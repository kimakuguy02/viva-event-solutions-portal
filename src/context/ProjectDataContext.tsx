import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, QuoteRequest, EquipmentItem, Partner, TicketSession, PlatformContentConfig, Department } from '../types';
import {
  DirectionOrg,
  OrganizationUnit,
  DynamicMenu,
  DynamicModule,
  DynamicForm,
  FormSubmission,
  CmsSectionItem,
  MediaItem,
  YouTubeChannelConfig
} from '../types/cmsAndErp';
import { INITIAL_PROJECTS, INITIAL_QUOTES, INITIAL_EQUIPMENT, INITIAL_PARTNERS, INITIAL_TICKETS } from '../data/vivaData';
import { DEFAULT_PLATFORM_CONFIG, POLES_15_OFFICIAL_DATA } from '../data/platformConfig';
import {
  INITIAL_DIRECTIONS_ORG,
  INITIAL_ORG_UNITS,
  INITIAL_DYNAMIC_MENUS,
  INITIAL_DYNAMIC_MODULES,
  INITIAL_CMS_SECTIONS,
  INITIAL_MEDIA_ITEMS,
  INITIAL_YOUTUBE_CONFIG,
  INITIAL_DYNAMIC_FORMS
} from '../data/cmsAndErpDefaults';
import {
  setFirestoreDocument,
  updateFirestoreDocument,
  deleteFirestoreDocument,
  subscribeFirestoreCollection,
  logAuditEvent,
  auth
} from '../services/firebase';
import { isSupabaseConfigured } from '../services/supabase';
import { logAudit } from '../services/supabase/auditService';
import {
  fetchMenus as fetchPgMenus,
  saveMenus as savePgMenus,
} from '../services/supabase/menuModuleService';
import {
  fetchModules as fetchPgModules,
  saveModules as savePgModules,
} from '../services/supabase/menuModuleService';
import {
  fetchSections as fetchPgSections,
  upsertSection as upsertPgSection,
  deleteSection as deletePgSection,
  addVersion as addPgVersion,
  publishSection as publishPgSection,
} from '../services/supabase/cmsService';
import {
  fetchForms as fetchPgForms,
  saveForm as savePgForm,
  deleteForm as deletePgForm,
  submitForm as submitPgForm,
  fetchSubmissions as fetchPgSubmissions,
  fetchOrgUnits as fetchPgOrgUnits,
  saveOrgUnits as savePgOrgUnits,
} from '../services/supabase/formOrgService';
import {
  fetchMedia as fetchPgMedia,
  saveMedia as savePgMedia,
  deleteMedia as deletePgMedia,
  fetchYouTubeConfig as fetchPgYouTube,
  saveYouTubeConfig as savePgYouTube,
} from '../services/supabase/mediaService';
import {
  fetchProjects as fetchPgProjects,
  saveProject as savePgProject,
  fetchQuotes as fetchPgQuotes,
  insertQuote as insertPgQuote,
  updateQuoteStatus as updatePgQuoteStatus,
} from '../services/supabase/businessService';
import { onAuthStateChanged } from 'firebase/auth';
import { where } from 'firebase/firestore';
import { platformSession } from '../services/platformSession';

export interface LiveQuestion {
  id: string;
  author: string;
  affiliation: string;
  content: string;
  votes: number;
  isAnswered: boolean;
  isApproved: boolean;
  timestamp: string;
}

export interface LivePoll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  isActive: boolean;
}

interface ProjectDataContextType {
  projects: Project[];
  quotes: QuoteRequest[];
  equipment: EquipmentItem[];
  partners: Partner[];
  tickets: TicketSession[];
  liveQuestions: LiveQuestion[];
  currentPoll: LivePoll;
  platformConfig: PlatformContentConfig;
  departments: Department[];
  directionsOrg: DirectionOrg[];
  orgUnits: OrganizationUnit[];
  dynamicMenus: DynamicMenu[];
  dynamicModules: DynamicModule[];
  dynamicForms: DynamicForm[];
  formSubmissions: FormSubmission[];
  cmsSections: CmsSectionItem[];
  mediaItems: MediaItem[];
  youtubeConfig: YouTubeChannelConfig;

  // Platform & CMS Content Actions
  updatePlatformConfig: (newConfig: Partial<PlatformContentConfig>) => void;
  updateDepartment: (id: number, updatedData: Partial<Department>) => void;
  addDepartment: (department: Omit<Department, 'id'>) => void;
  updateDirectionsOrg: (directions: DirectionOrg[]) => void;
  updateDynamicMenus: (menus: DynamicMenu[]) => void;
  updateDynamicModules: (modules: DynamicModule[]) => void;
  updateCmsSections: (sections: CmsSectionItem[]) => void;

  // Organigramme Dynamique Actions
  addOrgUnit: (unit: Omit<OrganizationUnit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrgUnit: (id: string, updated: Partial<OrganizationUnit>) => void;
  deleteOrgUnit: (id: string) => void;

  // Formulaires Dynamiques Actions
  addDynamicForm: (form: Omit<DynamicForm, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDynamicForm: (id: string, updated: Partial<DynamicForm>) => void;
  deleteDynamicForm: (id: string) => void;
  submitDynamicForm: (formId: string, data: Record<string, any>, submittedByName?: string) => Promise<string>;

  // Médias, Réalisations & Vidéos Actions
  addMediaItem: (media: Omit<MediaItem, 'id' | 'uploadedAt'>) => void;
  updateMediaItem: (id: string, updated: Partial<MediaItem>) => void;
  deleteMediaItem: (id: string) => void;
  updateYouTubeConfig: (cfg: Partial<YouTubeChannelConfig>) => void;

  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'code'>) => void;
  updateProjectDetails: (id: string, patch: Partial<Project>) => Promise<void>;
  updateProjectStatus: (id: string, status: Project['status'], progress: number) => void;

  // Quote Actions
  submitQuoteRequest: (quote: Omit<QuoteRequest, 'id' | 'referenceNumber' | 'createdAt' | 'status'>) => Promise<string>;
  updateQuoteStatus: (id: string, status: QuoteRequest['status']) => void;

  // Equipment Actions
  updateEquipmentStock: (id: string, quantityAvailable: number, condition?: EquipmentItem['condition']) => void;

  // Partner Actions
  updatePartnerStatus: (id: string, status: Partner['status'], rating?: number) => void;

  // Live Event Actions
  askLiveQuestion: (author: string, affiliation: string, content: string) => void;
  upvoteQuestion: (questionId: string) => void;
  moderateQuestion: (questionId: string, approve: boolean, markAnswered?: boolean) => void;
  votePoll: (optionId: string) => void;

  // Reset Data
  resetToDefaults: () => void;

  // CMS Draft / Preview / Visual Edit Actions
  isVisualEditMode: boolean;
  setVisualEditMode: (active: boolean) => void;
  activeVisualEditKey: string | null;
  setActiveVisualEditKey: (key: string | null) => void;
  previewDraftMode: boolean;
  setPreviewDraftMode: (active: boolean) => void;
  getCmsItem: (contentKey: string) => CmsSectionItem | undefined;
  getCmsValue: (contentKey: string, field?: 'content' | 'title' | 'subtitle' | 'primaryButtonText' | 'secondaryButtonText', fallback?: string) => string;
  saveCmsDraft: (idOrKey: string, draftData: Partial<CmsSectionItem>) => Promise<void>;
  publishCmsItem: (idOrKey: string, publishData?: Partial<CmsSectionItem>) => Promise<void>;
}

const ProjectDataContext = createContext<ProjectDataContextType | undefined>(undefined);

const INITIAL_QUESTIONS: LiveQuestion[] = [
  {
    id: "q-1",
    author: "M. Dieudonné Kalala",
    affiliation: "Directeur Événements - BCDC",
    content: "Quel est le délai moyen de déploiement pour un système Line Array et un mur LED de 100 m² à Kinshasa ?",
    votes: 24,
    isApproved: true,
    isAnswered: true,
    timestamp: "10:14"
  },
  {
    id: "q-2",
    author: "Honorable Sophie Kabangu",
    affiliation: "Commission Affaires Étrangères",
    content: "Comment vos équipes coordonnent-elles le protocole d'État et les cabines de traduction simultanée lors des sommets multilatéraux ?",
    votes: 18,
    isApproved: true,
    isAnswered: false,
    timestamp: "10:28"
  },
  {
    id: "q-3",
    author: "David Mbuyi",
    affiliation: "Agence Stratégique Vision RDC",
    content: "Proposez-vous une assistance d'urgence 24/7 avec générateurs de secours synchronisés sans micro-coupure ?",
    votes: 15,
    isApproved: true,
    isAnswered: false,
    timestamp: "10:45"
  }
];

const INITIAL_POLL: LivePoll = {
  id: "poll-2026-01",
  question: "Quel pôle d'ingénierie événementielle considérez-vous comme le plus stratégique pour vos prochains sommets en RDC ?",
  options: [
    { id: "opt-1", text: "Pôle 07 : Location & Exploitation Matériel Lourd (Line Array & Énergie)", votes: 45 },
    { id: "opt-2", text: "Pôle 03 : Événements Hybrides, Streaming 4K & Digital", votes: 38 },
    { id: "opt-3", text: "Pôle 08 & 12 : Protocole d'État, Diplomatie & Haute Sûreté", votes: 29 },
    { id: "opt-4", text: "Pôle 11 : Traduction Simultanée Bosch & Interprétariat AIIC", votes: 19 }
  ],
  totalVotes: 131,
  isActive: true
};

export const ProjectDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformConfig, setPlatformConfig] = useState<PlatformContentConfig>(() => {
    const saved = localStorage.getItem('viva_platform_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PLATFORM_CONFIG, ...parsed };
      } catch (e) {}
    }
    return DEFAULT_PLATFORM_CONFIG;
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('viva_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return POLES_15_OFFICIAL_DATA;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('viva_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [quotes, setQuotes] = useState<QuoteRequest[]>(() => {
    const saved = localStorage.getItem('viva_quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem('viva_equipment');
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('viva_partners');
    return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
  });

  const [tickets] = useState<TicketSession[]>(INITIAL_TICKETS);
  const [liveQuestions, setLiveQuestions] = useState<LiveQuestion[]>(INITIAL_QUESTIONS);
  const [currentPoll, setCurrentPoll] = useState<LivePoll>(INITIAL_POLL);

  const [directionsOrg, setDirectionsOrg] = useState<DirectionOrg[]>(() => {
    const saved = localStorage.getItem('viva_directions_org');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_DIRECTIONS_ORG;
  });

  const [orgUnits, setOrgUnits] = useState<OrganizationUnit[]>(() => {
    const saved = localStorage.getItem('viva_org_units');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ORG_UNITS;
  });

  const [dynamicMenus, setDynamicMenus] = useState<DynamicMenu[]>(() => {
    const saved = localStorage.getItem('viva_dynamic_menus');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_DYNAMIC_MENUS;
  });

  const [dynamicModules, setDynamicModules] = useState<DynamicModule[]>(() => {
    const saved = localStorage.getItem('viva_dynamic_modules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_DYNAMIC_MODULES;
  });

  const [dynamicForms, setDynamicForms] = useState<DynamicForm[]>(() => {
    const saved = localStorage.getItem('viva_dynamic_forms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_DYNAMIC_FORMS;
  });

  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>(() => {
    const saved = localStorage.getItem('viva_form_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [cmsSections, setCmsSections] = useState<CmsSectionItem[]>(() => {
    const saved = localStorage.getItem('viva_cms_sections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CMS_SECTIONS;
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('viva_media_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_MEDIA_ITEMS;
  });

  const [youtubeConfig, setYouTubeConfig] = useState<YouTubeChannelConfig>(() => {
    const saved = localStorage.getItem('viva_youtube_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_YOUTUBE_CONFIG;
  });

  const [isVisualEditMode, setVisualEditMode] = useState<boolean>(false);
  const [activeVisualEditKey, setActiveVisualEditKey] = useState<string | null>(null);
  const [previewDraftMode, setPreviewDraftMode] = useState<boolean>(false);

  // Offline cache only. Firestore remains the authoritative source of truth.
  // The cache is never used to overwrite a non-empty Firestore snapshot.
  const persistCache = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Offline Cache] Unable to persist ${key}:`, error);
    }
  }, []);

  useEffect(() => persistCache('viva_platform_config', platformConfig), [platformConfig, persistCache]);
  useEffect(() => persistCache('viva_departments', departments), [departments, persistCache]);
  useEffect(() => persistCache('viva_projects', projects), [projects, persistCache]);
  useEffect(() => persistCache('viva_quotes', quotes), [quotes, persistCache]);
  useEffect(() => persistCache('viva_equipment', equipment), [equipment, persistCache]);
  useEffect(() => persistCache('viva_partners', partners), [partners, persistCache]);
  useEffect(() => persistCache('viva_directions_org', directionsOrg), [directionsOrg, persistCache]);
  useEffect(() => persistCache('viva_org_units', orgUnits), [orgUnits, persistCache]);
  useEffect(() => persistCache('viva_dynamic_menus', dynamicMenus), [dynamicMenus, persistCache]);
  useEffect(() => persistCache('viva_dynamic_modules', dynamicModules), [dynamicModules, persistCache]);
  useEffect(() => persistCache('viva_dynamic_forms', dynamicForms), [dynamicForms, persistCache]);
  useEffect(() => persistCache('viva_form_submissions', formSubmissions), [formSubmissions, persistCache]);
  useEffect(() => persistCache('viva_cms_sections', cmsSections), [cmsSections, persistCache]);
  useEffect(() => persistCache('viva_media_items', mediaItems), [mediaItems, persistCache]);
  useEffect(() => persistCache('viva_youtube_config', youtubeConfig), [youtubeConfig, persistCache]);

  // Firestore is the runtime source of truth. These listeners replace local state
  // with the current server snapshot; localStorage is only the offline cache.
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    const subscribe = <T,>(
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      label: string
    ) => {
      try {
        const unsubscribe = subscribeFirestoreCollection<T>(collectionName, items => {
          setter(items);
        });
        unsubscribers.push(unsubscribe);
      } catch (error) {
        console.warn(`[Firebase] ${label} listener unavailable; offline cache retained:`, error);
      }
    };

    // Public / shared configuration and content.
    subscribe<Project>('projects', setProjects, 'Projects');
    subscribe<MediaItem>('media', setMediaItems, 'Media');
    subscribe<DynamicMenu>('dynamic_menus', setDynamicMenus, 'Menus');
    subscribe<DynamicModule>('dynamic_modules', setDynamicModules, 'Modules');
    subscribe<DynamicForm>('dynamic_forms', setDynamicForms, 'Forms');
    subscribe<OrganizationUnit>('organization_units', setOrgUnits, 'Organization units');
    subscribe<DirectionOrg>('organization_directions', setDirectionsOrg, 'Organization directions');
    subscribe<CmsSectionItem>('cms_sections', setCmsSections, 'CMS');
    subscribe<EquipmentItem>('equipment', setEquipment, 'Equipment');
    subscribe<Partner>('partners', setPartners, 'Partners');
    subscribe<Department>('departments', setDepartments, 'Departments');

    // Singleton platform configuration.
    try {
      const unsubscribePlatform = subscribeFirestoreCollection<PlatformContentConfig>(
        'platform_config',
        items => {
          const main = items.find((item: any) => (item as any).id === 'main');
          if (main) {
            const { id: _id, ...config } = main as any;
            setPlatformConfig(prev => ({ ...prev, ...config }));
          }
        }
      );
      unsubscribers.push(unsubscribePlatform);
    } catch (error) {
      console.warn('[Firebase] Platform configuration listener unavailable:', error);
    }

    try {
      const unsubscribeYouTube = subscribeFirestoreCollection<YouTubeChannelConfig>(
        'platform_config',
        items => {
          const youtube = items.find((item: any) => (item as any).id === 'youtube');
          if (youtube) {
            const { id: _id, ...config } = youtube as any;
            setYouTubeConfig(prev => ({ ...prev, ...config }));
          }
        }
      );
      unsubscribers.push(unsubscribeYouTube);
    } catch (error) {
      console.warn('[Firebase] YouTube configuration listener unavailable:', error);
    }

    // Auth-scoped data. Quotes and form submissions are never exposed globally.
    let unsubscribeQuotes: (() => void) | undefined;
    let unsubscribeSubmissions: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      unsubscribeQuotes?.();
      unsubscribeSubmissions?.();
      unsubscribeQuotes = undefined;
      unsubscribeSubmissions = undefined;

      if (!user) return;

      const isStaffOrAdmin = Boolean(
        user.email?.endsWith('@viva-eventsolutions.cd') ||
        user.email === 'misterk1502@gmail.com'
      );

      try {
        if (isStaffOrAdmin) {
          unsubscribeQuotes = subscribeFirestoreCollection<QuoteRequest>(
            'quotes',
            items => setQuotes(items)
          );
          unsubscribeSubmissions = subscribeFirestoreCollection<FormSubmission>(
            'form_submissions',
            items => setFormSubmissions(items)
          );
        } else if (user.email) {
          unsubscribeQuotes = subscribeFirestoreCollection<QuoteRequest>(
            'quotes',
            items => setQuotes(items),
            where('clientEmail', '==', user.email)
          );
        }
      } catch (error) {
        console.warn('[Firebase] Auth-scoped listeners unavailable; offline cache retained:', error);
      }
    });

    return () => {
      unsubscribers.forEach(unsubscribe => {
        try { unsubscribe(); } catch { /* noop */ }
      });
      unsubscribeQuotes?.();
      unsubscribeSubmissions?.();
      unsubscribeAuth();
    };
  }, []);

  // Wave 2 — overlay Supabase (SSOT) par-dessus l'état Firestore/legacy.
  // PG gagne sur les conflits (même id, code ou contentKey) ; les éléments
  // Firestore-only sont conservés jusqu'à la migration des données.
  // Échec PG = état legacy conservé + warn explicite (transitoire, pas silencieux).
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    (async () => {
      try {
        const [pgMenus, pgModules, pgSections, pgForms, pgUnits] = await Promise.all([
          fetchPgMenus(),
          fetchPgModules(),
          fetchPgSections(),
          fetchPgForms().catch(e => {
            console.warn('[Supabase Wave 2] Formulaires indisponibles :', e);
            return [];
          }),
          fetchPgOrgUnits().catch(e => {
            console.warn('[Supabase Wave 2] Organisation indisponible :', e);
            return [];
          }),
        ]);
        if (cancelled) return;
        if (pgMenus.length > 0) {
          setDynamicMenus(prev => {
            const overlay = new Map(pgMenus.map(m => [m.id, m]));
            const merged = prev.map(m => overlay.get(m.id) ?? m);
            for (const m of pgMenus) if (!merged.some(x => x.id === m.id)) merged.push(m);
            return merged;
          });
        }
        if (pgModules.length > 0) {
          setDynamicModules(prev => {
            const overlay = new Map(pgModules.map(m => [m.id, m]));
            const merged = prev.map(m => overlay.get(m.id) ?? m);
            for (const m of pgModules) if (!merged.some(x => x.id === m.id)) merged.push(m);
            return merged;
          });
        }
        if (pgSections.length > 0) {
          setCmsSections(prev => {
            const byKey = new Map(pgSections.map(s => [s.contentKey, s]));
            const byId = new Map(pgSections.map(s => [s.id, s]));
            const merged = prev.map(s => byKey.get(s.contentKey) ?? byId.get(s.id) ?? s);
            for (const s of pgSections) {
              if (!merged.some(x => x.contentKey === s.contentKey || x.id === s.id)) merged.push(s);
            }
            return merged;
          });
        }
        if (pgForms.length > 0) {
          setDynamicForms(prev => {
            const overlay = new Map<string, DynamicForm>();
            for (const f of pgForms) overlay.set(f.id, f);
            const merged = prev.map(f => overlay.get(f.id) ?? f);
            for (const f of pgForms) if (!merged.some(x => x.id === f.id)) merged.push(f);
            return merged;
          });
        }
        if (pgUnits.length > 0) {
          setOrgUnits(prev => {
            const overlay = new Map<string, OrganizationUnit>();
            const byCode = new Map<string, OrganizationUnit>();
            for (const u of pgUnits) {
              overlay.set(u.id, u);
              byCode.set(u.code ?? u.id, u);
            }
            const merged = prev.map(u => overlay.get(u.id) ?? (u.code ? byCode.get(u.code) : undefined) ?? u);
            for (const u of pgUnits) {
              if (!merged.some(x => x.id === u.id || (x.code && x.code === u.code))) merged.push(u);
            }
            return merged;
          });
        }
        // Soumissions staff : lecture PG (RLS forms.manage), fusion sans doublons.
        try {
          const pgSubs = await fetchPgSubmissions();
          if (pgSubs.length > 0) {
            setFormSubmissions(prev => {
              const ids = new Set(prev.map(s => s.id));
              return [...prev, ...pgSubs.filter(s => !ids.has(s.id))];
            });
          }
        } catch (e) {
          console.warn('[Supabase Wave 2] Soumissions indisponibles (permission ?) :', e);
        }
        // Médias + YouTube : overlay PG (SSOT), Firestore-only conservé en transition.
        try {
          const [pgMedia, pgYt] = await Promise.all([
            fetchPgMedia().catch(e => {
              console.warn('[Supabase Wave 2] Médias indisponibles :', e);
              return [];
            }),
            fetchPgYouTube().catch(e => {
              console.warn('[Supabase Wave 2] Config YouTube indisponible :', e);
              return null;
            }),
          ]);
          if (pgMedia.length > 0) {
            setMediaItems(prev => {
              const byUrl = new Map<string, MediaItem>();
              for (const m of pgMedia) byUrl.set(m.url, m);
              const merged = prev.map(m => byUrl.get(m.url) ?? m);
              for (const m of pgMedia) {
                if (!merged.some(x => x.url === m.url || x.id === m.id)) merged.push(m);
              }
              return merged;
            });
          }
          if (pgYt) setYouTubeConfig(pgYt);
        } catch (e) {
          console.warn('[Supabase Wave 2] Médias/YouTube indisponibles :', e);
        }
        // Projets + devis : overlay PG (SSOT), Firestore-only conservé en transition.
        try {
          const [pgProjects, pgQuotes] = await Promise.all([
            fetchPgProjects().catch(e => {
              console.warn('[Supabase Wave 2] Projets indisponibles :', e);
              return [];
            }),
            fetchPgQuotes().catch(e => {
              console.warn('[Supabase Wave 2] Devis indisponibles :', e);
              return [];
            }),
          ]);
          if (pgProjects.length > 0) {
            setProjects(prev => {
              const overlay = new Map<string, Project>();
              for (const p of pgProjects) overlay.set(p.code, p);
              const merged = prev.map(p => overlay.get(p.code) ?? p);
              for (const p of pgProjects) {
                if (!merged.some(x => x.code === p.code)) merged.push(p);
              }
              return merged;
            });
          }
          if (pgQuotes.length > 0) {
            setQuotes(prev => {
              const overlay = new Map<string, QuoteRequest>();
              for (const q of pgQuotes) overlay.set(q.referenceNumber, q);
              const merged = prev.map(q => overlay.get(q.referenceNumber) ?? q);
              for (const q of pgQuotes) {
                if (!merged.some(x => x.referenceNumber === q.referenceNumber)) merged.push(q);
              }
              return merged;
            });
          }
        } catch (e) {
          console.warn('[Supabase Wave 2] Projets/devis indisponibles :', e);
        }
      } catch (e) {
        console.warn('[Supabase Wave 2] Overlay indisponible, état legacy conservé :', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ==================== ACTIONS ====================

  const updateDirectionsOrg = (dirs: DirectionOrg[]) => {
    const previous = directionsOrg;
    setDirectionsOrg(dirs);

    dirs.forEach(d => {
      setFirestoreDocument('organization_directions', String(d.id), d)
        .catch(e => console.warn('[Firebase] Direction persist notice:', e));
    });

    previous
      .filter(d => !dirs.some(next => String(next.id) === String(d.id)))
      .forEach(d => {
        deleteFirestoreDocument('organization_directions', String(d.id))
          .catch(e => console.warn('[Firebase] Direction delete notice:', e));
      });

    logAuditEvent({
      action: 'ORGANIZATION_DIRECTIONS_UPDATED',
      resource: 'organization_directions',
      details: `${dirs.length} directions mises à jour.`
    });
  };

  const addOrgUnit = async (unitData: Omit<OrganizationUnit, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `unit-${Date.now()}`;
    const newUnit: OrganizationUnit = {
      ...unitData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    // Wave 2 — SSOT Supabase d'abord (tout ou rien sur la liste complète).
    if (isSupabaseConfigured()) {
      try {
        await savePgOrgUnits([...orgUnits, newUnit]);
        await logAudit('ORGANIZATION_UNIT_CREATED', 'organization_units', newId, {
          name: newUnit.name,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Création unité refusée :', e);
        throw e;
      }
    }
    setOrgUnits(prev => [...prev, newUnit]);

    setFirestoreDocument('organization_units', newId, newUnit)
      .catch(e => console.warn('[Firebase LEGACY mirror] Org unit persist notice:', e));

    logAuditEvent({
      action: 'ORGANIZATION_UNIT_CREATED',
      resource: 'organization_units',
      resourceId: newId,
      details: `Création entité : ${newUnit.name} (${newUnit.type})`
    });
  };

  const updateOrgUnit = async (id: string, updated: Partial<OrganizationUnit>) => {
    const current = orgUnits.find(u => u.id === id);
    // Wave 2 — SSOT Supabase d'abord.
    if (isSupabaseConfigured() && current) {
      try {
        await savePgOrgUnits(
          orgUnits.map(u => (u.id === id ? { ...u, ...updated, updatedAt: new Date().toISOString() } : u)),
        );
        await logAudit('ORGANIZATION_UNIT_UPDATED', 'organization_units', id, {});
      } catch (e) {
        console.error('[Supabase Wave 2] MAJ unité refusée :', e);
        throw e;
      }
    }
    setOrgUnits(prev => prev.map(u => u.id === id ? { ...u, ...updated, updatedAt: new Date().toISOString() } : u));
    updateFirestoreDocument('organization_units', id, { ...updated, updatedAt: new Date().toISOString() })
      .catch(e => console.warn('[Firebase LEGACY mirror] Org unit update notice:', e));
  };

  const deleteOrgUnit = async (id: string) => {
    // Wave 2 — SSOT Supabase d'abord.
    if (isSupabaseConfigured()) {
      try {
        await savePgOrgUnits(orgUnits.filter(u => u.id !== id));
        await logAudit('ORGANIZATION_UNIT_DELETED', 'organization_units', id, {});
      } catch (e) {
        console.error('[Supabase Wave 2] Suppression unité refusée :', e);
        throw e;
      }
    }
    setOrgUnits(prev => prev.filter(u => u.id !== id));
    deleteFirestoreDocument('organization_units', id)
      .catch(e => console.warn('[Firebase LEGACY mirror] Org unit delete notice:', e));
    logAuditEvent({
      action: 'ORGANIZATION_UNIT_DELETED',
      resource: 'organization_units',
      resourceId: id
    });
  };

  const updateDynamicMenus = async (menus: DynamicMenu[]) => {
    const previous = dynamicMenus;
    // Wave 2 — SSOT Supabase d'abord ; succès UI seulement après confirmation.
    if (isSupabaseConfigured()) {
      try {
        const confirmed = await savePgMenus(menus);
        setDynamicMenus(confirmed);
        await logAudit('DYNAMIC_MENUS_UPDATED', 'dynamic_menus', undefined, {
          count: confirmed.length,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Écriture menus refusée, état inchangé :', e);
        throw e;
      }
    } else {
      setDynamicMenus(menus);
    }

    // Miroir LEGACY Firestore (transition : lecteurs non migrés). Best-effort.
    menus.forEach(m => {
      setFirestoreDocument('dynamic_menus', m.id, m)
        .catch(e => console.warn('[Firebase LEGACY mirror] Menu persist notice:', e));
    });

    previous
      .filter(m => !menus.some(next => next.id === m.id))
      .forEach(m => {
        deleteFirestoreDocument('dynamic_menus', m.id)
          .catch(e => console.warn('[Firebase LEGACY mirror] Menu delete notice:', e));
      });

    logAuditEvent({
      action: 'DYNAMIC_MENUS_UPDATED',
      resource: 'dynamic_menus',
      details: `${menus.length} menus synchronisés.`
    });
  };

  const updateDynamicModules = async (mods: DynamicModule[]) => {
    const previous = dynamicModules;
    // Wave 2 — SSOT Supabase d'abord ; succès UI seulement après confirmation.
    if (isSupabaseConfigured()) {
      try {
        const confirmed = await savePgModules(mods);
        setDynamicModules(confirmed);
        await logAudit('DYNAMIC_MODULES_UPDATED', 'dynamic_modules', undefined, {
          count: confirmed.length,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Écriture modules refusée, état inchangé :', e);
        throw e;
      }
    } else {
      setDynamicModules(mods);
    }

    // Miroir LEGACY Firestore (transition). Best-effort.
    mods.forEach(mod => {
      setFirestoreDocument('dynamic_modules', mod.id, mod)
        .catch(e => console.warn('[Firebase LEGACY mirror] Module persist notice:', e));
    });

    previous
      .filter(mod => !mods.some(next => next.id === mod.id))
      .forEach(mod => {
        deleteFirestoreDocument('dynamic_modules', mod.id)
          .catch(e => console.warn('[Firebase LEGACY mirror] Module delete notice:', e));
      });

    logAuditEvent({
      action: 'DYNAMIC_MODULES_UPDATED',
      resource: 'dynamic_modules',
      details: `${mods.length} modules synchronisés.`
    });
  };

  const addDynamicForm = async (formData: Omit<DynamicForm, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `form-${Date.now()}`;
    const newForm: DynamicForm = {
      ...formData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submissionsCount: 0
    };
    // Wave 2 — SSOT Supabase d'abord.
    if (isSupabaseConfigured()) {
      try {
        await savePgForm(newForm);
        const confirmed = await fetchPgForms();
        const match = confirmed.find(f => f.id === newId);
        setDynamicForms(prev => [...prev, match ?? newForm]);
        await logAudit('DYNAMIC_FORM_CREATED', 'forms', newId, { name: newForm.name });
      } catch (e) {
        console.error('[Supabase Wave 2] Création formulaire refusée :', e);
        throw e;
      }
    } else {
      setDynamicForms(prev => [...prev, newForm]);
    }

    setFirestoreDocument('dynamic_forms', newId, newForm)
      .catch(e => console.warn('[Firebase LEGACY mirror] Form persist notice:', e));

    logAuditEvent({
      action: 'DYNAMIC_FORM_CREATED',
      resource: 'dynamic_forms',
      resourceId: newId,
      details: `Formulaire créé : ${newForm.name}`
    });
  };

  const updateDynamicForm = async (id: string, updated: Partial<DynamicForm>) => {
    const current = dynamicForms.find(f => f.id === id);
    // Wave 2 — SSOT Supabase d'abord.
    if (isSupabaseConfigured() && current) {
      try {
        await savePgForm({ ...current, ...updated, id, updatedAt: new Date().toISOString() });
        await logAudit('DYNAMIC_FORM_UPDATED', 'forms', id, {});
      } catch (e) {
        console.error('[Supabase Wave 2] MAJ formulaire refusée :', e);
        throw e;
      }
    }
    setDynamicForms(prev => prev.map(f => f.id === id ? { ...f, ...updated, updatedAt: new Date().toISOString() } : f));
    updateFirestoreDocument('dynamic_forms', id, { ...updated, updatedAt: new Date().toISOString() })
      .catch(e => console.warn('[Firebase LEGACY mirror] Form update notice:', e));
  };

  const deleteDynamicForm = async (id: string) => {
    // Wave 2 — SSOT Supabase d'abord.
    if (isSupabaseConfigured()) {
      try {
        await deletePgForm(id);
        await logAudit('DYNAMIC_FORM_DELETED', 'forms', id, {});
      } catch (e) {
        console.error('[Supabase Wave 2] Suppression formulaire refusée :', e);
        throw e;
      }
    }
    setDynamicForms(prev => prev.filter(f => f.id !== id));
    deleteFirestoreDocument('dynamic_forms', id)
      .catch(e => console.warn('[Firebase LEGACY mirror] Form delete notice:', e));
    logAuditEvent({
      action: 'DYNAMIC_FORM_DELETED',
      resource: 'dynamic_forms',
      resourceId: id
    });
  };

  const submitDynamicForm = async (formId: string, data: Record<string, any>, submittedByName?: string): Promise<string> => {
    const targetForm = dynamicForms.find(f => f.id === formId);
    const user = auth.currentUser;

    // Wave 2 — soumission PG si le formulaire y existe (insert RLS public prévu).
    if (isSupabaseConfigured()) {
      try {
        const pgForms = await fetchPgForms();
        const pgForm = pgForms.find(f => f.id === formId);
        if (pgForm) {
          const subId = await submitPgForm(
            (pgForm as unknown as { pgId: string }).pgId ?? pgForm.id,
            pgForm.name,
            data,
            {
              email: user?.email || (data.email as string) || 'visiteur@viva-eventsolutions.cd',
              name: submittedByName || (data.fullName as string) || user?.displayName || 'Candidat / Client',
            },
          );
          setFormSubmissions(prev => [{
            id: subId,
            formId,
            formName: pgForm.name,
            data,
            submittedBy: user?.uid || 'visitor',
            submittedByEmail: user?.email || (data.email as string) || 'visiteur@viva-eventsolutions.cd',
            submittedByName: submittedByName || (data.fullName as string) || user?.displayName || 'Candidat / Client',
            status: 'soumis',
            submittedAt: new Date().toISOString(),
          }, ...prev]);
          await logAudit('DYNAMIC_FORM_SUBMITTED', 'form_submissions', subId, { formName: pgForm.name });
          return subId;
        }
      } catch (e) {
        console.warn('[Supabase Wave 2] Soumission PG impossible, repli legacy :', e);
      }
    }

    const submissionId = `sub-${Date.now()}`;

    const submission: FormSubmission = {
      id: submissionId,
      formId,
      formName: targetForm?.name || 'Formulaire VIVA',
      data,
      submittedBy: user?.uid || 'visitor',
      submittedByEmail: user?.email || (data.email as string) || 'visiteur@viva-eventsolutions.cd',
      submittedByName: submittedByName || (data.fullName as string) || user?.displayName || 'Candidat / Client',
      status: 'soumis',
      submittedAt: new Date().toISOString()
    };

    setFormSubmissions(prev => [submission, ...prev]);

    // Update submissions count on form
    setDynamicForms(prev => prev.map(f => f.id === formId ? { ...f, submissionsCount: (f.submissionsCount || 0) + 1 } : f));

    await setFirestoreDocument('form_submissions', submissionId, submission);

    logAuditEvent({
      action: 'DYNAMIC_FORM_SUBMITTED',
      resource: 'form_submissions',
      resourceId: submissionId,
      details: `Soumission reçue pour formulaire: ${submission.formName}`
    });

    return submissionId;
  };

  // Médias & Galerie — Wave 2 : SSOT Supabase d'abord, miroir legacy ensuite.
  const addMediaItem = async (mediaData: Omit<MediaItem, 'id' | 'uploadedAt'>) => {
    const newId = `med-${Date.now()}`;
    const newMedia: MediaItem = {
      ...mediaData,
      id: newId,
      uploadedAt: new Date().toISOString()
    };
    if (isSupabaseConfigured()) {
      try {
        await savePgMedia(newMedia);
        const confirmed = await fetchPgMedia();
        const match = confirmed.find(m => m.url === newMedia.url);
        setMediaItems(prev => [match ?? newMedia, ...prev]);
        await logAudit('MEDIA_ITEM_CREATED', 'media', newId, {
          title: newMedia.title,
          type: newMedia.type,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Création média refusée :', e);
        throw e;
      }
    } else {
      setMediaItems(prev => [newMedia, ...prev]);
    }

    setFirestoreDocument('media', newId, newMedia)
      .catch(e => console.warn('[Firebase LEGACY mirror] Media persist notice:', e));

    logAuditEvent({
      action: 'MEDIA_ITEM_CREATED',
      resource: 'media',
      resourceId: newId,
      details: `Nouveau média : ${newMedia.title} (${newMedia.type})`
    });
  };

  const updateMediaItem = async (id: string, updated: Partial<MediaItem>) => {
    const current = mediaItems.find(m => m.id === id);
    if (isSupabaseConfigured() && current) {
      try {
        await savePgMedia({ ...current, ...updated });
        await logAudit('MEDIA_ITEM_UPDATED', 'media', id, {});
      } catch (e) {
        console.error('[Supabase Wave 2] MAJ média refusée :', e);
        throw e;
      }
    }
    setMediaItems(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    updateFirestoreDocument('media', id, updated)
      .catch(e => console.warn('[Firebase LEGACY mirror] Media update notice:', e));
  };

  const deleteMediaItem = async (id: string) => {
    const current = mediaItems.find(m => m.id === id);
    if (isSupabaseConfigured()) {
      try {
        // NOTE vague Storage : le fichier binaire n'est pas encore supprimé du bucket.
        await deletePgMedia(current?.url ?? id);
        await logAudit('MEDIA_ITEM_DELETED', 'media', id, {});
      } catch (e) {
        console.error('[Supabase Wave 2] Suppression média refusée :', e);
        throw e;
      }
    }
    setMediaItems(prev => prev.filter(m => m.id !== id));
    deleteFirestoreDocument('media', id)
      .catch(e => console.warn('[Firebase LEGACY mirror] Media delete notice:', e));
    logAuditEvent({
      action: 'MEDIA_ITEM_DELETED',
      resource: 'media',
      resourceId: id
    });
  };

  const updateYouTubeConfig = async (cfg: Partial<YouTubeChannelConfig>) => {
    const mergedPreview: YouTubeChannelConfig = { ...youtubeConfig, ...cfg };
    if (isSupabaseConfigured()) {
      try {
        await savePgYouTube(mergedPreview);
        const confirmed = await fetchPgYouTube();
        setYouTubeConfig(confirmed ?? mergedPreview);
        await logAudit('YOUTUBE_CONFIG_UPDATED', 'youtube_config', 'main', {});
      } catch (e) {
        console.error('[Supabase Wave 2] Config YouTube refusée :', e);
        throw e;
      }
    } else {
      setYouTubeConfig(prev => {
        const merged = { ...prev, ...cfg };
        setFirestoreDocument('platform_config', 'youtube', merged)
          .catch(e => console.warn('[Firebase] YouTube config persist notice:', e));
        return merged;
      });
    }
    if (!isSupabaseConfigured()) {
      logAuditEvent({
        action: 'YOUTUBE_CONFIG_UPDATED',
        resource: 'platform_config',
        details: 'Configuration chaîne YouTube mise à jour.'
      });
      return;
    }
    // Miroir LEGACY Firestore (transition). Best-effort.
    setFirestoreDocument('platform_config', 'youtube', mergedPreview)
      .catch(e => console.warn('[Firebase LEGACY mirror] YouTube config persist notice:', e));
    logAuditEvent({
      action: 'YOUTUBE_CONFIG_UPDATED',
      resource: 'platform_config',
      details: 'Configuration chaîne YouTube mise à jour.'
    });
  };

  const updateCmsSections = async (secs: CmsSectionItem[]) => {
    const previous = cmsSections;
    // Wave 2 — SSOT Supabase d'abord (appariement par contentKey stable).
    if (isSupabaseConfigured()) {
      try {
        for (const section of secs) {
          await upsertPgSection(section);
        }
        for (const section of previous) {
          if (!secs.some(next => next.contentKey === section.contentKey)) {
            await deletePgSection(section.contentKey);
          }
        }
        const confirmed = await fetchPgSections();
        // Réconciliation : lignes PG (UUID) + lignes legacy restantes.
        setCmsSections(prev => {
          const byKey = new Map(confirmed.map(s => [s.contentKey, s]));
          const merged = prev.map(s => byKey.get(s.contentKey) ?? s);
          for (const s of confirmed) {
            if (!merged.some(x => x.contentKey === s.contentKey)) merged.push(s);
          }
          return merged;
        });
        await logAudit('CMS_SECTIONS_UPDATED', 'cms_sections', undefined, {
          count: confirmed.length,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Écriture CMS refusée, état inchangé :', e);
        throw e;
      }
    } else {
      setCmsSections(secs);
    }

    // Miroir LEGACY Firestore (transition). Best-effort.
    secs.forEach(section => {
      setFirestoreDocument('cms_sections', section.id, section)
        .catch(e => console.warn('[Firebase LEGACY mirror] CMS section persist notice:', e));
    });

    previous
      .filter(section => !secs.some(next => next.id === section.id))
      .forEach(section => {
        deleteFirestoreDocument('cms_sections', section.id)
          .catch(e => console.warn('[Firebase LEGACY mirror] CMS section delete notice:', e));
      });

    logAuditEvent({
      action: 'CMS_SECTIONS_UPDATED',
      resource: 'cms_sections',
      details: `${secs.length} sections CMS mises à jour.`
    });
  };

  const getCmsItem = useCallback((contentKey: string): CmsSectionItem | undefined => {
    return cmsSections.find(s => s.contentKey === contentKey || s.id === contentKey);
  }, [cmsSections]);

  const getCmsValue = useCallback((
    contentKey: string,
    field: 'content' | 'title' | 'subtitle' | 'primaryButtonText' | 'secondaryButtonText' = 'content',
    fallback = ''
  ): string => {
    const item = cmsSections.find(s => s.contentKey === contentKey || s.id === contentKey);
    if (!item) return fallback;

    if (previewDraftMode || isVisualEditMode) {
      if (field === 'title' && item.draftTitle !== undefined && item.draftTitle !== '') return item.draftTitle;
      if (field === 'subtitle' && item.draftSubtitle !== undefined && item.draftSubtitle !== '') return item.draftSubtitle;
      if (field === 'content' && item.draftContent !== undefined && item.draftContent !== '') return item.draftContent;
      if (field === 'primaryButtonText' && item.draftPrimaryButtonText !== undefined && item.draftPrimaryButtonText !== '') return item.draftPrimaryButtonText;
      if (field === 'secondaryButtonText' && item.draftSecondaryButtonText !== undefined && item.draftSecondaryButtonText !== '') return item.draftSecondaryButtonText;
    }

    if (field === 'title') return item.publishedTitle || item.title || fallback;
    if (field === 'subtitle') return item.publishedSubtitle || item.subtitle || fallback;
    if (field === 'content') return item.publishedContent || item.content || fallback;
    if (field === 'primaryButtonText') return item.publishedPrimaryButtonText || item.primaryButtonText || fallback;
    if (field === 'secondaryButtonText') return item.publishedSecondaryButtonText || item.secondaryButtonText || fallback;

    return fallback;
  }, [cmsSections, previewDraftMode, isVisualEditMode]);

  const saveCmsDraft = async (idOrKey: string, draftData: Partial<CmsSectionItem>) => {
    const target = cmsSections.find(s => s.id === idOrKey || s.contentKey === idOrKey);
    if (!target) return;

    const updatedItem: CmsSectionItem = {
      ...target,
      status: 'draft',
      draftTitle: draftData.draftTitle ?? draftData.title ?? target.draftTitle ?? target.title,
      draftSubtitle: draftData.draftSubtitle ?? draftData.subtitle ?? target.draftSubtitle ?? target.subtitle,
      draftContent: draftData.draftContent ?? draftData.content ?? target.draftContent ?? target.content,
      draftPrimaryButtonText: draftData.draftPrimaryButtonText ?? draftData.primaryButtonText ?? target.draftPrimaryButtonText ?? target.primaryButtonText,
      draftSecondaryButtonText: draftData.draftSecondaryButtonText ?? draftData.secondaryButtonText ?? target.draftSecondaryButtonText ?? target.secondaryButtonText,
      lastModified: new Date().toISOString(),
      author: auth.currentUser?.displayName || auth.currentUser?.email || 'Super Administrateur'
    };

    // Wave 2 — brouillon = copie de travail PG (colonnes title/content/…, status draft).
    if (isSupabaseConfigured()) {
      try {
        await upsertPgSection({
          ...updatedItem,
          title: updatedItem.draftTitle ?? updatedItem.title,
          subtitle: updatedItem.draftSubtitle ?? updatedItem.subtitle,
          content: updatedItem.draftContent ?? updatedItem.content,
          primaryButtonText: updatedItem.draftPrimaryButtonText ?? updatedItem.primaryButtonText,
          secondaryButtonText: updatedItem.draftSecondaryButtonText ?? updatedItem.secondaryButtonText,
          status: 'draft',
        });
        await logAudit('CMS_DRAFT_SAVED', 'cms_sections', target.contentKey, {
          contentKey: target.contentKey,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Brouillon CMS refusé :', e);
        throw e;
      }
    }

    setCmsSections(prev => prev.map(s => s.id === target.id ? updatedItem : s));
    await setFirestoreDocument('cms_sections', target.id, updatedItem);

    logAuditEvent({
      action: 'CMS_DRAFT_SAVED',
      resource: 'cms_sections',
      resourceId: target.id,
      details: `Brouillon enregistré pour la clé CMS: ${target.contentKey}`
    });
  };

  const publishCmsItem = async (idOrKey: string, publishData?: Partial<CmsSectionItem>) => {
    const target = cmsSections.find(s => s.id === idOrKey || s.contentKey === idOrKey);
    if (!target) return;

    const newTitle = publishData?.title ?? target.draftTitle ?? target.title;
    const newSubtitle = publishData?.subtitle ?? target.draftSubtitle ?? target.subtitle;
    const newContent = publishData?.content ?? target.draftContent ?? target.content;
    const newPrimaryBtn = publishData?.primaryButtonText ?? target.draftPrimaryButtonText ?? target.primaryButtonText;
    const newSecondaryBtn = publishData?.secondaryButtonText ?? target.draftSecondaryButtonText ?? target.secondaryButtonText;

    // Wave 2 — publication PG : working + published_* + version, confirmation serveur.
    if (isSupabaseConfigured()) {
      try {
        const saved = await upsertPgSection({
          ...target,
          title: newTitle,
          subtitle: newSubtitle,
          content: newContent,
          primaryButtonText: newPrimaryBtn,
          secondaryButtonText: newSecondaryBtn,
          status: 'published',
        });
        await publishPgSection(saved.id, {
          published_title: newTitle,
          published_subtitle: newSubtitle,
          published_content: newContent,
          published_primary_button_text: newPrimaryBtn,
          published_secondary_button_text: newSecondaryBtn,
        });
        await addPgVersion(saved.id, {
          title: newTitle,
          content: newContent,
          oldValue: target.publishedContent || target.content,
          newValue: newContent,
          author: auth.currentUser?.displayName || auth.currentUser?.email || 'Super Administrateur',
        });
        await logAudit('CMS_ITEM_PUBLISHED', 'cms_sections', target.contentKey, {
          contentKey: target.contentKey,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Publication CMS refusée :', e);
        throw e;
      }
    }

    const newVersion = {
      versionId: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: auth.currentUser?.displayName || auth.currentUser?.email || 'Super Administrateur',
      title: newTitle,
      content: newContent,
      oldValue: target.publishedContent || target.content,
      newValue: newContent
    };

    const updatedItem: CmsSectionItem = {
      ...target,
      title: newTitle,
      subtitle: newSubtitle,
      content: newContent,
      primaryButtonText: newPrimaryBtn,
      secondaryButtonText: newSecondaryBtn,
      publishedTitle: newTitle,
      publishedSubtitle: newSubtitle,
      publishedContent: newContent,
      publishedPrimaryButtonText: newPrimaryBtn,
      publishedSecondaryButtonText: newSecondaryBtn,
      draftTitle: undefined,
      draftSubtitle: undefined,
      draftContent: undefined,
      draftPrimaryButtonText: undefined,
      draftSecondaryButtonText: undefined,
      status: 'published',
      lastModified: new Date().toISOString(),
      author: auth.currentUser?.displayName || auth.currentUser?.email || 'Super Administrateur',
      versions: [newVersion, ...(target.versions || [])]
    };

    setCmsSections(prev => prev.map(s => s.id === target.id ? updatedItem : s));
    await setFirestoreDocument('cms_sections', target.id, updatedItem);

    if (target.contentKey === 'home.welcome.title' || target.contentKey === 'welcomeMessage') {
      updatePlatformConfig({ welcomeMessage: newContent });
    } else if (target.contentKey === 'home.hero.title') {
      updatePlatformConfig({ heroTitle: newContent });
    } else if (target.contentKey === 'home.hero.description') {
      updatePlatformConfig({ heroSubtitle: newContent });
    }

    logAuditEvent({
      action: 'CMS_ITEM_PUBLISHED',
      resource: 'cms_sections',
      resourceId: target.id,
      details: `Publication officielle de la section: ${target.title} (${target.contentKey})`
    });
  };

  const updatePlatformConfig = (newConfig: Partial<PlatformContentConfig>) => {
    setPlatformConfig(prev => {
      const merged = { ...prev, ...newConfig };
      setFirestoreDocument('platform_config', 'main', merged).catch(e => console.warn('[Firebase] Platform config persist notice:', e));
      return merged;
    });
    logAuditEvent({
      action: 'PLATFORM_CONFIG_UPDATED',
      resource: 'platform_config',
      details: 'Paramètres globaux plateforme modifiés.'
    });
  };

  const updateDepartment = (id: number, updatedData: Partial<Department>) => {
    setDepartments(prev =>
      prev.map(dept => (dept.id === id ? { ...dept, ...updatedData } : dept))
    );
    updateFirestoreDocument('departments', String(id), updatedData)
      .catch(e => console.warn('[Firebase] Department update notice:', e));
    logAuditEvent({
      action: 'DEPARTMENT_UPDATED',
      resource: 'departments',
      resourceId: String(id),
      details: 'Département mis à jour.'
    });
  };

  const addDepartment = (deptData: Omit<Department, 'id'>) => {
    const newId = departments.length > 0 ? Math.max(...departments.map(d => d.id)) + 1 : 1;
    const newDept: Department = { ...deptData, id: newId };
    setDepartments(prev => [...prev, newDept]);
    setFirestoreDocument('departments', String(newId), newDept)
      .catch(e => console.warn('[Firebase] Department creation notice:', e));
    logAuditEvent({
      action: 'DEPARTMENT_CREATED',
      resource: 'departments',
      resourceId: String(newId),
      details: `Département créé : ${String((newDept as any).name || newId)}`
    });
  };

  const addProject = async (projectData: Omit<Project, 'id' | 'code'>) => {
    const newId = `prj-${Date.now()}`;
    const code = `VES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newProject: Project = {
      ...projectData,
      id: newId,
      code
    };
    // Wave 2 — SSOT Supabase d'abord.
    if (isSupabaseConfigured()) {
      try {
        await savePgProject(newProject);
        await logAudit('PROJECT_CREATED', 'projects', code, { title: newProject.title });
      } catch (e) {
        console.error('[Supabase Wave 2] Création projet refusée :', e);
        throw e;
      }
    }
    setProjects(prev => [newProject, ...prev]);

    // Persist to Firestore (LEGACY mirror). Best-effort.
    setFirestoreDocument('projects', newId, {
      id: newId,
      code,
      title: newProject.title,
      client: newProject.client,
      type: newProject.type || '',
      startDate: newProject.startDate || '',
      endDate: newProject.endDate || '',
      location: newProject.location || '',
      budgetUSD: Number(newProject.budgetUSD) || 0,
      progressPercent: Number(newProject.progressPercent) || 0,
      status: newProject.status,
      leadManager: newProject.leadManager || ''
    }).catch(e => console.warn('[Firebase LEGACY mirror] project persist notice:', e));

    logAuditEvent({
      action: 'PROJECT_CREATED',
      resource: 'projects',
      resourceId: newId,
      details: `Projet créé : ${newProject.title} (${code})`
    });
    platformSession.logDomainEvent('projet', `Projet créé : ${newProject.title} (${code})`);
  };

  // Mise à jour libre d'un projet (jalons, livrables, équipe, priorité, archive).
  // Champs cœur persistés Supabase ; champs étendus via miroir legacy (R4-01).
  const updateProjectDetails = async (id: string, patch: Partial<Project>) => {
    const current = projects.find(p => p.id === id);
    if (!current) throw new Error('Projet introuvable.');
    const merged = { ...current, ...patch };
    if (isSupabaseConfigured()) {
      try {
        await savePgProject(merged);
        await logAudit('PROJECT_UPDATED', 'projects', merged.code, { fields: Object.keys(patch) });
      } catch (e) {
        console.error('[Supabase Wave 2] MAJ projet refusée :', e);
        throw e;
      }
    }
    setProjects(prev => prev.map(p => (p.id === id ? merged : p)));
    await setFirestoreDocument('projects', id, merged).catch(e => {
      console.warn('[Firebase LEGACY mirror] project details notice:', e);
    });
  };

  const updateProjectStatus = async (id: string, status: Project['status'], progress: number) => {
    const current = projects.find(p => p.id === id);
    // Wave 2 — SSOT Supabase d'abord (appariement par code).
    if (isSupabaseConfigured() && current) {
      try {
        await savePgProject({ ...current, status, progressPercent: progress });
        await logAudit('PROJECT_STATUS_UPDATED', 'projects', current.code, { status });
      } catch (e) {
        console.error('[Supabase Wave 2] Statut projet refusé :', e);
        throw e;
      }
    }
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, status, progressPercent: progress } : p))
    );
    updateFirestoreDocument('projects', id, { status, progressPercent: progress })
      .catch(e => console.warn('[Firebase LEGACY mirror] project status update notice:', e));
  };

  const submitQuoteRequest = async (
    quoteData: Omit<QuoteRequest, 'id' | 'referenceNumber' | 'createdAt' | 'status'>
  ): Promise<string> => {
    const referenceNumber = `DEV-VES-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newQuote: QuoteRequest = {
      ...quoteData,
      id: `qte-${Date.now()}`,
      referenceNumber,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'submitted'
    };
    // Wave 2 — SSOT Supabase d'abord ; échec = erreur propagée, aucun succès affiché.
    if (isSupabaseConfigured()) {
      try {
        await insertPgQuote({
          referenceNumber,
          clientName: newQuote.clientName,
          clientEmail: newQuote.clientEmail,
          eventName: newQuote.eventName,
          eventDate: newQuote.eventDate,
          location: newQuote.location,
          attendees: Number(newQuote.estimatedAttendees) || 0,
          budgetUSD: Number(newQuote.estimatedBudgetUSD) || 0,
        });
        await logAudit('QUOTE_SUBMITTED', 'quotes', referenceNumber, {
          eventName: newQuote.eventName,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Soumission devis refusée :', e);
        throw e;
      }
    }
    setQuotes(prev => [newQuote, ...prev]);

    // Persist to Firestore (LEGACY mirror). Best-effort.
    setFirestoreDocument('quotes', newQuote.id, {
      id: newQuote.id,
      referenceNumber,
      clientName: newQuote.clientName,
      clientEmail: newQuote.clientEmail,
      clientPhone: newQuote.clientPhone || '',
      clientOrganization: newQuote.clientOrganization || '',
      eventType: newQuote.eventType || '',
      eventName: newQuote.eventName,
      eventDate: newQuote.eventDate || '',
      location: newQuote.location || '',
      estimatedAttendees: Number(newQuote.estimatedAttendees) || 0,
      estimatedBudgetUSD: Number(newQuote.estimatedBudgetUSD) || 0,
      status: 'submitted',
      priority: newQuote.priority || 'normale',
      customNotes: newQuote.customNotes || '',
      createdAt: newQuote.createdAt,
      userId: auth.currentUser?.uid || ''
    }).catch(e => console.warn('[Firebase LEGACY mirror] quote persist notice:', e));

    logAuditEvent({
      action: 'QUOTE_SUBMITTED',
      resource: 'quotes',
      resourceId: newQuote.id,
      details: `Nouveau devis : ${referenceNumber} (${newQuote.eventName})`
    });
    platformSession.logDomainEvent('devis', `Devis soumis : ${referenceNumber} (${newQuote.eventName})`);

    return referenceNumber;
  };

  const updateQuoteStatus = async (id: string, status: QuoteRequest['status']) => {
    const current = quotes.find(q => q.id === id);
    // Wave 2 — SSOT Supabase d'abord (appariement par referenceNumber).
    if (isSupabaseConfigured() && current) {
      try {
        await updatePgQuoteStatus(current.referenceNumber, status);
        await logAudit('QUOTE_STATUS_UPDATED', 'quotes', current.referenceNumber, { status });
      } catch (e) {
        console.error('[Supabase Wave 2] Statut devis refusé :', e);
        throw e;
      }
    }
    setQuotes(prev =>
      prev.map(q => (q.id === id ? { ...q, status } : q))
    );
    updateFirestoreDocument('quotes', id, { status })
      .catch(e => console.warn('[Firebase LEGACY mirror] quote status update notice:', e));

    logAuditEvent({
      action: 'QUOTE_STATUS_UPDATED',
      resource: 'quotes',
      resourceId: id,
      details: `Statut du devis changé en : ${status}`
    });
  };

  const updateEquipmentStock = (id: string, quantityAvailable: number, condition?: EquipmentItem['condition']) => {
    setEquipment(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              quantityAvailable,
              ...(condition ? { condition } : {})
            }
          : e
      )
    );
    updateFirestoreDocument('equipment', id, {
      quantityAvailable,
      ...(condition ? { condition } : {})
    }).catch(e => console.warn('[Firebase] Equipment stock update notice:', e));
  };

  const updatePartnerStatus = (id: string, status: Partner['status'], rating?: number) => {
    setPartners(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              status,
              ...(rating !== undefined ? { rating } : {})
            }
          : p
      )
    );
    updateFirestoreDocument('partners', id, {
      status,
      ...(rating !== undefined ? { rating } : {})
    }).catch(e => console.warn('[Firebase] Partner status update notice:', e));
  };

  const askLiveQuestion = (author: string, affiliation: string, content: string) => {
    const newQ: LiveQuestion = {
      id: `q-${Date.now()}`,
      author: author || "Participant Virtuel",
      affiliation: affiliation || "Participant En Ligne",
      content,
      votes: 1,
      isApproved: true,
      isAnswered: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLiveQuestions(prev => [newQ, ...prev]);
  };

  const upvoteQuestion = (questionId: string) => {
    setLiveQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, votes: q.votes + 1 } : q))
    );
  };

  const moderateQuestion = (questionId: string, approve: boolean, markAnswered?: boolean) => {
    setLiveQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              isApproved: approve,
              ...(markAnswered !== undefined ? { isAnswered: markAnswered } : {})
            }
          : q
      )
    );
  };

  const votePoll = (optionId: string) => {
    setCurrentPoll(prev => {
      const updatedOptions = prev.options.map(opt =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      return {
        ...prev,
        options: updatedOptions,
        totalVotes: prev.totalVotes + 1
      };
    });
  };

  const resetToDefaults = () => {
    // P0 Wave 1 — GARDE ANTI-DESTRUCTION : aucun appel direct n'exécute le reset.
    // Le seul chemin autorisé arme explicitement via sessionStorage('viva_reset_armed'
    // === 'RESET VIVA'), posé uniquement par ResetDatabaseModal après confirmation
    // tapée + SUPER_ADMIN. SCOPE STRICT : Firestore + cache local UNIQUEMENT.
    // Ne touche JAMAIS à Supabase/PostgreSQL (aucune écriture distante ici).
    if (typeof window !== 'undefined' && window.sessionStorage?.getItem('viva_reset_armed') !== 'RESET VIVA') {
      console.warn(
        '[resetToDefaults] REFUSÉ : reset non armé. Utilisez ResetDatabaseModal (confirmation "RESET VIVA"). Aucune donnée modifiée.',
      );
      return;
    }
    if (typeof window !== 'undefined') window.sessionStorage.removeItem('viva_reset_armed');
    setPlatformConfig(DEFAULT_PLATFORM_CONFIG);
    setDepartments(POLES_15_OFFICIAL_DATA);
    setProjects(INITIAL_PROJECTS);
    setQuotes(INITIAL_QUOTES);
    setEquipment(INITIAL_EQUIPMENT);
    setPartners(INITIAL_PARTNERS);
    setDirectionsOrg(INITIAL_DIRECTIONS_ORG);
    setOrgUnits(INITIAL_ORG_UNITS);
    setDynamicMenus(INITIAL_DYNAMIC_MENUS);
    setDynamicModules(INITIAL_DYNAMIC_MODULES);
    setDynamicForms(INITIAL_DYNAMIC_FORMS);
    setMediaItems(INITIAL_MEDIA_ITEMS);
    setYouTubeConfig(INITIAL_YOUTUBE_CONFIG);
    setCmsSections(INITIAL_CMS_SECTIONS);

    // A reset is an explicit administrator operation, so mirror it to Firestore.
    setFirestoreDocument('platform_config', 'main', DEFAULT_PLATFORM_CONFIG).catch(() => {});
    setFirestoreDocument('platform_config', 'youtube', INITIAL_YOUTUBE_CONFIG).catch(() => {});
    POLES_15_OFFICIAL_DATA.forEach(d => setFirestoreDocument('departments', String(d.id), d).catch(() => {}));
    INITIAL_PROJECTS.forEach(p => setFirestoreDocument('projects', p.id, p).catch(() => {}));
    INITIAL_QUOTES.forEach(q => setFirestoreDocument('quotes', q.id, q).catch(() => {}));
    INITIAL_EQUIPMENT.forEach(e => setFirestoreDocument('equipment', e.id, e).catch(() => {}));
    INITIAL_PARTNERS.forEach(p => setFirestoreDocument('partners', p.id, p).catch(() => {}));
    INITIAL_DIRECTIONS_ORG.forEach(d => setFirestoreDocument('organization_directions', String(d.id), d).catch(() => {}));
    INITIAL_ORG_UNITS.forEach(u => setFirestoreDocument('organization_units', u.id, u).catch(() => {}));
    INITIAL_DYNAMIC_MENUS.forEach(m => setFirestoreDocument('dynamic_menus', m.id, m).catch(() => {}));
    INITIAL_DYNAMIC_MODULES.forEach(m => setFirestoreDocument('dynamic_modules', m.id, m).catch(() => {}));
    INITIAL_DYNAMIC_FORMS.forEach(f => setFirestoreDocument('dynamic_forms', f.id, f).catch(() => {}));
    INITIAL_MEDIA_ITEMS.forEach(m => setFirestoreDocument('media', m.id, m).catch(() => {}));
    INITIAL_CMS_SECTIONS.forEach(c => setFirestoreDocument('cms_sections', c.id, c).catch(() => {}));

    Object.keys(localStorage)
      .filter(key => key.startsWith('viva_'))
      .forEach(key => localStorage.removeItem(key));

    logAuditEvent({
      action: 'PLATFORM_DATA_RESET',
      resource: 'platform',
      details: 'Réinitialisation explicite des données vers les valeurs par défaut.'
    });
  };

  return (
    <ProjectDataContext.Provider
      value={{
        projects,
        quotes,
        equipment,
        partners,
        tickets,
        liveQuestions,
        currentPoll,
        platformConfig,
        departments,
        directionsOrg,
        orgUnits,
        dynamicMenus,
        dynamicModules,
        dynamicForms,
        formSubmissions,
        cmsSections,
        mediaItems,
        youtubeConfig,
        updatePlatformConfig,
        updateDepartment,
        addDepartment,
        updateDirectionsOrg,
        addOrgUnit,
        updateOrgUnit,
        deleteOrgUnit,
        updateDynamicMenus,
        updateDynamicModules,
        addDynamicForm,
        updateDynamicForm,
        deleteDynamicForm,
        submitDynamicForm,
        addMediaItem,
        updateMediaItem,
        deleteMediaItem,
        updateYouTubeConfig,
        updateCmsSections,
        addProject,
        updateProjectDetails,
        updateProjectStatus,
        submitQuoteRequest,
        updateQuoteStatus,
        updateEquipmentStock,
        updatePartnerStatus,
        askLiveQuestion,
        upvoteQuestion,
        moderateQuestion,
        votePoll,
        resetToDefaults,
        isVisualEditMode,
        setVisualEditMode,
        activeVisualEditKey,
        setActiveVisualEditKey,
        previewDraftMode,
        setPreviewDraftMode,
        getCmsItem,
        getCmsValue,
        saveCmsDraft,
        publishCmsItem
      }}
    >
      {children}
    </ProjectDataContext.Provider>
  );
};

export const useProjectData = () => {
  const context = useContext(ProjectDataContext);
  if (!context) {
    throw new Error("useProjectData must be used within a ProjectDataProvider");
  }
  return context;
};
