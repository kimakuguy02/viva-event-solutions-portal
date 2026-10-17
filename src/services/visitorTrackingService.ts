export interface VisitorAction {
  action: string;
  label: string;
  timestamp: string;
}

export interface VisitorSession {
  id: string;
  firstSeen: string;
  lastActive: string;
  ipLocation: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablette';
  browser: string;
  identified: boolean;
  pageViews: number;
  viewedPoles: string[];
  interestLevel: 'Élevé (Projet chaud)' | 'Moyen (En prospection)' | 'Exploratoire';
  actions: VisitorAction[];
  clientInfo?: {
    name: string;
    organization: string;
    email: string;
    phone: string;
    clientType: string;
    city: string;
  };
}

const STORAGE_KEY_SESSIONS = 'viva_visitor_sessions';
const STORAGE_KEY_CURRENT = 'viva_current_visitor_id';

// Démo anonymisée (Phase 1, Bloc 6) : identités fictives, aucun PII réel.
// Ces exemples illustrent les formats d'affichage ; ils ne représentent
// aucune personne, entreprise ou institution réelle.
const INITIAL_DEMO_VISITORS: VisitorSession[] = [
  {
    id: "vis-demo-01",
    firstSeen: "14/09/2026 09:15",
    lastActive: "14/09/2026 10:42",
    ipLocation: "Exemple — région masquée",
    deviceType: "Desktop",
    browser: "Navigateur / OS de démonstration",
    identified: true,
    pageViews: 14,
    viewedPoles: ["Pôle 07. Location Matériel Lourd", "Pôle 03. Événements Hybrides", "Pôle 11. Traduction Simultanée"],
    interestLevel: "Élevé (Projet chaud)",
    actions: [
      { action: "page_view", label: "Consultation Accueil & 15 Pôles", timestamp: "09:15" },
      { action: "pole_view", label: "Consultation Pôle 07 Sonorisation & Énergie", timestamp: "09:22" },
      { action: "quote_simulated", label: "Simulation Devis Sommet (35 000 USD)", timestamp: "09:38" },
      { action: "account_created", label: "Création Compte Client Entreprise", timestamp: "10:12" },
      { action: "reservation_submitted", label: "Réservation Sommet Économique (exemple)", timestamp: "10:40" }
    ],
    clientInfo: {
      name: "Client Démo A (fictif)",
      organization: "Entreprise fictive de démonstration",
      email: "demo-a@exemple.invalid",
      phone: "+243 00 000 0000",
      clientType: "Grande Entreprise",
      city: "Ville de démonstration"
    }
  },
  {
    id: "vis-demo-02",
    firstSeen: "14/09/2026 11:20",
    lastActive: "14/09/2026 12:05",
    ipLocation: "Exemple — région masquée",
    deviceType: "Mobile",
    browser: "Navigateur mobile de démonstration",
    identified: true,
    pageViews: 9,
    viewedPoles: ["Pôle 08. Protocole & Accueil VIP", "Pôle 12. Sécurité Événementielle"],
    interestLevel: "Élevé (Projet chaud)",
    actions: [
      { action: "page_view", label: "Consultation Vitrine", timestamp: "11:20" },
      { action: "charter_view", label: "Téléchargement Charte & RCCM", timestamp: "11:32" },
      { action: "account_created", label: "Création Compte Protocole (exemple)", timestamp: "11:50" }
    ],
    clientInfo: {
      name: "Cliente Démo B (fictive)",
      organization: "Institution fictive de démonstration",
      email: "demo-b@exemple.invalid",
      phone: "+243 00 000 0001",
      clientType: "Institution publique",
      city: "Ville de démonstration"
    }
  },
  {
    id: "vis-demo-03",
    firstSeen: "14/09/2026 13:45",
    lastActive: "14/09/2026 14:10",
    ipLocation: "Exemple — région masquée",
    deviceType: "Mobile",
    browser: "Navigateur mobile de démonstration",
    identified: false,
    pageViews: 6,
    viewedPoles: ["Pôle 05. Traiteur & Restauration", "Pôle 10. Mobilité & Escorte VIP"],
    interestLevel: "Moyen (En prospection)",
    actions: [
      { action: "page_view", label: "Consultation Parc Matériel", timestamp: "13:45" },
      { action: "pole_view", label: "Consultation Pôle Traiteur & Banquets", timestamp: "13:58" },
      { action: "quote_opened", label: "Ouverture Simulateur Devis", timestamp: "14:05" }
    ]
  },
  {
    id: "vis-demo-04",
    firstSeen: "14/09/2026 15:02",
    lastActive: "14/09/2026 15:30",
    ipLocation: "Exemple — région masquée",
    deviceType: "Desktop",
    browser: "Navigateur de démonstration",
    identified: true,
    pageViews: 12,
    viewedPoles: ["Pôle 11. Traduction Simultanée", "Pôle 03. Événements Hybrides"],
    interestLevel: "Élevé (Projet chaud)",
    actions: [
      { action: "page_view", label: "Consultation Régie & Événements Hybrides", timestamp: "15:02" },
      { action: "account_created", label: "Création Compte Délégation (exemple)", timestamp: "15:18" },
      { action: "reservation_submitted", label: "Réservation Forum (exemple)", timestamp: "15:28" }
    ],
    clientInfo: {
      name: "Client Démo C (fictif)",
      organization: "Organisation fictive de démonstration",
      email: "demo-c@exemple.invalid",
      phone: "+243 00 000 0002",
      clientType: "Organisme international",
      city: "Ville de démonstration"
    }
  }
];

export class VisitorTrackingService {
  private static getStoredSessions(): VisitorSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to load visitor sessions", e);
    }
    // Initialize with demo data
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(INITIAL_DEMO_VISITORS));
    return INITIAL_DEMO_VISITORS;
  }

  private static saveSessions(sessions: VisitorSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save visitor sessions", e);
    }
  }

  public static getCurrentVisitorId(): string {
    let id = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!id) {
      id = `vis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem(STORAGE_KEY_CURRENT, id);
    }
    return id;
  }

  public static trackAction(action: string, label: string): void {
    const currentId = this.getCurrentVisitorId();
    const sessions = this.getStoredSessions();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${now.toLocaleDateString('fr-FR')} ${timeStr}`;

    let session = sessions.find(s => s.id === currentId);

    if (!session) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      session = {
        id: currentId,
        firstSeen: dateStr,
        lastActive: dateStr,
        ipLocation: "Kinshasa / RDC (Session active)",
        deviceType: isMobile ? 'Mobile' : 'Desktop',
        browser: navigator.userAgent.includes('Chrome') ? 'Google Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Navigateur Web',
        identified: false,
        pageViews: 1,
        viewedPoles: [],
        interestLevel: 'Exploratoire',
        actions: []
      };
      sessions.unshift(session);
    } else {
      session.lastActive = dateStr;
      session.pageViews += 1;
    }

    session.actions.unshift({
      action,
      label,
      timestamp: timeStr
    });

    // Update interest level based on actions
    if (session.actions.some(a => a.action === 'reservation_submitted' || a.action === 'account_created')) {
      session.interestLevel = 'Élevé (Projet chaud)';
    } else if (session.actions.some(a => a.action === 'quote_opened' || a.action === 'pole_view')) {
      session.interestLevel = 'Moyen (En prospection)';
    }

    this.saveSessions(sessions);
  }

  public static identifyVisitor(clientInfo: VisitorSession['clientInfo']): void {
    if (!clientInfo) return;
    const currentId = this.getCurrentVisitorId();
    const sessions = this.getStoredSessions();
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('fr-FR')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let session = sessions.find(s => s.id === currentId);

    if (!session) {
      session = {
        id: currentId,
        firstSeen: dateStr,
        lastActive: dateStr,
        ipLocation: `${clientInfo.city} (Client Identifié)`,
        deviceType: 'Desktop',
        browser: 'Navigateur Web',
        identified: true,
        pageViews: 2,
        viewedPoles: [],
        interestLevel: 'Élevé (Projet chaud)',
        actions: [],
        clientInfo
      };
      sessions.unshift(session);
    } else {
      session.identified = true;
      session.clientInfo = clientInfo;
      session.lastActive = dateStr;
      session.interestLevel = 'Élevé (Projet chaud)';
    }

    session.actions.unshift({
      action: 'account_created',
      label: `Identification Client : ${clientInfo.name} (${clientInfo.organization})`,
      timestamp: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    });

    this.saveSessions(sessions);
  }

  public static getAllSessions(): VisitorSession[] {
    return this.getStoredSessions();
  }

  public static clearSessions(): void {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
  }
}
