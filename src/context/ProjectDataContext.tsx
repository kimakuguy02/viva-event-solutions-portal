import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { adoptLegacyCache, cacheScopeFor, readScopedCache, scopedCacheKey } from '../utils/scopedCache';
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
import { INITIAL_EQUIPMENT, INITIAL_PARTNERS } from '../data/vivaData';
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
import { isSupabaseConfigured, supabase } from '../services/supabase';
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
import { deleteEnterpriseStorageFile } from '../services/storageService';
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

export type DataSourceKey =
  | 'menus'
  | 'modules'
  | 'cms'
  | 'forms'
  | 'orgUnits'
  | 'media'
  | 'youtube'
  | 'projects'
  | 'quotes'
  | 'submissions';

export interface DataSourceHealth {
  status: 'loading' | 'ok' | 'error' | 'idle';
  message?: string;
}

export const DATA_SOURCE_LABELS: Record<DataSourceKey, string> = {
  menus: 'Menus de navigation',
  modules: 'Modules',
  cms: 'Sections CMS',
  forms: 'Formulaires',
  orgUnits: 'Organisation',
  media: 'Médias',
  youtube: 'Chaîne YouTube',
  projects: 'Projets',
  quotes: 'Devis',
  submissions: 'Soumissions de formulaires',
};

// Projets, devis et soumissions sont protégés par RLS (session requise).
// Les lister ici provoquait un 401 anonyme à chaque chargement de vitrine.
const PUBLIC_DATA_SOURCES: DataSourceKey[] = ['menus', 'modules', 'cms', 'forms', 'orgUnits', 'media', 'youtube'];
const AUTH_DATA_SOURCES: DataSourceKey[] = ['projects', 'quotes', 'submissions'];

// Correctif éditorial validé par la direction : la copie publiée en base
// contient encore « notre établissement ». On aligne l'état chargé et le
// cache sur la formulation officielle tant que la ligne CMS n'est pas republiée.
const WELCOME_COPY_OLD = 'notre établissement';
const WELCOME_COPY_NEW = 'notre société';

function normalizeCmsCopy(sections: CmsSectionItem[]): CmsSectionItem[] {
  let changed = false;
  const fix = (value?: string) => {
    if (!value || !value.includes(WELCOME_COPY_OLD)) return value;
    changed = true;
    return value.split(WELCOME_COPY_OLD).join(WELCOME_COPY_NEW);
  };

  const next = sections.map(section => {
    if (section.contentKey !== 'home.welcome.title') return section;
    return {
      ...section,
      content: fix(section.content) ?? section.content,
      draftContent: fix(section.draftContent),
      publishedContent: fix(section.publishedContent),
    };
  });

  return changed ? next : sections;
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

  // Provenance des données : Postgres est la source de vérité.
  dataHealth: Record<DataSourceKey, DataSourceHealth>;
  reloadDataSource: (key: DataSourceKey) => void;
  reloadAllDataSources: () => void;

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
  addMediaItem: (media: Omit<MediaItem, 'id' | 'uploadedAt'>) => Promise<void>;
  updateMediaItem: (id: string, updated: Partial<MediaItem>) => void;
  deleteMediaItem: (id: string) => Promise<void>;
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

const INITIAL_QUESTIONS: LiveQuestion[] = [];

const INITIAL_POLL: LivePoll = {
  id: "poll-2026-01",
  question: "Quel pôle d'ingénierie événementielle considérez-vous comme le plus stratégique pour vos prochains sommets en RDC ?",
  options: [
    { id: "opt-1", text: "Pôle 07 : Location & Exploitation Matériel Lourd (Line Array & Énergie)", votes: 0 },
    { id: "opt-2", text: "Pôle 03 : Événements Hybrides, Streaming 4K & Digital", votes: 0 },
    { id: "opt-3", text: "Pôle 08 & 12 : Protocole d'État, Diplomatie & Haute Sûreté", votes: 0 },
    { id: "opt-4", text: "Pôle 11 : Traduction Simultanée Bosch & Interprétariat AIIC", votes: 0 }
  ],
  totalVotes: 0,
  isActive: true
};

export const ProjectDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const cacheScope = cacheScopeFor(currentUser);
  const [activeCacheScope, setActiveCacheScope] = useState<string>(cacheScope);

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
    adoptLegacyCache(localStorage, currentUser, ['viva_projects', 'viva_quotes']);
    // Un visiteur n'a pas de cache de données client : le serveur seul fait foi.
    if (cacheScope === 'anonymous') return [];
    return readScopedCache<Project>(localStorage, 'viva_projects', cacheScope) ?? [];
  });

  const [quotes, setQuotes] = useState<QuoteRequest[]>(() =>
    cacheScope === 'anonymous'
      ? []
      : readScopedCache<QuoteRequest>(localStorage, 'viva_quotes', cacheScope) ?? []
  );

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem('viva_equipment');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_EQUIPMENT;
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    const saved = localStorage.getItem('viva_partners');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_PARTNERS;
  });

  const [tickets] = useState<TicketSession[]>([]);
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
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeCmsCopy(parsed);
      } catch (e) {}
    }
    return normalizeCmsCopy(INITIAL_CMS_SECTIONS);
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

  const [dataHealth, setDataHealth] = useState<Record<DataSourceKey, DataSourceHealth>>({
    menus: { status: 'loading' },
    modules: { status: 'loading' },
    cms: { status: 'loading' },
    forms: { status: 'loading' },
    orgUnits: { status: 'loading' },
    media: { status: 'loading' },
    youtube: { status: 'loading' },
    projects: { status: 'loading' },
    quotes: { status: 'loading' },
    submissions: { status: 'loading' },
  });

  // Cache hors-ligne des données client. Supabase est la source de vérité :
  // le cache ne sert qu'à l'affichage pendant une coupure, jamais à écrire.
  const persistCache = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Offline Cache] Unable to persist ${key}:`, error);
    }
  }, []);

  // Résidus d'anciennes versions : un visiteur ne doit garder aucun devis local.
  useEffect(() => {
    try {
      localStorage.removeItem('viva_projects::anonymous');
      localStorage.removeItem('viva_quotes::anonymous');
    } catch {
      /* stockage indisponible : rien à nettoyer */
    }
  }, []);

  // Changement de compte : on quitte le cache du compte précédent avant de
  // charger celui du nouveau. L'état du compte sortant n'est jamais réutilisé.
  useEffect(() => {
    if (activeCacheScope === cacheScope) return;
    adoptLegacyCache(localStorage, currentUser, ['viva_projects', 'viva_quotes']);
    if (cacheScope === 'anonymous') {
      setProjects([]);
      setQuotes([]);
    } else {
      setProjects(readScopedCache<Project>(localStorage, 'viva_projects', cacheScope) ?? []);
      setQuotes(readScopedCache<QuoteRequest>(localStorage, 'viva_quotes', cacheScope) ?? []);
    }
    setActiveCacheScope(cacheScope);
  }, [activeCacheScope, cacheScope, currentUser]);

  useEffect(() => {
    if (activeCacheScope !== cacheScope) return;
    if (cacheScope === 'anonymous') return;
    persistCache(scopedCacheKey('viva_projects', activeCacheScope), projects);
  }, [projects, activeCacheScope, cacheScope, persistCache]);
  useEffect(() => {
    if (activeCacheScope !== cacheScope) return;
    if (cacheScope === 'anonymous') return;
    persistCache(scopedCacheKey('viva_quotes', activeCacheScope), quotes);
  }, [quotes, activeCacheScope, cacheScope, persistCache]);

  useEffect(() => persistCache('viva_platform_config', platformConfig), [platformConfig, persistCache]);
  useEffect(() => persistCache('viva_departments', departments), [departments, persistCache]);
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

  // Le catalogue officiel (départements, équipement, partenaires, directions)
  // n'est plus écouté depuis Firestore : sa base est vide, et un snapshot vide
  // écraserait les données officielles locales. Ces collections restent dans
  // l'état local + cache hors-ligne jusqu'à leur migration Postgres.
  // La configuration plateforme ne s'applique que si un document « main »
  // existe : un snapshot vide ne peut donc rien écraser.
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

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

    return () => {
      unsubscribers.forEach(unsubscribe => {
        try { unsubscribe(); } catch { /* noop */ }
      });
    };
  }, []);

  // Wave 2 — Postgres est la source de vérité des collections ci-dessous.
  // Un succès (même vide) remplace l'état local : plus de fusion avec les
  // données legacy. Un échec conserve l'état précédent mais est exposé via
  // dataHealth (bandeau back-office) : jamais silencieux.
  const loadDataSource = useCallback(async (key: DataSourceKey) => {
    setDataHealth(h => ({ ...h, [key]: { status: 'loading' } }));
    try {
      switch (key) {
        case 'menus': setDynamicMenus(await fetchPgMenus()); break;
        case 'modules': setDynamicModules(await fetchPgModules()); break;
        case 'cms': setCmsSections(normalizeCmsCopy(await fetchPgSections())); break;
        case 'forms': setDynamicForms(await fetchPgForms()); break;
        case 'orgUnits': setOrgUnits(await fetchPgOrgUnits()); break;
        case 'media': setMediaItems(await fetchPgMedia()); break;
        case 'youtube': {
          const yt = await fetchPgYouTube();
          if (yt) setYouTubeConfig(yt);
          break;
        }
        case 'projects': setProjects(await fetchPgProjects()); break;
        case 'quotes': setQuotes(await fetchPgQuotes()); break;
        case 'submissions': setFormSubmissions(await fetchPgSubmissions()); break;
      }
      setDataHealth(h => ({ ...h, [key]: { status: 'ok' } }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[Postgres] Lecture « ${DATA_SOURCE_LABELS[key]} » impossible : ${message}`);
      setDataHealth(h => ({ ...h, [key]: { status: 'error', message } }));
    }
  }, []);

  const reloadDataSource = useCallback((key: DataSourceKey) => {
    void loadDataSource(key);
  }, [loadDataSource]);

  const reloadAllDataSources = useCallback(() => {
    PUBLIC_DATA_SOURCES.forEach(key => void loadDataSource(key));
    void (async () => {
      if (!isSupabaseConfigured() || !supabase) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) AUTH_DATA_SOURCES.forEach(key => void loadDataSource(key));
    })();
  }, [loadDataSource]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setDataHealth(h => {
        const next = { ...h };
        for (const key of [...PUBLIC_DATA_SOURCES, ...AUTH_DATA_SOURCES]) {
          next[key] = {
            status: 'error',
            message: 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
          };
        }
        return next;
      });
      return;
    }
    PUBLIC_DATA_SOURCES.forEach(key => void loadDataSource(key));
  }, [loadDataSource]);

  // Devis & soumissions : RLS exige une session ; rechargés à chaque changement.
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    let active = true;
    const run = (hasSession: boolean) => {
      if (!active) return;
      for (const key of AUTH_DATA_SOURCES) {
        if (hasSession) void loadDataSource(key);
        else setDataHealth(h => ({ ...h, [key]: { status: 'idle', message: 'Session requise.' } }));
      }
    };
    supabase.auth.getSession().then(({ data }) => run(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => run(Boolean(session)));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadDataSource]);

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
    logAuditEvent({
      action: 'ORGANIZATION_UNIT_DELETED',
      resource: 'organization_units',
      resourceId: id
    });
  };

  const updateDynamicMenus = async (menus: DynamicMenu[]) => {
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

    logAuditEvent({
      action: 'DYNAMIC_MENUS_UPDATED',
      resource: 'dynamic_menus',
      details: `${menus.length} menus synchronisés.`
    });
  };

  const updateDynamicModules = async (mods: DynamicModule[]) => {
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
    // Une panne PG est remontée : pas de repli silencieux qui ferait croire à
    // une réception alors que le staff ne verrait rien dans Supabase.
    if (isSupabaseConfigured()) {
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
      console.warn('[Supabase] Formulaire absent de Postgres, repli legacy :', formId);
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
    } else if (current?.storagePath || current?.url.includes('firebasestorage.googleapis.com')) {
      await deleteEnterpriseStorageFile(
        current.storagePath ?? current.url,
        current.storageBucket,
      );
    }
    setMediaItems(prev => prev.filter(m => m.id !== id));
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
  };

  const submitQuoteRequest = async (
    quoteData: Omit<QuoteRequest, 'id' | 'referenceNumber' | 'createdAt' | 'status'>
  ): Promise<string> => {
    // SSOT Supabase : la référence vient du serveur, jamais du navigateur.
    // Échec = erreur propagée, aucun succès affiché.
    let referenceNumber: string;
    if (isSupabaseConfigured()) {
      try {
        referenceNumber = await insertPgQuote({
          clientName: quoteData.clientName,
          clientEmail: quoteData.clientEmail,
          eventName: quoteData.eventName,
          eventDate: quoteData.eventDate,
          location: quoteData.location,
          attendees: Number(quoteData.estimatedAttendees) || 0,
          budgetUSD: Number(quoteData.estimatedBudgetUSD) || 0,
        });
      } catch (e) {
        console.error('[Supabase Wave 2] Soumission devis refusée :', e);
        throw e;
      }
    } else {
      referenceNumber = `DEV-VES-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }

    const newQuote: QuoteRequest = {
      ...quoteData,
      id: `qte-${Date.now()}`,
      referenceNumber,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'submitted'
    };
    setQuotes(prev => [newQuote, ...prev]);

    // L'audit QUOTE_SUBMITTED est écrit par la RPC serveur : plus de 401
    // anonyme sur audit_logs ni de miroir Firestore pour ce parcours.
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
        dataHealth,
        reloadDataSource,
        reloadAllDataSources,
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
