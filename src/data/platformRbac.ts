// Données RBAC partagées — reflet EXACT des seeds 003 (lecture seule).
// Source unique pour RolesPermissionsManager + matrices plateforme.
// Toute divergence future avec la base = à corriger ici en priorité.
import type { RoleDefinition, PlatformAction } from '../types/platformBuilder';

export const CANONICAL_ROLES: RoleDefinition[] = [
  { id: 'r-super', code: 'SUPER_ADMIN', name: 'Super Administrateur', description: 'Contrôle global plateforme (technique).', isSystem: true, isActive: true },
  { id: 'r-ag', code: 'ADMIN_GENERAL', name: 'Direction Générale (Admin Général)', description: 'Pilotage global métier.', isSystem: true, isActive: true },
  { id: 'r-dg', code: 'DG_GERANT', name: 'DG / Gérance statutaire', description: 'Vision stratégique, budgets, investissements.', isSystem: true, isActive: true },
  { id: 'r-rh', code: 'ADMIN_RH', name: 'Administrateur RH', description: 'RH, contrats, organigramme.', isSystem: true, isActive: true },
  { id: 'r-daf', code: 'DAF_COMPTABLE', name: 'DAF / Comptable SYSCOHADA', description: 'Comptabilité, trésorerie, double signature.', isSystem: true, isActive: true },
  { id: 'r-chef', code: 'CHEF_EQUIPE', name: "Chef d'équipe / Régie", description: 'Projets terrain, tâches, matériel.', isSystem: true, isActive: true },
  { id: 'r-com', code: 'COMMERCIAL_SECRETAIRE', name: 'Commercial / Secrétariat', description: 'CRM, devis, communication.', isSystem: true, isActive: true },
  { id: 'r-cli', code: 'CLIENT', name: 'Client partenaire', description: 'Espace client, devis, commandes.', isSystem: true, isActive: true },
  { id: 'r-vis', code: 'VISITOR', name: 'Visiteur public', description: 'Vitrine publique.', isSystem: true, isActive: true },
];

export const RBAC_MODULES = ['users', 'roles', 'organization', 'cms', 'menus', 'modules', 'forms', 'media', 'audit', 'settings', 'erp', 'quotes', 'projects'] as const;
export const RBAC_ACTIONS: PlatformAction[] = ['view', 'create', 'read', 'update', 'delete', 'publish', 'approve', 'validate', 'export', 'manage', 'configure'];

export const RBAC_MATRIX: Record<string, Record<string, PlatformAction[]>> = {
  SUPER_ADMIN: Object.fromEntries(RBAC_MODULES.map((m) => [m, [...RBAC_ACTIONS]])),
  ADMIN_GENERAL: {
    users: ['view', 'create', 'update'], roles: ['view'], organization: ['view', 'manage'],
    cms: ['view', 'create', 'update', 'publish'], menus: ['view', 'manage'], modules: ['view', 'create', 'update'],
    forms: ['view', 'create', 'update'], media: ['view', 'update', 'publish'], audit: ['view'],
    settings: ['view', 'manage'], erp: ['view', 'create', 'update', 'validate'],
    quotes: ['view', 'create', 'update', 'approve'], projects: ['view', 'create', 'update'],
  },
  DG_GERANT: {
    users: ['view'], roles: ['view'], organization: ['view', 'manage'], cms: ['view'],
    menus: ['view'], modules: ['view'], forms: ['view'], media: ['view'], audit: ['view'],
    settings: ['view'], erp: ['view', 'validate'], quotes: ['view', 'approve'], projects: ['view', 'create', 'update'],
  },
  ADMIN_RH: {
    users: ['view', 'create', 'update'], roles: ['view'], organization: ['view', 'manage'],
    cms: ['view'], menus: ['view'], modules: ['view'], forms: ['view'], media: ['view'], projects: ['view'],
  },
  DAF_COMPTABLE: {
    erp: ['view', 'create', 'update', 'validate'], quotes: ['view', 'approve'],
    modules: ['view'], menus: ['view'], media: ['view'], audit: ['view'], settings: ['view'], projects: ['view'],
  },
  CHEF_EQUIPE: {
    erp: ['view', 'create', 'update'], quotes: ['view'], projects: ['view', 'update'],
    modules: ['view'], menus: ['view'], media: ['view'], forms: ['view'],
  },
  COMMERCIAL_SECRETAIRE: {
    cms: ['view', 'update'], menus: ['view'], modules: ['view'], forms: ['view'],
    media: ['view'], quotes: ['view', 'create', 'update'], erp: ['view'], projects: ['view'],
  },
  CLIENT: { quotes: ['view', 'create'], forms: ['view'], media: ['view'], menus: ['view'], modules: ['view'], projects: ['view'] },
  VISITOR: { menus: ['view'], media: ['view'] },
};

// Organisation officielle : 9 directions × 4 sous-directions (reflet du code).
export interface OrgDirectionInfo {
  code: string;
  name: string;
  subDirections: string[];
  linkedModules: string[];
  linkedPermissions: string[];
}

export const ORG_DIRECTIONS: OrgDirectionInfo[] = [
  { code: '01', name: 'DIRECTION GÉNÉRALE', subDirections: ['Secrétariat de Direction & coordination', 'Stratégie & développement', 'Contrôle interne & performance', 'Partenariats & relations institutionnelles'], linkedModules: ['ERP & Gestion Opérationnelle'], linkedPermissions: ['organization.manage', 'settings.manage'] },
  { code: '02', name: 'DIRECTION DES RESSOURCES HUMAINES', subDirections: ['Recrutement & gestion des talents', 'Administration du personnel & paie', 'Formation & développement des compétences', 'Relations sociales, discipline & bien-être'], linkedModules: ['ERP & Gestion Opérationnelle'], linkedPermissions: ['users.view', 'users.create'] },
  { code: '03', name: 'DIRECTION ADMINISTRATIVE & FINANCIÈRE', subDirections: ['Administration & affaires générales', 'Comptabilité & fiscalité', 'Finance, trésorerie & contrôle de gestion', 'Achats & gestion des fournisseurs'], linkedModules: ['ERP & Gestion Opérationnelle'], linkedPermissions: ['finance.approve', 'erp.validate'] },
  { code: '04', name: 'AFFAIRES JURIDIQUES', subDirections: ['Conseil juridique & conformité', 'Contrats & affaires commerciales', 'Contentieux & règlement des litiges', 'Propriété intellectuelle & protection juridique'], linkedModules: [], linkedPermissions: [] },
  { code: '05', name: 'INGÉNIERIE & PRODUCTION ÉVÉNEMENTIELLE', subDirections: ['Conseil & ingénierie événementielle', 'Production & réalisation', 'Audiovisuel & cinématographie', 'Diffusion & expériences événementielles'], linkedModules: ['Guichet Devis Intelligent'], linkedPermissions: ['quotes.manage'] },
  { code: '06', name: 'TECHNIQUE, SCÉNOGRAPHIE & INFRASTRUCTURES', subDirections: ['Son, lumière & scène', 'Image, LED & solutions visuelles', 'Décoration & scénographie', 'Location & infrastructures'], linkedModules: ['Gestion du Parc Matériel'], linkedPermissions: ['equipment.manage'] },
  { code: '07', name: 'LOGISTIQUE, HOSPITALITÉ & EXPÉRIENCE PARTICIPANT', subDirections: ['Transport & mobilité', 'Accueil, protocole & gestion des invités', 'Billetterie & gestion des participants', 'Traiteur, hébergement & conciergerie'], linkedModules: [], linkedPermissions: [] },
  { code: '08', name: 'COMMUNICATION, MARKETING & DÉVELOPPEMENT DIGITAL', subDirections: ['Marketing & promotion', 'Communication & relations publiques', 'Branding & activation de marque', 'Technologies & solutions digitales'], linkedModules: ['CMS & Édition de Contenus', 'Hub Live & Q&A Interactive'], linkedPermissions: ['content.update'] },
  { code: '09', name: 'SÉCURITÉ, SÛRETÉ & GESTION DES RISQUES', subDirections: ['Sécurité & gardiennage', 'Sûreté & protection', 'Gestion des risques & prévention', 'Sécurité technique & conformités'], linkedModules: ['Sûreté & Contrôle d’Accès RLS'], linkedPermissions: ['audit.view'] },
];
