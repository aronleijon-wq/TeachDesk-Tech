CREATE TABLE IF NOT EXISTS public.admin_emails (email TEXT PRIMARY KEY CHECK (email = lower(email)));
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_emails (email) VALUES ('byleijons@gmail.com') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users u JOIN public.admin_emails a ON a.email = lower(u.email)
                 WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.demo_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE public.demo_requests DROP CONSTRAINT IF EXISTS demo_requests_status_check;
ALTER TABLE public.demo_requests ADD CONSTRAINT demo_requests_status_check CHECK (status IN ('new','contacted','closed'));
GRANT SELECT, UPDATE (status) ON public.demo_requests TO authenticated;
DROP POLICY IF EXISTS "Admins can read demo requests" ON public.demo_requests;
CREATE POLICY "Admins can read demo requests" ON public.demo_requests FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update demo request status" ON public.demo_requests;
CREATE POLICY "Admins can update demo request status" ON public.demo_requests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());