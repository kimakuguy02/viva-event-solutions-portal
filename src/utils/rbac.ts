import { UserRole } from '../types';

export type ErpModuleId =
  | 'dashboard'
  | 'accounting'
  | 'crm'
  | 'projects-tasks'
  | 'assets-loans'
  | 'human-resources'
  | 'governance'
  | 'purchases';

export interface ModulePermission {
  canAccess: boolean;
  moduleName: string;
  requiredRoles: string[];
  description: string;
  denialReason?: string;
  authorizedRoles: UserRole[];
}

export const ERP_RBAC_PERMISSIONS: Record<ErpModuleId, {
  name: string;
  authorizedRoles: UserRole[];
  requiredRoleNames: string[];
  description: string;
  denialReason: string;
}> = {
  dashboard: {
    name: "Tableau de Bord Exécutif",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'daf_comptable', 'chef_equipe', 'commercial_secretaire', 'admin', 'admin_general'],
    requiredRoleNames: ["Tous les Collaborateurs Habilités"],
    description: "Indicateurs de performance consolidés adaptés au périmètre métier du travailleur.",
    denialReason: "Accès réservé aux employés officiels de VIVA EVENT SOLUTIONS SARLU."
  },
  accounting: {
    name: "Comptabilité & Trésorerie SYSCOHADA",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'daf_comptable', 'admin', 'admin_general'],
    requiredRoleNames: ["COMPTABLE (DAF)", "MALTHUS KILUMBA WA BANZA (DG / Administrateur)"],
    description: "Journaux d'écritures SYSCOHADA/IFRS, caisses USD/CDF, double signature OTP et clôtures journalières.",
    denialReason: "Ce module financier hautement confidentiel est strictement réservé au COMPTABLE et à la Direction Générale (MALTHUS KILUMBA WA BANZA)."
  },
  crm: {
    name: "Clients & CRM Entreprise",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'commercial_secretaire', 'daf_comptable', 'admin', 'admin_general'],
    requiredRoleNames: ["Commercial / Secrétariat", "COMPTABLE", "MALTHUS KILUMBA WA BANZA (DG / Admin)"],
    description: "Portefeuille clients d'État et privés, historique des interactions, devis chiffrés et facturation.",
    denialReason: "Ce module est réservé au pôle commercial, au COMPTABLE pour la facturation et à la Direction Générale (MALTHUS KILUMBA WA BANZA)."
  },
  'projects-tasks': {
    name: "Projets & Tâches Opérationnelles",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'chef_equipe', 'admin', 'admin_general'],
    requiredRoleNames: ["Chef d'Équipe Régie", "MALTHUS KILUMBA WA BANZA (DG / Administrateur)"],
    description: "Chantiers événementiels, assignation des tâches de terrain et fiches d'activité quotidiennes.",
    denialReason: "Ce module de régie technique et d'affectation terrain est réservé au Chef d'Équipe Régie et à la Direction (MALTHUS KILUMBA WA BANZA)."
  },
  'assets-loans': {
    name: "Actifs, Stocks & Prêts Matériel",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'chef_equipe', 'admin', 'admin_general'],
    requiredRoleNames: ["Chef d'Équipe Régie", "MALTHUS KILUMBA WA BANZA (DG / Administrateur)"],
    description: "Traçabilité du parc lourd (groupes électrogènes, Line Array, LED), bons de prêt contradictoires et maintenance.",
    denialReason: "La gestion des actifs physiques et l'émission des bons de sortie de matériel sont réservées à la régie technique et à la Direction (MALTHUS KILUMBA WA BANZA)."
  },
  'human-resources': {
    name: "Ressources Humaines & Organigramme",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'admin', 'admin_general'],
    requiredRoleNames: ["MALTHUS KILUMBA WA BANZA (DG / Administrateur)"],
    description: "Fiches de poste contractuelles des 9 directions, KPIs, gestion des contrats et sécurité du travail.",
    denialReason: "Ce module stratégique RH et confidentiel est sous le contrôle exclusif de MALTHUS KILUMBA WA BANZA (Directeur Général & Administrateur)."
  },
  governance: {
    name: "Gouvernance, Sécurité & Audit Trail",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'admin', 'admin_general'],
    requiredRoleNames: ["MALTHUS KILUMBA WA BANZA (DG / Administrateur)"],
    description: "Matrice d'accès RBAC, journal des événements d'audit immuable et notifications d'urgence multicanales.",
    denialReason: "Le paramétrage de la politique de sécurité et l'audit trail sont réservés exclusivement à MALTHUS KILUMBA WA BANZA (DG & Administrateur)."
  },
  purchases: {
    name: "Achats & Commandes Fournisseurs",
    authorizedRoles: ['dg_gerant', 'admin_rh', 'daf_comptable', 'chef_equipe', 'commercial_secretaire', 'admin', 'admin_general'],
    requiredRoleNames: ["Collaborateurs habilités (session — persistance R4-12)"],
    description: "Demandes d'achat, validations, bons de commande et suivi des livraisons fournisseurs.",
    denialReason: "Ce module est réservé aux collaborateurs habilités."
  }
};

/**
 * Check whether a user role can access a given ERP module
 */
export function canUserAccessModule(role: UserRole, moduleId: ErpModuleId): boolean {
  const perm = ERP_RBAC_PERMISSIONS[moduleId];
  if (!perm) return false;
  return perm.authorizedRoles.includes(role);
}

/**
 * Get permission details for a specific module and role
 */
export function getModulePermission(role: UserRole, moduleId: ErpModuleId): ModulePermission {
  const perm = ERP_RBAC_PERMISSIONS[moduleId];
  const canAccess = perm.authorizedRoles.includes(role);
  return {
    canAccess,
    moduleName: perm.name,
    requiredRoles: perm.requiredRoleNames,
    description: perm.description,
    denialReason: canAccess ? undefined : perm.denialReason,
    authorizedRoles: perm.authorizedRoles
  };
}
