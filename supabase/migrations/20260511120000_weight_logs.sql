-- Weight tracking for babies. Stored in grams; UI lets users toggle to kg.

CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  measured_on date NOT NULL,
  weight_g integer NOT NULL CHECK (weight_g > 0),
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view weight" ON public.weight_logs FOR SELECT
  USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "insert weight" ON public.weight_logs FOR INSERT
  WITH CHECK (public.is_baby_parent(baby_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "update weight" ON public.weight_logs FOR UPDATE
  USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "delete weight" ON public.weight_logs FOR DELETE
  USING (public.is_baby_parent(baby_id, auth.uid()));

CREATE INDEX weight_logs_baby_date_idx ON public.weight_logs (baby_id, measured_on DESC);

ALTER TABLE public.weight_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_logs;
