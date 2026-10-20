// Types pour le CMS, Menus Dynamiques, Modules, Formulaires, Médias et Organigramme
// VIVA EVENT SOLUTIONS SARLU — Architecture Production-Ready

export interface SubDirection {
  id: string;
  name: string;
  description?: string;
  responsible?: string;
  active: boolean;
}

export interface DirectionOrg {
  id: number;
  code: string; // "01", "02", etc.
  name: string;
  tagline: string;
  description: string;
  responsible: string;
  active: boolean;
  order: number;
  subDirections: SubDirection[];
  associatedUsers: string[];
  permissions: string[];
}

export type OrgUnitType = 'direction' | 'sous_direction' | 'departement' | 'service' | 'bureau' | 'poste';

export interface OrganizationUnit {
  id: string;
  parentId: string | null;
  type: OrgUnitType;
  code?: string;
  name: string;
  description: string;
  order: number;
  status: 'actif' | 'inactif';
  responsibleUid?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  responsiblePhotoUrl?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicMenu {
  id: string;
  name: string;
  displayName?: string;
  icon: string;
  description: string;
  route: string;
  order: number;
  showInNavbar: boolean;
  active: boolean;
  minRole: 'visitor' | 'client' | 'manager' | 'admin' | 'super_admin';
  moduleId?: string;
  tag: 'public' | 'client' | 'admin' | 'erp';
}

export interface DynamicModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'core' | 'engineering' | 'logistics' | 'security' | 'digital' | 'management' | 'media' | 'hr';
  route?: string;
  active: boolean;
  status?: 'ACTIF' | 'INACTIF' | 'ARCHIVE';
  allowedRoles: string[];
  permissions: string[];
  menuId?: string;
  archived: boolean;
  workflow?: string;
}

// ==========================================
// FORMULAIRES DYNAMIQUES
// ==========================================

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'image'
  | 'signature'
  | 'currency'
  | 'user'
  | 'department'
  | 'role';

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  /** Texte d'aide affiché sous le champ (Phase 2.2 — persistance DB : R2-05). */
  helpText?: string;
  /** Règle de validation exprimée en texte (ex. "min:3", "regex:^\\+243") — R2-05. */
  validation?: string;
  required: boolean;
  options?: string[]; // Pour select / radio / checkbox / multiselect
  order: number;
  defaultValue?: any;
}

export interface DynamicForm {
  id: string;
  name: string;
  description: string;
  departmentId?: string;
  departmentName?: string;
  moduleId?: string;
  targetAudience: 'public' | 'client' | 'staff' | 'admin';
  allowedRoles: string[];
  status: 'actif' | 'inactif' | 'archive';
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  submissionsCount?: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  data: Record<string, any>;
  submittedBy: string;
  submittedByEmail: string;
  submittedByName?: string;
  status: 'soumis' | 'en_traitement' | 'approuve' | 'rejete';
  notes?: string;
  submittedAt: string;
  updatedAt?: string;
}

// ==========================================
// CMS GLOBAL & VERSIONS
// ==========================================

export interface CmsVersion {
  versionId: string;
  timestamp: string;
  author: string;
  title: string;
  content: string;
  oldValue?: string;
  newValue?: string;
}

export type CmsCategory =
  | 'ACCUEIL'
  | 'A_PROPOS'
  | 'SERVICES'
  | 'REALISATIONS'
  | 'MEDIAS'
  | 'CONTACT'
  | 'FOOTER'
  | 'NAVIGATION'
  | 'ESPACE_CLIENT'
  | 'ESPACE_PUBLIC'
  | 'ESPACE_ADMINISTRATEUR'
  | 'PAGES_INSTITUTIONNELLES'
  | 'MESSAGES_SYSTEME';

export interface CmsSectionItem {
  id: string;
  page: 'accueil' | 'presentation' | 'poles' | 'contact' | 'client_portal' | 'admin' | 'footer' | 'media' | string;
  category?: CmsCategory | string;
  section: string;
  component: string;
  contentKey: string;
  title: string;
  subtitle?: string;
  content: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  type: 'text' | 'html' | 'image_url' | 'slogan' | 'button_label' | 'compound';
  status: 'published' | 'draft' | 'archived';
  language: 'fr' | 'en';
  lastModified: string;
  author: string;
  // Brouillon / Draft fields
  draftTitle?: string;
  draftSubtitle?: string;
  draftContent?: string;
  draftPrimaryButtonText?: string;
  draftSecondaryButtonText?: string;
  // Published / Live fields
  publishedTitle?: string;
  publishedSubtitle?: string;
  publishedContent?: string;
  publishedPrimaryButtonText?: string;
  publishedSecondaryButtonText?: string;
  versions: CmsVersion[];
}

// ==========================================
// MÉDIAS (PHOTOS, RÉALISATIONS, VIDÉOS & YOUTUBE)
// ==========================================

export type MediaCategory =
  | 'sommet_etat'
  | 'corporate'
  | 'scenographie'
  | 'sonorisation'
  | 'eclairage'
  | 'traduction'
  | 'vip'
  | 'general';

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  caption?: string;
  type: 'photo' | 'video_file' | 'youtube';
  category: MediaCategory;
  url: string; // URL de stockage public ou lien vidéo
  storageBucket?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  projectName?: string;
  realizationDate?: string;
  isFeatured: boolean;
  order: number;
  status: 'published' | 'draft' | 'archived';
  uploadedAt: string;
  uploadedBy: string;
}

export interface YouTubeChannelConfig {
  youtubeChannelUrl: string;
  youtubeChannelId: string;
  youtubeChannelName: string;
  youtubeChannelDescription: string;
  isChannelEnabled: boolean;
}

// ==========================================
// ASSISTANT GEMINI AI & ACTIONS RBAC
// ==========================================

export interface AiProposedAction {
  id: string;
  actionType:
    | 'CREATE_DIRECTION'
    | 'UPDATE_DIRECTION'
    | 'CREATE_MODULE'
    | 'UPDATE_MENU'
    | 'CREATE_FORM'
    | 'UPDATE_CMS'
    | 'ADD_MEDIA'
    | 'ADD_YOUTUBE_VIDEO'
    | 'UPDATE_YOUTUBE_CHANNEL'
    | 'CREATE_TRANSACTION'
    | 'INFORMATIONAL';
  title: string;
  description: string;
  payload: any;
  requiresConfirmation: boolean;
  executed?: boolean;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  proposedAction?: AiProposedAction;
  status?: 'pending' | 'success' | 'refused' | 'error';
}
