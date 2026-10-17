-- CHANTIER 2 — 005 : RLS métier deny-by-default (réutilise has_permission())
-- ANON : uniquement contenus explicitement publiés. Aucun USING(true) sur table privée.

alter table public.cms_sections enable row level security;
alter table public.cms_versions enable row level security;
alter table public.menus enable row level security;
alter table public.modules enable row level security;
alter table public.module_permissions enable row level security;
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_submissions enable row level security;
alter table public.media_items enable row level security;
alter table public.youtube_config enable row level security;
alter table public.youtube_videos enable row level security;
alter table public.org_units enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.erp_tasks enable row level security;
alter table public.erp_transactions enable row level security;
alter table public.cash_closures enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

-- ---------- CMS : public = published seul ----------
drop policy if exists cms_public_read on public.cms_sections;
create policy cms_public_read on public.cms_sections for select to anon, authenticated
  using (status = 'published');
drop policy if exists cms_staff_manage on public.cms_sections;
create policy cms_staff_manage on public.cms_sections for all to authenticated
  using (public.has_permission('cms.view'))
  with check (public.has_permission('cms.update'));
-- Versions : staff lecture seule (écriture via trigger/Edge à venir)
drop policy if exists cms_versions_staff_read on public.cms_versions;
create policy cms_versions_staff_read on public.cms_versions for select to authenticated
  using (public.has_permission('cms.view'));

-- ---------- Menus/Modules : public = actifs + visibilité public ----------
drop policy if exists menus_public_read on public.menus;
create policy menus_public_read on public.menus for select to anon, authenticated
  using (is_active and visibility = 'public');
drop policy if exists menus_staff_read on public.menus;
create policy menus_staff_read on public.menus for select to authenticated
  using (public.has_permission('menus.view'));
drop policy if exists menus_staff_write on public.menus;
create policy menus_staff_write on public.menus for insert to authenticated
  with check (public.has_permission('menus.manage'));
drop policy if exists menus_staff_update on public.menus;
create policy menus_staff_update on public.menus for update to authenticated
  using (public.has_permission('menus.manage')) with check (public.has_permission('menus.manage'));
drop policy if exists menus_staff_delete on public.menus;
create policy menus_staff_delete on public.menus for delete to authenticated
  using (public.has_permission('menus.manage'));

drop policy if exists modules_public_read on public.modules;
create policy modules_public_read on public.modules for select to anon, authenticated
  using (is_active and not archived);
drop policy if exists modules_staff_write on public.modules;
create policy modules_staff_write on public.modules for all to authenticated
  using (public.has_permission('modules.view'))
  with check (public.has_permission('modules.create'));
drop policy if exists module_permissions_staff_read on public.module_permissions;
create policy module_permissions_staff_read on public.module_permissions for select to authenticated
  using (public.has_permission('modules.view'));

-- ---------- Formulaires : lecture selon audience, soumission publique contrôlée ----------
drop policy if exists forms_public_read on public.forms;
create policy forms_public_read on public.forms for select to anon, authenticated
  using (status = 'actif' and target_audience = 'public');
drop policy if exists forms_staff_read on public.forms;
create policy forms_staff_read on public.forms for select to authenticated
  using (public.has_permission('forms.view'));
drop policy if exists forms_staff_write on public.forms;
create policy forms_staff_write on public.forms for all to authenticated
  using (public.has_permission('forms.view'))
  with check (public.has_permission('forms.create'));
drop policy if exists form_fields_read on public.form_fields;
create policy form_fields_read on public.form_fields for select to anon, authenticated
  using (exists (select 1 from public.forms f
    where f.id = form_fields.form_id and f.status = 'actif'
      and (f.target_audience = 'public' or public.has_permission('forms.view'))));
-- Soumissions : insertion publique (spam filtré Edge plus tard), lecture staff + auteur
drop policy if exists submissions_public_insert on public.form_submissions;
create policy submissions_public_insert on public.form_submissions for insert to anon, authenticated
  with check (true);
drop policy if exists submissions_staff_read on public.form_submissions;
create policy submissions_staff_read on public.form_submissions for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('forms.view'));

-- ---------- Médias/YouTube : public = published + visibility public ----------
drop policy if exists media_public_read on public.media_items;
create policy media_public_read on public.media_items for select to anon, authenticated
  using (status = 'published' and visibility = 'public');
drop policy if exists media_staff_read on public.media_items;
create policy media_staff_read on public.media_items for select to authenticated
  using (public.has_permission('media.view'));
drop policy if exists media_staff_write on public.media_items;
create policy media_staff_write on public.media_items for all to authenticated
  using (public.has_permission('media.view'))
  with check (public.has_permission('media.upload'));
drop policy if exists youtube_public_read on public.youtube_config;
create policy youtube_public_read on public.youtube_config for select to anon, authenticated using (true);
drop policy if exists youtube_videos_public_read on public.youtube_videos;
create policy youtube_videos_public_read on public.youtube_videos for select to anon, authenticated
  using (is_published);
drop policy if exists youtube_staff_write on public.youtube_videos;
create policy youtube_staff_write on public.youtube_videos for all to authenticated
  using (public.has_permission('media.view'))
  with check (public.has_permission('media.upload'));

-- ---------- Organisation : lecture publique institutionnelle, écriture staff ----------
drop policy if exists org_public_read on public.org_units;
create policy org_public_read on public.org_units for select to anon, authenticated
  using (is_active);
drop policy if exists org_staff_write on public.org_units;
create policy org_staff_write on public.org_units for all to authenticated
  using (public.has_permission('organization.view'))
  with check (public.has_permission('organization.manage'));

-- ---------- CRM/Projets/Devis : jamais publics, owner ou permission ----------
drop policy if exists clients_staff_read on public.clients;
create policy clients_staff_read on public.clients for select to authenticated
  using (owner_profile_id = auth.uid() or public.has_permission('erp.view'));
drop policy if exists clients_staff_write on public.clients;
create policy clients_staff_write on public.clients for all to authenticated
  using (public.has_permission('erp.create')) with check (public.has_permission('erp.create'));

drop policy if exists projects_public_none on public.projects;
-- Pas de policy anon : aucun accès public par défaut. Vitrine via media/cms uniquement.
drop policy if exists projects_staff_read on public.projects;
create policy projects_staff_read on public.projects for select to authenticated
  using (lead_profile_id = auth.uid() or public.has_permission('projects.view'));
drop policy if exists projects_staff_write on public.projects;
create policy projects_staff_write on public.projects for all to authenticated
  using (public.has_permission('projects.create'))
  with check (public.has_permission('projects.create'));

drop policy if exists quotes_owner_read on public.quotes;
create policy quotes_owner_read on public.quotes for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('quotes.view'));
drop policy if exists quotes_public_insert on public.quotes;
create policy quotes_public_insert on public.quotes for insert to anon, authenticated with check (true);
drop policy if exists quotes_staff_update on public.quotes;
create policy quotes_staff_update on public.quotes for update to authenticated
  using (public.has_permission('quotes.update')) with check (public.has_permission('quotes.update'));
drop policy if exists quote_items_read on public.quote_items;
create policy quote_items_read on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q
    where q.id = quote_items.quote_id
      and (q.submitted_by = auth.uid() or public.has_permission('quotes.view'))));

-- ---------- ERP : staff habilité uniquement ----------
drop policy if exists tasks_staff on public.erp_tasks;
create policy tasks_staff on public.erp_tasks for all to authenticated
  using (assigned_to = auth.uid() or public.has_permission('erp.view'))
  with check (public.has_permission('erp.create'));
drop policy if exists tx_staff_read on public.erp_transactions;
create policy tx_staff_read on public.erp_transactions for select to authenticated
  using (public.has_permission('erp.view'));
drop policy if exists tx_staff_write on public.erp_transactions;
create policy tx_staff_write on public.erp_transactions for insert to authenticated
  with check (public.has_permission('erp.create'));
-- Pas d'UPDATE/DELETE public : validation via RPC/Edge (chantier ERP).
drop policy if exists closures_staff on public.cash_closures;
create policy closures_staff on public.cash_closures for all to authenticated
  using (public.has_permission('erp.view'))
  with check (public.has_permission('erp.validate'));

-- ---------- Audit append-only : insert auth, lecture audit.view, jamais update/delete ----------
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert to authenticated with check (true);
drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select to authenticated
  using (actor_user_id = auth.uid() or public.has_permission('audit.view'));

-- ---------- Paramètres : lecture publique partielle via Edge, ici staff ----------
drop policy if exists settings_staff_read on public.app_settings;
create policy settings_staff_read on public.app_settings for select to authenticated
  using (public.has_permission('settings.view'));
drop policy if exists settings_staff_write on public.app_settings;
create policy settings_staff_write on public.app_settings for all to authenticated
  using (public.has_permission('settings.view'))
  with check (public.has_permission('settings.manage'));

-- ---------- Immutabilité transactions validées (défense en profondeur) ----------
create or replace function public.prevent_validated_tx_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.validation_status = 'valide' then
    raise exception 'Transaction validée immuable (utiliser contrepassation).';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'Suppression transaction interdite (contrepassation requise).';
  end if;
  return coalesce(new, old);
end; $$;
drop trigger if exists trg_tx_immutable on public.erp_transactions;
create trigger trg_tx_immutable before update or delete on public.erp_transactions
  for each row execute function public.prevent_validated_tx_mutation();

-- ---------- Audit : refuse update/delete même service hors service_role ----------
create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  raise exception 'audit_logs append-only (ni update ni delete).';
end; $$;
drop trigger if exists trg_audit_immutable on public.audit_logs;
create trigger trg_audit_immutable before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_mutation();
