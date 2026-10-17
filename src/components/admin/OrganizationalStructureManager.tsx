import React, { useState } from 'react';
import { DirectionOrg, SubDirection } from '../../types/cmsAndErp';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  AlertCircle,
  Save,
  X
} from 'lucide-react';

interface OrganizationalStructureManagerProps {
  directions: DirectionOrg[];
  onUpdateDirections: (directions: DirectionOrg[]) => void;
}

export const OrganizationalStructureManager: React.FC<OrganizationalStructureManagerProps> = ({
  directions,
  onUpdateDirections
}) => {
  const { currentUser, isAdminGeneral } = useAuth();
  const [selectedDirId, setSelectedDirId] = useState<number | null>(directions[0]?.id || null);
  const [isEditingDir, setIsEditingDir] = useState<boolean>(false);
  const [editDirForm, setEditDirForm] = useState<DirectionOrg | null>(null);
  const [isAddingDir, setIsAddingDir] = useState<boolean>(false);
  const [newDirForm, setNewDirForm] = useState<Omit<DirectionOrg, 'id'>>({
    code: '10',
    name: 'NOUVELLE DIRECTION',
    tagline: 'Description courte de la direction',
    description: 'Description détaillée de la mission et des attributions',
    responsible: 'Responsable désigné',
    active: true,
    order: directions.length + 1,
    subDirections: [],
    associatedUsers: [],
    permissions: ['view_module']
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [subDirModal, setSubDirModal] = useState<{ dirId: number; sub?: SubDirection } | null>(null);
  const [subDirForm, setSubDirForm] = useState({ name: '', description: '', active: true });

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

  const handleSaveDirection = () => {
    if (!editDirForm) return;
    const updated = directions.map(d => (d.id === editDirForm.id ? editDirForm : d));
    onUpdateDirections(updated);
    setIsEditingDir(false);
    logAuditAction('UPDATE_DIRECTION', `Modification de la direction ${editDirForm.name}`);
  };

  const handleCreateDirection = () => {
    const newId = Math.max(...directions.map(d => d.id), 0) + 1;
    const created: DirectionOrg = { ...newDirForm, id: newId };
    const updated = [...directions, created];
    onUpdateDirections(updated);
    setIsAddingDir(false);
    logAuditAction('CREATE_DIRECTION', `Création de la direction ${created.name}`);
  };

  const handleDeleteDirection = (id: number) => {
    const target = directions.find(d => d.id === id);
    const updated = directions.filter(d => d.id !== id);
    onUpdateDirections(updated);
    setDeleteConfirmId(null);
    if (selectedDirId === id) setSelectedDirId(updated[0]?.id || null);
    logAuditAction('DELETE_DIRECTION', `Suppression de la direction ${target?.name}`);
  };

  const handleToggleDirActive = (id: number) => {
    const updated = directions.map(d => (d.id === id ? { ...d, active: !d.active } : d));
    onUpdateDirections(updated);
    logAuditAction('TOGGLE_DIRECTION', `Changement statut actif pour direction id ${id}`);
  };

  const handleSaveSubDirection = (dirId: number) => {
    const updated = directions.map(d => {
      if (d.id === dirId) {
        if (subDirModal?.sub) {
          // Edit existing
          const subs = d.subDirections.map(s => (s.id === subDirModal.sub?.id ? { ...s, ...subDirForm } : s));
          return { ...d, subDirections: subs };
        } else {
          // Add new
          const newSub: SubDirection = {
            id: 'sub-' + Date.now(),
            ...subDirForm
          };
          return { ...d, subDirections: [...d.subDirections, newSub] };
        }
      }
      return d;
    });
    onUpdateDirections(updated);
    setSubDirModal(null);
    setSubDirForm({ name: '', description: '', active: true });
    logAuditAction('MANAGE_SUB_DIRECTION', `Mise à jour des sous-directions de id ${dirId}`);
  };

  const handleDeleteSubDirection = (dirId: number, subId: string) => {
    const updated = directions.map(d => {
      if (d.id === dirId) {
        return { ...d, subDirections: d.subDirections.filter(s => s.id !== subId) };
      }
      return d;
    });
    onUpdateDirections(updated);
    logAuditAction('DELETE_SUB_DIRECTION', `Suppression sous-direction ${subId}`);
  };

  const currentDir = directions.find(d => d.id === selectedDirId) || directions[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-500/30">
              🏛️ Centre Organisationnel & Gouvernance
            </span>
            <span className="text-xs text-slate-400">9 Directions & Sous-Directions Officielles RDC</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Structure Organisationnelle & Hiérarchie
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Gestion complète des directions, sous-directions, responsables, autorisations et attributions institutionnelles de VIVA EVENT SOLUTIONS.
          </p>
        </div>

        {isAdminGeneral && (
          <button
            onClick={() => setIsAddingDir(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Direction</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Directions List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Directions Officielles (01 - 09)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">{directions.length}</span>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {directions.map(dir => (
              <div
                key={dir.id}
                onClick={() => setSelectedDirId(dir.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedDirId === dir.id
                    ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center ${
                    dir.active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {dir.code}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold truncate max-w-[180px] sm:max-w-[220px]">{dir.name}</h4>
                    <p className="text-[11px] text-slate-400">{dir.subDirections.length} sous-directions</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dir.active ? 'bg-emerald-400' : 'bg-rose-500'}`} title={dir.active ? 'Active' : 'Inactive'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Direction Details & Sub-Directions CRUD */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          {currentDir ? (
            <>
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                      Direction N° {currentDir.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${currentDir.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {currentDir.active ? 'Active' : 'Désactivée'}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{currentDir.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{currentDir.tagline}</p>
                </div>

                {isAdminGeneral && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditDirForm(currentDir);
                        setIsEditingDir(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleToggleDirActive(currentDir.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                        currentDir.active ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {currentDir.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{currentDir.active ? 'Désactiver' : 'Activer'}</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(currentDir.id)}
                      className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description & Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Responsable / Titulaire</span>
                  <p className="text-white font-semibold text-sm">{currentDir.responsible}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Mission Principale</span>
                  <p className="text-slate-300">{currentDir.description}</p>
                </div>
              </div>

              {/* Sub-Directions Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Sous-Directions Associées ({currentDir.subDirections.length})
                    </h4>
                  </div>
                  {isAdminGeneral && (
                    <button
                      onClick={() => {
                        setSubDirModal({ dirId: currentDir.id });
                        setSubDirForm({ name: '', description: '', active: true });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une sous-direction</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentDir.subDirections.map(sub => (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs sm:text-sm">{sub.name}</span>
                        {isAdminGeneral && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSubDirModal({ dirId: currentDir.id, sub });
                                setSubDirForm({ name: sub.name, description: sub.description || '', active: sub.active });
                              }}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubDirection(currentDir.id, sub.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{sub.description || 'Aucune description spécifique.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-400 py-12">Sélectionnez une direction pour afficher ses détails.</p>
          )}
        </div>
      </div>

      {/* Edit Direction Modal */}
      {isEditingDir && editDirForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Modifier la Direction ({editDirForm.code})</h3>
              <button onClick={() => setIsEditingDir(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nom de la Direction</label>
                <input
                  type="text"
                  value={editDirForm.name}
                  onChange={e => setEditDirForm({ ...editDirForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tagline / Slogan</label>
                <input
                  type="text"
                  value={editDirForm.tagline}
                  onChange={e => setEditDirForm({ ...editDirForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Responsable</label>
                <input
                  type="text"
                  value={editDirForm.responsible}
                  onChange={e => setEditDirForm({ ...editDirForm, responsible: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDirForm.description}
                  onChange={e => setEditDirForm({ ...editDirForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsEditingDir(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleSaveDirection} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Direction Modal */}
      {isAddingDir && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Ajouter une Nouvelle Direction</h3>
              <button onClick={() => setIsAddingDir(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Code (ex: 10)</label>
                  <input
                    type="text"
                    value={newDirForm.code}
                    onChange={e => setNewDirForm({ ...newDirForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Ordre</label>
                  <input
                    type="number"
                    value={newDirForm.order}
                    onChange={e => setNewDirForm({ ...newDirForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nom</label>
                <input
                  type="text"
                  value={newDirForm.name}
                  onChange={e => setNewDirForm({ ...newDirForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Tagline</label>
                <input
                  type="text"
                  value={newDirForm.tagline}
                  onChange={e => setNewDirForm({ ...newDirForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Responsable</label>
                <input
                  type="text"
                  value={newDirForm.responsible}
                  onChange={e => setNewDirForm({ ...newDirForm, responsible: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDirForm.description}
                  onChange={e => setNewDirForm({ ...newDirForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsAddingDir(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={handleCreateDirection} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Créer la direction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Direction Modal */}
      {subDirModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {subDirModal.sub ? 'Modifier la Sous-Direction' : 'Ajouter une Sous-Direction'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nom de la sous-direction</label>
                <input
                  type="text"
                  value={subDirForm.name}
                  onChange={e => setSubDirForm({ ...subDirForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Description / Rôle</label>
                <textarea
                  rows={2}
                  value={subDirForm.description}
                  onChange={e => setSubDirForm({ ...subDirForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSubDirModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={() => handleSaveSubDirection(subDirModal.dirId)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Confirmer la Suppression</h3>
            <p className="text-xs text-slate-300">
              Êtes-vous sûr de vouloir supprimer définitivement cette direction et ses sous-directions ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Annuler</button>
              <button onClick={() => handleDeleteDirection(deleteConfirmId)} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
