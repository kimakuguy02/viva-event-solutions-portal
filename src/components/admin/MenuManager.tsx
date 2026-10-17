import React, { useState } from 'react';
import { DynamicMenu } from '../../types/cmsAndErp';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  Save,
  X,
  Compass,
  Radio,
  Ticket,
  Vote,
  Megaphone,
  UserCheck
} from 'lucide-react';

interface MenuManagerProps {
  menus: DynamicMenu[];
  onUpdateMenus: (menus: DynamicMenu[]) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({ menus, onUpdateMenus }) => {
  const { currentUser, isAdminGeneral } = useAuth();
  const [isEditing, setIsEditing] = useState<DynamicMenu | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMenu, setNewMenu] = useState<Omit<DynamicMenu, 'id'>>({
    name: 'Nouveau Menu',
    icon: 'Compass',
    description: 'Description du menu',
    route: 'custom-route',
    order: menus.length + 1,
    showInNavbar: true,
    active: true,
    minRole: 'visitor',
    tag: 'public'
  });

  const logAuditAction = (action: string, details: string) => {
    const logs = JSON.parse(localStorage.getItem('viva_audit_logs') || '[]');
    logs.unshift({
      id: 'audit-' + Date.now(),
      timestamp: new Date().toISOString(),
      userEmail: currentUser.email,
      action: action,
      ipAddress: '192.168.1.50 (Secure RLS)',
      device: navigator.userAgent
    });
    localStorage.setItem('viva_audit_logs', JSON.stringify(logs));
  };

  const handleSaveEdit = () => {
    if (!isEditing) return;
    const updated = menus.map(m => (m.id === isEditing.id ? isEditing : m));
    onUpdateMenus(updated);
    setIsEditing(null);
    logAuditAction('UPDATE_MENU', `Modification du menu ${isEditing.name}`);
  };

  const handleCreateMenu = () => {
    const created: DynamicMenu = {
      id: 'menu-' + Date.now(),
      ...newMenu
    };
    const updated = [...menus, created];
    onUpdateMenus(updated);
    setIsAdding(false);
    logAuditAction('CREATE_MENU', `Création du menu ${created.name}`);
  };

  const handleDeleteMenu = (id: string) => {
    const updated = menus.filter(m => m.id !== id);
    onUpdateMenus(updated);
    logAuditAction('DELETE_MENU', `Suppression du menu id ${id}`);
  };

  const handleToggleActive = (id: string) => {
    const updated = menus.map(m => (m.id === id ? { ...m, active: !m.active } : m));
    onUpdateMenus(updated);
    logAuditAction('TOGGLE_MENU', `Basculement statut menu id ${id}`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
              🧭 Gestion Dynamique des Menus & Navigation
            </span>
            <span className="text-xs text-slate-400">Configuration centralisée sans code en dur</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Gestionnaire des Menus & Routes
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Le Super Administrateur peut configurer l'ensemble des menus, routes, icônes, ordre d'affichage, permissions minimales et balises d'accès.
          </p>
        </div>

        {isAdminGeneral && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Menu</span>
          </button>
        )}
      </div>

      {/* Menus Table / Cards Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Menus Actifs du Portail ({menus.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Source de vérité unique</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map(menu => (
            <div
              key={menu.id}
              className={`p-4 rounded-2xl border space-y-3 transition-all ${
                menu.active
                  ? 'bg-slate-950/80 border-slate-800 text-white shadow-md'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center border border-emerald-500/30">
                    {menu.order}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold">{menu.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Route: /{menu.route}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    menu.tag === 'public' ? 'bg-blue-500/20 text-blue-300' :
                    menu.tag === 'client' ? 'bg-purple-500/20 text-purple-300' :
                    menu.tag === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {menu.tag}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400">{menu.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">Rôle min: <strong className="text-white">{menu.minRole}</strong></span>

                {isAdminGeneral && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(menu.id)}
                      className={`p-1.5 rounded-lg border ${menu.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}
                      title={menu.active ? 'Désactiver' : 'Activer'}
                    >
                      {menu.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsEditing(menu)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Modifier"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Modifier le Menu</h3>
              <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nom</label>
                  <input
                    type="text"
                    value={isEditing.name}
                    onChange={e => setIsEditing({ ...isEditing, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Route (sans /)</label>
                  <input
                    type="text"
                    value={isEditing.route}
                    onChange={e => setIsEditing({ ...isEditing, route: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Ordre</label>
                  <input
                    type="number"
                    value={isEditing.order}
                    onChange={e => setIsEditing({ ...isEditing, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rôle Minimum</label>
                  <select
                    value={isEditing.minRole}
                    onChange={e => setIsEditing({ ...isEditing, minRole: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="visitor">Visiteur</option>
                    <option value="client">Client</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tag</label>
                  <select
                    value={isEditing.tag}
                    onChange={e => setIsEditing({ ...isEditing, tag: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="public">Public</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="erp">ERP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={isEditing.description}
                  onChange={e => setIsEditing({ ...isEditing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditing(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Créer un Nouveau Menu</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nom</label>
                  <input
                    type="text"
                    value={newMenu.name}
                    onChange={e => setNewMenu({ ...newMenu, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Route</label>
                  <input
                    type="text"
                    value={newMenu.route}
                    onChange={e => setNewMenu({ ...newMenu, route: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Ordre</label>
                  <input
                    type="number"
                    value={newMenu.order}
                    onChange={e => setNewMenu({ ...newMenu, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rôle Min</label>
                  <select
                    value={newMenu.minRole}
                    onChange={e => setNewMenu({ ...newMenu, minRole: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="visitor">Visiteur</option>
                    <option value="client">Client</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tag</label>
                  <select
                    value={newMenu.tag}
                    onChange={e => setNewMenu({ ...newMenu, tag: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="public">Public</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="erp">ERP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={newMenu.description}
                  onChange={e => setNewMenu({ ...newMenu, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleCreateMenu} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Créer le menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
