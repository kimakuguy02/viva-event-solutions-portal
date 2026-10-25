export type UserRole = 
  | 'visitor' 
  | 'client' 
  | 'dg_gerant'             // Joel TUVUVU NGOY KASONGO (DG / Gérance)
  | 'admin_rh'              // Eric KAZADI LUYENGA (Administrateur Opérationnel & RH)
  | 'daf_comptable'          // Patrick MUKENDI (Comptable / DAF)
  | 'chef_equipe'           // Serge ILUNGA (Chef d'Équipe Opérationnel)
  | 'commercial_secretaire' // Sarah KALONJI (Commercial / Secrétaire)
  | 'admin'                 // compat
  | 'admin_general';        // compat

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  ipAddress: string;
  device: string;
}

// ==================== ORGANIGRAMME & EMPLOYÉS ====================
export interface JobPosition {
  title: string;
  direction: string;
  reportsTo: string;
  mainMissions: string[];
  responsibilities: string[];
  kpis: string[];
  systemPermissions: string[];
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  jobTitle: string;
  directionName: string;
  reportsTo: string;
  jobPosition: JobPosition;
  avatar?: string;
  status: 'active' | 'en_mission' | 'conge';
}

// ==================== CRM (CLIENTS & PROSPECTS) ====================
export interface CrmClient {
  id: string;
  code: string;
  name: string;
  organization: string;
  category: 'institutionnel' | 'diplomatique' | 'grande_entreprise' | 'pme' | 'particulier_vip';
  status: 'prospect' | 'devis_en_cours' | 'client_actif' | 'fidelise';
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  totalRevenueUSD: number;
  contractsCount: number;
  fidelityTier: 'standard' | 'argent' | 'or' | 'platine';
  lastInteractionDate: string;
  assignedManager: string;
  notes: string;
}

export interface CrmInteraction {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  type: 'appel' | 'reunion' | 'email' | 'visite_terrain' | 'devis_transmis' | 'autre';
  authorName: string;
  authorProfileId?: string;
  summary: string;
  nextAction?: string;
  nextFollowUpDate?: string;
}

// ==================== COMPTABILITÉ & TRÉSORERIE (SYSCOHADA / IFRS RDC) ====================
export type PaymentAccount = 
  | 'caisse_usd' 
  | 'caisse_cdf' 
  | 'banque_rawbank_usd' 
  | 'banque_rawbank_cdf' 
  | 'banque_equity_usd' 
  | 'mpesa_cdf' 
  | 'orange_money_cdf' 
  | 'airtel_money_usd';

export interface AccountingTransaction {
  id: string;
  pieceReference: string; // Ex: FAC-2026-089, CHQ-RAW-4521, RC-0012
  date: string;
  type: 'recette' | 'depense';
  category: 
    | 'ventes_services'     // Recettes: Ventes prestations son/lumière/vidéo/scéno
    | 'marchandises'        // Recettes: Vente & Location matériel
    | 'subventions'         // Recettes: Subventions, partenariats & sponsoring
    | 'loyers'              // Dépenses: Loyers dépôts & bureaux
    | 'energie'             // Dépenses: Carburant groupes électrogènes 500 kVA, SNEL
    | 'salaires'            // Dépenses: Salaires, primes régisseurs & techniciens
    | 'stock';              // Dépenses: Achat matériel consommable, câbles, projecteurs
  accountCode: string;     // Ex: 7061 (Ventes prestations), 6051 (Énergie), 6611 (Salaires)
  description: string;
  amountUSD: number;
  amountCDF: number;
  paymentAccount: PaymentAccount;
  beneficiaryOrPayer: string;
  performedBy: string;
  requiresDoubleSignature: boolean; // True si > 100 USD ou > 285 000 CDF
  validationStatus: 'valide' | 'en_attente_manager' | 'en_attente_otp_daf' | 'rejete';
  managerApprovedBy?: string;
  dafOtpVerifiedAt?: string;
  attachmentUrl?: string;
}

export interface DailyCashClosure {
  id: string;
  date: string;
  currency: 'USD' | 'CDF';
  theoreticalBalance: number;
  physicalCountedBalance: number;
  discrepancy: number; // physical - theoretical
  justification?: string;
  closedBy: string;
  pvReference: string;
  status: 'conforme' | 'ecart_justifie' | 'anomalie';
  closedAt: string;
  /** Visa DAF posé par la RPC closure_validate (jamais par le navigateur). */
  validatedBy?: string;
  validatedAt?: string;
}

// ==================== GESTION DE PROJETS & TÂCHES ====================
export type TaskPriority = 'basse' | 'normale' | 'haute' | 'urgente';
export type TaskStatus = 'a_faire' | 'en_cours' | 'revue' | 'termine';

export interface ProjectTask {
  id: string;
  projectCode: string;
  projectTitle: string;
  serviceDirection: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  createdAt: string;
  completedAt?: string;
  estimatedHours: number;
}

export interface DailyFieldReport {
  id: string;
  reportDate: string;
  projectTitle: string;
  projectCode: string;
  leadSupervisor: string;
  teamMembersPresent: string[];
  weatherCondition: 'favorable' | 'pluvieux' | 'orageux' | 'chaleur_extreme';
  technicalProgress: string;
  incidentsEncountered: string;
  solutionsApplied: string;
  materialUsed: string[];
  supervisorSignatureName: string;
  signedAt: string;
}

// ==================== GESTION ACTIFS, STOCKS & IMMOBILISATIONS ====================
export interface EquipmentLoanRecord {
  id: string;
  voucherNumber: string; // Ex: BON-PRET-2026-0045
  equipmentCode: string;
  equipmentName: string;
  serialNumber?: string;
  quantity: number;
  borrowerName: string;     // QUI
  borrowerRole: string;
  borrowerPhone: string;
  projectAssignment: string;// POUR QUOI
  checkoutDate: string;     // QUAND
  expectedReturnDate: string;
  actualReturnDate?: string;
  outgoingCondition: 'excellent' | 'bon_etat' | 'usure_normale';
  returnCondition?: 'impeccable' | 'usure_normale' | 'degrade' | 'en_panne';
  status: 'en_cours' | 'restitue' | 'en_retard' | 'incident_signale';
  damageCostUSD?: number;
  notes?: string;
  inspectedBy: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  date: string;
  type: 'preventive' | 'curative' | 'etalonnage';
  technicianName: string;
  description: string;
  costUSD: number;
  costCDF: number;
  partsReplaced?: string;
  nextScheduledDate: string;
}

// ==================== COMMUNICATION MULTICANAL ====================
export interface MultichannelNotice {
  id: string;
  channel: 'sms' | 'email' | 'notification_push';
  targetRecipient: string;
  recipientName: string;
  subject: string;
  content: string;
  sentAt: string;
  status: 'envoye' | 'delivre' | 'ouvert';
  category: 'facture_devis' | 'alerte_securite' | 'rappel_echeance' | 'maintenance' | 'annonce_rh';
}

// ==================== MESSAGERIE INTERNE DU PERSONNEL ====================
export type MessagePriority = 'normal' | 'important' | 'urgent';

export interface MessageAttachment {
  type: 'devis' | 'tache' | 'materiel' | 'transaction' | 'client';
  label: string;
  referenceId: string;
  extraInfo?: string;
}

export interface StaffMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderJobTitle: string;
  senderAvatarColor: string;
  recipientId?: string; // ID du collègue si message privé 1-à-1
  channelId?: string;   // ID du salon si message de groupe
  content: string;
  timestamp: string;
  priority?: MessagePriority;
  attachment?: MessageAttachment;
  readBy?: string[];    // Liste des IDs utilisateurs ayant lu le message
}

export interface StaffChannel {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'general' | 'operations' | 'finance' | 'commercial' | 'urgences';
  isPrivate?: boolean;
  memberRoles: UserRole[];
  unreadCount?: number;
}

// ==================== NOTIFICATIONS PAR COMPTE ====================
export type NotificationType = 
  | 'message' 
  | 'validation_requise' 
  | 'alerte_metier' 
  | 'succes' 
  | 'directive';

export interface AccountNotification {
  id: string;
  recipientId: string;   // ID de l'utilisateur ou du rôle cible
  recipientRole?: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  timestamp: string;
  isRead: boolean;
  actionTab?: string;    // Onglet ERP vers lequel naviguer (ex: 'accounting', 'messaging', 'projects-tasks')
  actionLabel?: string;
  metadata?: {
    senderName?: string;
    referenceCode?: string;
    amountUSD?: number;
    channelId?: string;
  };
}

// ==================== PERSONNALISATION & MODIFICATIONS DE COMPTE ====================
export type WorkerAvailability = 'disponible' | 'en_mission' | 'reunion' | 'occupe' | 'conge';

export interface WorkerProfileCustomization {
  workerId: string;
  name: string;
  phone: string;
  whatsapp?: string;
  bio?: string;
  avatarColor: string;
  availability: WorkerAvailability;
  statusNote?: string;
  notifySound: boolean;
  notifyInApp: boolean;
  lastUpdated: string;
}
