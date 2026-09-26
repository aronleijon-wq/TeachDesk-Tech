-- Applied by hand in the Lovable Cloud SQL editor on 2026-09-26, like 0004. Deliberately
-- NOT listed in ../migrations/meta/_journal.json, so it is never run a second time.
-- Tested beforehand on Postgres 18 (PGlite) with the production migration history:
-- pilots, invitations, who may see and change what, and rollback on failure.

-- School pilots and invitations. TeachDesk staff start a pilot for a school, which invites
-- the school's first admin; school admins then invite their teachers. Invitations are
-- shared as links, and only the invited email address can accept one.
-- Runs as one transaction: if any step fails, nothing is changed.

BEGIN;

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email = lower(email) AND email LIKE '_%@_%.__%'),
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  -- The secret part of the invitation link.
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days',
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ
);
CREATE INDEX invitations_organization_id_idx ON public.invitations (organization_id);
-- At most one open invitation per school and address; inviting again renews it.
CREATE UNIQUE INDEX invitations_one_open_per_email ON public.invitations (organization_id, email)
WHERE accepted_at IS NULL;

-- --- Who may do what ---------------------------------------------------------------

-- True if the signed-in teacher is an admin of this school.
CREATE FUNCTION public.is_school_admin(org UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = org AND m.user_id = auth.uid() AND m.role = 'admin'
  );
$$;

-- Invites someone to a school and returns the invitation's token, for the link. Inviting
-- an address that already has an open invitation renews that one (same link, 14 more days).
CREATE FUNCTION public.invite_to_school(org UUID, invite_email TEXT, invite_role TEXT DEFAULT 'teacher')
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  invite_token TEXT;
BEGIN
  IF NOT (public.is_admin() OR public.is_school_admin(org)) THEN
    RAISE EXCEPTION 'Only the school''s admins can invite' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.invitations AS i (organization_id, email, role)
  VALUES (org, lower(trim(invite_email)), invite_role)
  ON CONFLICT (organization_id, email) WHERE accepted_at IS NULL
  DO UPDATE SET role = EXCLUDED.role, expires_at = EXCLUDED.expires_at
  RETURNING i.token INTO invite_token;
  RETURN invite_token;
END;
$$;

-- TeachDesk staff start a pilot: the school, when the pilot ends, and an invitation for the
-- school's first admin. Returns that invitation's token.
CREATE FUNCTION public.start_pilot(school_name TEXT, admin_email TEXT, pilot_days INTEGER DEFAULT 30)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  org UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only TeachDesk staff can start pilots' USING ERRCODE = '42501';
  END IF;
  IF pilot_days IS NULL OR pilot_days NOT BETWEEN 1 AND 365 THEN
    RAISE EXCEPTION 'A pilot lasts 1 to 365 days' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.organizations (name, status, pilot_ends_at)
  VALUES (trim(school_name), 'pilot', now() + make_interval(days => pilot_days))
  RETURNING id INTO org;
  RETURN public.invite_to_school(org, admin_email, 'admin');
END;
$$;

-- What an invitation link shows before signing in: the school, the role, a hint of the
-- invited address, and whether the link can still be used.
CREATE FUNCTION public.invitation_preview(invite_token TEXT)
RETURNS TABLE (school TEXT, role TEXT, email_hint TEXT, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT
    o.name,
    i.role,
    left(i.email, 1) || '•••' || substring(i.email FROM position('@' IN i.email)),
    CASE
      WHEN i.accepted_at IS NOT NULL THEN 'used'
      WHEN i.expires_at <= now() THEN 'expired'
      ELSE 'valid'
    END
  FROM public.invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = invite_token;
$$;

-- Accepts an invitation for the signed-in teacher, whose confirmed email must be the invited
-- one, and returns the school's id. Errors: TD404 unknown link, TD410 used or expired,
-- TD403 signed in with another email address.
CREATE FUNCTION public.accept_invitation(invite_token TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  invite public.invitations;
  signed_in_email TEXT;
BEGIN
  SELECT * INTO invite FROM public.invitations i WHERE i.token = invite_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown invitation' USING ERRCODE = 'TD404';
  END IF;
  IF invite.accepted_at IS NOT NULL OR invite.expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation used or expired' USING ERRCODE = 'TD410';
  END IF;

  SELECT lower(u.email) INTO signed_in_email
  FROM auth.users u
  WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;
  IF signed_in_email IS DISTINCT FROM invite.email THEN
    RAISE EXCEPTION 'Invitation is for another email address' USING ERRCODE = 'TD403';
  END IF;

  -- Joining as admin makes an existing teacher an admin; joining as teacher never demotes.
  INSERT INTO public.memberships AS m (organization_id, user_id, role)
  VALUES (invite.organization_id, auth.uid(), invite.role)
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET role = CASE WHEN EXCLUDED.role = 'admin' THEN 'admin' ELSE m.role END;

  UPDATE public.invitations i SET accepted_by = auth.uid(), accepted_at = now() WHERE i.id = invite.id;

  -- Teachers who join a school see its workspace rather than the demo.
  INSERT INTO public.profiles (user_id, show_demo) VALUES (auth.uid(), false)
  ON CONFLICT (user_id) DO UPDATE SET show_demo = false;

  RETURN invite.organization_id;
END;
$$;

-- Everyone in a school, with names and emails. For TeachDesk staff and the school's admins.
CREATE FUNCTION public.school_members(org UUID)
RETURNS TABLE (user_id UUID, role TEXT, name TEXT, email TEXT, joined_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT m.user_id, m.role, coalesce(p.name, ''), u.email, m.created_at
  FROM public.memberships m
  JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.organization_id = org AND (public.is_admin() OR public.is_school_admin(org))
  ORDER BY m.role, coalesce(nullif(p.name, ''), u.email);
$$;

-- --- Row-level security ----------------------------------------------------------------

-- Invitations are created through the functions above; staff and school admins can see
-- them (to copy a link again) and withdraw them.
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invitations FROM anon, authenticated;
GRANT SELECT, DELETE ON public.invitations TO authenticated;

CREATE POLICY "Staff and school admins see invitations" ON public.invitations FOR SELECT TO authenticated
USING (public.is_admin() OR public.is_school_admin(organization_id));
CREATE POLICY "Staff and school admins withdraw invitations" ON public.invitations FOR DELETE TO authenticated
USING (public.is_admin() OR public.is_school_admin(organization_id));

-- School admins see everyone in their school and can remove teachers (not other admins).
CREATE POLICY "School admins see their school's members" ON public.memberships FOR SELECT TO authenticated
USING (public.is_school_admin(organization_id));
CREATE POLICY "School admins remove teachers" ON public.memberships FOR DELETE TO authenticated
USING (public.is_school_admin(organization_id) AND role = 'teacher');

-- Signed-in teachers only (Supabase would also allow anon) — except the invitation
-- preview, which people see before they sign in.
REVOKE ALL ON FUNCTION
  public.is_school_admin(UUID),
  public.invite_to_school(UUID, TEXT, TEXT),
  public.start_pilot(TEXT, TEXT, INTEGER),
  public.invitation_preview(TEXT),
  public.accept_invitation(TEXT),
  public.school_members(UUID)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.is_school_admin(UUID),
  public.invite_to_school(UUID, TEXT, TEXT),
  public.start_pilot(TEXT, TEXT, INTEGER),
  public.invitation_preview(TEXT),
  public.accept_invitation(TEXT),
  public.school_members(UUID)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.invitation_preview(TEXT) TO anon;

COMMIT;
