import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from '../types';
import { ApiClient } from '../services/apiClient';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import {
  auth as firebaseAuth,
} from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db as firebaseDb } from '../services/firebase';

/* =====================================================================
   AUTHENTIFICATION VIVA — PHASE 2
   Autorité : Supabase Auth + profiles/roles (RULE-001/003).
   Firebase/Express = LEGACY (repli non privilégié tant que le schéma
   distant 001→007 n'est pas déployé — cf. REMOTE SCHEMA NOT DEPLOYED).
   AUCUN bypass : pas de loginAsClient, pas de setUserRole, pas d'auto-admin
   par email. Le rôle vient de PostgreSQL, jamais du navigateur.
   ===================================================================== */

export type CanonicalRoleCode =
  | 'SUPER_ADMIN' | 'ADMIN_GENERAL' | 'DG_GERANT' | 'ADMIN_RH'
  | 'DAF_COMPTABLE' | 'CHEF_EQUIPE' | 'COMMERCIAL_SECRETAIRE'
  | 'CLIENT' | 'VISITOR';

export type AuthMode = 'supabase' | 'legacy' | 'anonymous';

/** Mapping canonique (DB) → rôle legacy d'affichage (compat UI existante). */
const CANONICAL_TO_LEGACY: Record<CanonicalRoleCode, UserRole> = {
  SUPER_ADMIN: 'admin',
  ADMIN_GENERAL: 'admin_general',
  DG_GERANT: 'dg_gerant',
  ADMIN_RH: 'admin_rh',
  DAF_COMPTABLE: 'daf_comptable',
  CHEF_EQUIPE: 'chef_equipe',
  COMMERCIAL_SECRETAIRE: 'commercial_secretaire',
  CLIENT: 'client',
  VISITOR: 'visitor',
};

export interface VIVAWorker {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  directionName: string;
  phone: string;
  avatarColor: string;
  description: string;
}

/* LEGACY : simple aide d'affichage de l'écran de login (ne confère aucun droit). */
export const OFFICIAL_VIVA_WORKERS: VIVAWorker[] = [
  {
    id: 'usr-admin-gen-001',
    name: 'Direction Générale (Super Administrateur)',
    email: 'direction.generale@viva-eventsolutions.cd',
    role: 'admin_general',
    jobTitle: 'Super Administrateur Institutionnel',
    directionName: '01. Direction Générale & Stratégie',
    phone: '+243 00 000 0000',
    avatarColor: '#D97706',
    description: "Contrôle global infalsifiable, gestion des comptes, habilitations RBAC et sécurité serveur",
  },
  {
    id: 'usr-dg-002',
    name: 'MALTHUS KILUMBA WA BANZA',
    email: 'malthus.kilumba@viva-eventsolutions.cd',
    role: 'dg_gerant',
    jobTitle: 'DG / Gérance (Directeur Général & Gérant Statutaire)',
    directionName: '01. Direction Générale & Stratégie',
    phone: '+243 81 500 0001',
    avatarColor: '#F59E0B',
    description: 'Vision stratégique, budgets annuels, validation investissements majeurs, accès exécutif étendu',
  },
  {
    id: 'usr-adm-003',
    name: 'MALTHUS KILUMBA WA BANZA (Admin RH)',
    email: 'admin.malthus@viva-eventsolutions.cd',
    role: 'admin_rh',
    jobTitle: 'Directeur Général & Administrateur',
    directionName: '02. Administration & Ressources Humaines',
    phone: '+243 81 500 0002',
    avatarColor: '#3B82F6',
    description: 'Gestion opérationnelle, ressources humaines, fiches de poste, conformité administrative et arbitrage',
  },
  {
    id: 'usr-daf-004',
    name: 'COMPTABLE AGRÉÉ SYSCOHADA',
    email: 'comptable@viva-eventsolutions.cd',
    role: 'daf_comptable',
    jobTitle: 'Comptable Agréé / DAF (Direction Financière)',
    directionName: '03. Direction Financière & Comptabilité SYSCOHADA',
    phone: '+243 81 500 0003',
    avatarColor: '#10B981',
    description: 'Journaux SYSCOHADA, facturation, rapprochements bancaires, M-Pesa/Banques/Caisses, validation double signature',
  },
  {
    id: 'usr-ops-005',
    name: 'Ing. Serge ILUNGA',
    email: 'chef.operations@viva-eventsolutions.cd',
    role: 'chef_equipe',
    jobTitle: "Chef d'Équipe Opérationnel & Régisseur",
    directionName: '06. Direction Technique & Scénographie',
    phone: '+243 81 500 0004',
    avatarColor: '#EC4899',
    description: 'Projets terrain, tâches prioritaires, rapports journaliers de chantier, traçabilité des prêts de matériel',
  },
  {
    id: 'usr-com-006',
    name: 'Mme Sarah KALONJI',
    email: 'commercial@viva-eventsolutions.cd',
    role: 'commercial_secretaire',
    jobTitle: 'Commercial / Secrétaire de Direction',
    directionName: '08. Direction Commerciale & Relations Clients',
    phone: '+243 81 500 0005',
    avatarColor: '#8B5CF6',
    description: 'CRM, qualification prospects, devis chiffrés, factures d’acompte, historique client, communication multicanal',
  },
];

export const DEFAULT_VISITOR_USER: User = {
  id: 'usr-vis-002',
  name: 'Visiteur / Client Public',
  email: 'client@viva-eventsolutions.cd',
  role: 'visitor',
  organization: 'Grand Public / Partenaire',
  permissions: [],
};

interface AuthContextType {
  currentUser: User;
  activeRole: UserRole;
  roleCode: CanonicalRoleCode | null;
  authMode: AuthMode;
  loading: boolean;
  authError: string | null;
  isSimulatingVisitor: boolean;
  isAdmin: boolean;
  isAdminGeneral: boolean;
  isSuperAdmin: boolean;
  isDg: boolean;
  isAdminRh: boolean;
  isDaf: boolean;
  isChefEquipe: boolean;
  isCommercial: boolean;
  isStaffWorker: boolean;
  isAuthenticated: boolean;
  userPermissions: string[];
  hasPermission: (permission: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: { email: string; password: string; name: string; phone?: string; organization?: string }) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  loginWithServer: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  logoutToVisitor: () => void;
  quickLoginAsVisitor: () => void;
  toggleVisitorMode: () => void;
  toastMessage: string | null;
  dismissToast: () => void;
  showToast: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isSchemaMissingError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('PGRST205') || msg.includes('schema cache') || msg.includes('Could not find the table');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_VISITOR_USER);
  const [roleCode, setRoleCode] = useState<CanonicalRoleCode | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('anonymous');
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSimulatingVisitor, setIsSimulatingVisitor] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const schemaMissingRef = useRef(false);
  const authModeRef = useRef<AuthMode>('anonymous');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const dismissToast = () => setToastMessage(null);

  const toAppUser = useCallback(
    (supabaseUserId: string, email: string, profile: { full_name: string; roleCode: CanonicalRoleCode; permissions: string[]; phone?: string }) => {
      const appUser: User = {
        id: supabaseUserId,
        name: profile.full_name || email.split('@')[0],
        email,
        role: CANONICAL_TO_LEGACY[profile.roleCode],
        phone: profile.phone,
        organization: 'VIVA EVENT SOLUTIONS SARLU',
        permissions: profile.permissions,
      };
      return appUser;
    },
    [],
  );

  /** Profil + rôle + permissions depuis PostgreSQL (autorité). */
  const fetchSupabaseProfile = useCallback(async (userId: string, email: string) => {
    if (!supabase) throw new Error('Supabase non configuré.');
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, status, role_id, roles!inner(code)')
      .eq('id', userId)
      .single();
    if (pErr) throw pErr;
    if (!profile || (profile as { status: string }).status !== 'active') {
      throw new Error('Compte introuvable ou suspendu.');
    }
    const role = (profile as unknown as { roles: { code: CanonicalRoleCode } }).roles;
    const { data: perms, error: permErr } = await supabase
      .from('role_permissions')
      .select('permissions!inner(code)')
      .eq('role_id', (profile as unknown as { role_id: string }).role_id);
    if (permErr) throw permErr;
    const codes = ((perms ?? []) as unknown as { permissions: { code: string } }[]).map((r) => r.permissions.code);
    return {
      full_name: (profile as unknown as { full_name: string }).full_name,
      roleCode: role.code,
      permissions: codes,
    };
  }, []);

  const applySupabaseSession = useCallback(
    async (userId: string, email: string) => {
      const profile = await fetchSupabaseProfile(userId, email);
      setRoleCode(profile.roleCode);
      setCurrentUser(toAppUser(userId, email, profile));
      setIsSimulatingVisitor(false);
      setAuthMode('supabase');
      setAuthError(null);
    },
    [fetchSupabaseProfile, toAppUser],
  );

  /* ---------------- LEGACY (repli non privilégié, distant non déployé) ---------------- */
  const applyLegacyFirebaseUser = useCallback(async (fbUser: FirebaseUser) => {
    // LEGACY : lecture du profil Firestore existant, SANS auto-promotion.
    // Tout nouveau profil = rôle minimal 'client'. Aucun SUPER_ADMIN attribué ici.
    let firestoreData: { name?: string; email?: string; role?: UserRole; phone?: string; permissions?: string[] } | null = null;
    try {
      const snap = await getDoc(doc(firebaseDb, 'users', fbUser.uid));
      if (snap.exists()) firestoreData = snap.data() as typeof firestoreData;
    } catch (e) {
      console.warn('[LEGACY Auth] Firestore profile fetch notice:', e);
    }
    const mapped: User = {
      id: fbUser.uid,
      name: firestoreData?.name || fbUser.displayName || 'Utilisateur VIVA',
      email: firestoreData?.email || fbUser.email || '',
      role: (firestoreData?.role as UserRole) || 'client',
      phone: firestoreData?.phone,
      organization: 'VIVA EVENT SOLUTIONS SARLU',
      permissions: firestoreData?.permissions || [],
    };
    // Garde anti-escalade legacy : jamais de rôle staff sans profil Firestore existant.
    if (!firestoreData && (mapped.role === 'admin' || mapped.role === 'admin_general')) {
      mapped.role = 'client';
    }
    setRoleCode(null);
    setCurrentUser(mapped);
    setIsSimulatingVisitor(false);
    setAuthMode('legacy');
  }, []);

  /* ---------------- Init session ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured() && supabase) {
          const { data } = await supabase.auth.getSession();
          const sessionUser = data.session?.user;
          if (sessionUser?.email) {
            try {
              await applySupabaseSession(sessionUser.id, sessionUser.email);
              return;
            } catch (e) {
              if (!isSchemaMissingError(e)) throw e;
              schemaMissingRef.current = true; // REMOTE SCHEMA NOT DEPLOYED → repli legacy
            }
          }
        }
      } catch (e) {
        console.warn('[Auth] Supabase session init notice:', e);
      }
      // Repli LEGACY : état Firebase existant (prototype conservé, non privilégié)
      try {
        const fbUser = firebaseAuth.currentUser;
        if (fbUser && !cancelled) {
          await applyLegacyFirebaseUser(fbUser);
        } else if (!cancelled) {
          const legacyToken = ApiClient.getToken();
          if (legacyToken) {
            try {
              const res = await ApiClient.getMe();
              if (res?.user && !cancelled) {
                setCurrentUser({
                  id: res.user.id,
                  name: res.user.name,
                  email: res.user.email,
                  role: (res.user.role as UserRole) || 'client',
                  phone: res.user.phone,
                  organization: 'VIVA EVENT SOLUTIONS SARLU',
                  permissions: res.user.permissions || [],
                });
                setRoleCode(null);
                setAuthMode('legacy');
                return;
              }
            } catch {
              ApiClient.setToken(null);
            }
          }
          if (!cancelled) {
            setCurrentUser(DEFAULT_VISITOR_USER);
            setRoleCode(null);
            setAuthMode('anonymous');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    let supaUnsub: (() => void) | undefined;
    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return;
        if (event === 'SIGNED_OUT' || !session?.user?.email) return;
        try {
          await applySupabaseSession(session.user.id, session.user.email);
        } catch (e) {
          if (isSchemaMissingError(e)) {
            schemaMissingRef.current = true;
            return; // reste sur l'état legacy existant
          }
          setAuthError(e instanceof Error ? e.message : String(e));
        }
      });
      supaUnsub = () => listener.subscription.unsubscribe();
    }
    const unsubLegacy = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (cancelled || authModeRef.current === 'supabase') return;
      if (fbUser) {
        await applyLegacyFirebaseUser(fbUser);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
      supaUnsub?.();
      unsubLegacy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    authModeRef.current = authMode;
  }, [authMode]);

  /* ---------------- Inactivité (30 min, staff uniquement) ---------------- */
  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (!isSimulatingVisitor && currentUser.role !== 'visitor') {
        inactivityTimer = setTimeout(() => {
          logout().catch(() => {});
          setIsSimulatingVisitor(true);
          showToast("⏱️ Session expirée après 30 minutes d'inactivité. Déconnexion automatique de sécurité.");
        }, 30 * 60 * 1000);
      }
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isSimulatingVisitor, showToast]);

  /* ---------------- Actions ---------------- */

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    setAuthError(null);
    // 1) Supabase Auth (autorité)
    if (isSupabaseConfigured() && supabase && !schemaMissingRef.current) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        const u = data.user;
        if (!u?.email) throw new Error('Session invalide.');
        await applySupabaseSession(u.id, u.email);
        showToast(`🛡️ Bienvenue ${currentUser.name === DEFAULT_VISITOR_USER.name ? u.email : currentUser.name}`);
        return { success: true };
      } catch (e) {
        if (isSchemaMissingError(e)) {
          schemaMissingRef.current = true; // bascule legacy ci-dessous
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          setAuthError(msg);
          return { success: false, error: 'Identifiants incorrects ou compte inactif.' };
        }
      }
    }
    // 2) LEGACY : Firebase puis Express (prototype, non privilégié, sans auto-admin)
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      await applyLegacyFirebaseUser(userCredential.user);
      showToast('🛡️ Authentifié (LEGACY Firebase — migrer vers Supabase).');
      return { success: true };
    } catch {
      try {
        const res = await ApiClient.login(cleanEmail, password);
        if (res?.success && res.user) {
          setCurrentUser({
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: (res.user.role as UserRole) || 'client',
            phone: res.user.phone,
            organization: 'VIVA EVENT SOLUTIONS SARLU',
            permissions: res.user.permissions || [],
          });
          setRoleCode(null);
          setAuthMode('legacy');
          setIsSimulatingVisitor(false);
          showToast('🛡️ Session vérifiée (LEGACY Express — migrer vers Supabase).');
          return { success: true };
        }
      } catch {
        /* noop */
      }
      return { success: false, error: 'Identifiants incorrects. Veuillez vérifier votre adresse e-mail et mot de passe.' };
    }
  };

  const loginWithServer = signIn;

  const signUp: AuthContextType['signUp'] = async (params) => {
    // Inscription publique : rôle imposé par le trigger DB (CLIENT), jamais choisi.
    if (isSupabaseConfigured() && supabase && !schemaMissingRef.current) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: params.email.trim(),
          password: params.password,
          options: { data: { full_name: params.name, phone: params.phone ?? '', organization: params.organization ?? '' } },
        });
        if (error) throw error;
        if (!data.session) {
          return { success: true, needsConfirmation: true };
        }
        const u = data.user;
        if (u?.email) await applySupabaseSession(u.id, u.email);
        return { success: true };
      } catch (e) {
        if (isSchemaMissingError(e)) {
          schemaMissingRef.current = true;
        } else {
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      }
    }
    return { success: false, error: 'Inscription indisponible : schéma Supabase non déployé (REMOTE SCHEMA NOT DEPLOYED).' };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // Cible : OAuth Supabase (à configurer côté dashboard) ; repli LEGACY Firebase.
    if (isSupabaseConfigured() && supabase && !schemaMissingRef.current) {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (!error) return { success: true };
      console.warn('[Auth] Supabase OAuth notice:', error.message);
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      await applyLegacyFirebaseUser(result.user);
      showToast('🎉 Connexion Google réussie (LEGACY — migrer vers Supabase).');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Échec de connexion avec Google.' };
    }
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
      await firebaseSignOut(firebaseAuth).catch(() => {});
      await ApiClient.logout().catch(() => {});
    } catch (err) {
      console.warn('[Auth] Logout warning:', err);
    } finally {
      ApiClient.setToken(null);
      setCurrentUser(DEFAULT_VISITOR_USER);
      setRoleCode(null);
      setAuthMode('anonymous');
      setIsSimulatingVisitor(false);
      showToast('👤 Session terminée - Retour au mode public');
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase && !schemaMissingRef.current) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (!error) {
        showToast('📧 Un lien de réinitialisation vous a été envoyé par e-mail.');
        return { success: true };
      }
      return { success: false, error: error.message };
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      showToast('📧 Un lien de réinitialisation vous a été envoyé par e-mail. (LEGACY)');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Impossible d'envoyer l'email de réinitialisation." };
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (authMode === 'supabase' && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) {
        showToast('🔒 Mot de passe mis à jour avec succès.');
        return { success: true };
      }
      return { success: false, error: error.message };
    }
    if (!firebaseAuth.currentUser) {
      return { success: false, error: 'Aucun utilisateur connecté.' };
    }
    try {
      await updatePassword(firebaseAuth.currentUser, newPassword);
      showToast('🔒 Mot de passe mis à jour avec succès. (LEGACY)');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du mot de passe.' };
    }
  };

  const refreshProfile = async () => {
    if (authMode !== 'supabase' || !supabase) return;
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (u?.email) {
      const profile = await fetchSupabaseProfile(u.id, u.email);
      setRoleCode(profile.roleCode);
      setCurrentUser(toAppUser(u.id, u.email, profile));
    }
  };

  const logoutToVisitor = () => {
    logout();
  };

  const quickLoginAsVisitor = () => {
    logout();
  };

  // Aperçu visiteur = RÉTROGRADATION d'affichage uniquement, jamais une élévation.
  const toggleVisitorMode = () => {
    if (!isSimulatingVisitor && currentUser.role !== 'visitor') {
      setIsSimulatingVisitor(true);
      showToast('🔍 Basculement en aperçu Visiteur Public (Vitrine)');
    } else {
      setIsSimulatingVisitor(false);
      showToast(`🛡️ Retour à votre espace authentifié : ${currentUser.name}`);
    }
  };

  const activeRole: UserRole = isSimulatingVisitor ? 'visitor' : currentUser.role;
  const isAuthenticated = currentUser.role !== 'visitor';

  const userPermissions = currentUser.permissions || [];
  const hasPermission = (perm: string): boolean => {
    // UX uniquement — la sécurité réelle est RLS/serveur (RULE-006/007).
    if (isSimulatingVisitor || currentUser.role === 'visitor') return false;
    if (roleCode === 'SUPER_ADMIN') return true;
    if (authMode === 'supabase') return userPermissions.includes(perm);
    if (currentUser.role === 'admin_general' || currentUser.role === 'dg_gerant') return true;
    return userPermissions.includes(perm) || userPermissions.includes('all_access') || userPermissions.includes('god_mode');
  };

  const isDg = (currentUser.role === 'dg_gerant' || currentUser.role === 'admin_general' || currentUser.role === 'admin') && !isSimulatingVisitor;
  const isAdminRh = (currentUser.role === 'admin_rh' || currentUser.role === 'admin_general' || currentUser.role === 'admin') && !isSimulatingVisitor;
  const isDaf = (currentUser.role === 'daf_comptable' || currentUser.role === 'admin_general' || currentUser.role === 'admin') && !isSimulatingVisitor;
  const isChefEquipe = (currentUser.role === 'chef_equipe' || currentUser.role === 'admin_general' || currentUser.role === 'admin') && !isSimulatingVisitor;
  const isCommercial =
    (currentUser.role === 'commercial_secretaire' || currentUser.role === 'admin_general' || currentUser.role === 'admin') && !isSimulatingVisitor;

  const isStaffWorker =
    !isSimulatingVisitor &&
    ['dg_gerant', 'admin_rh', 'daf_comptable', 'chef_equipe', 'commercial_secretaire', 'admin', 'admin_general'].includes(currentUser.role);

  const isAdmin = isStaffWorker;
  const isAdminGeneral = (currentUser.role === 'admin_general' || currentUser.role === 'admin') && !isSimulatingVisitor;
  // SUPER_ADMIN = rôle DB uniquement (jamais email hardcodé, jamais localStorage).
  const isSuperAdmin = roleCode === 'SUPER_ADMIN' && !isSimulatingVisitor;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        roleCode,
        authMode,
        loading,
        authError,
        isSimulatingVisitor,
        isAdmin,
        isAdminGeneral,
        isSuperAdmin,
        isDg,
        isAdminRh,
        isDaf,
        isChefEquipe,
        isCommercial,
        isStaffWorker,
        isAuthenticated,
        userPermissions,
        hasPermission,
        signIn,
        signUp,
        loginWithServer,
        loginWithGoogle,
        logout,
        resetPassword,
        changePassword,
        refreshProfile,
        logoutToVisitor,
        quickLoginAsVisitor,
        toggleVisitorMode,
        toastMessage,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
