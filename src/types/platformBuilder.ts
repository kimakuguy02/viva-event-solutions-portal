// Types Platform Builder — Phase 2.1 (frontend/produit).
// Aucune persistance définitive ici : les structures persistées (rôles,
// permissions, org, audit) seront raccordées au modèle Supabase définitif
// après finalisation des fonctionnalités (DATA REQUIREMENT dans le rapport).
// Les rôles canoniques restent : SUPER_ADMIN, ADMIN_GENERAL, DG_GERANT,
// ADMIN_RH, DAF_COMPTABLE, CHEF_EQUIPE, COMMERCIAL_SECRETAIRE, CLIENT, VISITOR.

export type AdminRoleCode =
  | 'SUPER_ADMIN'
  | 'ADMIN_GENERAL'
  | 'DG_GERANT'
  | 'ADMIN_RH'
  | 'DAF_COMPTABLE'
  | 'CHEF_EQUIPE'
  | 'COMMERCIAL_SECRETAIRE'
  | 'CLIENT'
  | 'VISITOR'
  | string;

export type PlatformAction =
  | 'view' | 'create' | 'read' | 'update' | 'delete'
  | 'publish' | 'approve' | 'validate' | 'export' | 'manage' | 'configure';

export interface RoleDefinition {
  id: string;
  code: AdminRoleCode;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  userCount?: number;
}

export interface PermissionGrant {
  module: string;
  actions: PlatformAction[];
}

export interface EffectivePermission {
  roleCode: AdminRoleCode;
  module: string;
  action: PlatformAction;
  granted: boolean;
  origin: 'system' | 'custom';
}

export type WorkflowStageStatus = 'pending' | 'active' | 'done' | 'blocked';

export interface WorkflowStage {
  id: string;
  key: 'REQUEST' | 'SUBMISSION' | 'VERIFICATION' | 'VALIDATION' | 'EXECUTION' | 'CLOSURE';
  label: string;
  responsibleRole: AdminRoleCode;
  dueDays: number;
  status: WorkflowStageStatus;
  conditions: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  targetFormId?: string;
  isActive: boolean;
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
}

export type AuditResult = 'success' | 'failure' | 'denied';
export type AuditLevel = 'info' | 'warning' | 'critical';

export interface AuditEventItem {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  module: string;
  resource: string;
  resourceId?: string;
  result: AuditResult;
  level: AuditLevel;
  source: 'supabase' | 'firestore' | 'local' | 'server';
  details?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  kind: 'denied_access' | 'role_change' | 'failed_login' | 'sensitive_action';
  summary: string;
  actorEmail: string;
  level: AuditLevel;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CopilotProposedAction {
  id: string;
  kind: 'CREATE_MODULE' | 'UPDATE_CMS' | 'CREATE_FORM' | 'UPDATE_MENU' | 'ANALYZE' | 'CONFIG_HELP';
  title: string;
  detail: string;
  payloadSummary: string;
  status: 'proposed' | 'confirmed' | 'rejected';
}

export type PurchaseStatus = 'draft' | 'pending_validation' | 'validated' | 'ordered' | 'delivered' | 'closed' | 'rejected';

export interface PurchaseLine {
  id: string;
  label: string;
  quantity: number;
  unitPriceUSD: number;
}

export interface PurchaseRequest {
  id: string;
  reference: string;
  requester: string;
  direction: string;
  projectCode?: string;
  supplierName?: string;
  lines: PurchaseLine[];
  currency: 'USD' | 'CDF';
  justification: string;
  status: PurchaseStatus;
  validator?: string;
  validatedAt?: string;
  createdAt: string;
}

// Journal d'événements domaine (notifications in-app) — session uniquement,
// jamais de faux historique (R4-25). Persisté serveur à la phase notifications.
export interface DomainEvent {
  id: string;
  time: string;
  kind: 'demande' | 'devis' | 'projet' | 'tache' | 'validation' | 'securite' | 'systeme';
  label: string;
  actorEmail?: string;
}
