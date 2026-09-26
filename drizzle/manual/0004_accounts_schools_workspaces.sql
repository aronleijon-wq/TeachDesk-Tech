-- Applied by hand in the Lovable Cloud SQL editor on 2026-09-26, because Lovable's
-- migration tool blocks renaming tables. Deliberately NOT listed in
-- ../migrations/meta/_journal.json, so it is never run a second time.
-- Tested beforehand on Postgres 18 (PGlite) with the production migration history:
-- data move, row-level security, versions, plans, schools and rollback on failure.

-- Accounts, schools and saved work, ready for both solo teachers and whole schools.
-- Replaces the per-teacher "workspaces" table from the previous migration. Anything
-- already saved there is moved into the new structure below before it is removed.
-- Runs as one transaction: if any step fails, nothing is changed.

BEGIN;

ALTER TABLE public.workspaces RENAME TO workspaces_v1;
ALTER INDEX public.workspaces_pkey RENAME TO workspaces_v1_pkey;

-- Schools (later also municipalities). Created by TeachDesk staff for pilots and customers.
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'pilot' CHECK (status IN ('pilot', 'active', 'ended')),
  pilot_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'pilot' OR pilot_ends_at IS NOT NULL)
);

-- Who belongs to which school, and as what.
CREATE TABLE public.memberships (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- A workspace holds classes, students, exams and so on. It belongs either to one teacher
-- (their personal workspace) or to one school.
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((owner_user_id IS NULL) <> (organization_id IS NULL))
);

-- Each class, student, exam, retake, assignment and calendar event is its own row, so
-- teachers working on different things never overwrite each other. "version" rises with
-- every change, so an edit based on an old copy is refused instead of silently winning.
-- "seq" keeps items in the order they were saved (e.g. a pasted class list).
CREATE TABLE public.workspace_items (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('class', 'student', 'exam', 'retake', 'assignment', 'event')),
  id TEXT NOT NULL CHECK (char_length(id) BETWEEN 1 AND 200),
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object' AND octet_length(data::text) <= 500000),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  seq BIGINT GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (workspace_id, kind, id)
);

-- Move work saved by the previous version (one document per teacher) into items.
-- Exams are stored oldest first, so they still show newest first.
INSERT INTO public.workspaces (owner_user_id)
SELECT user_id FROM public.workspaces_v1;

INSERT INTO public.workspace_items (workspace_id, kind, id, data)
SELECT w.id, lists.kind, item.elem->>'id', item.elem
FROM public.workspaces_v1 prev
JOIN public.workspaces w ON w.owner_user_id = prev.user_id
CROSS JOIN (VALUES
  ('class', 'classes'), ('student', 'students'), ('exam', 'exams'),
  ('retake', 'retakes'), ('assignment', 'assignments'), ('event', 'events')
) AS lists(kind, list)
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(prev.data->lists.list) = 'array' THEN prev.data->lists.list ELSE '[]'::jsonb END
) WITH ORDINALITY AS item(elem, ord)
WHERE jsonb_typeof(item.elem) = 'object' AND item.elem ? 'id'
ORDER BY prev.user_id, lists.kind, CASE WHEN lists.kind = 'exam' THEN -item.ord ELSE item.ord END
ON CONFLICT DO NOTHING;

DROP TABLE public.workspaces_v1;

-- Solo teachers: every new account gets 14 days of Pro, then the free plan unless they pay.
-- The plan is set by TeachDesk (billing); teachers can't change it or the trial.
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';
UPDATE public.profiles SET plan = 'free' WHERE plan NOT IN ('free', 'pro');
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro'));
ALTER TABLE public.profiles ADD COLUMN trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days';

-- AI use per teacher and month, for the free plan's monthly allowance.
CREATE TABLE public.ai_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  generations INTEGER NOT NULL DEFAULT 0 CHECK (generations >= 0),
  PRIMARY KEY (user_id, month)
);

-- --- Who may do what ---------------------------------------------------------------

-- True if the signed-in teacher may use this workspace: it's theirs, or their school's.
CREATE FUNCTION public.can_access_workspace(target UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = target
      AND (
        w.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.organization_id = w.organization_id AND m.user_id = auth.uid()
        )
      )
  );
$$;

-- True if the signed-in teacher has Pro features: they pay for Pro, their trial is
-- running, or they belong to a school whose pilot or subscription is running.
CREATE FUNCTION public.has_pro_access() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (p.plan = 'pro' OR p.trial_ends_at > now())
  ) OR EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.organizations o ON o.id = m.organization_id
    WHERE m.user_id = auth.uid()
      AND (o.status = 'active' OR (o.status = 'pilot' AND o.pilot_ends_at > now()))
  );
$$;

-- AI generations left this month: NULL means unlimited (Pro). The free plan gets 3;
-- keep FREE_AI_PER_MONTH in src/lib/pricing.ts in sync.
CREATE FUNCTION public.ai_generations_left() RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE
    WHEN public.has_pro_access() THEN NULL
    ELSE greatest(0, 3 - coalesce((
      SELECT u.generations FROM public.ai_usage u
      WHERE u.user_id = auth.uid() AND u.month = date_trunc('month', now())::date
    ), 0))
  END;
$$;

-- Counts one finished AI generation for the signed-in teacher.
CREATE FUNCTION public.record_ai_generation() RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.ai_usage AS u (user_id, month, generations)
  VALUES (auth.uid(), date_trunc('month', now())::date, 1)
  ON CONFLICT (user_id, month) DO UPDATE SET generations = u.generations + 1;
$$;

-- --- Workspaces ------------------------------------------------------------------------

-- Returns the signed-in teacher's personal workspace, creating it on their first visit.
CREATE FUNCTION public.ensure_personal_workspace() RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  workspace UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.workspaces (owner_user_id) VALUES (auth.uid())
  ON CONFLICT (owner_user_id) DO NOTHING;
  SELECT w.id INTO workspace FROM public.workspaces w WHERE w.owner_user_id = auth.uid();
  RETURN workspace;
END;
$$;

-- Every school gets its workspace as soon as it is created.
CREATE FUNCTION public.create_organization_workspace() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.workspaces (organization_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_create_workspace AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.create_organization_workspace();

-- Saves a batch of changed items: all or nothing. Each change carries the version it was
-- based on (0 for a new item) and its data (null deletes it). If any item was changed
-- by someone else meanwhile, nothing is saved and error code TD409 is returned.
CREATE FUNCTION public.save_workspace_items(target UUID, changes JSONB) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  change JSONB;
  base INTEGER;
  affected INTEGER;
BEGIN
  IF NOT public.can_access_workspace(target) THEN
    RAISE EXCEPTION 'No access to this workspace' USING ERRCODE = '42501';
  END IF;

  FOR change IN SELECT value FROM jsonb_array_elements(changes) LOOP
    base := (change->>'version')::integer;
    IF base = 0 THEN
      INSERT INTO public.workspace_items (workspace_id, kind, id, data, updated_by)
      VALUES (target, change->>'kind', change->>'id', change->'data', auth.uid())
      ON CONFLICT DO NOTHING;
    ELSIF jsonb_typeof(change->'data') = 'null' THEN
      DELETE FROM public.workspace_items i
      WHERE i.workspace_id = target AND i.kind = change->>'kind' AND i.id = change->>'id' AND i.version = base;
    ELSE
      UPDATE public.workspace_items i
      SET data = change->'data', version = i.version + 1, updated_at = now(), updated_by = auth.uid()
      WHERE i.workspace_id = target AND i.kind = change->>'kind' AND i.id = change->>'id' AND i.version = base;
    END IF;

    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected = 0 THEN
      RAISE EXCEPTION 'Changed by someone else' USING ERRCODE = 'TD409';
    END IF;
  END LOOP;
END;
$$;

-- --- Row-level security ----------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.organizations, public.memberships, public.workspaces, public.workspace_items, public.ai_usage
FROM anon, authenticated;

-- Teachers read through the policies below; all workspace writes go through
-- save_workspace_items(). Schools and memberships are managed by TeachDesk staff.
GRANT SELECT ON public.organizations, public.memberships, public.workspaces, public.workspace_items, public.ai_usage
TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizations, public.memberships TO authenticated;

CREATE POLICY "Members see their school" ON public.organizations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.memberships m WHERE m.organization_id = organizations.id AND m.user_id = auth.uid()
));
CREATE POLICY "Staff manage schools" ON public.organizations FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers see their own memberships" ON public.memberships FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "Staff manage memberships" ON public.memberships FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Teachers see workspaces they can use" ON public.workspaces FOR SELECT TO authenticated
USING (public.can_access_workspace(id));

CREATE POLICY "Teachers see items in workspaces they can use" ON public.workspace_items FOR SELECT TO authenticated
USING (public.can_access_workspace(workspace_id));

CREATE POLICY "Teachers see their own AI use" ON public.ai_usage FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Functions are callable by signed-in teachers only (Supabase would also allow anon).
REVOKE ALL ON FUNCTION
  public.can_access_workspace(UUID),
  public.has_pro_access(),
  public.ai_generations_left(),
  public.record_ai_generation(),
  public.ensure_personal_workspace(),
  public.save_workspace_items(UUID, JSONB)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.can_access_workspace(UUID),
  public.has_pro_access(),
  public.ai_generations_left(),
  public.record_ai_generation(),
  public.ensure_personal_workspace(),
  public.save_workspace_items(UUID, JSONB)
TO authenticated;

COMMIT;
