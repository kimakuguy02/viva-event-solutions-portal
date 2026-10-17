-- VIVA EVENT SOLUTIONS — Migration 003 : seeds RBAC idempotents (rôles + permissions + matrice)
-- Idempotent : ré-exécutable sans doublons (ON CONFLICT).
-- Mapping canonique (analyse code réel) :
--   admin_general      -> ADMIN_GENERAL (rôle legacy conservé, distinct de SUPER_ADMIN)
--   admin / SUPER_ADMIN / super_admin -> SUPER_ADMIN (canonique, voir note)
--   dg_gerant          -> DG_GERANT
--   admin_rh           -> ADMIN_RH
--   daf_comptable      -> DAF_COMPTABLE
--   chef_equipe        -> CHEF_EQUIPE
--   commercial_secretaire -> COMMERCIAL_SECRETAIRE
--   client             -> CLIENT        | visitor -> VISITOR
--   project_manager, logistics_lead, it_technician, department_head,
--   permanent_user, temporary_user -> NON repris comme rôles système ;
--   à modéliser plus tard comme org_units/fonctions si besoin (pas de doublons).
-- NOTE : 'admin' générique historique est fusionné dans SUPER_ADMIN pour éviter
--   admin ~ administrator ~ super_admin. ADMIN_GENERAL reste le rôle DG existant.

-- ============ RÔLES (9 canoniques) ============
insert into public.roles (code, name, description, is_system) values
  ('SUPER_ADMIN', 'Super Administrateur', 'Contrôle global plateforme (technique, pas un rôle métier DG).', true),
  ('ADMIN_GENERAL', 'Direction Générale (Admin Général)', 'Rôle DG historique admin_general : pilotage global métier.', true),
  ('DG_GERANT', 'DG / Gérance statutaire', 'Vision stratégique, budgets, validation investissements.', true),
  ('ADMIN_RH', 'Administrateur RH', 'RH, contrats, organigramme, arbitrage opérationnel.', true),
  ('DAF_COMPTABLE', 'DAF / Comptable SYSCOHADA', 'Comptabilité, trésorerie, double signature.', true),
  ('CHEF_EQUIPE', 'Chef d''équipe / Régie', 'Projets terrain, tâches, matériel.', true),
  ('COMMERCIAL_SECRETAIRE', 'Commercial / Secrétariat', 'CRM, devis, communication.', true),
  ('CLIENT', 'Client partenaire', 'Espace client, devis, commandes.', true),
  ('VISITOR', 'Visiteur public', 'Vitrine publique, simulation devis.', true)
on conflict (code) do update set name = excluded.name, description = excluded.description;

-- ============ PERMISSIONS (conserve les 17 codes legacy + extensions RBAC) ============
-- Legacy conservés tels quels : users.view/create/update/delete, roles.manage (gardé
-- pour compat, doublé par roles.* fins), organization.view/update, content.view/update/publish,
-- modules.view/update, quotes.manage, equipment.manage, finance.approve, audit.view, settings.update.
insert into public.permissions (code, name, description, module) values
  -- Utilisateurs / RBAC (legacy + fin)
  ('users.view', 'Consulter les utilisateurs', 'Annuaire collaborateurs.', 'users'),
  ('users.create', 'Créer des utilisateurs', 'Création comptes staff.', 'users'),
  ('users.update', 'Modifier utilisateurs/statuts', 'Profils et suspensions.', 'users'),
  ('users.delete', 'Supprimer des utilisateurs', 'Suppression définitive.', 'users'),
  ('roles.manage', 'Gérer la matrice RBAC (legacy)', 'Alias historique ; préférer roles.*.', 'roles'),
  ('roles.view', 'Consulter rôles et matrice', 'Lecture rôles/permissions.', 'roles'),
  ('roles.create', 'Créer des rôles', 'Nouveaux rôles.', 'roles'),
  ('roles.update', 'Modifier les rôles', 'Renommer / activer.', 'roles'),
  ('roles.delete', 'Supprimer des rôles', 'Suppression rôles non-système.', 'roles'),
  ('permissions.view', 'Consulter les permissions', 'Catalogue permissions.', 'roles'),
  ('permissions.assign', 'Attribuer des permissions', 'Lier rôles<->permissions (SUPER_ADMIN).', 'roles'),
  -- Organisation
  ('organization.view', 'Voir l''organigramme', 'Directions et unités.', 'organization'),
  ('organization.manage', 'Gérer l''organisation', 'Directions, sous-directions, fonctions.', 'organization'),
  -- Contenus / CMS
  ('cms.view', 'Consulter le CMS', 'Catalogue sections.', 'cms'),
  ('cms.create', 'Créer du contenu CMS', 'Nouvelles sections.', 'cms'),
  ('cms.update', 'Éditer le CMS', 'Brouillons et textes.', 'cms'),
  ('cms.publish', 'Publier le CMS', 'Mise en ligne / archivage.', 'cms'),
  ('cms.delete', 'Supprimer du contenu CMS', 'Suppression sections.', 'cms'),
  ('content.view', 'Consulter contenus (legacy)', 'Alias historique cms.view.', 'cms'),
  ('content.update', 'Éditer contenus (legacy)', 'Alias historique cms.update.', 'cms'),
  ('content.publish', 'Publier contenus (legacy)', 'Alias historique cms.publish.', 'cms'),
  -- Menus / Modules / Formulaires
  ('menus.view', 'Consulter les menus', 'Navigation dynamique.', 'menus'),
  ('menus.manage', 'Gérer les menus', 'Créer/ordonner/activer.', 'menus'),
  ('modules.view', 'Consulter les modules', 'Fonctionnalités.', 'modules'),
  ('modules.create', 'Créer des modules', 'Nouvelles fonctionnalités.', 'modules'),
  ('modules.update', 'Modifier les modules', 'Activer/désactiver/attribuer.', 'modules'),
  ('modules.delete', 'Supprimer des modules', 'Retrait modules.', 'modules'),
  ('forms.view', 'Consulter les formulaires', 'Catalogue formulaires.', 'forms'),
  ('forms.create', 'Créer des formulaires', 'Générateur dynamique.', 'forms'),
  ('forms.update', 'Modifier les formulaires', 'Champs et statuts.', 'forms'),
  ('forms.delete', 'Supprimer des formulaires', 'Retrait formulaires.', 'forms'),
  ('forms.submit', 'Soumettre un formulaire', 'Dépôt public/client.', 'forms'),
  -- Médias / YouTube
  ('media.view', 'Consulter les médias', 'Galerie et réalisations.', 'media'),
  ('media.upload', 'Téléverser des médias', 'Photos/vidéos.', 'media'),
  ('media.update', 'Modifier les médias', 'Métadonnées et visibilité.', 'media'),
  ('media.delete', 'Supprimer des médias', 'Retrait + Storage.', 'media'),
  ('media.publish', 'Publier les médias', 'Publication / une.', 'media'),
  -- Audit / Paramètres
  ('audit.view', 'Consulter l''audit', 'Journaux légaux.', 'audit'),
  ('settings.view', 'Consulter les paramètres', 'Config et devises.', 'settings'),
  ('settings.manage', 'Gérer les paramètres', 'Config, taux, feature flags.', 'settings'),
  -- ERP / Opérations
  ('erp.view', 'Consulter l''ERP', 'Tableaux et journaux.', 'erp'),
  ('erp.create', 'Créer des écritures ERP', 'Transactions, tâches, clients.', 'erp'),
  ('erp.update', 'Modifier l''ERP', 'Corrections non validées.', 'erp'),
  ('erp.validate', 'Valider (double signature)', 'Visa manager/DAF.', 'erp'),
  ('equipment.manage', 'Gérer le parc matériel (legacy)', 'Stocks et prêts.', 'erp'),
  ('finance.approve', 'Approuver finances (legacy)', 'Alias historique erp.validate.', 'erp'),
  ('quotes.view', 'Consulter les devis', 'Guichet devis.', 'quotes'),
  ('quotes.create', 'Créer un devis', 'Soumission publique/client.', 'quotes'),
  ('quotes.update', 'Modifier un devis', 'Correction avant validation.', 'quotes'),
  ('quotes.manage', 'Gérer les devis (legacy)', 'Émission et validation.', 'quotes'),
  ('quotes.approve', 'Approuver un devis', 'Validation / rejet.', 'quotes'),
  ('projects.view', 'Consulter les projets', 'Portefeuille.', 'projects'),
  ('projects.create', 'Créer des projets', 'Nouveaux chantiers.', 'projects'),
  ('projects.update', 'Modifier les projets', 'Statuts et avancement.', 'projects'),
  ('projects.delete', 'Supprimer des projets', 'Archivage / retrait.', 'projects')
on conflict (code) do update set name = excluded.name, description = excluded.description, module = excluded.module;

-- ============ MATRICE role_permissions (idempotente) ============
-- SUPER_ADMIN : tout (y compris permissions.assign, seul à l'avoir).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where r.code = 'SUPER_ADMIN'
on conflict do nothing;

-- ADMIN_GENERAL (DG historique) : large métier, sans permissions.assign ni roles.delete/users.delete.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'ADMIN_GENERAL'
  and p.code in (
    'users.view','users.create','users.update',
    'roles.view','permissions.view',
    'organization.view','organization.manage',
    'cms.view','cms.create','cms.update','cms.publish',
    'content.view','content.update','content.publish',
    'menus.view','menus.manage',
    'modules.view','modules.create','modules.update',
    'forms.view','forms.create','forms.update','forms.submit',
    'media.view','media.upload','media.update','media.publish',
    'audit.view','settings.view','settings.manage',
    'erp.view','erp.create','erp.update','erp.validate',
    'equipment.manage','finance.approve',
    'quotes.view','quotes.create','quotes.update','quotes.manage','quotes.approve',
    'projects.view','projects.create','projects.update'
  )
on conflict do nothing;

-- DG_GERANT : exécutif (pas de users.delete/roles.* écriture).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'DG_GERANT'
  and p.code in (
    'users.view','roles.view','permissions.view',
    'organization.view','organization.manage',
    'cms.view','menus.view','modules.view','forms.view','forms.submit',
    'media.view','audit.view','settings.view',
    'erp.view','erp.validate','finance.approve',
    'quotes.view','quotes.manage','quotes.approve',
    'projects.view','projects.create','projects.update'
  )
on conflict do nothing;

-- ADMIN_RH : RH + orga + lecture.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'ADMIN_RH'
  and p.code in (
    'users.view','users.create','users.update','roles.view','permissions.view',
    'organization.view','organization.manage',
    'cms.view','content.view','menus.view','modules.view','forms.view','forms.submit',
    'media.view','projects.view'
  )
on conflict do nothing;

-- DAF_COMPTABLE : finances + devis + audit lecture.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'DAF_COMPTABLE'
  and p.code in (
    'erp.view','erp.create','erp.update','erp.validate','finance.approve',
    'quotes.view','quotes.manage','quotes.approve',
    'modules.view','menus.view','media.view','audit.view','settings.view','projects.view'
  )
on conflict do nothing;

-- CHEF_EQUIPE : terrain + matériel + tâches.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'CHEF_EQUIPE'
  and p.code in (
    'erp.view','erp.create','erp.update','equipment.manage',
    'quotes.view','quotes.manage',
    'projects.view','projects.update',
    'modules.view','menus.view','media.view','forms.submit'
  )
on conflict do nothing;

-- COMMERCIAL_SECRETAIRE : CRM/devis + contenus.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'COMMERCIAL_SECRETAIRE'
  and p.code in (
    'cms.view','cms.update','content.view','content.update',
    'menus.view','modules.view','forms.view','forms.submit',
    'media.view','quotes.view','quotes.create','quotes.update','quotes.manage',
    'erp.view','projects.view'
  )
on conflict do nothing;

-- CLIENT : portail + soumissions propres.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'CLIENT'
  and p.code in ('quotes.view','quotes.create','forms.view','forms.submit','media.view','menus.view','modules.view','projects.view')
on conflict do nothing;

-- VISITOR : vitrine + soumission devis/formulaire (lecture publique gérée aussi par policies futures).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.code = 'VISITOR'
  and p.code in ('quotes.create','forms.submit','media.view','menus.view')
on conflict do nothing;
