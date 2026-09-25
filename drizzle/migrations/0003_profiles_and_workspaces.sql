-- Teachers' own data, one row per account. Only the teacher can read or change it.

-- Profile shown in the app. "plan" is set by TeachDesk (billing), not by the teacher.
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '' CHECK (char_length(name) <= 200),
  role TEXT NOT NULL DEFAULT 'Teacher' CHECK (char_length(role) <= 200),
  school TEXT NOT NULL DEFAULT '' CHECK (char_length(school) <= 200),
  plan TEXT NOT NULL DEFAULT 'Trial',
  show_demo BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The teacher's workspace (classes, students, exams, retakes, assignments) as one document.
-- "version" goes up on every save so two devices can't silently overwrite each other.
CREATE TABLE public.workspaces (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles, public.workspaces FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (user_id, name, role, school, show_demo) ON public.profiles TO authenticated;
GRANT UPDATE (name, role, school, show_demo) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;

CREATE POLICY "Teachers read their own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers read their own workspace" ON public.workspaces FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers create their own workspace" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers update their own workspace" ON public.workspaces FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Teachers delete their own workspace" ON public.workspaces FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER workspaces_touch_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();