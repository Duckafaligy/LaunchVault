
CREATE OR REPLACE FUNCTION public.tier_rank(_tier public.subscription_tier)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _tier::text
    WHEN 'free'  THEN 0
    WHEN 'tier1' THEN 1
    WHEN 'tier2' THEN 2
    WHEN 'tier3' THEN 3
    WHEN 'tier4' THEN 4
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.has_tier_access(_user_id uuid, _required public.subscription_tier)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND public.tier_rank(subscription_tier) >= public.tier_rank(_required)
      AND (subscription_status = 'active' OR _required::text = 'free')
  )
$$;

CREATE OR REPLACE FUNCTION public.consume_credits(
  _user_id uuid,
  _bucket text,
  _amount integer,
  _content_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated integer;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  IF _bucket = 'template_prompt' THEN
    UPDATE public.profiles
       SET template_prompt_credits = template_prompt_credits - _amount,
           updated_at = now()
     WHERE id = _user_id AND template_prompt_credits >= _amount;
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
$$;

CREATE OR REPLACE FUNCTION public.unlock_content(_user_id uuid, _content_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item public.content_items%ROWTYPE;
  _already_unlocked boolean;
  _consumed boolean;
BEGIN
  SELECT * INTO _item FROM public.content_items WHERE id = _content_id AND is_published = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_content_unlocks
    WHERE user_id = _user_id AND content_id = _content_id
  ) INTO _already_unlocked;

  IF _already_unlocked THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_unlocked');
  END IF;

  IF public.has_tier_access(_user_id, _item.tier_required) THEN
    INSERT INTO public.user_content_unlocks (user_id, content_id, unlock_type)
    VALUES (_user_id, _content_id, 'subscription')
    ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('ok', true, 'reason', 'tier_access');
  END IF;

  IF _item.credit_type IS NULL OR _item.credit_cost <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'requires_tier');
  END IF;

  _consumed := public.consume_credits(
    _user_id, _item.credit_type::text, _item.credit_cost, _content_id
  );

  IF NOT _consumed THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits');
  END IF;

  INSERT INTO public.user_content_unlocks (user_id, content_id, unlock_type)
  VALUES (_user_id, _content_id, 'credit')
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'reason', 'credit_spent');
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_fields_trg ON public.profiles;
CREATE TRIGGER protect_profile_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'brendanhllau@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
