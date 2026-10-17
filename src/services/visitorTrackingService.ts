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

export class VisitorTrackingService {
  private static getStoredSessions(): VisitorSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to load visitor sessions", e);
    }
    return [];
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
