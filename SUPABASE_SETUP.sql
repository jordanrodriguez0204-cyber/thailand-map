-- ════════════════════════════════════════════════════════════════════
-- thailand-map — Setup Supabase pour la sync des hôtels/budgets/activités
-- À coller dans : Supabase Dashboard → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════

-- 1) Table de sync clé/valeur (miroir des données localStorage `th_*`)
create table if not exists public.app_data (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

-- L'app utilise la clé anon (publique) : politique ouverte, même niveau
-- de protection que la table steps existante.
drop policy if exists "app_data_all" on public.app_data;
create policy "app_data_all" on public.app_data
  for all using (true) with check (true);

-- 2) Activer le temps réel (l'autre téléphone voit les modifs en direct)
alter publication supabase_realtime add table public.app_data;

-- ════════════════════════════════════════════════════════════════════
-- NOTE SÉCURITÉ (constat du 21/07/2026) :
-- La table `steps` est ouverte en lecture/écriture/suppression à la clé
-- anon, qui est publique (visible dans le bundle JS et le repo GitHub).
-- Une vraie protection nécessiterait Supabase Auth (comptes utilisateurs),
-- disproportionné pour une app à deux. Le risque réel est faible
-- (URL obscure), et l'export JSON (menu Plus → Exporter la sauvegarde)
-- sert de filet. Si tu veux quand même durcir : active l'authentification
-- par magic link et remplace using(true) par auth.role() = 'authenticated'.
-- ════════════════════════════════════════════════════════════════════
