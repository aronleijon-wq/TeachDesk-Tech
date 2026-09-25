-- Admins: people allowed to read and triage demo requests.
-- Access is granted by email, but only once that email is verified
-- (Google sign-in, or a confirmed email/password account).
CREATE TABLE public.admin_emails (
  email TEXT PRIMARY KEY CHECK (email = lower(email))
);
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
-- No policies: the list is not readable through the public API.

INSERT INTO public.admin_emails (email) VALUES ('aronleijon@icloud.com');

CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.admin_emails a ON a.email = lower(u.email)
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Demo requests get a triage status that admins can update.
ALTER TABLE public.demo_requests
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'contacted', 'closed'));

GRANT SELECT, UPDATE (status) ON public.demo_requests TO authenticated;

CREATE POLICY "Admins can read demo requests" ON public.demo_requests
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update demo request status" ON public.demo_requests
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
