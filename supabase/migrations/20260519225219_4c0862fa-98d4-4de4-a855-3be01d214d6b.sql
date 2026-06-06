
-- 1. Rename enum value
ALTER TYPE credit_bucket RENAME VALUE 'template_prompt' TO 'prompt';

-- 2. Rename profile column
ALTER TABLE public.profiles RENAME COLUMN template_prompt_credits TO prompt_credits;

-- 3. Add xp_reward to content_items
ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 10;

-- 4. Add lesson_content to content_payloads
ALTER TABLE public.content_payloads
  ADD COLUMN IF NOT EXISTS lesson_content jsonb;

-- 5. Update consume_credits to use new bucket name
CREATE OR REPLACE FUNCTION public.consume_credits(_user_id uuid, _bucket text, _amount integer, _content_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _updated integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  IF _bucket = 'prompt' THEN
    UPDATE public.profiles
       SET prompt_credits = prompt_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND prompt_credits >= _amount;
  ELSIF _bucket = 'mini_course' THEN
    UPDATE public.profiles
       SET mini_course_credits = mini_course_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND mini_course_credits >= _amount;
  ELSIF _bucket = 'main_course' THEN
    UPDATE public.profiles
       SET main_course_credits = main_course_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND main_course_credits >= _amount;
  ELSE
    RAISE EXCEPTION 'Unknown credit bucket: %', _bucket;
  END IF;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN RETURN false; END IF;

  INSERT INTO public.credit_transactions (
    user_id, transaction_type, credit_bucket, amount, related_content_id
  ) VALUES (
    _user_id, 'spend', _bucket::credit_bucket, -_amount, _content_id
  );

  RETURN true;
END;
$function$;

-- 6. Update protect_profile_fields to reference renamed column
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
  NEW.prompt_credits           := OLD.prompt_credits;
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
