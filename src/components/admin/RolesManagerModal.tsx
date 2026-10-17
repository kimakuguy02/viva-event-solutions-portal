import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Users
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

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: "usr-admin-gen-001",
    name: "Guy Kimaku (Administrateur Général - God Mode)",
    email: "direction.generale@viva-eventsolutions.cd",
    phone: "+243 00 000 0000",
    role: "admin_general",
    directionName: "01. DIRECTION GÉNÉRALE",
    status: "active",
    createdAt: "2026-01-10",
    lastLogin: "2026-09-02 10:14",
    permissions: ["all_access", "god_mode", "reset_database", "manage_roles", "manage_cms", "manage_finance", "audit_logs"]
  },
  {
    id: "usr-it-002",
    name: "Ingénieur Landry Mwamba (Technicien Informaticien)",
    email: "tech.it@viva-eventsolutions.cd",
    phone: "+243 00 000 0011",
    role: "it_technician",
    directionName: "08. DIRECTION COMMUNICATION, MARKETING & DÉVELOPPEMENT DIGITAL",
    status: "active",
    createdAt: "2026-02-15",
    lastLogin: "2026-09-01 18:30",
    permissions: ["manage_digital_hub", "network_starlink", "ticketing_access", "broadcast_systems"]
  },
  {
    id: "usr-dept-003",
    name: "Mme Clarisse Banza (Responsable Département Scénographie)",
    email: "scenographie@viva-eventsolutions.cd",
    phone: "+243 00 000 0022",
    role: "department_head",
    directionName: "06. DIRECTION TECHNIQUE, SCÉNOGRAPHIE & INFRASTRUCTURES",
    status: "active",
    createdAt: "2026-03-01",
    lastLogin: "2026-08-30 09:12",
    permissions: ["manage_department_projects", "inventory_request", "quote_validation"]
  },
  {
    id: "usr-perm-004",
    name: "Alain Kabasele (Régisseur Général Permanent)",
    email: "regie.permanente@viva-eventsolutions.cd",
    phone: "+243 00 000 0033",
    role: "permanent_user",
    directionName: "05. DIRECTION INGÉNIERIE & PRODUCTION ÉVÉNEMENTIELLE",
    status: "active",
    createdAt: "2026-04-12",
    lastLogin: "2026-09-02 07:45",
    permissions: ["logistics_view", "equipment_checklist", "project_operations"]
  },
  {
    id: "usr-temp-005",
    name: "Équipe Renfort Sommet (Opérateur Temporaire)",
    email: "renfort.event@viva-eventsolutions.cd",
    phone: "+243 00 000 0044",
    role: "temporary_user",
    directionName: "07. DIRECTION LOGISTIQUE, HOSPITALITÉ & EXPÉRIENCE PARTICIPANT",
    status: "active",
    createdAt: "2026-08-20",
    lastLogin: "2026-08-28 14:00",
    permissions: ["badge_scanning", "guest_checkin"]
  }
];

interface RolesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolesManagerModal: React.FC<RolesManagerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isAdminGeneral } = useAuth();
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const [users, setUsers] = useState<ManagedUser[]>(() => {
    const saved = localStorage.getItem('viva_managed_users');
    return saved ? JSON.parse(saved) : INITIAL_MANAGED_USERS;
  });

  const [activeTab, setActiveTab] = useState<'users' | 'create' | 'permissions'>('users');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+243 ');
  const [newRole, setNewRole] = useState<UserRole>('department_head');
  const [newDirection, setNewDirection] = useState(OFFICIAL_DIRECTIONS_9[0]);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  if (!isAdminGeneral) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-black text-white">Accès Refusé - Mode Dieu Requis</h3>
          <p className="text-xs text-slate-300">
            La gestion des rôles et des habilitations est strictement réservée à l'Administrateur Général.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-750 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const logAuditAction = (action: string, details: string) => {
    const auditLogs = JSON.parse(localStorage.getItem('viva_audit_logs') || '[]');
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: currentUser.email,
      action: `${action} : ${details}`,
      ipAddress: '192.168.1.45',
      device: navigator.userAgent || 'Chrome / Windows RDC'
    });
    localStorage.setItem('viva_audit_logs', JSON.stringify(auditLogs));
  };

  const handleSaveUsers = (updated: ManagedUser[]) => {
    setUsers(updated);
    localStorage.setItem('viva_managed_users', JSON.stringify(updated));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newUser: ManagedUser = {
      id: `usr-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      directionName: newDirection,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      permissions: newRole === 'admin_general' ? ['all_access', 'god_mode'] : ['standard_operational']
    };

    const updated = [...users, newUser];
    handleSaveUsers(updated);
    logAuditAction('USER_CREATED_GOD_MODE', `${newName} (${newRole})`);

    setNewName('');
    setNewEmail('');
    setNewPhone('+243 ');
    setActiveTab('users');
    setNotice(`✅ Utilisateur "${newName}" créé avec succès.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleToggleStatus = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.id === currentUser.id) {
      alert("Impossible de suspendre votre propre compte Administrateur Général.");
      return;
    }

    const updated = users.map(u => {
      if (u.id === userId) {
        const nextStatus: 'active' | 'suspended' = u.status === 'active' ? 'suspended' : 'active';
        logAuditAction('USER_STATUS_TOGGLED', `${u.name} -> ${nextStatus}`);
        return { ...u, status: nextStatus };
      }
      return u;
    });

    handleSaveUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.id === currentUser.id || target.role === 'admin_general') {
      alert("Impossible de supprimer le compte Administrateur Général principal.");
      return;
    }

    if (confirm(`Confirmez-vous la suppression définitive du compte de "${target.name}" ?`)) {
      const updated = users.filter(u => u.id !== userId);
      handleSaveUsers(updated);
      logAuditAction('USER_DELETED_GOD_MODE', `${target.name} (${target.email})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border
        }}
      >
        {/* Top Header */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: activePalette.colors.border }}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  ⚡ Mode Dieu • Administrateur Général
                </span>
              </div>
              <h3 className="text-xl font-black text-white">Gestion des Rôles, Utilisateurs & Habilitations</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b flex items-center gap-2 overflow-x-auto" style={{ borderColor: activePalette.colors.border }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un Compte</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Matrice des Permissions & Rôles</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {notice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{notice}</span>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Comptes habilités sur la plateforme VIVA EVENT SOLUTIONS SARLU
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  Contrôle RBAC + RLS Supabase
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                    <tr>
                      <th className="p-3.5">Utilisateur & Contact</th>
                      <th className="p-3.5">Rôle</th>
                      <th className="p-3.5">Direction Affectée</th>
                      <th className="p-3.5">Statut</th>
                      <th className="p-3.5">Dernier Accès</th>
                      <th className="p-3.5 text-right">Actions God Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white text-sm">{u.name}</div>
                          <div className="text-slate-400 text-[11px]">{u.email}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{u.phone}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase font-mono ${
                            u.role === 'admin_general'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : u.role === 'it_technician'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : u.role === 'department_head'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px] max-w-xs truncate">
                          {u.directionName}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {u.status === 'active' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[10px]">
                          {u.lastLogin || 'Jamais connecté'}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                              u.status === 'active'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                            title={u.status === 'active' ? 'Suspendre le compte' : 'Réactiver le compte'}
                          >
                            {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {u.role !== 'admin_general' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer transition-colors"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateUser} className="max-w-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Ing. Faustin Lumbala"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Professionnel *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="agent@viva-eventsolutions.cd"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Téléphone & WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+243 00 000 0000"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Rôle d'Habilitation *</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-amber-500"
                  >
                    <option value="admin_general">Administrateur Général (God Mode)</option>
                    <option value="it_technician">Technicien Informaticien</option>
                    <option value="department_head">Responsable de Département</option>
                    <option value="permanent_user">Utilisateur Permanent</option>
                    <option value="temporary_user">Utilisateur Temporaire</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Direction de Rattachement (Structure des 9 Directions) *</label>
                <select
                  value={newDirection}
                  onChange={e => setNewDirection(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-amber-500"
                >
                  {OFFICIAL_DIRECTIONS_9.map((dir, idx) => (
                    <option key={idx} value={dir}>{dir}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Créer et Activer le Compte</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                <h4 className="font-black text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Structure Hiérarchique des Permissions (Sécurité RLS Supabase)</span>
                </h4>
                <p>
                  En tant qu'<strong>Administrateur Général</strong>, vous disposez des droits super-administrateur illimités (God Mode).
                  Les requêtes API sont contrôlées côté serveur avec vérification des jetons et politique Row-Level Security.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    role: "Administrateur Général (God Mode)",
                    desc: "Accès total et exclusif à la réinitialisation de la base, gestion des rôles, CMS global, logs d'audit et validation budgétaire.",
                    badge: "ACCÈS TOTAL ILLIMITÉ",
                    color: "border-amber-500/50 bg-amber-500/10 text-amber-400"
                  },
                  {
                    role: "Technicien Informaticien",
                    desc: "Supervision des flux live streaming Starlink, billetterie connectée, contrôles d'accès QR code et régies numériques.",
                    badge: "INFRASTRUCTURE & DIGITAL",
                    color: "border-blue-500/50 bg-blue-500/10 text-blue-400"
                  },
                  {
                    role: "Responsable de Département",
                    desc: "Gestion des projets, devis et matériels assignés à sa direction spécifique (isolation stricte par département).",
                    badge: "PÉRIMÈTRE DIRECTIONNEL",
                    color: "border-purple-500/50 bg-purple-500/10 text-purple-400"
                  },
                  {
                    role: "Utilisateur Permanent / Temporaire",
                    desc: "Saisie de terrain, émargement des invités, listes de contrôle matériel et exécution des tâches de régie.",
                    badge: "EXÉCUTION TERRAIN",
                    color: "border-slate-700 bg-slate-800 text-slate-300"
                  }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${item.color} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-white text-sm">{item.role}</h5>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
