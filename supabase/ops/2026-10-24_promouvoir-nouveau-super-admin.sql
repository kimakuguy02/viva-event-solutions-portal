-- Promouvoir un NOUVEAU compte SUPER_ADMIN (créé dans le dashboard Authentication → Users).
-- Le trigger d'inscription (migration 20261003_002) crée toujours un profil CLIENT : la promotion
-- doit donc être faite explicitement. À coller dans l'éditeur SQL du dashboard, en 3 passages.
-- Préalable : cocher « Auto confirm user » à la création du compte, sinon la connexion est refusée.
-- Cible déjà renseignée : kimakuguy02@gmail.com — rien à éditer.

-- ============================================================
-- PASSAGE 1 — ÉTAT DES LIEUX (lecture seule, aucun effet)
-- ============================================================
select u.email,
       (u.email_confirmed_at is not null) as compte_confirme,
       (p.id is not null)                 as profil_existe,
       r.code                             as role_actuel,
       p.status                           as statut_profil
from auth.users u
left join public.profiles p on p.id = u.id
left join public.roles    r on r.id = p.role_id
order by u.created_at;

-- Le rôle cible doit exister ; sinon ne pas continuer.
select id, code, name from public.roles where code in ('SUPER_ADMIN', 'CLIENT');

-- ============================================================
-- PASSAGE 2 — PROMOTION (UNE SEULE LIGNE TOUCHÉE, transactionnelle)
-- ============================================================
set viva.cible = 'kimakuguy02@gmail.com';

begin;

do $$
declare
  v_role     uuid;
  v_client   uuid;
  v_lignes   int;
begin
  select id into v_role   from public.roles where code = 'SUPER_ADMIN';
  select id into v_client from public.roles where code = 'CLIENT';

  if v_role is null then
    raise exception 'Role SUPER_ADMIN absent : seeds 003 non appliqués. Interruptible, rien n''est écrit.';
  end if;

  update public.profiles
     set role_id = v_role,
         status  = 'active'
   where email = current_setting('viva.cible');
  get diagnostics v_lignes = row_count;

  if v_lignes <> 1 then
    raise exception 'Cible % -> % ligne(s) mise(s) a jour. Rollback.', current_setting('viva.cible'), v_lignes;
  end if;
end $$;

commit;

-- ============================================================
-- PASSAGE 3 — CONTRÔLE (lecture seule)
-- Le même session doit encore contenir viva.cible ; sinon le re-setter.
-- ============================================================
set viva.cible = 'kimakuguy02@gmail.com';

select u.email,
       (u.email_confirmed_at is not null) as compte_confirme,
       r.code                              as role_actuel,
       p.status                            as statut_profil,
       p.full_name
from auth.users u
join public.profiles p on p.id = u.id
join public.roles    r on r.id = p.role_id
where u.email = current_setting('viva.cible');

-- ============================================================
-- ROLLBACK UNIQUEMENT SI BESOIN — remet le compte en CLIENT inactif.
-- Attention : si c'est le seul compte administrateur, cela ferme l'accès admin.
-- ============================================================
-- set viva.cible = 'kimakuguy02@gmail.com';
-- begin;
-- update public.profiles
--    set role_id = (select id from public.roles where code = 'CLIENT'),
--        status  = 'inactive'
--  where email = current_setting('viva.cible');
-- commit;
