-- Daily supplement / drops ("gocce") checklist. One row = one config item
-- ticked for a given day; unticking deletes the row. The set of items lives in
-- a client-side JSON config (src/config/supplements.json) — only the chosen
-- item key is persisted here, so editing the config never breaks stored data.

CREATE TABLE public.supplement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  log_date date NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (baby_id, item_key, log_date)
);

ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;

-- A ticked item is a single row that's created or deleted, never updated, so
-- there is no UPDATE policy.
CREATE POLICY "view supplement" ON public.supplement_logs FOR SELECT
  USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "insert supplement" ON public.supplement_logs FOR INSERT
  WITH CHECK (public.is_baby_parent(baby_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "delete supplement" ON public.supplement_logs FOR DELETE
  USING (public.is_baby_parent(baby_id, auth.uid()));

CREATE INDEX supplement_logs_baby_date_idx ON public.supplement_logs (baby_id, log_date);

ALTER TABLE public.supplement_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplement_logs;
