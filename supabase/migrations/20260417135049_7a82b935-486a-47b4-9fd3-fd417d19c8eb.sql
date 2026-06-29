
-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Babies
CREATE TABLE public.babies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birth_date date NOT NULL,
  gender text,
  photo_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;

-- Baby parents (link)
CREATE TABLE public.baby_parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(baby_id, parent_id)
);
ALTER TABLE public.baby_parents ENABLE ROW LEVEL SECURITY;

-- Helper security definer
CREATE OR REPLACE FUNCTION public.is_baby_parent(_baby_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.baby_parents WHERE baby_id = _baby_id AND parent_id = _user_id);
$$;

CREATE POLICY "view linked babies" ON public.babies FOR SELECT
  USING (public.is_baby_parent(id, auth.uid()));
CREATE POLICY "insert own baby" ON public.babies FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "update linked babies" ON public.babies FOR UPDATE
  USING (public.is_baby_parent(id, auth.uid()));
CREATE POLICY "delete own babies" ON public.babies FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "view own baby_parents" ON public.baby_parents FOR SELECT
  USING (parent_id = auth.uid() OR public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "insert self baby_parents" ON public.baby_parents FOR INSERT
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY "delete own baby_parents" ON public.baby_parents FOR DELETE
  USING (parent_id = auth.uid());

-- Sleep logs
CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view sleep" ON public.sleep_logs FOR SELECT USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "insert sleep" ON public.sleep_logs FOR INSERT WITH CHECK (public.is_baby_parent(baby_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "update sleep" ON public.sleep_logs FOR UPDATE USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "delete sleep" ON public.sleep_logs FOR DELETE USING (public.is_baby_parent(baby_id, auth.uid()));

-- Diaper logs
CREATE TABLE public.diaper_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL,
  pee boolean NOT NULL DEFAULT false,
  poo boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.diaper_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view diaper" ON public.diaper_logs FOR SELECT USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "insert diaper" ON public.diaper_logs FOR INSERT WITH CHECK (public.is_baby_parent(baby_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "update diaper" ON public.diaper_logs FOR UPDATE USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "delete diaper" ON public.diaper_logs FOR DELETE USING (public.is_baby_parent(baby_id, auth.uid()));

-- Feeding logs
CREATE TABLE public.feeding_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  feed_type text NOT NULL CHECK (feed_type IN ('breast','formula')),
  breast_side text CHECK (breast_side IN ('left','right','both')),
  formula_ml integer,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view feeding" ON public.feeding_logs FOR SELECT USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "insert feeding" ON public.feeding_logs FOR INSERT WITH CHECK (public.is_baby_parent(baby_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "update feeding" ON public.feeding_logs FOR UPDATE USING (public.is_baby_parent(baby_id, auth.uid()));
CREATE POLICY "delete feeding" ON public.feeding_logs FOR DELETE USING (public.is_baby_parent(baby_id, auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_babies_updated BEFORE UPDATE ON public.babies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile + auto link baby creator as parent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_baby()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.baby_parents (baby_id, parent_id) VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_baby_created
AFTER INSERT ON public.babies
FOR EACH ROW EXECUTE FUNCTION public.handle_new_baby();
