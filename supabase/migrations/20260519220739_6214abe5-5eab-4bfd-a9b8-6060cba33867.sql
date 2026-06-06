-- 1) Add streak + xp columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS xp_points integer NOT NULL DEFAULT 0;

-- 2) Extend the protect_profile_fields trigger to lock the new fields too
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier        := OLD.subscription_tier;
  NEW.subscription_status      := OLD.subscription_status;
  NEW.template_prompt_credits  := OLD.template_prompt_credits;
  NEW.mini_course_credits      := OLD.mini_course_credits;
  NEW.main_course_credits      := OLD.main_course_credits;
  NEW.stripe_customer_id       := OLD.stripe_customer_id;
  NEW.stripe_subscription_id   := OLD.stripe_subscription_id;
  NEW.current_period_end       := OLD.current_period_end;
  NEW.current_streak           := OLD.current_streak;
  NEW.longest_streak           := OLD.longest_streak;
  NEW.last_active_date         := OLD.last_active_date;
  NEW.xp_points                := OLD.xp_points;
  RETURN NEW;
END;
$function$;

-- Make sure the trigger is attached (it may not be — knowledge file showed no triggers)
DROP TRIGGER IF EXISTS protect_profile_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_fields_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- 3) tick_streak: increments / resets a user's streak based on last activity
CREATE OR REPLACE FUNCTION public.tick_streak(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _today date := (now() AT TIME ZONE 'utc')::date;
  _last  date;
  _cur   integer;
  _long  integer;
  _new_streak integer;
BEGIN
  SELECT last_active_date, current_streak, longest_streak
    INTO _last, _cur, _long
  FROM public.profiles
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_profile');
  END IF;

  IF _last = _today THEN
    -- already active today; nothing to do
    RETURN jsonb_build_object(
      'ok', true,
      'current_streak', _cur,
      'longest_streak', _long,
      'changed', false
    );
  ELSIF _last = _today - 1 THEN
    _new_streak := COALESCE(_cur, 0) + 1;
  ELSE
    _new_streak := 1;
  END IF;

  UPDATE public.profiles
     SET current_streak   = _new_streak,
         longest_streak   = GREATEST(COALESCE(_long, 0), _new_streak),
         last_active_date = _today,
         updated_at       = now()
   WHERE id = _user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'current_streak', _new_streak,
    'longest_streak', GREATEST(COALESCE(_long, 0), _new_streak),
    'changed', true
  );
END;
$function$;

-- 4) award_xp: safely adds XP to a user
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new integer;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN (SELECT xp_points FROM public.profiles WHERE id = _user_id);
  END IF;

  UPDATE public.profiles
     SET xp_points  = COALESCE(xp_points, 0) + _amount,
         updated_at = now()
   WHERE id = _user_id
   RETURNING xp_points INTO _new;

  RETURN COALESCE(_new, 0);
END;
$function$;

-- 5) Index for course-progress lookups by user+content
CREATE UNIQUE INDEX IF NOT EXISTS course_progress_user_content_uniq
  ON public.course_progress(user_id, content_id);

-- And a generic per-user index for "in-progress" listings
CREATE INDEX IF NOT EXISTS course_progress_user_idx
  ON public.course_progress(user_id, last_opened_at DESC);
