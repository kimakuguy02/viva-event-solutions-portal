import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) {
  throw new Error("Configuration de sécurité serveur invalide : ADMIN_PASSWORD obligatoire (min 8 caractères). Le serveur refuse de démarrer avec une sécurité compromise.");
}

// Types for persistent server database
export interface DbSchema {
  version: number;
  lastUpdated: string;
  users: any[];
  sessions: { token: string; userId: string; email: string; role: string; expiresAt: number }[];
  platformConfig: any;
  directionsOrg: any[];
  dynamicMenus: any[];
  dynamicModules: any[];
  cmsSections: any[];
  projects: any[];
  quotes: any[];
  equipment: any[];
  partners: any[];
  tickets: any[];
  erp: {
    employees: any[];
    crmClients: any[];
    crmInteractions: any[];
    transactions: any[];
    cashClosures: any[];
    tasks: any[];
    fieldReports: any[];
    loanRecords: any[];
    maintenanceLogs: any[];
    notices: any[];
  };
  auditLogs: {
    id: string;
    userId?: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    result: 'success' | 'failure' | 'denied';
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    details?: string;
  }[];
  featureFlags: {
    quotesEnabled: boolean;
    liveHubEnabled: boolean;
    ticketingEnabled: boolean;
    votingEnabled: boolean;
    clientPortalEnabled: boolean;
    visitorRadarEnabled: boolean;
    maintenanceMode: boolean;
  };
  financialSettings: {
    exchangeRateCDF: number;
    vatRatePercent: number;
    doubleSignatureThresholdUSD: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'viva_database.json');
const BACKUP_FILE = path.join(DATA_DIR, 'viva_database.backup.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache with atomic disk persistence
let dbState: DbSchema | null = null;

// Password hashing utilities using Node.js built-in crypto (PBKDF2)
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashedAttempt = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hashedAttempt), Buffer.from(hash));
}

// Default initial data generator (Preserving all rich institutional data)
function getInitialDbState(): DbSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD obligatoire pour initialiser la base.");
  }
  const { hash: adminHash } = hashPassword(adminPassword, adminSalt);

  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    users: [
      {
        id: "usr-admin-gen-001",
        name: "Direction Générale (Super Administrateur)",
        email: process.env.ADMIN_EMAIL || "direction.generale@viva-eventsolutions.cd",
        phone: "+243 81 000 9988",
        role: "admin_general",
        directionName: "01. DIRECTION GÉNÉRALE",
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        status: "active",
        createdAt: "2026-01-10",
        lastLogin: new Date().toISOString(),
        permissions: [
          "all_access",
          "god_mode",
          "users.view",
          "users.create",
          "users.update",
          "users.delete",
          "roles.manage",
          "organization.view",
          "organization.update",
          "content.view",
          "content.create",
          "content.update",
          "content.publish",
          "modules.view",
          "modules.update",
          "quotes.manage",
          "equipment.manage",
          "finance.approve",
          "audit.view",
          "settings.update"
        ]
      },
      {
        id: "usr-dg-002",
        name: "MALTHUS KILUMBA WA BANZA",
        email: "malthus.kilumba@viva-eventsolutions.cd",
        phone: "+243 81 500 0001",
        role: "dg_gerant",
        directionName: "01. DIRECTION GÉNÉRALE",
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        status: "active",
        createdAt: "2026-01-15",
        lastLogin: new Date().toISOString(),
        permissions: ["organization.view", "organization.update", "content.view", "modules.view", "quotes.manage", "finance.approve", "audit.view"]
      },
      {
        id: "usr-adm-003",
        name: "MALTHUS KILUMBA WA BANZA (Admin RH)",
        email: "admin.malthus@viva-eventsolutions.cd",
        phone: "+243 81 500 0002",
        role: "admin_rh",
        directionName: "02. DIRECTION DES RESSOURCES HUMAINES",
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        status: "active",
        createdAt: "2026-02-01",
        lastLogin: new Date().toISOString(),
        permissions: ["users.view", "users.create", "users.update", "organization.view", "content.view", "modules.view"]
      },
      {
        id: "usr-daf-004",
        name: "COMPTABLE AGRÉÉ SYSCOHADA",
        email: "comptable@viva-eventsolutions.cd",
        phone: "+243 81 500 0003",
        role: "daf_comptable",
        directionName: "03. DIRECTION ADMINISTRATIVE & FINANCIÈRE",
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        status: "active",
        createdAt: "2026-02-15",
        lastLogin: new Date().toISOString(),
        permissions: ["finance.approve", "quotes.manage", "modules.view", "audit.view"]
      },
      {
        id: "usr-ops-005",
        name: "Ing. Serge ILUNGA",
        email: "chef.operations@viva-eventsolutions.cd",
        phone: "+243 81 500 0004",
        role: "chef_equipe",
        directionName: "06. DIRECTION TECHNIQUE, SCÉNOGRAPHIE & INFRASTRUCTURES",
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        status: "active",
        createdAt: "2026-03-01",
        lastLogin: new Date().toISOString(),
        permissions: ["equipment.manage", "quotes.manage", "modules.view"]
      },
      {
        id: "usr-com-006",
        name: "Mme Sarah KALONJI",
        email: "commercial@viva-eventsolutions.cd",
        phone: "+243 81 500 0005",
        role: "commercial_secretaire",
        directionName: "08. DIRECTION COMMUNICATION, MARKETING & DÉVELOPPEMENT DIGITAL",
        passwordHash: adminHash,
        passwordSalt: adminSalt,
        status: "active",
        createdAt: "2026-03-10",
        lastLogin: new Date().toISOString(),
        permissions: ["content.view", "content.update", "quotes.manage", "modules.view"]
      }
    ],
    sessions: [],
    platformConfig: {
      heroTitle: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale",
      heroSubtitle: "De la conception intellectuelle à la mise en œuvre technique, logistique, numérique et sécuritaire. Un guichet unique global (one-stop-shop) pour sublimer vos sommets d'État, conventions et grands événements.",
      heroTagline: "CRÉER • ORGANISER • PRODUIRE • CONNECTER • IMPACTER",
      heroImageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
      welcomeMessage: "Madame, Monsieur,\n\nNous vous souhaitons chaleureusement la bienvenue sur le portail officiel de VIVA EVENT SOLUTIONS.\n\nNous vous remercions de l'intérêt que vous portiez à notre société et sommes heureux de vous ouvrir les portes de notre univers, de notre savoir-faire et de nos différentes solutions.\n\nVIVA EVENT SOLUTIONS accompagne les institutions, entreprises, organisations, acteurs culturels, producteurs, artistes et particuliers dans la conception et la réalisation de projets événementiels et de projets associés.\n\nNotre approche repose sur une conviction simple : un projet complexe mérite une vision globale, une organisation structurée et une coordination maîtrisée.\n\nNous vous invitons à découvrir nos expertises, nos solutions, notre approche artistique et créative ainsi que les différentes possibilités de collaboration que nous proposons.",
      whoWeAreText: "Une Architecture Unique & Intégrée, au service de projets complexes.\n\nVIVA EVENT SOLUTIONS est une société basée à Kinshasa-RDC, qui se positionne à l'intersection de plusieurs domaines : Événementiel, communication, numérique, production audiovisuelle, logistique, technologie, services aux entreprises et services aux institutions.",
      contactInfo: {
        phone: "+243 963 216 780 / +243 855 929 308",
        email: "contact@viva-eventsolutions.cd",
        address: "Boulevard du 30 Juin, Gombe, Kinshasa - RDC",
        rccm: "CD/KIN/RCCM/24-B-01492",
        idNat: "01-G4701-N44921",
        website: "www.viva-eventsolutions.cd"
      },
      navigationMenuLabels: {
        home: "Accueil",
        visitorHub: "Espace Visiteur",
        poles: "Nos 15 Pôles",
        clientSpace: "Espace Client",
        quoteSimulator: "Demander un devis",
        partners: "7 Collèges Partenaires",
        equipment: "Parc Matériel",
        liveHub: "Live & Hybride",
        adminConsole: "Espace VIVA EVENT SOLUTIONS"
      }
    },
    directionsOrg: [
      {
        id: 1,
        code: "01",
        name: "DIRECTION GÉNÉRALE",
        tagline: "Secrétariat de direction, stratégie, contrôle et relations institutionnelles",
        description: "Pilote la vision globale, la stratégie institutionnelle, les relations diplomatiques et la coordination générale de VIVA EVENT SOLUTIONS.",
        responsible: "M. le Directeur Général & Président",
        active: true,
        order: 1,
        subDirections: [
          { id: "sub-1-1", name: "Secrétariat de Direction & coordination", description: "Gestion de l'agenda présidentiel et coordination des notes de service", active: true },
          { id: "sub-1-2", name: "Stratégie & développement", description: "Planification stratégique et expansion régionale en Afrique Centrale", active: true },
          { id: "sub-1-3", name: "Contrôle interne & performance", description: "Audit des processus et indicateurs de performance KPI", active: true },
          { id: "sub-1-4", name: "Partenariats & relations institutionnelles", description: "Liaison avec les ministères, présidences et organisations internationales", active: true }
        ],
        associatedUsers: ["dg@viva-eventsolutions.cd", "direction.generale@viva-eventsolutions.cd"],
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
        associatedUsers: ["rh@viva-eventsolutions.cd"],
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
        associatedUsers: ["daf@viva-eventsolutions.cd"],
        permissions: ["manage_finances", "approve_quotes", "manage_invoices"]
      },
      {
        id: 4,
        code: "04",
        name: "DIRECTION DES AFFAIRES JURIDIQUES",
        tagline: "Conformité, contrats, contentieux et propriété intellectuelle",
        description: "Sécurise juridiquement tous les contrats de sommets, la conformité OAPI/RCCM et la gestion des litiges.",
        responsible: "Directeur des Affaires Juridiques & Conformité",
        active: true,
        order: 4,
        subDirections: [
          { id: "sub-4-1", name: "Conseil juridique & conformité", description: "Veille réglementaire et avis légaux", active: true },
          { id: "sub-4-2", name: "Contrats & affaires commerciales", description: "Rédaction et validation des conventions clients/fournisseurs", active: true },
          { id: "sub-4-3", name: "Contentieux & règlement des litiges", description: "Gestion des réclamations et arbitrages", active: true },
          { id: "sub-4-4", name: "Propriété intellectuelle & protection juridique", description: "Enregistrement de marques et protection OAPI", active: true }
        ],
        associatedUsers: ["legal@viva-eventsolutions.cd"],
        permissions: ["manage_contracts", "view_legal"]
      },
      {
        id: 5,
        code: "05",
        name: "DIRECTION INGÉNIERIE & PRODUCTION ÉVÉNEMENTIELLE",
        tagline: "Conseil, réalisation, audiovisuel et expériences",
        description: "Conçoit et produit l'architecture globale des grands événements, des plateaux TV et des diffusions internationales.",
        responsible: "Directeur de l'Ingénierie & Production",
        active: true,
        order: 5,
        subDirections: [
          { id: "sub-5-1", name: "Conseil & ingénierie événementielle", description: "Design conceptuel et cahiers des charges", active: true },
          { id: "sub-5-2", name: "Production & réalisation", description: "Pilotage des régies générales le jour J", active: true },
          { id: "sub-5-3", name: "Audiovisuel & cinématographie", description: "Captation multicaméra 4K et drone", active: true },
          { id: "sub-5-4", name: "Diffusion & expériences événementielles", description: "Streaming live mondial et réalité immersive", active: true }
        ],
        associatedUsers: ["production@viva-eventsolutions.cd"],
        permissions: ["manage_projects", "manage_equipment"]
      },
      {
        id: 6,
        code: "06",
        name: "DIRECTION TECHNIQUE, SCÉNOGRAPHIE & INFRASTRUCTURES",
        tagline: "Son, lumière, LED, décoration et infrastructures",
        description: "Assure le déploiement technique lourd (Line Array, dalles LED P2.6, structures alu, groupes électrogènes et scénographie).",
        responsible: "Directeur Technique & Infrastructures",
        active: true,
        order: 6,
        subDirections: [
          { id: "sub-6-1", name: "Son, lumière & scène", description: "Systèmes audio professionnels et éclairage scénique intelligent", active: true },
          { id: "sub-6-2", name: "Image, LED & solutions visuelles", description: "Murs d'images géants et processeurs Novastar", active: true },
          { id: "sub-6-3", name: "Décoration & scénographie", description: "Habillage visuel, mobilier VIP et podiums", active: true },
          { id: "sub-6-4", name: "Location & infrastructures", description: "Chapiteaux modulaires et groupes électrogènes insonorisés", active: true }
        ],
        associatedUsers: ["technique@viva-eventsolutions.cd"],
        permissions: ["manage_equipment", "manage_inventory"]
      },
      {
        id: 7,
        code: "07",
        name: "DIRECTION LOGISTIQUE, HOSPITALITÉ & EXPÉRIENCE PARTICIPANT",
        tagline: "Transport, protocole, billetterie et hébergement",
        description: "Coordonne l'accueil VIP, le transport sécurisé, la billetterie numérique et l'art de la table de haut standing.",
        responsible: "Directeur Logistique & Hospitalité",
        active: true,
        order: 7,
        subDirections: [
          { id: "sub-7-1", name: "Transport & mobilité", description: "Flotte de véhicules VIP et transferts aéroport", active: true },
          { id: "sub-7-2", name: "Accueil, protocole & gestion des invités", description: "Hôtesses d'accueil formées et protocole d'État", active: true },
          { id: "sub-7-3", name: "Billetterie & gestion des participants", description: "Badges RFID, QR-codes et contrôle d'accès", active: true },
          { id: "sub-7-4", name: "Traiteur, hébergement & conciergerie", description: "Restauration gastronomique et réservations hôtelières", active: true }
        ],
        associatedUsers: ["logistique@viva-eventsolutions.cd"],
        permissions: ["manage_ticketing", "manage_hospitality"]
      },
      {
        id: 8,
        code: "08",
        name: "DIRECTION COMMUNICATION, MARKETING & DÉVELOPPEMENT DIGITAL",
        tagline: "Marketing, RP, branding et solutions digitales",
        description: "Pilote la notoriété de VIVA EVENT SOLUTIONS, les relations publiques, l'identité de marque et le portail digital.",
        responsible: "Directeur Communication & Digital",
        active: true,
        order: 8,
        subDirections: [
          { id: "sub-8-1", name: "Marketing & promotion", description: "Campagnes promotionnelles et acquisition de clients", active: true },
          { id: "sub-8-2", name: "Communication & relations publiques", description: "Relations presse et communiqués officiels", active: true },
          { id: "sub-8-3", name: "Branding & activation de marque", description: "Signalétique et design graphique", active: true },
          { id: "sub-8-4", name: "Technologies & solutions digitales", description: "Développement web, application mobile et plateformes live", active: true }
        ],
        associatedUsers: ["com@viva-eventsolutions.cd"],
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
    ],
    dynamicMenus: [
      { id: "menu-home", name: "Accueil & Vision", icon: "Compass", description: "Page principale de présentation", route: "home", order: 1, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-poles", name: "Nos 15 Pôles", icon: "Layers", description: "Catalogue complet des expertises", route: "departments", order: 2, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-equipment", name: "Parc Matériel", icon: "Truck", description: "Inventaire technique et lourd", route: "equipment", order: 3, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-partners", name: "Partenaires", icon: "Users", description: "7 collèges de prestataires d'élite", route: "partners", order: 4, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-presentation", name: "Présentation Officielle", icon: "Sparkles", description: "Charte et vision institutionnelle", route: "welcome-about", order: 5, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-live", name: "Hub Live", icon: "Radio", description: "Streaming 4K, Q&A et votes interactifs", route: "live-hub", order: 6, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-announcements", name: "Annonces", icon: "Megaphone", description: "Actualités et communiqués officiels", route: "announcements", order: 7, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-ticketing", name: "Billetterie", icon: "Ticket", description: "Réservation de places pour sommets", route: "ticketing", order: 8, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-voting", name: "Sondages", icon: "Vote", description: "Votes en direct pour conférences", route: "voting", order: 9, showInNavbar: true, active: true, minRole: "visitor", tag: "public" },
      { id: "menu-client", name: "Espace Client", icon: "UserCheck", description: "Portail dédié aux clients et partenaires", route: "client", order: 10, showInNavbar: true, active: true, minRole: "client", tag: "client" },
      { id: "menu-admin", name: "Console Back-Office", icon: "Shield", description: "Centre de contrôle administrateur et ERP", route: "admin-dashboard", order: 11, showInNavbar: true, active: true, minRole: "admin", tag: "admin" }
    ],
    dynamicModules: [
      { id: "mod-erp", name: "ERP & Gestion Opérationnelle", description: "Pilotage centralisé des départements, projets et finances", icon: "LayoutDashboard", category: "management", active: true, allowedRoles: ["admin", "super_admin", "manager"], permissions: ["all"], archived: false },
      { id: "mod-cms", name: "CMS & Édition de Contenus", description: "Édition dynamique des textes, slogans et sections du site", icon: "Edit3", category: "digital", active: true, allowedRoles: ["admin", "super_admin"], permissions: ["edit_content"], archived: false },
      { id: "mod-quotes", name: "Guichet Devis Intelligent", description: "Génération automatique de devis et facturation pro forma", icon: "FileText", category: "engineering", active: true, allowedRoles: ["admin", "super_admin", "manager"], permissions: ["manage_quotes"], archived: false },
      { id: "mod-equipment", name: "Gestion du Parc Matériel", description: "Suivi en temps réel des stocks de dalles LED, son et énergie", icon: "Truck", category: "logistics", active: true, allowedRoles: ["admin", "super_admin", "manager", "staff"], permissions: ["manage_equipment"], archived: false },
      { id: "mod-live", name: "Hub Live & Q&A Interactive", description: "Animation de sessions en direct, questions modérées et sondages", icon: "Radio", category: "digital", active: true, allowedRoles: ["admin", "super_admin", "manager", "visitor"], permissions: ["interact_live"], archived: false },
      { id: "mod-security", name: "Sûreté & Contrôle d'Accès RLS", description: "Sécurité des données et journalisation des accès sensibles", icon: "Shield", category: "security", active: true, allowedRoles: ["super_admin"], permissions: ["god_mode"], archived: false }
    ],
    cmsSections: [
      {
        id: "cms-1",
        page: "accueil",
        section: "Bannière Principale",
        component: "HeroSection",
        contentKey: "heroTitle",
        title: "Titre Principal de la Bannière",
        content: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale",
        type: "text",
        status: "published",
        language: "fr",
        lastModified: new Date().toISOString(),
        author: "Super Administrateur",
        versions: [
          { versionId: "v-1", timestamp: new Date().toISOString(), author: "Super Administrateur", title: "Titre Principal", content: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale" }
        ]
      },
      {
        id: "cms-2",
        page: "accueil",
        section: "Texte de Bienvenue",
        component: "WelcomeAboutSection",
        contentKey: "welcomeMessage",
        title: "Message Officiel de Bienvenue",
        content: "Madame, Monsieur,\n\nNous vous souhaitons chaleureusement la bienvenue sur le portail officiel de VIVA EVENT SOLUTIONS.\n\nNous vous remercions de l'intérêt que vous portiez à notre société et sommes heureux de vous ouvrir les portes de notre univers, de notre savoir-faire et de nos différentes solutions.\n\nVIVA EVENT SOLUTIONS accompagne les institutions, entreprises, organisations, acteurs culturels, producteurs, artistes et particuliers dans la conception et la réalisation de projets événementiels et de projets associés.",
        type: "html",
        status: "published",
        language: "fr",
        lastModified: new Date().toISOString(),
        author: "Super Administrateur",
        versions: [
          { versionId: "v-2", timestamp: new Date().toISOString(), author: "Super Administrateur", title: "Message Officiel", content: "Madame, Monsieur,\n\nNous vous souhaitons chaleureusement la bienvenue sur le portail officiel de VIVA EVENT SOLUTIONS..." }
        ]
      },
      {
        id: "cms-3",
        page: "presentation",
        section: "Qui Nous Sommes",
        component: "WhoWeAreSection",
        contentKey: "whoWeAreText",
        title: "Présentation de la Société",
        content: "Une Architecture Unique & Intégrée, au service de projets complexes.\n\nVIVA EVENT SOLUTIONS est une société basée à Kinshasa-RDC, qui se positionne à l'intersection de plusieurs domaines : Événementiel, communication, numérique, production audiovisuelle, logistique, technologie, services aux entreprises et services aux institutions.",
        type: "text",
        status: "published",
        language: "fr",
        lastModified: new Date().toISOString(),
        author: "Super Administrateur",
        versions: [
          { versionId: "v-3", timestamp: new Date().toISOString(), author: "Super Administrateur", title: "Qui Nous Sommes", content: "Une Architecture Unique & Intégrée..." }
        ]
      }
    ],
    projects: [],
    quotes: [],
    equipment: [],
    partners: [],
    tickets: [],
    erp: {
      employees: [],
      crmClients: [],
      crmInteractions: [],
      transactions: [],
      cashClosures: [],
      tasks: [],
      fieldReports: [],
      loanRecords: [],
      maintenanceLogs: [],
      notices: []
    },
    auditLogs: [
      {
        id: "log-init-001",
        userEmail: "system@viva-eventsolutions.cd",
        action: "DATABASE_INITIALIZED",
        resource: "system",
        result: "success",
        timestamp: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: "Backend Core Service",
        details: "Base de données centrale persistante initialisée avec intégrité RLS."
      }
    ],
    featureFlags: {
      quotesEnabled: true,
      liveHubEnabled: true,
      ticketingEnabled: true,
      votingEnabled: true,
      clientPortalEnabled: true,
      visitorRadarEnabled: true,
      maintenanceMode: false
    },
    financialSettings: {
      exchangeRateCDF: 2850,
      vatRatePercent: 16,
      doubleSignatureThresholdUSD: 100
    }
  };
}

// Load database from disk or initialize
export function getDb(): DbSchema {
  if (dbState) return dbState;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbState = JSON.parse(data);
      return dbState!;
    } catch (err) {
      console.error("[Database] Error reading DB file, attempting backup:", err);
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const backupData = fs.readFileSync(BACKUP_FILE, 'utf-8');
          dbState = JSON.parse(backupData);
          return dbState!;
        } catch (backupErr) {
          console.error("[Database] Backup recovery failed:", backupErr);
        }
      }
    }
  }

  // Create new state
  dbState = getInitialDbState();
  saveDb(dbState);
  return dbState;
}

// Save database to disk atomically with backup
export function saveDb(newState: DbSchema): void {
  dbState = {
    ...newState,
    lastUpdated: new Date().toISOString()
  };

  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    const json = JSON.stringify(dbState, null, 2);
    fs.writeFileSync(tempFile, json, 'utf-8');
    
    // Backup existing if exists
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, BACKUP_FILE);
      } catch (e) {}
    }

    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("[Database] Atomic save failed:", err);
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
    }
    throw err;
  }
}

// Helper to log audit event persistently
export function appendAuditLog(event: {
  userId?: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'success' | 'failure' | 'denied';
  ipAddress: string;
  userAgent: string;
  details?: string;
}): void {
  const db = getDb();
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event
  };
  db.auditLogs.unshift(newLog);
  // Keep max 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs = db.auditLogs.slice(0, 1000);
  }
  saveDb(db);
}
