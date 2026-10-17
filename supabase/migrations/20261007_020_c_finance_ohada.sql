-- VIVA — Migration 020 (vague C2) : OHADA + trésorerie
-- Prérequiss : 001, 004 (erp_transactions, cash_closures). ADDITIF, sans TVA.
-- La partie double est vérifiée par contrainte + trigger (serveur).

create table if not exists public.journals (
  code text primary key,
  label text not null default ''
);

create table if not exists public.ohada_accounts (
  code text primary key,
  label text not null default '',
  classe text not null default '',
  type text not null default 'actif' check (type in ('actif','passif','charge','produit'))
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  tx_id uuid not null references public.erp_transactions (id) on delete cascade,
  journal_code text not null references public.journals (code) on delete restrict,
  account_code text not null references public.ohada_accounts (code) on delete restrict,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  created_at timestamptz not null default now(),
  check (debit > 0 or credit > 0)
);
create index if not exists journal_entries_tx_idx on public.journal_entries (tx_id);
create index if not exists journal_entries_account_idx on public.journal_entries (account_code);

-- Partie double : vérifiée dans la RPC erp_validate (extension prévue :
-- refuser la validation si SUM(debit) <> SUM(credit) des journal_entries liées).
-- Aucune fonction fantôme ici : pas de trigger sans attache.

create table if not exists public.opening_balances (
  id uuid primary key default gen_random_uuid(),
  account text not null,
  currency text not null default 'USD' check (currency in ('USD','CDF')),
  amount numeric(16,2) not null default 0,
  set_by uuid references public.profiles (id) on delete set null,
  set_at timestamptz not null default now(),
  unique (account, currency)
);

create table if not exists public.treasury_balances (
  account text not null,
  currency text not null default 'USD' check (currency in ('USD','CDF')),
  balance numeric(16,2) not null default 0,
  as_of timestamptz not null default now(),
  primary key (account, currency)
);

create table if not exists public.reconciliations (
  id uuid primary key default gen_random_uuid(),
  account text not null,
  currency text not null default 'USD',
  expected numeric(16,2) not null default 0,
  counted numeric(16,2) not null default 0,
  discrepancy numeric(16,2) not null default 0,
  reconciled_by uuid references public.profiles (id) on delete set null,
  reconciled_at timestamptz not null default now()
);

-- Clôtures : validation traçable (colonnes déjà ajoutées en 018 si appliquée).
alter table public.cash_closures
  add column if not exists validated_by uuid references public.profiles (id) on delete set null;
alter table public.cash_closures
  add column if not exists validated_at timestamptz;

-- RLS : lecture erp.view, écritures verrouillées (RPC/Edge).
alter table public.journals enable row level security;
alter table public.ohada_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.opening_balances enable row level security;
alter table public.treasury_balances enable row level security;
alter table public.reconciliations enable row level security;

drop policy if exists ohada_read on public.journals;
create policy ohada_read on public.journals for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists ohada_acc_read on public.ohada_accounts;
create policy ohada_acc_read on public.ohada_accounts for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists journal_entries_read on public.journal_entries;
create policy journal_entries_read on public.journal_entries for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists opening_read on public.opening_balances;
create policy opening_read on public.opening_balances for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists treasury_read on public.treasury_balances;
create policy treasury_read on public.treasury_balances for select
  to authenticated using (public.has_permission('erp.view'));
drop policy if exists reconc_read on public.reconciliations;
create policy reconc_read on public.reconciliations for select
  to authenticated using (public.has_permission('erp.view'));
-- Pas d'écriture directe : RPC/Edge (journalisation + validation métier).

grant select on public.journals, public.ohada_accounts, public.journal_entries,
  public.opening_balances, public.treasury_balances, public.reconciliations to authenticated;

-- Vérification : 6 tables, RLS true, policies lecture, NUMERIC partout, 0 TVA.
-- Retour arrière : drop tables dans l'ordre inverse (entries, reconciliations,
-- treasury, opening, ohada, journals) ; drop colonnes cash_closures.
