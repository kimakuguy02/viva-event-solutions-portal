// Client API Centralisé VIVA EVENT SOLUTIONS
// Gère l'authentification Bearer token, la persistance des sessions et les appels réseau sécurisés

const TOKEN_KEY = 'viva_auth_token';

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export class ApiClient {
  private static token: string | null = null;

  public static getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  public static setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // If unauthorized, token expired
        this.setToken(null);
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || `Erreur serveur (${response.status})`);
      }

      return json;
    } catch (err: any) {
      throw err;
    }
  }

  // Auth endpoints
  public static async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  public static async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public static async getMe() {
    return this.request('/api/auth/me', { method: 'GET' });
  }

  // Sync endpoints
  public static async pullSync(since?: string) {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.request(`/api/sync/pull${query}`, { method: 'GET' });
  }

  public static async pushSync(mutations: any[]) {
    return this.request('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({ mutations })
    });
  }

  // CMS
  public static async updateCmsSection(id: string, title: string, content: string) {
    return this.request(`/api/cms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content })
    });
  }

  // Organization
  public static async updateOrganization(directions: any[]) {
    return this.request('/api/organization', {
      method: 'PUT',
      body: JSON.stringify({ directions })
    });
  }

  // Menus & Modules
  public static async updateMenus(menus: any[]) {
    return this.request('/api/menus', {
      method: 'PUT',
      body: JSON.stringify({ menus })
    });
  }

  public static async updateModules(modules: any[]) {
    return this.request('/api/modules', {
      method: 'PUT',
      body: JSON.stringify({ modules })
    });
  }

  // Settings
  public static async updateSettings(settings: any) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Audit logs
  public static async getAuditLogs() {
    return this.request('/api/admin/audit-logs', { method: 'GET' });
  }
}
