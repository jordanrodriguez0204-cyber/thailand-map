-- ============================================================
-- Schéma Supabase pour Thailand Travel Map
-- Colle ce SQL dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Table principale des étapes
create table if not exists public.steps (
  id           uuid default gen_random_uuid() primary key,
  ordre        integer not null,
  nom          text not null,
  lat          double precision not null,
  lng          double precision not null,
  dates        text,
  categorie    text default 'ville',
  notes        text,
  modified_by  text,
  modified_at  timestamptz default now()
);

-- Activer la sécurité au niveau des lignes (RLS)
alter table public.steps enable row level security;

-- Politique : lecture et écriture publiques (protégées par le PIN côté frontend)
create policy "Accès public en lecture"
  on public.steps for select using (true);

create policy "Accès public en insertion"
  on public.steps for insert with check (true);

create policy "Accès public en modification"
  on public.steps for update using (true);

create policy "Accès public en suppression"
  on public.steps for delete using (true);

-- Activer Realtime sur cette table
alter publication supabase_realtime add table public.steps;
