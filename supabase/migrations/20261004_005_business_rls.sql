-- CHANTIER 2 — 005 : RLS métier deny-by-default (réutilise has_permission())
-- ANON : uniquement contenus explicitement publiés. Aucun USING(true) sur table privée.
--
-- Règle appliquée partout : JAMAIS « for all » avec un using de lecture.
-- Une policy FOR ALL couvre DELETE, et DELETE n'évalue que « using » : autoriser
-- cms.view signifiait donc pouvoir supprimer toute la ligne éditoriale. Chaque
-- table a désormais une policy par command, avec le droit d'écrire correspondant.
-- Tables sans code *.delete semé : DELETE est gates sur le droit d'update.

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
drop policy if exists cms_staff_insert on public.cms_sections;
create policy cms_staff_insert on public.cms_sections for insert to authenticated
  with check (public.has_permission('cms.create'));
drop policy if exists cms_staff_update on public.cms_sections;
create policy cms_staff_update on public.cms_sections for update to authenticated
  using (public.has_permission('cms.update'))
  with check (public.has_permission('cms.update'));
drop policy if exists cms_staff_delete on public.cms_sections;
create policy cms_staff_delete on public.cms_sections for delete to authenticated
  using (public.has_permission('cms.delete'));
-- Versions : le CMS journalise chaque publication cote appli (addPgVersion).
-- Select-only laissait l'ecran « historique » definitivement inecrire.
drop policy if exists cms_versions_staff_read on public.cms_versions;
create policy cms_versions_staff_read on public.cms_versions for select to authenticated
  using (public.has_permission('cms.view'));
drop policy if exists cms_versions_staff_insert on public.cms_versions;
create policy cms_versions_staff_insert on public.cms_versions for insert to authenticated
  with check (public.has_permission('cms.update'));
drop policy if exists cms_versions_staff_delete on public.cms_versions;
create policy cms_versions_staff_delete on public.cms_versions for delete to authenticated
  using (public.has_permission('cms.delete'));

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
drop policy if exists modules_staff_insert on public.modules;
create policy modules_staff_insert on public.modules for insert to authenticated
  with check (public.has_permission('modules.create'));
drop policy if exists modules_staff_update on public.modules;
create policy modules_staff_update on public.modules for update to authenticated
  using (public.has_permission('modules.update'))
  with check (public.has_permission('modules.update'));
drop policy if exists modules_staff_delete on public.modules;
create policy modules_staff_delete on public.modules for delete to authenticated
  using (public.has_permission('modules.delete'));
drop policy if exists module_permissions_staff_read on public.module_permissions;
create policy module_permissions_staff_read on public.module_permissions for select to authenticated
  using (public.has_permission('modules.view'));
-- module_permissions etait en lecture seule : l'attribution droits<->module ne
-- s'ecrivait donc jamais depuis l'appli (table restee vide en production).
drop policy if exists module_permissions_staff_write on public.module_permissions;
drop policy if exists module_permissions_staff_insert on public.module_permissions;
create policy module_permissions_staff_insert on public.module_permissions for insert to authenticated
  with check (public.has_permission('modules.update'));
drop policy if exists module_permissions_staff_delete on public.module_permissions;
create policy module_permissions_staff_delete on public.module_permissions for delete to authenticated
  using (public.has_permission('modules.update'));

-- ---------- Formulaires : lecture selon audience, soumission publique contrôlée ----------
drop policy if exists forms_public_read on public.forms;
create policy forms_public_read on public.forms for select to anon, authenticated
  using (status = 'actif' and target_audience = 'public');
drop policy if exists forms_staff_read on public.forms;
create policy forms_staff_read on public.forms for select to authenticated
  using (public.has_permission('forms.view'));
drop policy if exists forms_staff_write on public.forms;
drop policy if exists forms_staff_insert on public.forms;
create policy forms_staff_insert on public.forms for insert to authenticated
  with check (public.has_permission('forms.create'));
drop policy if exists forms_staff_update on public.forms;
create policy forms_staff_update on public.forms for update to authenticated
  using (public.has_permission('forms.update'))
  with check (public.has_permission('forms.update'));
drop policy if exists forms_staff_delete on public.forms;
create policy forms_staff_delete on public.forms for delete to authenticated
  using (public.has_permission('forms.delete'));
drop policy if exists form_fields_read on public.form_fields;
create policy form_fields_read on public.form_fields for select to anon, authenticated
  using (exists (select 1 from public.forms f
    where f.id = form_fields.form_id and f.status = 'actif'
      and (f.target_audience = 'public' or public.has_permission('forms.view'))));
-- Champs de formulaire : le createur de formulaire (form builder) ecrit ici.
-- Sans ces policies, le builder etait structurellement inutilisation.
drop policy if exists form_fields_staff_write on public.form_fields;
drop policy if exists form_fields_staff_insert on public.form_fields;
create policy form_fields_staff_insert on public.form_fields for insert to authenticated
  with check (public.has_permission('forms.create'));
drop policy if exists form_fields_staff_update on public.form_fields;
create policy form_fields_staff_update on public.form_fields for update to authenticated
  using (public.has_permission('forms.update'))
  with check (public.has_permission('forms.update'));
drop policy if exists form_fields_staff_delete on public.form_fields;
create policy form_fields_staff_delete on public.form_fields for delete to authenticated
  using (public.has_permission('forms.update') or public.has_permission('forms.delete'));
-- Soumissions : insertion publique CONTROLEE (le garde-fis anti-spam Edge reste a venir).
-- with check (true) laissait un visiteur anonyme ecrire dans n'importe quel formulaire
-- cible staff/admin, avec n'importe quel status (« approuve ») et n'importe quelle
-- identite soumise : empoisonnement du CRM et usure de la base.
drop policy if exists submissions_public_insert on public.form_submissions;
create policy submissions_public_insert on public.form_submissions for insert to anon, authenticated
  with check (
    status = 'soumis'
    and (auth.uid() is null or submitted_by = auth.uid())
    and exists (select 1 from public.forms f
      where f.id = form_submissions.form_id and f.status = 'actif'
        and (f.target_audience = 'public' or auth.uid() is not null))
  );
-- Lecture : l'auteur ou le staff. Le sous-referencement forms est lu par la RLS du
-- demandeur, d'ou l'absence de jointure ici.
drop policy if exists submissions_staff_read on public.form_submissions;
create policy submissions_staff_read on public.form_submissions for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('forms.view'));
drop policy if exists submissions_staff_update on public.form_submissions;
create policy submissions_staff_update on public.form_submissions for update to authenticated
  using (public.has_permission('forms.update'))
  with check (public.has_permission('forms.update'));
drop policy if exists submissions_staff_delete on public.form_submissions;
create policy submissions_staff_delete on public.form_submissions for delete to authenticated
  using (public.has_permission('forms.delete'));

-- ---------- Médias/YouTube : public = published + visibility public ----------
drop policy if exists media_public_read on public.media_items;
create policy media_public_read on public.media_items for select to anon, authenticated
  using (status = 'published' and visibility = 'public');
drop policy if exists media_staff_read on public.media_items;
create policy media_staff_read on public.media_items for select to authenticated
  using (public.has_permission('media.view'));
drop policy if exists media_staff_write on public.media_items;
drop policy if exists media_staff_insert on public.media_items;
create policy media_staff_insert on public.media_items for insert to authenticated
  with check (public.has_permission('media.upload'));
drop policy if exists media_staff_update on public.media_items;
create policy media_staff_update on public.media_items for update to authenticated
  using (public.has_permission('media.update'))
  with check (public.has_permission('media.update'));
drop policy if exists media_staff_delete on public.media_items;
create policy media_staff_delete on public.media_items for delete to authenticated
  using (public.has_permission('media.delete'));
drop policy if exists youtube_public_read on public.youtube_config;
create policy youtube_public_read on public.youtube_config for select to anon, authenticated using (true);
-- Singleton de config (channel_url/id/name) : aucun secret, mais il etait en
-- lecture seule stricte -> l'ecran « reglages YouTube » ne pouvait jamais enregistrer.
drop policy if exists youtube_config_staff_write on public.youtube_config;
drop policy if exists youtube_config_staff_update on public.youtube_config;
create policy youtube_config_staff_update on public.youtube_config for update to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));
drop policy if exists youtube_config_staff_insert on public.youtube_config;
create policy youtube_config_staff_insert on public.youtube_config for insert to authenticated
  with check (public.has_permission('settings.manage'));
drop policy if exists youtube_videos_public_read on public.youtube_videos;
create policy youtube_videos_public_read on public.youtube_videos for select to anon, authenticated
  using (is_published);
drop policy if exists youtube_staff_write on public.youtube_videos;
drop policy if exists youtube_staff_insert on public.youtube_videos;
create policy youtube_staff_insert on public.youtube_videos for insert to authenticated
  with check (public.has_permission('media.upload'));
drop policy if exists youtube_staff_update on public.youtube_videos;
create policy youtube_staff_update on public.youtube_videos for update to authenticated
  using (public.has_permission('media.update'))
  with check (public.has_permission('media.update'));
drop policy if exists youtube_staff_delete on public.youtube_videos;
create policy youtube_staff_delete on public.youtube_videos for delete to authenticated
  using (public.has_permission('media.delete'));

-- ---------- Organisation : lecture publique institutionnelle, écriture staff ----------
drop policy if exists org_public_read on public.org_units;
-- anon ne passe plus par cette table : voir 008, vue v_org_units_public sans
-- coordonnees. La policy ne concerne donc plus que le personnel.
create policy org_public_read on public.org_units for select to authenticated
  using (is_active);
-- Organisation : la lecture est publique, les coordonnees du personnel ne doivent
-- PAS suivre (voir 008 : org_public_read restreint aux colonnes non-PII).
drop policy if exists org_staff_write on public.org_units;
drop policy if exists org_staff_insert on public.org_units;
create policy org_staff_insert on public.org_units for insert to authenticated
  with check (public.has_permission('organization.manage'));
drop policy if exists org_staff_update on public.org_units;
create policy org_staff_update on public.org_units for update to authenticated
  using (public.has_permission('organization.manage'))
  with check (public.has_permission('organization.manage'));
drop policy if exists org_staff_delete on public.org_units;
create policy org_staff_delete on public.org_units for delete to authenticated
  using (public.has_permission('organization.manage'));

-- ---------- CRM/Projets/Devis : jamais publics, owner ou permission ----------
drop policy if exists clients_staff_read on public.clients;
create policy clients_staff_read on public.clients for select to authenticated
  using (owner_profile_id = auth.uid() or public.has_permission('erp.view'));
drop policy if exists clients_staff_write on public.clients;
drop policy if exists clients_staff_insert on public.clients;
create policy clients_staff_insert on public.clients for insert to authenticated
  with check (public.has_permission('erp.create'));
drop policy if exists clients_staff_update on public.clients;
create policy clients_staff_update on public.clients for update to authenticated
  using (public.has_permission('erp.update'))
  with check (public.has_permission('erp.update'));
drop policy if exists clients_staff_delete on public.clients;
create policy clients_staff_delete on public.clients for delete to authenticated
  using (public.has_permission('erp.update'));

drop policy if exists projects_public_none on public.projects;
-- Pas de policy anon : aucun accès public par défaut. Vitrine via media/cms uniquement.
drop policy if exists projects_staff_read on public.projects;
create policy projects_staff_read on public.projects for select to authenticated
  using (lead_profile_id = auth.uid() or public.has_permission('projects.view'));
drop policy if exists projects_staff_write on public.projects;
drop policy if exists projects_staff_insert on public.projects;
create policy projects_staff_insert on public.projects for insert to authenticated
  with check (public.has_permission('projects.create'));
drop policy if exists projects_staff_update on public.projects;
create policy projects_staff_update on public.projects for update to authenticated
  using (public.has_permission('projects.update'))
  with check (public.has_permission('projects.update'));
drop policy if exists projects_staff_delete on public.projects;
create policy projects_staff_delete on public.projects for delete to authenticated
  using (public.has_permission('projects.delete'));

drop policy if exists quotes_owner_read on public.quotes;
create policy quotes_owner_read on public.quotes for select to authenticated
  using (submitted_by = auth.uid() or public.has_permission('quotes.view'));
drop policy if exists quotes_public_insert on public.quotes;
-- with check (true) permettait a un anonyme de creer un devis deja « approved »
-- (le check 004 accepte approved) avec n'importe quel total_et n'importe quel
-- client_email : faux devis valides dans le registre et liste de contacts soutiree.
create policy quotes_public_insert on public.quotes for insert to anon, authenticated
  with check (
    status = 'submitted'
    and (auth.uid() is null or submitted_by = auth.uid())
  );
drop policy if exists quotes_staff_update on public.quotes;
create policy quotes_staff_update on public.quotes for update to authenticated
  using (public.has_permission('quotes.update'))
  -- Auto-approval reserve au droit quotes.approve : sinon quotes.update seul
  -- transforme un devis soumis en devis approuve, sans la validation DAF.
  with check (public.has_permission('quotes.update')
    and (status <> 'approved' or public.has_permission('quotes.approve')));
drop policy if exists quotes_staff_delete on public.quotes;
create policy quotes_staff_delete on public.quotes for delete to authenticated
  using (public.has_permission('quotes.manage'));
drop policy if exists quote_items_read on public.quote_items;
create policy quote_items_read on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q
    where q.id = quote_items.quote_id
      and (q.submitted_by = auth.uid() or public.has_permission('quotes.view'))));
-- Lignes de devis : sans policy d'ecriture, businessService.insertQuote enregistrait
-- l'en-tete et perdait silencieusement tous les postes facture.
drop policy if exists quote_items_staff_write on public.quote_items;
drop policy if exists quote_items_staff_insert on public.quote_items;
create policy quote_items_staff_insert on public.quote_items for insert to authenticated
  with check (public.has_permission('quotes.create') or public.has_permission('quotes.update'));
drop policy if exists quote_items_staff_update on public.quote_items;
create policy quote_items_staff_update on public.quote_items for update to authenticated
  using (public.has_permission('quotes.update'))
  with check (public.has_permission('quotes.update'));
drop policy if exists quote_items_staff_delete on public.quote_items;
create policy quote_items_staff_delete on public.quote_items for delete to authenticated
  using (public.has_permission('quotes.update'));

-- ---------- ERP : staff habilité uniquement ----------
drop policy if exists tasks_staff on public.erp_tasks;
drop policy if exists tasks_staff_insert on public.erp_tasks;
create policy tasks_staff_insert on public.erp_tasks for insert to authenticated
  with check (public.has_permission('erp.create'));
-- L'executeur peut porter a jour SA tache ; la suppression reste un droit de gestion.
drop policy if exists tasks_staff_update on public.erp_tasks;
create policy tasks_staff_update on public.erp_tasks for update to authenticated
  using (assigned_to = auth.uid() or public.has_permission('erp.update'))
  with check (public.has_permission('erp.create') or public.has_permission('erp.update'));
drop policy if exists tasks_staff_delete on public.erp_tasks;
create policy tasks_staff_delete on public.erp_tasks for delete to authenticated
  using (public.has_permission('erp.update'));
drop policy if exists tx_staff_read on public.erp_transactions;
create policy tx_staff_read on public.erp_transactions for select to authenticated
  using (public.has_permission('erp.view'));
drop policy if exists tx_staff_write on public.erp_transactions;
create policy tx_staff_write on public.erp_transactions for insert to authenticated
  with check (public.has_permission('erp.create'));
-- Pas d'UPDATE/DELETE public : validation via RPC/Edge (chantier ERP).
drop policy if exists closures_staff on public.cash_closures;
-- Volontairement aucune policy de fermeture ici : 018 cree closures_staff_read /
-- _write / _update etymeme sur erp.validate, plus un trigger d'immutabilite. Une
-- table sans policy = acces refuse (deny by default), donc la fenetre 005→018 est
-- sure. Redefinir ces policies ici aurait produit un « policy already exists ».

-- ---------- Audit append-only : insert auth, lecture audit.view, jamais update/delete ----------
drop policy if exists audit_insert on public.audit_logs;
-- 010 impose actor_user_id par trigger ; la policy le verrouille aussi, pour que
-- la piste d'audit reste opposable meme si le trigger saute. Ni update ni delete :
-- trigger d'immutabilite plus bas.
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (actor_user_id = auth.uid());
drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select to authenticated
  using (actor_user_id = auth.uid() or public.has_permission('audit.view'));

-- ---------- Paramètres : lecture publique partielle via Edge, ici staff ----------
drop policy if exists settings_staff_read on public.app_settings;
create policy settings_staff_read on public.app_settings for select to authenticated
  using (public.has_permission('settings.view'));
drop policy if exists settings_staff_write on public.app_settings;
-- settings.view seul (DG, DAF) ne doit pas pouvoir effacer le taux de change, la
-- TVA ou le seuil de double signature : le delete partait du meme using que la
-- lecture dans la version « for all ».
drop policy if exists settings_staff_insert on public.app_settings;
create policy settings_staff_insert on public.app_settings for insert to authenticated
  with check (public.has_permission('settings.manage'));
drop policy if exists settings_staff_update on public.app_settings;
create policy settings_staff_update on public.app_settings for update to authenticated
  using (public.has_permission('settings.manage'))
  with check (public.has_permission('settings.manage'));
drop policy if exists settings_staff_delete on public.app_settings;
create policy settings_staff_delete on public.app_settings for delete to authenticated
  using (public.has_permission('settings.manage'));

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
