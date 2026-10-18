-- VIVA EVENT SOLUTIONS — Migration 002 : RLS deny-by-default + helpers + triggers sécurité
-- Dépend de 001. Aucune donnée métier. Aucune suppression Firebase/Express.

-- ============================================================
-- RLS ON (deny by default : sans policy, tout est refusé)
-- ============================================================
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.role_permissions enable row level security;

-- ============================================================
-- Helpers SECURITY DEFINER (bypass RLS interne, anti-récursion)
-- search_path verrouillé. Décision basée sur auth.uid() uniquement,
-- jamais sur localStorage / header / champ client.
-- ============================================================

-- Rôle courant (role_id) de l'appelant
create or replace function public.current_role_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.role_id from public.profiles p where p.id = auth.uid();
$$;

-- Code rôle courant (ex: 'SUPER_ADMIN')
create or replace function public.current_role_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();
$$;

-- Test permission : true si le rôle courant possède `permission_code`
create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    join public.permissions perm on perm.id = rp.permission_id
    where p.id = auth.uid()
      and p.status = 'active'
      and perm.code = permission_code
  );
$$;

-- Test super-admin (code canonique SUPER_ADMIN)
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and p.status = 'active'
      and r.code = 'SUPER_ADMIN'
  );
$$;

-- ============================================================
-- Protection SUPER_ADMIN : bloque toute élévation via profiles
-- Un UPDATE/INSERT qui changerait role_id ou status vers un rôle
-- plus privilégié est refusé sauf si l'exécutant est SUPER_ADMIN
-- ou service_role (bypass RLS, migrations/seeds).
-- ============================================================
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_super boolean;
begin
  -- service_role / owner bypassent RLS : on laisse passer (seeds, trigger signup)
  -- Le trigger signup utilise explicitement le rôle CLIENT, jamais SUPER_ADMIN.
  if auth.uid() is null then
    return new;
  end if;

  select public.is_super_admin() into caller_is_super;

  -- INSERT : seul un SUPER_ADMIN peut créer un profil non-CLIENT,
  -- et personne ne peut créer un SUPER_ADMIN via API publique.
  -- (La création normale passe par handle_new_user, pas par INSERT direct.)
  if tg_op = 'INSERT' then
    if caller_is_super then
      return new;
    end if;
    -- Bloque la création directe (forcer le passage par auth signup + trigger)
    raise exception 'profiles INSERT direct interdit (utiliser signup).';
  end if;

  -- UPDATE : si role_id ou status change, exiger SUPER_ADMIN
  if tg_op = 'UPDATE' then
    if new.role_id is distinct from old.role_id or new.status is distinct from old.status then
      if not caller_is_super then
        raise exception 'Élévation de privilèges refusée (SUPER_ADMIN requis).';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_no_escalation on public.profiles;
create trigger trg_profiles_no_escalation
  before insert or update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

-- ============================================================
-- Trigger signup : auth.users -> profiles (rôle défaut CLIENT, jamais SUPER_ADMIN)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_role_id uuid;
begin
  -- Robustesse §10 : si les seeds (003) ne sont pas encore appliqués au moment
  -- d'un signup (002 déjà appliqué), créer CLIENT à la volée au lieu de
  -- laisser un auth.users sans profil exploitable. Idempotent, jamais SUPER_ADMIN.
  insert into public.roles (code, name, description, is_system)
  values ('CLIENT', 'Client partenaire', 'Espace client, devis, commandes.', true)
  on conflict (code) do nothing;

  select r.id into client_role_id from public.roles r where r.code = 'CLIENT';
  if client_role_id is null then
    raise exception 'Rôle CLIENT introuvable après création auto (signup impossible).';
  end if;

  insert into public.profiles (id, email, full_name, role_id, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    client_role_id,
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_users_profiles on auth.users;
create trigger trg_auth_users_profiles
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Audit SECURITY DEFINER §7 : droits d'exécution explicites
-- Helpers lecture seule, nécessaires aux policies RLS (appelant authenticated).
-- Pas d'élévation possible : aucun paramètre contrôlant l'identité,
-- décision basée sur auth.uid() uniquement.
-- ============================================================
revoke all on function public.current_role_id() from public;
revoke all on function public.current_role_code() from public;
revoke all on function public.has_permission(text) from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.current_role_id() to authenticated, service_role;
grant execute on function public.current_role_code() to authenticated, service_role;
grant execute on function public.is_super_admin() to authenticated, service_role;
-- has_permission est aussi appelé dans des policies « to anon » (form_fields_read, 005).
-- Sans ce grant, toute policy anon qui invoque la fonction échoue en 42501 au lieu de
-- renvoyer les lignes publiques. anon n'a pas d'auth.uid() : la fonction renvoie false,
-- donc le grant n'ouvre rien.
grant execute on function public.has_permission(text) to anon, authenticated, service_role;
-- handle_new_user / prevent_privilege_escalation / set_updated_at :
-- exécution via triggers uniquement, aucun GRANT public.

-- ============================================================
-- POLICIES — lecture/écriture minimale, tout le reste refusé
-- ============================================================

-- ---- profiles ----
-- Lecture : soi-même OU users.view (staff habilité)
drop policy if exists profiles_select_own_or_staff on public.profiles;
create policy profiles_select_own_or_staff
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.has_permission('users.view')
  );

-- Écriture : INSERT direct interdit (voir trigger), UPDATE soi-même
-- (champs non-privilégiés) OU users.update. Le trigger bloque role_id/status.
drop policy if exists profiles_update_own_or_staff on public.profiles;
create policy profiles_update_own_or_staff
  on public.profiles for update
  to authenticated
  using (
    id = auth.uid()
    or public.has_permission('users.update')
  )
  with check (
    id = auth.uid()
    or public.has_permission('users.update')
  );

-- Pas de DELETE public : seul SUPER_ADMIN via backend (pas de policy delete = refusé).
-- Création d'utilisateurs staff : via Edge Function/service_role (bypass RLS), pas via policy.

-- ---- roles ----
-- Tout compte authentifié doit pouvoir lire le catalogue des rôles : la connexion
-- elle-même resolve profiles -> roles!inner(code) (AuthContext). Restreindre cette
-- lecture à roles.view/users.view fait remonter zéro enfant, donc zéro profil, et
-- chaque auto-inscription CLIENT échoue avec « Compte introuvable ou suspendu ».
-- Les codes/noms de rôles ne sont pas confidentiels ; les droits, eux, restent sous
-- role_permissions (policy ci-dessous).
drop policy if exists roles_select_staff on public.roles;
create policy roles_select_staff
  on public.roles for select
  to authenticated
  using (true);
-- Pas de INSERT/UPDATE/DELETE public : SUPER_ADMIN via service_role/Edge uniquement.

-- ---- permissions ----
-- Même raisonnement que roles : catalogue lecture seule (les libellés de droits
-- sont déjà connus du client via la matrice de son propre rôle).
drop policy if exists permissions_select_staff on public.permissions;
create policy permissions_select_staff
  on public.permissions for select
  to authenticated
  using (true);
-- Pas d'écriture publique.

-- ---- role_permissions ----
-- L'app résout les droits courants via role_permissions!inner -> permissions!inner(code).
-- Un CLIENT doit donc voir les lignes de PROPRE rôle ; le staff habilité voit tout.
drop policy if exists role_permissions_select_staff on public.role_permissions;
create policy role_permissions_select_staff
  on public.role_permissions for select
  to authenticated
  using (
    role_id = public.current_role_id()
    or public.has_permission('roles.view')
    or public.has_permission('users.view')
  );
-- Pas d'écriture publique : attribution via Edge Function SUPER_ADMIN (service_role).
