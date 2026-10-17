export type UserRole = 
  | 'visitor' 
  | 'client' 
  | 'dg_gerant'
  | 'admin_rh'
  | 'daf_comptable'
  | 'chef_equipe'
  | 'commercial_secretaire'
  | 'admin' 
  | 'admin_general'
  | 'SUPER_ADMIN'
  | 'super_admin'
  | 'project_manager' 
  | 'logistics_lead' 
  | 'it_technician' 
  | 'department_head'
  | 'permanent_user'
  | 'temporary_user';

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  ipAddress: string;
  device: string;
}

export interface User {
  id: string;
  name: string;
  postnom?: string;
  prenom?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organization?: string;
  clientType?: 'particulier' | 'entreprise' | 'institution' | 'organisation';
  jobTitle?: string;
  industry?: string;
  phone?: string;
  secondaryPhone?: string;
  whatsapp?: string;
  country?: string;
  province?: string;
  city?: string;
  commune?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  contactPerson?: {
    name: string;
    role: string;
    organization: string;
    phone: string;
    whatsapp: string;
    email: string;
    preferredMethod: 'phone' | 'whatsapp' | 'email';
  };
  mfaEnabled?: boolean;
  departmentId?: number;
  permissions?: string[];
}

export interface Department {
  id: number;
  number: number;
  name: string;
  shortName: string;
  tagline: string;
  category: 'commerce' | 'engineering' | 'tech' | 'production' | 'design' | 'catering' | 'logistics' | 'communication' | 'security' | 'services' | 'artistic';
  iconName: string;
  description: string;
  subPillars: {
    title: string;
    description: string;
    capabilities: string[];
  }[];
  keyEquipment?: string[];
  metrics?: { label: string; value: string };
  badgeColor?: string;
  imageUrl?: string;
  meaningText?: string;
  whyThisPoleText?: string;
  globalIdeaText?: string;
  concreteExampleText?: string;
  expectedResultText?: string;
}

export interface PartnerCollege {
  id: number;
  name: string;
  code: string;
  description: string;
  iconName: string;
  keyResponsibilities: string[];
  sopCriteria: string[];
  memberCount: number;
  status: 'active' | 'auditing';
}

export interface Partner {
  id: string;
  name: string;
  collegeId: number;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  rating: number; // 1 to 5
  status: 'certified' | 'pending_audit' | 'renewal_needed';
  oapiCompliant: boolean;
  confidentialitySigned: boolean;
  activeContractsCount: number;
  specialty: string;
}

export interface QuoteItemBreakdown {
  id: string;
  number: string;
  category: string;
  prestation: string;
  specifications: string;
  quantity: number;
  unit: string;
  duration: string;
  unitPriceUSD: number;
  discountUSD: number;
  totalUSD: number;
}

export interface QuoteOptionItem {
  id: string;
  number: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceUSD: number;
  totalUSD: number;
  selected: boolean;
}

export interface AdditionalCostItem {
  id: string;
  number: string;
  title: string;
  justification: string;
  amountUSD: number;
}

export interface CommercialDiscount {
  type: string;
  baseAmountUSD: number;
  ratePercent: number;
  amountUSD: number;
}

export interface PaymentMilestone {
  label: string;
  percentage: number;
  amountUSD: number;
  dueDate: string;
  status: 'a_payer' | 'paye' | 'en_attente';
}

export interface QuoteRequest {
  id: string;
  referenceNumber: string;
  dossierNumber?: string;
  projectCode?: string;
  version?: string;
  emissionDate?: string;
  validityDate?: string;
  clientName: string;
  clientOrganization: string;
  clientEmail: string;
  clientPhone: string;
  eventType: 'institutionnel' | 'diplomatique' | 'entreprise' | 'culturel' | 'mariage_prestige' | 'foire_salon' | 'religieux' | 'sportif';
  eventName: string;
  eventDate: string;
  location: string;
  estimatedAttendees: number;
  format?: 'presentiel' | 'virtuel' | 'live' | 'hybride';
  offerLevel?: 'STANDARD' | 'PREMIUM' | 'VIP_EXECUTIVE';
  selectedDepartmentIds: number[];
  requirements: {
    scenicAudioLight: boolean;
    ledScreensAndBroadcast: boolean;
    hybridStreaming: boolean;
    simultaneousTranslation: boolean;
    vipTransportAndEscort: boolean;
    highSecurityAndCrowdControl: boolean;
    cateringAndCocktail: boolean;
    tentsAndPowerGen: boolean;
    audiovisual4kProduction: boolean;
    decorationAndFloral: boolean;
    artisticAndEntertainment?: boolean;
    hotelAndConcierge?: boolean;
  };
  attachedFiles?: { name: string; size: string; url?: string }[];
  customNotes: string;
  estimatedBudgetUSD: number;
  status: 'submitted' | 'under_review' | 'quote_issued' | 'approved' | 'rejected' | 'en_attente_acompte';
  createdAt: string;
  priority: 'haute' | 'normale' | 'urgente';
  // PDF Quote Detailed breakdown
  items?: QuoteItemBreakdown[];
  options?: QuoteOptionItem[];
  additionalCosts?: AdditionalCostItem[];
  discounts?: CommercialDiscount[];
  paymentMilestones?: PaymentMilestone[];
  internalCostEstimateUSD?: number;
  internalMarginRatePercent?: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  owner?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  priority?: 'basse' | 'normale' | 'haute' | 'urgente';
}

export interface ProjectDeliverable {
  id: string;
  name: string;
  status: 'pending' | 'ready';
  url?: string;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  client: string;
  clientId?: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  budgetUSD: number;
  progressPercent: number;
  status: 'conception' | 'retroplanning' | 'en_cours' | 'cloture' | 'archive';
  departmentsAssigned: number[];
  leadManager: string;
  vipProtocolRequired: boolean;
  securityClearance: 'standard' | 'renforce' | 'haut_niveau';
  format?: 'presentiel' | 'virtuel' | 'live' | 'hybride';
  milestones?: { title: string; date: string; completed: boolean }[];
  deliverables?: { name: string; status: 'pending' | 'ready'; url?: string }[];
  metrics: {
    attendeesExpected: number;
    equipmentCount: number;
    partnerCollegesMobilized: number;
  };
  // Phase PROMPT 2 — extensions produit (miroir legacy ; colonnes PG : R4-01).
  detailedMilestones?: ProjectMilestone[];
  detailedDeliverables?: ProjectDeliverable[];
  team?: string[];
  priority?: 'basse' | 'normale' | 'haute' | 'urgente';
  archived?: boolean;
  description?: string;
}

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category: 'audio' | 'lighting' | 'led_screens' | 'structures' | 'power_generators' | 'tents' | 'broadcast' | 'vehicles' | 'furniture' | 'security_gear';
  departmentId: number;
  quantityTotal: number;
  quantityAvailable: number;
  condition: 'excellent' | 'bon' | 'en_maintenance';
  powerRatingKW?: number;
  specs: string;
  locationStorage: string;
  dailyRateUSD: number;
  imageUrl?: string;
}

export interface TicketSession {
  id: string;
  title: string;
  speaker: string;
  time: string;
  track: string;
  capacity: number;
  registeredCount: number;
  isLive: boolean;
}

export interface PlatformContentConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  heroImageUrl: string;
  welcomeMessage: string;
  whoWeAreText: string;
  whyChooseUsPoints: string[];
  valuesList: { number: string; title: string; text: string }[];
  missionCyclePoints: { title: string; text: string }[];
  marketProblems: { number: number; title: string; desc: string }[];
  marketResponsePoints: string[];
  targetClients: string[];
  eventTypes: { title: string; desc: string; icon: string }[];
  navigationMenuLabels: {
    home: string;
    visitorHub: string;
    poles: string;
    clientSpace: string;
    quoteSimulator: string;
    partners: string;
    equipment: string;
    liveHub: string;
    adminConsole: string;
  };
  companyLogoUrl?: string;
  companyStampUrl?: string;
  managerSignatureUrl?: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    rccm: string;
    idNat: string;
    website: string;
  };
}

