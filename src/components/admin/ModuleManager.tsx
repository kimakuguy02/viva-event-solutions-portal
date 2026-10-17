import React, { useState } from 'react';
import { DynamicModule } from '../../types/cmsAndErp';
import { useAuth } from '../../context/AuthContext';
import {
  Boxes,
  Plus,
  Edit3,
  Archive,
  CheckCircle2,
  XCircle,
  Shield,
  Save,
  X,
  Layers,
  Terminal
} from 'lucide-react';

interface ModuleManagerProps {
  modules: DynamicModule[];
  onUpdateModules: (modules: DynamicModule[]) => void;
}

export const ModuleManager: React.FC<ModuleManagerProps> = ({ modules, onUpdateModules }) => {
  const { currentUser, isAdminGeneral } = useAuth();
  const [isEditing, setIsEditing] = useState<DynamicModule | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newModule, setNewModule] = useState<Omit<DynamicModule, 'id'>>({
    name: 'Nouveau Module',
    description: 'Description du module et de ses fonctionnalités',
    icon: 'Boxes',
    category: 'management',
    active: true,
    allowedRoles: ['admin', 'super_admin'],
    permissions: ['all'],
    archived: false
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
    const updated = modules.map(m => (m.id === isEditing.id ? isEditing : m));
    onUpdateModules(updated);
    setIsEditing(null);
    logAuditAction('UPDATE_MODULE', `Modification du module ${isEditing.name}`);
  };

  const handleCreateModule = () => {
    const created: DynamicModule = {
      id: 'mod-' + Date.now(),
      ...newModule
    };
    const updated = [...modules, created];
    onUpdateModules(updated);
    setIsAdding(false);
    logAuditAction('CREATE_MODULE', `Création du module ${created.name}`);
  };

  const handleToggleActive = (id: string) => {
    const updated = modules.map(m => (m.id === id ? { ...m, active: !m.active } : m));
    onUpdateModules(updated);
    logAuditAction('TOGGLE_MODULE', `Basculement activation module id ${id}`);
  };

  const handleArchiveModule = (id: string) => {
    const updated = modules.map(m => (m.id === id ? { ...m, archived: !m.archived } : m));
    onUpdateModules(updated);
    logAuditAction('ARCHIVE_MODULE', `Archivage / Désarchivage module id ${id}`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
              🧩 Architecture Extensible & Modules ERP
            </span>
            <span className="text-xs text-slate-400">Activation/Désactivation en temps réel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Gestionnaire des Modules
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Contrôlez l'accès aux modules fonctionnels. Lorsqu'un module est désactivé, ses routes protégées et interfaces sont instantanément verrouillées.
          </p>
        </div>

        {isAdminGeneral && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Module</span>
          </button>
        )}
      </div>

      {/* Modules Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Modules Enregistrés ({modules.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Architecture modulaire extensible</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => (
            <div
              key={mod.id}
              className={`p-5 rounded-2xl border space-y-4 transition-all ${
                mod.active && !mod.archived
                  ? 'bg-slate-950/80 border-slate-800 text-white shadow-md'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${mod.active ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{mod.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">{mod.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${mod.active && !mod.archived ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {mod.allowedRoles.map(role => (
                  <span key={role} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-800">
                    {role}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">{mod.archived ? 'Archivé' : (mod.active ? 'Actif' : 'Désactivé')}</span>

                {isAdminGeneral && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(mod.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer ${
                        mod.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {mod.active ? 'Actif' : 'Inactif'}
                    </button>
                    <button
                      onClick={() => setIsEditing(mod)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      title="Modifier"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => handleArchiveModule(mod.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Archiver"
                    >
                      <Archive className="w-3.5 h-3.5" />
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
              <h3 className="text-lg font-bold text-white">Modifier le Module</h3>
              <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nom du Module</label>
                  <input
                    type="text"
                    value={isEditing.name}
                    onChange={e => setIsEditing({ ...isEditing, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Catégorie</label>
                  <select
                    value={isEditing.category}
                    onChange={e => setIsEditing({ ...isEditing, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="management">Management</option>
                    <option value="engineering">Engineering</option>
                    <option value="logistics">Logistics</option>
                    <option value="security">Security</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={isEditing.description}
                  onChange={e => setIsEditing({ ...isEditing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditing(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2">
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
              <h3 className="text-lg font-bold text-white">Créer un Nouveau Module</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nom</label>
                  <input
                    type="text"
                    value={newModule.name}
                    onChange={e => setNewModule({ ...newModule, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Catégorie</label>
                  <select
                    value={newModule.category}
                    onChange={e => setNewModule({ ...newModule, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="management">Management</option>
                    <option value="engineering">Engineering</option>
                    <option value="logistics">Logistics</option>
                    <option value="security">Security</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newModule.description}
                  onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleCreateModule} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Créer le module</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
