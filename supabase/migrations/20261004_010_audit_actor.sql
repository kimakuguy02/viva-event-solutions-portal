-- VIVA — Migration 010 : acteur d'audit fiable côté serveur
-- Constat P1 (Wave 1) : audit_insert autorise tout actor_user_id fourni par le
-- client. Ce trigger impose actor_user_id = auth.uid() et created_at = now()
-- pour toute session authentifiée ; les opérations service_role/SQL (uid NULL,
-- ex. seeds, Edge admin) conservent les valeurs fournies.
-- Idempotent. Ne touche à aucune donnée existante.

create or replace function public.force_audit_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.actor_user_id := auth.uid();
    new.created_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_actor on public.audit_logs;
create trigger trg_audit_actor
  before insert on public.audit_logs
  for each row execute function public.force_audit_actor();
