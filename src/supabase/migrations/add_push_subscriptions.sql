-- Abonnements aux notifications push Web (par appareil). Idempotent.
-- À coller dans Supabase Studio → SQL Editor → Run.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  label      text,
  role       text NOT NULL DEFAULT 'animateur',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS activé sans policy anon → deny par défaut (le serveur écrit via service_role).
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
