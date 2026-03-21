
-- Loyalty program configuration per business
CREATE TABLE public.loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Loyalty Card',
  stamps_required integer NOT NULL DEFAULT 10,
  reward_description text NOT NULL DEFAULT 'Free service',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Individual client loyalty cards
CREATE TABLE public.loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.loyalty_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  stamps_collected integer NOT NULL DEFAULT 0,
  reward_redeemed boolean NOT NULL DEFAULT false,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual stamp events
CREATE TABLE public.loyalty_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  stamped_at timestamptz NOT NULL DEFAULT now(),
  stamped_by uuid REFERENCES auth.users(id),
  notes text
);

-- RLS
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_stamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own loyalty programs" ON public.loyalty_programs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own loyalty cards" ON public.loyalty_cards
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own loyalty stamps" ON public.loyalty_stamps
  FOR ALL TO authenticated USING (
    card_id IN (SELECT id FROM public.loyalty_cards WHERE user_id = auth.uid())
  ) WITH CHECK (
    card_id IN (SELECT id FROM public.loyalty_cards WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view loyalty cards by email" ON public.loyalty_cards
  FOR SELECT TO anon USING (true);

CREATE POLICY "Public can view loyalty programs" ON public.loyalty_programs
  FOR SELECT TO anon USING (is_active = true);
