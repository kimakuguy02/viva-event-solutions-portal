import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logAudit as writeAuditLog } from '../../services/supabase/auditService';
import { isPgId } from '../../services/supabase/erpService';
import { useAuditEvents } from '../../hooks/useAuditEvents';
import { UserRole } from '../../types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  UserPlus,
  Trash2,
  KeyRound,
  Edit,
  Check,
  X,
  AlertTriangle,
  Building2,
  Lock,
  Layers,
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Fingerprint
} from 'lucide-react';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  directionName: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
}

export const OFFICIAL_DIRECTIONS_9 = [
  "01. DIRECTION GÉNÉRALE (Secrétariat de Direction, Stratégie, Contrôle interne, Partenariats)",
  "02. DIRECTION DES RESSOURCES HUMAINES (Recrutement, Paie, Formation, Relations sociales)",
  "03. DIRECTION ADMINISTRATIVE & FINANCIÈRE (Administration, Comptabilité, Trésorerie, Achats)",
  "04. DIRECTION DES AFFAIRES JURIDIQUES (Conseil juridique, Contrats, Contentieux, Propriété OAPI)",
  "05. DIRECTION INGÉNIERIE & PRODUCTION ÉVÉNEMENTIELLE (Conseil, Production, Audiovisuel, Diffusion)",
  "06. DIRECTION TECHNIQUE, SCÉNOGRAPHIE & INFRASTRUCTURES (Son/Lumière, Écrans LED, Décoration, Location)",
  "07. DIRECTION LOGISTIQUE, HOSPITALITÉ & EXPÉRIENCE PARTICIPANT (Transport, Protocole, Billetterie, Traiteur/Hôtel)",
  "08. DIRECTION COMMUNICATION, MARKETING & DÉVELOPPEMENT DIGITAL (Marketing, Relations publiques, Branding, Digital)",
  "09. DIRECTION SÉCURITÉ, SÛRETÉ & GESTION DES RISQUES (Sécurité, Sûreté VIP, Prévention des risques, Conformités)"
];

export const SYSTEM_PERMISSIONS = [
  { id: 'users.view', label: 'Consulter les utilisateurs', category: 'Utilisateurs' },
  { id: 'users.create', label: 'Créer de nouveaux utilisateurs', category: 'Utilisateurs' },
  { id: 'users.update', label: 'Modifier les profils et statuts', category: 'Utilisateurs' },
  { id: 'users.delete', label: 'Supprimer des utilisateurs', category: 'Utilisateurs' },
  { id: 'roles.manage', label: 'Gérer la matrice RBAC', category: 'Rôles & Sécurité' },
  { id: 'organization.view', label: 'Voir l\'organigramme officiel', category: 'Organisation' },
  { id: 'organization.update', label: 'Modifier les 9 directions & pôles', category: 'Organisation' },
  { id: 'content.view', label: 'Consulter le catalogue CMS', category: 'Contenus' },
  { id: 'content.update', label: 'Éditer les textes du portail', category: 'Contenus' },
  { id: 'content.publish', label: 'Publier et archiver les contenus', category: 'Contenus' },
  { id: 'modules.view', label: 'Accéder aux modules ERP', category: 'Modules' },
  { id: 'modules.update', label: 'Activer / Désactiver les modules', category: 'Modules' },
  { id: 'quotes.manage', label: 'Émettre et valider les devis', category: 'Opérations' },
  { id: 'equipment.manage', label: 'Gérer le parc matériel lourd', category: 'Opérations' },
  { id: 'finance.approve', label: 'Double signature financière DAF', category: 'Finances' },
  { id: 'audit.view', label: 'Accès aux journaux d\'audit légaux', category: 'Sécurité' },
  { id: 'settings.update', label: 'Configurer la plateforme & devises', category: 'Plateforme' }
];

/* Annuaire : aucune ligne inventée. Un profil n'existe que s'il vient de
   Supabase (`profiles` + rôles) ou de la session. Les anciens seeds présentaient
   des noms de collaborateurs avec des téléphone/privilèges fabriqués. */
function toManagedUser(pg: { id: string; email: string; full_name: string; status: string; roles?: { code: string }[] }): ManagedUser {
  const code = pg.roles?.[0]?.code ?? '';
  return {
    id: pg.id,
    name: pg.full_name || pg.email,
    email: pg.email,
    phone: '',
    role: (code.toLowerCase() === 'super_admin' ? 'admin_general' : code.toLowerCase()) as UserRole,
    directionName: '',
    status: pg.status === 'active' ? 'active' : 'suspended',
    createdAt: '',
    permissions: [],
  };
}

export const RolesAndUsersManager: React.FC = () => {
  const { currentUser, isAdminGeneral } = useAuth();
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';
  const { events: auditEvents, source: auditSource } = useAuditEvents(15);

  const [users, setUsers] = useState<ManagedUser[]>(() => {
    const saved = localStorage.getItem('viva_managed_users');
    return saved ? JSON.parse(saved) : [];
  });
  // Source serveur (lecture seule) : profils/roles DB fusionnés par e-mail
  // (DB gagne sur rôle/statut). Échec = annuaire local conservé + mention.
  const [directorySource, setDirectorySource] = useState<'local' | 'supabase'>('local');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('../../services/supabase');
        if (!isSupabaseConfigured() || !supabase) return;
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id,email,full_name,status,roles!inner(code)');
        if (error || !profiles) return;
        if (cancelled) return;
        const byEmail = new Map(profiles.map(p => [p.email.toLowerCase(), p]));
        setUsers(prev => {
          const enriched = prev.map(u => {
            const pg = byEmail.get(u.email.toLowerCase());
            const code = pg?.roles?.[0]?.code;
            if (!pg || !code) return u;
            return {
              ...u,
              role: (code.toLowerCase() === 'super_admin' ? 'admin_general' : code.toLowerCase()) as UserRole,
              status: (pg.status === 'active' ? 'active' : 'suspended') as ManagedUser['status'],
            };
          });
          const known = new Set(enriched.map(u => u.email.toLowerCase()));
          for (const pg of profiles) {
            if (known.has(pg.email.toLowerCase())) continue;
            known.add(pg.email.toLowerCase());
            enriched.push(toManagedUser(pg));
          }
          return enriched;
        });
        if (profiles.length > 0) setDirectorySource('supabase');
      } catch {
        /* repli local explicite */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'users' | 'create' | 'rbac' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User form state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    directionName: string;
    permissions: string[];
  }>({
    name: '',
    email: '',
    phone: '+243 ',
    role: 'department_head',
    directionName: OFFICIAL_DIRECTIONS_9[0],
    permissions: ['users.view', 'organization.view', 'content.view']
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveUsers = (updated: ManagedUser[]) => {
    setUsers(updated);
    localStorage.setItem('viva_managed_users', JSON.stringify(updated));
  };

  const logAudit = (action: string, details: string) => {
    void writeAuditLog(action, 'users', undefined, { details });
  };

  const isServerProfile = (u: ManagedUser) => isPgId(u.id);

  // Un profil chargé depuis `profiles` est autorité serveur : le suspendre, le
  // rétrograder ou le supprimer ici ne modifierait que la copie locale, qui
  // serait écrasée au prochain chargement — donc un faux succès affiché.
  const refuseServerProfile = (u: ManagedUser | undefined): boolean => {
    if (!u || !isServerProfile(u)) return false;
    showToast('Compte servi par Supabase : rôle et statut se changent dans la base (profiles / roles), pas dans cet écran.');
    return true;
  };

  const handleCreateOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingUserId) {
      const updated = users.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            directionName: formData.directionName,
            permissions: formData.permissions
          };
        }
        return u;
      });
      handleSaveUsers(updated);
      logAudit('USER_DIRECTORY_LOCAL_UPDATED', `${formData.name} (${formData.role})`);
      showToast(`Fiche locale « ${formData.name} » mise à jour — le compte de connexion n'est pas modifié.`);
      setEditingUserId(null);
    } else {
      const newUser: ManagedUser = {
        id: `usr-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        directionName: formData.directionName,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: formData.permissions
      };
      const updated = [...users, newUser];
      handleSaveUsers(updated);
      // Aucun compte de connexion n'est créé ici : le provisioning Supabase
      // (auth.users + profiles + roles) exige une voie admin — lot 2, Edge Function.
      logAudit('USER_DIRECTORY_LOCAL_ADDED', `${newUser.name} (${newUser.role})`);
      showToast(`Fiche locale ajoutée pour « ${newUser.name} » — aucun compte de connexion créé.`);
    }

    setFormData({
      name: '',
      email: '',
      phone: '+243 ',
      role: 'department_head',
      directionName: OFFICIAL_DIRECTIONS_9[0],
      permissions: ['users.view', 'organization.view', 'content.view']
    });
    setActiveTab('users');
  };

  const handleStartEdit = (user: ManagedUser) => {
    if (refuseServerProfile(user)) return;
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      directionName: user.directionName,
      permissions: user.permissions || []
    });
    setActiveTab('create');
  };

  const handleToggleStatus = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (refuseServerProfile(target)) return;
    if (target.id === currentUser.id) {
      showToast("Impossible de suspendre votre propre session d'administrateur actif.");
      return;
    }

    const nextStatus: 'active' | 'suspended' = target.status === 'active' ? 'suspended' : 'active';
    const updated = users.map(u => (u.id === userId ? { ...u, status: nextStatus } : u));
    handleSaveUsers(updated);
    logAudit('USER_DIRECTORY_LOCAL_STATUS', `${target.name} -> ${nextStatus}`);
    showToast(`Fiche locale « ${target.name} » basculée à « ${nextStatus.toUpperCase()} » — statut Supabase inchangé.`);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser.id || userToDelete.role === 'admin_general') {
      showToast("Impossible de supprimer le compte d'Administration Générale.");
      setUserToDelete(null);
      return;
    }
    if (refuseServerProfile(userToDelete)) {
      setUserToDelete(null);
      return;
    }

    const updated = users.filter(u => u.id !== userToDelete.id);
    handleSaveUsers(updated);
    logAudit('USER_DIRECTORY_LOCAL_DELETED', `${userToDelete.name} (${userToDelete.email})`);
    showToast(`Fiche locale de « ${userToDelete.name} » retirée de cet appareil — le compte de connexion existe toujours.`);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesDirection = filterDirection === 'all' || u.directionName.includes(filterDirection);
    return matchesSearch && matchesRole && matchesDirection;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
              🛡️ Contrôle d'Accès Centralisé & RBAC
            </span>
            <span className="text-xs text-slate-400">Attribution des rôles et sécurisation des privilèges</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Utilisateurs, Rôles & Permissions
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Administrez l'ensemble des collaborateurs des 9 directions de VIVA EVENT SOLUTIONS, définissez les profils d'accès et appliquez les politiques de sécurité.
          </p>
          <p className="text-[11px] mt-2 font-mono">
            {directorySource === 'supabase' ? (
              <span className="text-emerald-400">Source : profils/roles Supabase (rôles fusionnés par e-mail).</span>
            ) : (
              <span className="text-amber-300">Source : annuaire local — source serveur : profiles/roles (connexion requise).</span>
            )}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUserId(null);
            setFormData({
              name: '',
              email: '',
              phone: '+243 ',
              role: 'department_head',
              directionName: OFFICIAL_DIRECTIONS_9[0],
              permissions: ['users.view', 'organization.view', 'content.view']
            });
            setActiveTab('create');
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un Collaborateur</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: activePalette.colors.border }}>
        {[
          { id: 'users', label: `Annuaire des Collaborateurs (${users.length})`, icon: Users },
          { id: 'create', label: editingUserId ? 'Modifier l\'Utilisateur' : 'Créer un Compte', icon: UserPlus },
          { id: 'rbac', label: 'Matrice RBAC & Permissions', icon: ShieldCheck },
          { id: 'audit', label: 'Journal des Connexions & Audit', icon: Fingerprint }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border"
              style={{
                backgroundColor: isActive ? activePalette.colors.primary : (isLight ? '#F1F5F9' : activePalette.colors.bgSubtle),
                borderColor: isActive ? activePalette.colors.borderGlow : activePalette.colors.border,
                color: isActive ? '#FFFFFF' : (isLight ? '#475569' : '#CBD5E1')
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
          >
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, email, téléphone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="px-3 py-2 rounded-xl border text-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              >
                <option value="all">Tous les rôles</option>
                <option value="admin_general">Admin Général</option>
                <option value="dg_gerant">DG / Gérance</option>
                <option value="admin_rh">Administration & RH</option>
                <option value="daf_comptable">DAF & Comptabilité</option>
                <option value="chef_equipe">Chef d'Équipe Technique</option>
                <option value="commercial_secretaire">Commercial & Secrétariat</option>
              </select>

              <select
                value={filterDirection}
                onChange={e => setFilterDirection(e.target.value)}
                className="px-3 py-2 rounded-xl border text-xs max-w-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              >
                <option value="all">Toutes les directions</option>
                <option value="01.">01. Direction Générale</option>
                <option value="02.">02. Ressources Humaines</option>
                <option value="03.">03. Admin & Financière</option>
                <option value="04.">04. Affaires Juridiques</option>
                <option value="05.">05. Ingénierie & Production</option>
                <option value="06.">06. Technique & Scéno</option>
                <option value="07.">07. Logistique & Hospitalité</option>
                <option value="08.">08. Com & Digital</option>
                <option value="09.">09. Sécurité & Sûreté</option>
              </select>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="p-5 rounded-2xl border space-y-4 shadow-sm hover:shadow-md transition-shadow relative"
                style={{
                  backgroundColor: activePalette.colors.bgSurface,
                  borderColor: activePalette.colors.border
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 font-black text-sm flex items-center justify-center border border-blue-500/20">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{user.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    user.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 pt-2 border-t" style={{ borderColor: activePalette.colors.border }}>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Rôle Système :</span>
                    <strong className="text-amber-400 font-mono text-[11px]">{user.role}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Téléphone :</span>
                    <span className="text-slate-300 font-mono text-[11px]">{user.phone}</span>
                  </div>
                  <div className="text-slate-400">
                    <span>Direction rattachée :</span>
                    <div className="text-slate-300 font-medium text-[11px] truncate mt-0.5">{user.directionName}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-[11px]" style={{ borderColor: activePalette.colors.border }}>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dernière connexion : {user.lastLogin || 'Jamais'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(user)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Modifier cet utilisateur"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        user.status === 'active'
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                      title={user.status === 'active' ? 'Suspendre' : 'Réactiver'}
                    >
                      {user.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                    {user.role !== 'admin_general' && (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE / EDIT USER */}
      {activeTab === 'create' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl max-w-3xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">
              {editingUserId ? "Modifier le compte collaborateur" : "Créer un nouveau collaborateur VIVA"}
            </h3>
            {editingUserId && (
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setActiveTab('users');
                }}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Annuler la modification
              </button>
            )}
          </div>

          <form onSubmit={handleCreateOrUpdateUser} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom et Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Landry Mwamba"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Professionnel *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: l.mwamba@viva-eventsolutions.cd"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Téléphone Direct</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+243 81 000 0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Rôle Système *</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                >
                  <option value="dg_gerant">DG / Gérance (Statutaire)</option>
                  <option value="admin_rh">Administrateur & RH</option>
                  <option value="daf_comptable">DAF & Comptable SYSCOHADA</option>
                  <option value="chef_equipe">Chef d'Équipe Technique</option>
                  <option value="commercial_secretaire">Commercial & Secrétariat</option>
                  <option value="department_head">Chef de Département</option>
                  <option value="it_technician">Technicien Informatique</option>
                  <option value="permanent_user">Collaborateur Permanent</option>
                  <option value="temporary_user">Opérateur Temporaire</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Direction Institutionnelle *</label>
              <select
                value={formData.directionName}
                onChange={e => setFormData({ ...formData, directionName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              >
                {OFFICIAL_DIRECTIONS_9.map(dir => (
                  <option key={dir} value={dir}>{dir}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Permissions Individuelles Accordées :</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                {SYSTEM_PERMISSIONS.map(p => {
                  const isChecked = formData.permissions.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, permissions: [...formData.permissions, p.id] });
                          } else {
                            setFormData({ ...formData, permissions: formData.permissions.filter(x => x !== p.id) });
                          }
                        }}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                      />
                      <span>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: activePalette.colors.border }}>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: activePalette.colors.border }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                {editingUserId ? "Enregistrer les modifications" : "Créer le compte"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <div>
              <h3 className="text-lg font-bold text-white">Matrice RBAC (Rôles & Permissions)</h3>
              <p className="text-xs text-slate-400">Cartographie des privilèges attribués selon les responsabilités fonctionnelles</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Permission / Ressource</th>
                  <th className="py-3 px-2 text-center text-amber-400">Admin Général</th>
                  <th className="py-3 px-2 text-center text-blue-400">DG Gérance</th>
                  <th className="py-3 px-2 text-center text-emerald-400">Admin RH</th>
                  <th className="py-3 px-2 text-center text-teal-400">DAF / Comptable</th>
                  <th className="py-3 px-2 text-center text-pink-400">Chef d'Équipe</th>
                  <th className="py-3 px-2 text-center text-purple-400">Commercial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {SYSTEM_PERMISSIONS.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-300">
                      <div>{p.label}</div>
                      <span className="text-[10px] text-slate-500">{p.id}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /></td>
                    <td className="py-2.5 px-2 text-center">
                      {['organization.view', 'organization.update', 'content.view', 'modules.view', 'quotes.manage', 'finance.approve', 'audit.view'].includes(p.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {['users.view', 'users.create', 'users.update', 'organization.view', 'content.view', 'modules.view'].includes(p.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {['finance.approve', 'quotes.manage', 'modules.view', 'audit.view'].includes(p.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {['equipment.manage', 'quotes.manage', 'modules.view'].includes(p.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {['content.view', 'content.update', 'quotes.manage', 'modules.view'].includes(p.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : <span className="text-slate-600">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-4"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Journal d'Audit Sécurisé (RLS & Événements)</h3>
            <span className="text-xs text-slate-400">Source : {auditSource === 'none' ? 'aucune' : auditSource}</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
            {auditEvents.length === 0 && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                Aucun événement journalisé côté serveur pour cette session.
              </div>
            )}
            {auditEvents.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-amber-400">{log.action}</div>
                  <div className="text-[11px] text-slate-400">{log.actorEmail} • {log.resource}</div>
                </div>
                <div className="text-right text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete User Modal Confirmation (No window.confirm) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-rose-500/50 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-black text-white">Confirmer la suppression</h3>
            <p className="text-xs text-slate-300">
              Voulez-vous supprimer définitivement le compte de <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email}) ?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
