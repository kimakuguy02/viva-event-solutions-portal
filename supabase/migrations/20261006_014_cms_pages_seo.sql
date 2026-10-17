-- VIVA — Migration 014 (vague A3) : pages CMS, SEO, statuts étendus
-- Prérequiss : 001 (set_updated_at), 004 (cms_sections).
-- ADDITIF : nouvelles tables + colonnes NULLables ; CHECK status étendu à 'review'.

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  is_published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_pages_updated on public.pages;
create trigger trg_pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

create table if not exists public.seo_meta (
  section_id uuid primary key references public.cms_sections (id) on delete cascade,
  meta_title text not null default '',
  meta_desc text not null default '',
  slug text not null default '',
  og_image text,
  noindex boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.cms_sections
  add column if not exists page_id uuid references public.pages (id) on delete set null;

alter table public.cms_sections
  add column if not exists position integer not null default 0;

alter table public.cms_sections
  add column if not exists scheduled_at timestamptz;

alter table public.cms_sections
  add column if not exists published_by uuid references public.profiles (id) on delete set null;

create index if not exists cms_sections_page_id_idx on public.cms_sections (page_id, position);

-- Extension du CHECK status : nom auto-généré par 004 = cms_sections_status_check.
alter table public.cms_sections drop constraint if exists cms_sections_status_check;
alter table public.cms_sections
  add constraint cms_sections_status_check
  check (status in ('draft','review','published','archived'));

alter table public.pages enable row level security;
alter table public.seo_meta enable row level security;

-- Pages : lecture publique des publiées, gestion cms.update.
drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages for select
  to anon, authenticated using (is_published);

drop policy if exists pages_staff_write on public.pages;
create policy pages_staff_write on public.pages for all
  to authenticated
  using (public.has_permission('cms.view'))
  with check (public.has_permission('cms.update'));

-- SEO : lecture publique (métadonnées affichables), écriture cms.update.
drop policy if exists seo_public_read on public.seo_meta;
create policy seo_public_read on public.seo_meta for select
  to anon, authenticated using (true);

drop policy if exists seo_staff_write on public.seo_meta;
create policy seo_staff_write on public.seo_meta for all
  to authenticated
  using (public.has_permission('cms.view'))
  with check (public.has_permission('cms.update'));

grant select on public.pages, public.seo_meta to anon;
grant select, insert, update, delete on public.pages, public.seo_meta to authenticated;

-- Vérification post-migration :
--   select conname from pg_constraint where conrelid='public.cms_sections'::regclass and conname='cms_sections_status_check';
--   select column_name from information_schema.columns where table_schema='public' and table_name='cms_sections' and column_name in ('page_id','position','scheduled_at','published_by');
--   insert into public.cms_sections (page, content_key, title, content, status) values ('__test','__t1','t','c','review') returning id; -- puis delete ciblé
-- Retour arrière : drop table seo_meta, pages ; drop colonnes ; restaurer l'ancien CHECK (draft/published/archived).
