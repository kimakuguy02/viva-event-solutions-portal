import {
  DirectionOrg,
  OrganizationUnit,
  DynamicMenu,
  DynamicModule,
  CmsSectionItem,
  MediaItem,
  YouTubeChannelConfig,
  DynamicForm
} from '../types/cmsAndErp';

export const INITIAL_DIRECTIONS_ORG: DirectionOrg[] = [
  {
    id: 1,
    code: "01",
    name: "DIRECTION GÉNÉRALE",
    tagline: "Secrétariat de direction, stratégie, contrôle et relations institutionnelles",
    description: "Pilote la vision globale, la stratégie institutionnelle, les relations diplomatiques et la coordination générale de VIVA EVENT SOLUTIONS.",
    responsible: "M. le Directeur Général & Gérant",
    active: true,
    order: 1,
    subDirections: [
      { id: "sub-1-1", name: "Secrétariat de Direction & coordination", description: "Gestion de l'agenda présidentiel et coordination des notes de service", active: true },
      { id: "sub-1-2", name: "Stratégie & développement", description: "Planification stratégique et expansion régionale en Afrique Centrale", active: true },
      { id: "sub-1-3", name: "Contrôle interne & performance", description: "Audit des processus et indicateurs de performance KPI", active: true },
      { id: "sub-1-4", name: "Partenariats & relations institutionnelles", description: "Liaison avec les ministères, présidences et organisations internationales", active: true }
    ],
    associatedUsers: ["direction.generale@viva-eventsolutions.cd", "malthus.kilumba@viva-eventsolutions.cd"],
    permissions: ["all_access", "god_mode", "approve_budget"]
  },
  {
    id: 2,
    code: "02",
    name: "DIRECTION DES RESSOURCES HUMAINES",
    tagline: "Talents, paie, formation et bien-être au travail",
    description: "Gère le capital humain d'élite, les recrutements spécialisés, la paie, la formation continue et la discipline sociale.",
    responsible: "Directeur des Ressources Humaines",
    active: true,
    order: 2,
    subDirections: [
      { id: "sub-2-1", name: "Recrutement & gestion des talents", description: "Sélection des experts techniques et opérationnels", active: true },
      { id: "sub-2-2", name: "Administration du personnel & paie", description: "Gestion des contrats, salaires et avantages sociaux", active: true },
      { id: "sub-2-3", name: "Formation & développement des compétences", description: "Mise à niveau certifiée des techniciens et hôtesses", active: true },
      { id: "sub-2-4", name: "Relations sociales, discipline & bien-être au travail", description: "Climat social, hygiène et sécurité du personnel", active: true }
    ],
    associatedUsers: ["admin.malthus@viva-eventsolutions.cd"],
    permissions: ["manage_users", "view_payroll"]
  },
  {
    id: 3,
    code: "03",
    name: "DIRECTION ADMINISTRATIVE & FINANCIÈRE",
    tagline: "Comptabilité, fiscalité, trésorerie et achats",
    description: "Garantit la santé financière, la comptabilité rigoureuse, la fiscalité aux normes congolaises et le contrôle des approvisionnements.",
    responsible: "Directeur Administratif & Financier (DAF)",
    active: true,
    order: 3,
    subDirections: [
      { id: "sub-3-1", name: "Administration & affaires générales", description: "Gestion des locaux, assurances et services généraux", active: true },
      { id: "sub-3-2", name: "Comptabilité & fiscalité", description: "Tenue des grands livres, TVA et impôts légaux DGI", active: true },
      { id: "sub-3-3", name: "Finance, trésorerie & contrôle de gestion", description: "Flux de trésorerie en USD/CDF et budgets de sommets", active: true },
      { id: "sub-3-4", name: "Achats & gestion des fournisseurs", description: "Appels d'offres et contrats fournisseurs internationaux", active: true }
    ],
    associatedUsers: ["comptable@viva-eventsolutions.cd"],
    permissions: ["manage_finances", "approve_quotes", "manage_invoices"]
  },
  {
    id: 4,
    code: "04",
    name: "DIRECTION JURIDIQUE & CONTENTIEUX",
    tagline: "Conformité légale, contrats et propriété intellectuelle",
    description: "Sécurise l'ensemble des engagements contractuels, la conformité OHADA/RDC et la gestion des litiges.",
    responsible: "Directeur Juridique & Conformité",
    active: true,
    order: 4,
    subDirections: [
      { id: "sub-4-1", name: "Contrats & marchés", description: "Rédaction et validation des conventions d'affaires et baux", active: true },
      { id: "sub-4-2", name: "Contentieux & précontentieux", description: "Défense des intérêts corporatifs et résolutions amiables", active: true },
      { id: "sub-4-3", name: "Conformité & régulation", description: "Veille réglementaire et conformité sectorielle", active: true }
    ],
    associatedUsers: ["juridique@viva-eventsolutions.cd"],
    permissions: ["manage_contracts", "view_legal"]
  },
  {
    id: 5,
    code: "05",
    name: "DIRECTION DES OPÉRATIONS & PRODUCTION ÉVÉNEMENTIELLE",
    tagline: "Ingénierie, scénographie, logistique et régie générale",
    description: "Moteur opérationnel de VIVA, déployant l'ingénierie lourde, la scénographie de prestige et la coordination terrain.",
    responsible: "Directeur des Opérations (DOPE)",
    active: true,
    order: 5,
    subDirections: [
      { id: "sub-5-1", name: "Ingénierie de projets & planification", description: "Rétroplanning minuté, dimensionnement technique et études de charge", active: true },
      { id: "sub-5-2", name: "Scénographie & design d'espace", description: "Conception 3D, plans de scène et rendus photoréalistes", active: true },
      { id: "sub-5-3", name: "Régie générale & coordination", description: "Direction de plateau, régie technique et coordination minute par minute", active: true },
      { id: "sub-5-4", name: "Logistique technique & transport", description: "Flotte de transport lourd, levage et acheminement sur site", active: true }
    ],
    associatedUsers: ["chef.operations@viva-eventsolutions.cd"],
    permissions: ["manage_projects", "manage_logistics"]
  },
  {
    id: 6,
    code: "06",
    name: "DIRECTION TECHNIQUE & INFRASTRUCTURES",
    tagline: "Son, lumière, LED, vidéo broadcast et énergie",
    description: "Pilote les équipements lourds : systèmes Line Array, écrans géants LED, caméras broadcast 4K et générateurs synchronisés.",
    responsible: "Directeur Technique Central",
    active: true,
    order: 6,
    subDirections: [
      { id: "sub-6-1", name: "Sonorisation & acoustique", description: "Calibration acoustique Line Array et liaisons HF sécurisées", active: true },
      { id: "sub-6-2", name: "Éclairage scénique & architectural", description: "Projecteurs asservis, découpes et mise en lumière de palais", active: true },
      { id: "sub-6-3", name: "Écrans LED & affichage dynamique", description: "Murs LED P2/P3 incurvés, processeurs Novastar et régies graphiques", active: true },
      { id: "sub-6-4", name: "Énergie & groupes électrogènes", description: "Centrales mobiles insonorisées avec inverseurs automatiques sans coupure", active: true }
    ],
    associatedUsers: ["technique@viva-eventsolutions.cd"],
    permissions: ["manage_equipment", "manage_infrastructure"]
  },
  {
    id: 7,
    code: "07",
    name: "DIRECTION DU PROTOCOLE, ACCUEIL & RELATIONS PUBLIQUES",
    tagline: "Protocole d'État, VIP, hôtesses et conciergerie de luxe",
    description: "Supervise l'étiquette diplomatique, le protocole présidentiel, les délégations internationales et l'accueil VIP.",
    responsible: "Directrice du Protocole d'État & Accueil",
    active: true,
    order: 7,
    subDirections: [
      { id: "sub-7-1", name: "Protocole d'État & délégations", description: "Ordre de préséance, placement officiel et salons d'honneur", active: true },
      { id: "sub-7-2", name: "Hôtesses d'accueil & bilingues", description: "Personnel formé pour les sommets multilatéraux et galas", active: true },
      { id: "sub-7-3", name: "Conciergerie & transport VIP", description: "Véhicules blindés, chauffeurs formés et hébergement d'élite", active: true },
      { id: "sub-7-4", name: "Traduction simultanée Bosch", description: "Cabines insonorisées ISO et interprètes de conférence AIIC", active: true }
    ],
    associatedUsers: ["protocole@viva-eventsolutions.cd"],
    permissions: ["manage_vip", "manage_hospitality"]
  },
  {
    id: 8,
    code: "08",
    name: "DIRECTION COMMERCIALE, MARKETING & COMMUNICATION",
    tagline: "Ventes, stratégie de marque, relations publiques et digital",
    description: "Développe le portefeuille institutionnel et corporate, pilote la marque VIVA et anime les plateformes de diffusion.",
    responsible: "Directrice Commerciale & Marketing",
    active: true,
    order: 8,
    subDirections: [
      { id: "sub-8-1", name: "Marketing & promotion", description: "Campagnes promotionnelles et acquisition de clients", active: true },
      { id: "sub-8-2", name: "Communication & relations publiques", description: "Relations presse et communiqués officiels", active: true },
      { id: "sub-8-3", name: "Branding & activation de marque", description: "Signalétique et design graphique", active: true },
      { id: "sub-8-4", name: "Technologies & solutions digitales", description: "Développement web, application mobile et plateformes live", active: true }
    ],
    associatedUsers: ["commercial@viva-eventsolutions.cd"],
    permissions: ["manage_cms", "manage_marketing"]
  },
  {
    id: 9,
    code: "09",
    name: "DIRECTION SÉCURITÉ, SÛRETÉ & GESTION DES RISQUES",
    tagline: "Gardiennage, protection, risques et conformité technique",
    description: "Assure la sécurité absolue des personnes et des biens sur tous les sites, la prévention des risques et la sûreté VIP.",
    responsible: "Directeur de la Sécurité & Sûreté",
    active: true,
    order: 9,
    subDirections: [
      { id: "sub-9-1", name: "Sécurité & gardiennage", description: "Agents formés pour le contrôle de périmètre", active: true },
      { id: "sub-9-2", name: "Sûreté & protection", description: "Protection rapprochée des personnalités et délégations", active: true },
      { id: "sub-9-3", name: "Gestion des risques & prévention", description: "Plans d'évacuation et gestion de crise", active: true },
      { id: "sub-9-4", name: "Sécurité technique & conformités", description: "Inspection des installations électriques et structures", active: true }
    ],
    associatedUsers: ["securite@viva-eventsolutions.cd"],
    permissions: ["manage_security", "view_safety"]
  }
];

// Hiérarchie dynamique complète de l'organigramme (extensible sans limite)
export const INITIAL_ORG_UNITS: OrganizationUnit[] = [
  {
    id: "unit-dg",
    parentId: null,
    type: "direction",
    code: "DIR-01",
    name: "Direction Générale & Stratégie",
    description: "Haute direction exécutive et vision globale de la société",
    order: 1,
    status: "actif",
    responsibleName: "MALTHUS KILUMBA WA BANZA",
    responsibleEmail: "malthus.kilumba@viva-eventsolutions.cd",
    responsiblePhone: "+243 81 500 0001",
    location: "Siège Social Kinshasa / Gombe",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z"
  },
  {
    id: "unit-rh",
    parentId: null,
    type: "direction",
    code: "DIR-02",
    name: "Direction des Ressources Humaines & Talents",
    description: "Gestion du capital humain, recrutement d'experts et paie",
    order: 2,
    status: "actif",
    responsibleName: "Mme Clarisse MUKANYA",
    responsibleEmail: "rh@viva-eventsolutions.cd",
    responsiblePhone: "+243 81 500 0002",
    location: "Kinshasa / Gombe",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z"
  },
  {
    id: "unit-rh-recrutement",
    parentId: "unit-rh",
    type: "departement",
    code: "DEP-RH-01",
    name: "Département Recrutement & Intégration",
    description: "Sourcing des profils d'ingénieurs du son, régisseurs et hôtesses",
    order: 1,
    status: "actif",
    responsibleName: "Jean-Paul KASONGO",
    responsibleEmail: "recrutement@viva-eventsolutions.cd",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z"
  },
  {
    id: "unit-daf",
    parentId: null,
    type: "direction",
    code: "DIR-03",
    name: "Direction Financière & Comptabilité SYSCOHADA",
    description: "Gestion financière, budgets, trésorerie et conformité fiscale DGI",
    order: 3,
    status: "actif",
    responsibleName: "Comptable Agréé SYSCOHADA",
    responsibleEmail: "comptable@viva-eventsolutions.cd",
    responsiblePhone: "+243 81 500 0003",
    location: "Kinshasa / Gombe",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z"
  },
  {
    id: "unit-technique",
    parentId: null,
    type: "direction",
    code: "DIR-06",
    name: "Direction Technique & Scénographie 3D",
    description: "Ingénierie du son, murs LED, éclairage architectural et énergie",
    order: 4,
    status: "actif",
    responsibleName: "Ing. Serge ILUNGA",
    responsibleEmail: "chef.operations@viva-eventsolutions.cd",
    responsiblePhone: "+243 81 500 0004",
    location: "Base Logistique Limete & Hub Gombe",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z"
  }
];

export const INITIAL_DYNAMIC_MENUS: DynamicMenu[] = [
  { id: "menu-home", name: "Accueil & Vision", displayName: "Accueil & Vision", icon: "Compass", description: "Page principale de présentation", route: "home", order: 1, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-poles", name: "Nos 15 Pôles", displayName: "Nos 15 Pôles", icon: "Layers", description: "Catalogue complet des expertises", route: "departments", order: 2, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-media", name: "Médias & Réalisations", displayName: "Médias & Réalisations", icon: "Image", description: "Galerie photos, réalisations et vidéos YouTube officielles", route: "media", order: 3, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-equipment", name: "Parc Matériel", displayName: "Parc Matériel", icon: "Truck", description: "Inventaire technique et lourd", route: "equipment", order: 4, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-partners", name: "Partenaires", displayName: "Partenaires", icon: "Users", description: "7 collèges de prestataires d'élite", route: "partners", order: 5, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-presentation", name: "Présentation Officielle", displayName: "Présentation Officielle", icon: "Sparkles", description: "Charte et vision institutionnelle", route: "welcome-about", order: 6, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-live", name: "Hub Live", displayName: "Hub Live", icon: "Radio", description: "Streaming 4K, Q&A et votes interactifs", route: "live-hub", order: 7, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-announcements", name: "Annonces", displayName: "Annonces", icon: "Megaphone", description: "Actualités et communiqués officiels", route: "announcements", order: 8, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-ticketing", name: "Billetterie", displayName: "Billetterie", icon: "Ticket", description: "Réservation de places pour sommets", route: "ticketing", order: 9, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-voting", name: "Sondages", displayName: "Sondages", icon: "Vote", description: "Votes en direct pour conférences", route: "voting", order: 10, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
  { id: "menu-client", name: "Espace Client", displayName: "Espace Client", icon: "UserCheck", description: "Portail dédié aux clients et partenaires", route: "client", order: 11, showInNavbar: true, active: true, minRole: "client", tag: "client" },
  { id: "menu-admin", name: "Console Back-Office", displayName: "Console Back-Office", icon: "Shield", description: "Centre de contrôle administrateur et ERP", route: "admin-dashboard", order: 12, showInNavbar: true, active: true, minRole: "admin", tag: "admin" }
];

export const INITIAL_DYNAMIC_MODULES: DynamicModule[] = [
  { id: "mod-erp", name: "ERP & Gestion Opérationnelle", description: "Pilotage centralisé des départements, projets et finances", icon: "LayoutDashboard", category: "management", active: true, allowedRoles: ["admin", "super_admin", "manager"], permissions: ["all"], archived: false },
  { id: "mod-media", name: "Médiathèque & Réalisations", description: "Galerie photos, réalisations prestigieuses et vidéos YouTube", icon: "Image", category: "media", active: true, allowedRoles: ["admin", "super_admin", "manager", "visitor"], permissions: ["view_media", "edit_media"], archived: false },
  { id: "mod-forms", name: "Générateur de Formulaires Dynamiques", description: "Création et suivi de formulaires sur mesure par département", icon: "FileText", category: "management", active: true, allowedRoles: ["admin", "super_admin", "manager"], permissions: ["manage_forms"], archived: false },
  { id: "mod-cms", name: "CMS & Édition de Contenus", description: "Édition dynamique des textes, slogans et sections du site", icon: "Edit3", category: "digital", active: true, allowedRoles: ["admin", "super_admin"], permissions: ["edit_content"], archived: false },
  { id: "mod-quotes", name: "Guichet Devis Intelligent", description: "Génération automatique de devis et facturation pro forma", icon: "DollarSign", category: "engineering", active: true, allowedRoles: ["admin", "super_admin", "manager"], permissions: ["manage_quotes"], archived: false },
  { id: "mod-equipment", name: "Gestion du Parc Matériel", description: "Suivi en temps réel des stocks de dalles LED, son et énergie", icon: "Truck", category: "logistics", active: true, allowedRoles: ["admin", "super_admin", "manager", "staff"], permissions: ["manage_equipment"], archived: false },
  { id: "mod-live", name: "Hub Live & Q&A Interactive", description: "Animation de sessions en direct, questions modérées et sondages", icon: "Radio", category: "digital", active: true, allowedRoles: ["admin", "super_admin", "manager", "visitor"], permissions: ["interact_live"], archived: false },
  { id: "mod-ai", name: "Assistant Intelligent Gemini VIVA", description: "Assistance globale pour l'administration et le conseil client", icon: "Sparkles", category: "digital", active: true, allowedRoles: ["admin", "super_admin", "manager", "staff", "client", "visitor"], permissions: ["use_ai"], archived: false }
];

export const INITIAL_CMS_SECTIONS: CmsSectionItem[] = [
  // 1. ACCUEIL
  {
    id: "cms-welcome-main",
    page: "accueil",
    category: "ACCUEIL",
    section: "Texte de Bienvenue Officiel",
    component: "WelcomeAboutSection",
    contentKey: "home.welcome.title",
    title: "Bienvenue chez VIVA EVENT SOLUTIONS",
    subtitle: "PORTAIL OFFICIEL DE VIVA EVENT SOLUTIONS SARLU",
    content: "Madame, Monsieur,\n\nNous vous souhaitons chaleureusement la bienvenue sur le portail officiel de VIVA EVENT SOLUTIONS.\n\nNous vous remercions de l'intérêt que vous portez à notre établissement et sommes heureux de vous ouvrir les portes de notre univers, de notre savoir-faire et de nos différentes solutions.\n\nVIVA EVENT SOLUTIONS accompagne les institutions, entreprises, organisations, acteurs culturels, producteurs, artistes et particuliers dans la conception et la réalisation de projets événementiels et de projets associés.",
    primaryButtonText: "NOS 15 PÔLES DE SERVICES",
    secondaryButtonText: "Demander un Devis Immédiat",
    type: "compound",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedTitle: "Bienvenue chez VIVA EVENT SOLUTIONS",
    publishedSubtitle: "PORTAIL OFFICIEL DE VIVA EVENT SOLUTIONS SARLU",
    publishedContent: "Madame, Monsieur,\n\nNous vous souhaitons chaleureusement la bienvenue sur le portail officiel de VIVA EVENT SOLUTIONS.\n\nNous vous remercions de l'intérêt que vous portez à notre établissement et sommes heureux de vous ouvrir les portes de notre univers, de notre savoir-faire et de nos différentes solutions.\n\nVIVA EVENT SOLUTIONS accompagne les institutions, entreprises, organisations, acteurs culturels, producteurs, artistes et particuliers dans la conception et la réalisation de projets événementiels et de projets associés.",
    publishedPrimaryButtonText: "NOS 15 PÔLES DE SERVICES",
    publishedSecondaryButtonText: "Demander un Devis Immédiat",
    versions: [
      { versionId: "v-welcome-01", timestamp: new Date().toISOString(), author: "Super Administrateur", title: "Bienvenue chez VIVA EVENT SOLUTIONS", content: "Madame, Monsieur, Nous vous souhaitons chaleureusement la bienvenue..." }
    ]
  },
  {
    id: "cms-hero-title",
    page: "accueil",
    category: "ACCUEIL",
    section: "Bannière Hero - Titre Principal",
    component: "HeroSection",
    contentKey: "home.hero.title",
    title: "Titre de la Bannière Principale",
    subtitle: "RDC & Afrique Centrale",
    content: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale",
    primaryButtonText: "Réserver un Événement",
    secondaryButtonText: "Nos 15 Pôles Spécialisés",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedTitle: "Titre de la Bannière Principale",
    publishedContent: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale",
    publishedPrimaryButtonText: "Réserver un Événement",
    publishedSecondaryButtonText: "Nos 15 Pôles Spécialisés",
    versions: []
  },
  {
    id: "cms-hero-desc",
    page: "accueil",
    category: "ACCUEIL",
    section: "Bannière Hero - Description",
    component: "HeroSection",
    contentKey: "home.hero.description",
    title: "Sous-titre / Description de la Bannière",
    content: "Conception scénographique 3D, sonorisation Line Array, régie technique 4K et logistique autonome pour sommets d'État, conférences internationales et rassemblements d'affaires.",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Conception scénographique 3D, sonorisation Line Array, régie technique 4K et logistique autonome pour sommets d'État, conférences internationales et rassemblements d'affaires.",
    versions: []
  },
  // 2. À PROPOS
  {
    id: "cms-about-who",
    page: "presentation",
    category: "A_PROPOS",
    section: "Qui Sommes-Nous",
    component: "WelcomeAboutSection",
    contentKey: "about.whoWeAre.description",
    title: "QUI SOMMES-NOUS ? — Présentation de la Société",
    subtitle: "Une Architecture Unique & Intégrée, au service de projets complexes.",
    content: "VIVA EVENT SOLUTIONS est une société basée à Kinshasa-RDC, qui se positionne à l'intersection de plusieurs domaines : Événementiel, communication, numérique, production audiovisuelle, logistique, technologie, services aux entreprises et services aux institutions.",
    type: "html",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedTitle: "QUI SOMMES-NOUS ? — Présentation de la Société",
    publishedContent: "VIVA EVENT SOLUTIONS est une société basée à Kinshasa-RDC, qui se positionne à l'intersection de plusieurs domaines : Événementiel, communication, numérique, production audiovisuelle, logistique, technologie, services aux entreprises et services aux institutions.",
    versions: []
  },
  // 3. SERVICES
  {
    id: "cms-services-title",
    page: "poles",
    category: "SERVICES",
    section: "15 Pôles de Services",
    component: "DepartmentsCatalog",
    contentKey: "services.title",
    title: "Titre Catalogue des 15 Pôles Spécialisés",
    subtitle: "Couverture intégrale de la chaîne de valeur événementielle",
    content: "De la conception scénographique 3D au déploiement de groupes électrogènes synchronisés de 3 200 kVA, explorez nos 15 directions de compétences intégrées.",
    primaryButtonText: "Demander une offre technique",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "De la conception scénographique 3D au déploiement de groupes électrogènes synchronisés de 3 200 kVA, explorez nos 15 directions de compétences intégrées.",
    versions: []
  },
  // 4. RÉALISATIONS
  {
    id: "cms-realisations-title",
    page: "accueil",
    category: "REALISATIONS",
    section: "Sommets & Réalisations",
    component: "ProjectManager",
    contentKey: "projects.title",
    title: "Titre Section Projets & Sommets d'État",
    subtitle: "Diplomatie, Conférences & Grands Rassemblements",
    content: "Gestion intégrale et protocolaire des plus grands événements institutionnels et corporatifs de la République Démocratique du Congo.",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Gestion intégrale et protocolaire des plus grands événements institutionnels et corporatifs de la République Démocratique du Congo.",
    versions: []
  },
  // 5. MÉDIAS
  {
    id: "cms-medias-title",
    page: "media",
    category: "MEDIAS",
    section: "Médiathèque & YouTube",
    component: "MediaManager",
    contentKey: "media.title",
    title: "Galerie & Médiathèque Officielle",
    subtitle: "Photothèque & Vidéothèque HD",
    content: "Explorez nos reportages photos et captations audiovisuelles 4K sur le terrain des opérations à Kinshasa et dans les provinces de la RDC.",
    primaryButtonText: "Consulter la Chaîne YouTube",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Explorez nos reportages photos et captations audiovisuelles 4K sur le terrain des opérations à Kinshasa et dans les provinces de la RDC.",
    versions: []
  },
  // 6. CONTACT
  {
    id: "cms-contact-details",
    page: "contact",
    category: "CONTACT",
    section: "Coordonnées Officielles & Guichet",
    component: "Footer",
    contentKey: "contact.title",
    title: "Coordonnées Officielles & Siège",
    subtitle: "Kinshasa / Gombe • RDC",
    content: "Siège Social : Boulevard du 30 Juin, Gombe, Kinshasa - RDC\nTéléphone Direction : +243 963 216 780\nEmail Institutionnel : contact@viva-eventsolutions.cd\nHoraires Guichet : Lundi au Samedi, 08h00 - 18h30",
    primaryButtonText: "Nous Contacter",
    type: "html",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Siège Social : Boulevard du 30 Juin, Gombe, Kinshasa - RDC\nTéléphone Direction : +243 963 216 780\nEmail Institutionnel : contact@viva-eventsolutions.cd\nHoraires Guichet : Lundi au Samedi, 08h00 - 18h30",
    versions: []
  },
  // 7. FOOTER
  {
    id: "cms-footer-desc",
    page: "footer",
    category: "FOOTER",
    section: "Pied de Page Officiel",
    component: "Footer",
    contentKey: "footer.description",
    title: "Description Institutionnelle Footer",
    content: "VIVA EVENT SOLUTIONS SARLU — Leader de l'ingénierie événementielle globale, de la scénographie de prestige et des technologies de pointe en RDC.",
    primaryButtonText: "Mentions Légales",
    secondaryButtonText: "Charte de Marque",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "VIVA EVENT SOLUTIONS SARLU — Leader de l'ingénierie événementielle globale, de la scénographie de prestige et des technologies de pointe en RDC.",
    versions: []
  },
  // 8. NAVIGATION
  {
    id: "cms-nav-tagline",
    page: "navigation",
    category: "NAVIGATION",
    section: "Barre de Navigation Principale",
    component: "Navbar",
    contentKey: "navigation.tagline",
    title: "Slogan En-tête Navigation",
    content: "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO & AFRIQUE CENTRALE • Guichet Unique Ingénierie Événementielle Globale",
    primaryButtonText: "Simulateur Devis",
    secondaryButtonText: "Réserver un Événement",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO & AFRIQUE CENTRALE • Guichet Unique Ingénierie Événementielle Globale",
    versions: []
  },
  // 9. ESPACE CLIENT
  {
    id: "cms-client-portal",
    page: "client_portal",
    category: "ESPACE_CLIENT",
    section: "Portail Client Partenaire",
    component: "ClientPortal",
    contentKey: "client.welcome.title",
    title: "Espace Client Partenaire & Suivi Devis",
    subtitle: "Guichet Unique Dédié",
    content: "Bienvenue sur votre portail client dédié. Suivez ici en temps réel l'avancement de vos demandes de devis, le rétroplanning de vos événements et vos factures d'acompte.",
    primaryButtonText: "Nouveau Devis",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Bienvenue sur votre portail client dédié. Suivez ici en temps réel l'avancement de vos demandes de devis, le rétroplanning de vos événements et vos factures d'acompte.",
    versions: []
  },
  // 10. ESPACE PUBLIC
  {
    id: "cms-public-space",
    page: "accueil",
    category: "ESPACE_PUBLIC",
    section: "Bannière Visiteurs & Partenaires Publics",
    component: "HeroSection",
    contentKey: "public.banner.text",
    title: "Message de Bienvenue Espace Public",
    content: "Accédez librement à la vitrine officielle de nos 15 pôles spécialisés, simulez vos devis et réservez vos dates pour vos cérémonies et sommets.",
    primaryButtonText: "Découvrir nos Réalisations",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Accédez librement à la vitrine officielle de nos 15 pôles spécialisés, simulez vos devis et réservez vos dates pour vos cérémonies et sommets.",
    versions: []
  },
  // 11. ESPACE ADMINISTRATEUR
  {
    id: "cms-admin-space",
    page: "admin",
    category: "ESPACE_ADMINISTRATEUR",
    section: "Console Back-Office & Super Admin",
    component: "AdminDashboard",
    contentKey: "admin.dashboard.title",
    title: "Tableau de Bord Exécutif • Direction Générale",
    content: "Supervision en temps réel des sommets d'État, du guichet unique de devis, des 14 départements opérationnels et des 7 collèges de prestataires d'élite.",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Supervision en temps réel des sommets d'État, du guichet unique de devis, des 14 départements opérationnels et des 7 collèges de prestataires d'élite.",
    versions: []
  },
  // 12. PAGES INSTITUTIONNELLES
  {
    id: "cms-legal-terms",
    page: "presentation",
    category: "PAGES_INSTITUTIONNELLES",
    section: "Mentions Légales & Registre de Commerce",
    component: "BrandCharterModal",
    contentKey: "legal.terms.title",
    title: "Registre & Immatriculation Officielle RDC",
    content: "VIVA EVENT SOLUTIONS SARLU est immatriculée au Registre du Commerce et du Crédit Mobilier sous le numéro RCCM CD/KIN/RCCM/24-B-01492, Identification Nationale 01-G4700-N88412M, Numéro Impôt A2418579Z. Siège social à Kinshasa / Gombe.",
    type: "html",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "VIVA EVENT SOLUTIONS SARLU est immatriculée au Registre du Commerce et du Crédit Mobilier sous le numéro RCCM CD/KIN/RCCM/24-B-01492, Identification Nationale 01-G4700-N88412M, Numéro Impôt A2418579Z. Siège social à Kinshasa / Gombe.",
    versions: []
  },
  // 13. MESSAGES SYSTÈME
  {
    id: "cms-sys-offline",
    page: "admin",
    category: "MESSAGES_SYSTEME",
    section: "Notification Mode Offline & Sécurité",
    component: "OfflineBanner",
    contentKey: "system.offline.notice",
    title: "Avertissement Mode Hors-Ligne & Cache",
    content: "Connexion Firestore temporairement interrompue : les opérations locales sont enregistrées en cache sécurisé et synchronisées automatiquement dès le rétablissement du réseau.",
    type: "text",
    status: "published",
    language: "fr",
    lastModified: new Date().toISOString(),
    author: "Super Administrateur",
    publishedContent: "Connexion Firestore temporairement interrompue : les opérations locales sont enregistrées en cache sécurisé et synchronisées automatiquement dès le rétablissement du réseau.",
    versions: []
  }
];

// Configuration officielle de la Chaîne YouTube
export const INITIAL_YOUTUBE_CONFIG: YouTubeChannelConfig = {
  youtubeChannelUrl: "https://www.youtube.com/@vivaeventsolutions-rdc",
  youtubeChannelId: "UC_viva_event_solutions_rdc",
  youtubeChannelName: "VIVA EVENT SOLUTIONS TV",
  youtubeChannelDescription: "Chaîne officielle de l'ingénierie événementielle en République Démocratique du Congo : découvrez nos réalisations de sommets diplomatiques, concerts géants et captations 4K.",
  isChannelEnabled: true
};

// Éléments Médias Initiaux (Photos de réalisations réelles, vidéos et vidéos YouTube)
export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: "med-01",
    title: "Scénographie & Mur LED Sommet Économique International",
    description: "Installation d'un mur LED P2.5 incurvé de 85 m² avec régie 4K Novastar et pupitre présidentiel sécurisé au Fleuve Congo Hotel.",
    caption: "Kinshasa, Décembre 2025 • 1 200 délégués ministériels",
    type: "photo",
    category: "sommet_etat",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80",
    projectName: "Sommet Économique Afrique Centrale",
    realizationDate: "2025-12-14",
    isFeatured: true,
    order: 1,
    status: "published",
    uploadedAt: "2026-01-10T10:00:00Z",
    uploadedBy: "Direction Générale"
  },
  {
    id: "med-02",
    title: "Déploiement Système Line Array L-Acoustics K2",
    description: "Système de sonorisation longue portée avec 24 boîtes K2 et subwoofers KS28 pour le festival panafricain de Kinshasa.",
    caption: "Esplanade du Palais du Peuple • Couverture acoustique 45 000 personnes",
    type: "photo",
    category: "sonorisation",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
    projectName: "Festival Panafricain des Arts",
    realizationDate: "2025-11-20",
    isFeatured: true,
    order: 2,
    status: "published",
    uploadedAt: "2026-01-12T14:30:00Z",
    uploadedBy: "Direction Technique"
  },
  {
    id: "med-03",
    title: "Cabines de Traduction Simultanée Bosch DCN NG",
    description: "Installation de 6 cabines insonorisées conformes aux normes ISO 4043 avec distribution infrarouge pour 16 langues officielles.",
    caption: "Conférence Ministérielle Tripartite • Interprètes AIIC",
    type: "photo",
    category: "traduction",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
    projectName: "Forum Multilatéral de la Paix",
    realizationDate: "2025-10-05",
    isFeatured: false,
    order: 3,
    status: "published",
    uploadedAt: "2026-01-15T09:15:00Z",
    uploadedBy: "Direction du Protocole"
  },
  {
    id: "med-04",
    title: "Éclairage Architectural & Show Lumière Grand Gala",
    description: "Mise en lumière dynamique du Palais avec 60 lyres Beam/Spot Robe et wash architectural LED sans éblouissement.",
    caption: "Gala Annuel d'Excellence Minière • RDC",
    type: "photo",
    category: "eclairage",
    url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
    projectName: "Nuit des Bâtisseurs RDC",
    realizationDate: "2025-12-28",
    isFeatured: true,
    order: 4,
    status: "published",
    uploadedAt: "2026-01-18T16:00:00Z",
    uploadedBy: "Direction des Opérations"
  },
  {
    id: "med-05",
    title: "Rétrospective Officielle : Les Grands Sommets 2025",
    description: "Film institutionnel retraçant les réalisations scénographiques, audiovisuelles et protocolaires de VIVA EVENT SOLUTIONS en RDC.",
    caption: "Production Broadcast 4K • VIVA Media",
    type: "youtube",
    category: "corporate",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeVideoId: "dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    projectName: "Rétrospective Annuelle VIVA",
    realizationDate: "2025-12-31",
    isFeatured: true,
    order: 5,
    status: "published",
    uploadedAt: "2026-01-20T11:00:00Z",
    uploadedBy: "Direction Générale"
  },
  {
    id: "med-06",
    title: "Backstage & Déploiement Logistique : 48 Heures Avant le Coup d'Envoi",
    description: "Immersion vidéo exclusive au cœur des équipes techniques montant les structures d'aluminium truss et les générateurs insonorisés.",
    caption: "Reportage Technique Terrain • Équipe Régie",
    type: "youtube",
    category: "scenographie",
    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    youtubeVideoId: "ScMzIvxBSi4",
    thumbnailUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
    projectName: "Série Coulisses d'Experts",
    realizationDate: "2026-01-15",
    isFeatured: false,
    order: 6,
    status: "published",
    uploadedAt: "2026-01-25T15:20:00Z",
    uploadedBy: "Direction de la Communication"
  }
];

// Formulaires Dynamiques Préconfigurés
export const INITIAL_DYNAMIC_FORMS: DynamicForm[] = [
  {
    id: "form-recrutement",
    name: "Formulaire de Recrutement & Candidature Spécialisée",
    description: "Candidature pour techniciens son, éclairagistes, régisseurs, hôtesses et agents de protocole.",
    departmentId: "unit-rh",
    departmentName: "Direction des Ressources Humaines",
    targetAudience: "public",
    allowedRoles: ["visitor", "client", "staff", "admin"],
    status: "actif",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    submissionsCount: 14,
    fields: [
      { id: "f-1", name: "fullName", label: "Nom et Prénom", type: "text", placeholder: "Ex: Moïse KABWE", required: true, order: 1 },
      { id: "f-2", name: "email", label: "Adresse E-mail Professionnelle", type: "email", placeholder: "nom@domaine.cd", required: true, order: 2 },
      { id: "f-3", name: "phone", label: "Numéro de Téléphone (WhatsApp)", type: "phone", placeholder: "+243 ...", required: true, order: 3 },
      {
        id: "f-4",
        name: "specialty",
        label: "Pôle de Spécialité Recherché",
        type: "select",
        required: true,
        options: [
          "Ingénieur du Son / Line Array",
          "Technicien Lumière / Pupitreur GrandMA",
          "Opérateur Écran LED & Processeur Novastar",
          "Régisseur Général de Scène",
          "Hôte / Hôtesse d'Accueil Bilingue",
          "Agent de Sécurité Événementielle & Protocole"
        ],
        order: 4
      },
      { id: "f-5", name: "yearsOfExperience", label: "Années d'Expérience dans l'Événementiel", type: "number", placeholder: "Ex: 5", required: true, order: 5 },
      { id: "f-6", name: "coverNote", label: "Présentation de vos références et motivations", type: "textarea", placeholder: "Mentionnez les sommets, concerts ou projets auxquels vous avez collaboré...", required: true, order: 6 }
    ]
  },
  {
    id: "form-devis-specifique",
    name: "Cahier des Charges Sommet & Événement Diplomatique",
    description: "Formulaire technique détaillé pour les présidences, ministères et organisations internationales.",
    departmentId: "unit-dg",
    departmentName: "Direction Générale & Protocole",
    targetAudience: "client",
    allowedRoles: ["client", "admin", "manager"],
    status: "actif",
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-02-10T12:00:00Z",
    submissionsCount: 8,
    fields: [
      { id: "cs-1", name: "institutionName", label: "Institution / Ministère / Ambassade", type: "text", required: true, order: 1 },
      { id: "cs-2", name: "contactPerson", label: "Nom du Délégué ou Point Focal", type: "text", required: true, order: 2 },
      { id: "cs-3", name: "delegatesCount", label: "Nombre de Délégués VIP attendus", type: "number", required: true, order: 3 },
      {
        id: "cs-4",
        name: "needsTranslation",
        label: "Traduction Simultanée Requise",
        type: "radio",
        options: ["Oui (Cabines ISO + Écouteurs)", "Non (Unilingue)", "À déterminer"],
        required: true,
        order: 4
      },
      { id: "cs-5", name: "eventDate", label: "Date Prévue de l'Événement", type: "date", required: true, order: 5 },
      { id: "cs-6", name: "estimatedBudget", label: "Enveloppe Budgétaire Estimée (USD)", type: "currency", placeholder: "Ex: 50000", required: false, order: 6 }
    ]
  }
];
