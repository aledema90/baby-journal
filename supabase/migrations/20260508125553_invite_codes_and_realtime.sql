-- Co-parent invite codes (Fase 2) + realtime publication for log tables.

-- 1) invite_codes table -------------------------------------------------------
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(code) BETWEEN 4 AND 12)
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- A baby's parents can view, create and revoke invite codes for that baby.
-- Codes are *not* readable by anyone else (redemption goes through the
-- security-definer function below, which can look up the code without RLS).
CREATE POLICY "view invite codes for own babies" ON public.invite_codes FOR SELECT
  USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "create invite codes for own babies" ON public.invite_codes FOR INSERT
  WITH CHECK (public.is_baby_parent(baby_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "delete own invite codes" ON public.invite_codes FOR DELETE
  USING (created_by = auth.uid());

-- 2) Redemption RPC -----------------------------------------------------------
-- Atomically: validate the code, link the redeemer to the baby via
-- baby_parents, mark the code as consumed. Returns the baby_id on success.
CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invite RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Devi essere autenticato' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO invite FROM public.invite_codes
    WHERE code = _code
      AND used_by IS NULL
      AND expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Codice non valido o scaduto' USING ERRCODE = 'P0002';
  END IF;

  IF invite.created_by = auth.uid() THEN
    RAISE EXCEPTION 'Non puoi usare un codice creato da te' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.baby_parents
    WHERE baby_id = invite.baby_id AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sei già collegato a questo bambino' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.baby_parents (baby_id, parent_id)
  VALUES (invite.baby_id, auth.uid());

  UPDATE public.invite_codes
  SET used_by = auth.uid(), used_at = now()
  WHERE id = invite.id;

  RETURN invite.baby_id;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text) TO authenticated;

-- 3) Realtime ---------------------------------------------------------------
-- Enable WAL replication so co-parents see each other's writes live.
ALTER TABLE public.sleep_logs REPLICA IDENTITY FULL;
ALTER TABLE public.diaper_logs REPLICA IDENTITY FULL;
ALTER TABLE public.feeding_logs REPLICA IDENTITY FULL;
ALTER TABLE public.babies REPLICA IDENTITY FULL;
ALTER TABLE public.baby_parents REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diaper_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feeding_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.babies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.baby_parents;
