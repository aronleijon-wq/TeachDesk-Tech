-- Applied by hand in the Lovable Cloud SQL editor on 2026-09-26, like 0004 and 0005.
-- Deliberately NOT listed in ../migrations/meta/_journal.json, so it is never run a second
-- time. Tested beforehand on Postgres 18 (PGlite) with the production migration history:
-- counting, the daily limit, per-teacher and per-day allowances, locked direct access and
-- rollback on failure.

-- A daily allowance of questions to the help center's Ask AI assistant, so its cost stays
-- predictable. Only the number of questions is stored, never what was asked.
-- Runs as one transaction: if any step fails, nothing is changed.

BEGIN;

-- Questions each teacher has asked the assistant, per day (Swedish time).
CREATE TABLE public.help_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  questions INTEGER NOT NULL DEFAULT 0 CHECK (questions >= 0),
  PRIMARY KEY (user_id, day)
);

-- No direct access: counting goes through use_help_question() below.
ALTER TABLE public.help_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.help_usage FROM anon, authenticated;

-- Counts one question for the signed-in teacher and returns how many are left today, or
-- raises TD429 once today's are used up. Keep HELP_QUESTIONS_PER_DAY in src/lib/pricing.ts
-- in sync with daily_limit.
CREATE FUNCTION public.use_help_question() RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  daily_limit CONSTANT INTEGER := 20;
  today CONSTANT DATE := (now() AT TIME ZONE 'Europe/Stockholm')::date;
  used INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.help_usage AS h (user_id, day, questions)
  VALUES (auth.uid(), today, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET questions = h.questions + 1
  WHERE h.questions < daily_limit
  RETURNING h.questions INTO used;

  IF used IS NULL THEN
    RAISE EXCEPTION 'No help questions left today' USING ERRCODE = 'TD429';
  END IF;
  RETURN daily_limit - used;
END;
$$;

REVOKE ALL ON FUNCTION public.use_help_question() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_help_question() TO authenticated;

COMMIT;
