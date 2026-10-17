import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useAuth } from '../../context/AuthContext';
import { OrganizationUnit, OrgUnitType } from '../../types/cmsAndErp';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  FolderTree,
  Power
} from 'lucide-react';

export const HierarchicalOrgManager: React.FC = () => {
  const { orgUnits, addOrgUnit, updateOrgUnit, deleteOrgUnit } = useProjectData();
  const { isAdminGeneral } = useAuth();

  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Form State
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<OrgUnitType>('direction');
  const [unitCode, setUnitCode] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [unitRespName, setUnitRespName] = useState('');
  const [unitRespEmail, setUnitRespEmail] = useState('');
  const [unitRespPhone, setUnitRespPhone] = useState('');
  const [unitLocation, setUnitLocation] = useState('Kinshasa / Gombe');
  const [unitParentId, setUnitParentId] = useState<string>('');

  const resetForm = () => {
    setUnitName('');
    setUnitType('direction');
    setUnitCode('');
    setUnitDescription('');
    setUnitRespName('');
    setUnitRespEmail('');
    setUnitRespPhone('');
    setUnitLocation('Kinshasa / Gombe');
    setUnitParentId('');
    setEditingUnitId(null);
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    if (editingUnitId) {
      updateOrgUnit(editingUnitId, {
        name: unitName.trim(),
        type: unitType,
        code: unitCode.trim(),
        description: unitDescription.trim(),
        parentId: unitParentId || null,
        responsibleName: unitRespName.trim() || undefined,
        responsibleEmail: unitRespEmail.trim() || undefined,
        responsiblePhone: unitRespPhone.trim() || undefined,
        location: unitLocation.trim() || undefined
      });
    } else {
      addOrgUnit({
        parentId: unitParentId || null,
        type: unitType,
        code: unitCode.trim() || `UNIT-${Math.floor(100 + Math.random() * 900)}`,
        name: unitName.trim(),
        description: unitDescription.trim(),
        order: orgUnits.length + 1,
        status: 'actif',
        responsibleName: unitRespName.trim() || undefined,
        responsibleEmail: unitRespEmail.trim() || undefined,
        responsiblePhone: unitRespPhone.trim() || undefined,
        location: unitLocation.trim() || undefined
      });
    }

    resetForm();
  };

  const startEdit = (unit: OrganizationUnit) => {
    setEditingUnitId(unit.id);
    setUnitName(unit.name);
    setUnitType(unit.type);
    setUnitCode(unit.code || '');
    setUnitDescription(unit.description || '');
    setUnitParentId(unit.parentId || '');
    setUnitRespName(unit.responsibleName || '');
    setUnitRespEmail(unit.responsibleEmail || '');
    setUnitRespPhone(unit.responsiblePhone || '');
    setUnitLocation(unit.location || 'Kinshasa / Gombe');
  };

  // Group root directions vs children
  const rootUnits = orgUnits.filter(u => !u.parentId).sort((a, b) => a.order - b.order);
  const getChildren = (parentId: string) => orgUnits.filter(u => u.parentId === parentId).sort((a, b) => a.order - b.order);

  const unitTypeLabels: Record<OrgUnitType, string> = {
    direction: 'Direction Centrale',
    sous_direction: 'Sous-Direction',
    departement: 'Département',
    service: 'Service Technique',
    bureau: 'Bureau Opérationnel',
    poste: 'Poste / Fonction Spécifique'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FolderTree className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white font-serif">
              Organigramme Dynamique Extensible
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Création et modélisation hiérarchique illimitée (Directions, Sous-directions, Départements, Services, Postes) synchronisée avec Firestore.
          </p>
        </div>

        <button
          onClick={resetForm}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Entité</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Tree View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-xs uppercase tracking-wider">
                Arborescence Institutionnelle ({orgUnits.length} entités)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {rootUnits.length} directions racines
              </span>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {rootUnits.map(unit => {
                const children = getChildren(unit.id);
                const isSelected = selectedParentId === unit.id;

                return (
                  <div
                    key={unit.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{unit.name}</span>
                            {unit.code && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                                {unit.code}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{unit.description}</p>
                          {unit.responsibleName && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-2">
                              <User className="w-3.5 h-3.5 text-blue-400" />
                              <span>Responsable : <strong className="text-white">{unit.responsibleName}</strong></span>
                              {unit.responsiblePhone && <span className="text-slate-500">• {unit.responsiblePhone}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const nextStatus = unit.status === 'actif' ? 'inactif' : 'actif';
                            updateOrgUnit(unit.id, { status: nextStatus });
                          }}
                          className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                            unit.status === 'actif' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500'
                          }`}
                          title={unit.status === 'actif' ? 'Désactiver' : 'Activer'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startEdit(unit)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteOrgUnit(unit.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-entities */}
                    {children.length > 0 && (
                      <div className="pl-6 pt-2 border-t border-slate-800/80 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Sous-Directions & Départements rattachés ({children.length}) :
                        </span>
                        {children.map(child => (
                          <div
                            key={child.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{child.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                                  {child.type}
                                </span>
                              </div>
                              {child.responsibleName && (
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  Resp : {child.responsibleName} ({child.responsibleEmail || 'N/A'})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(child)}
                                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteOrgUnit(child.id)}
                                className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCreateOrUpdate}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl sticky top-24"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                {editingUnitId ? "Modifier l'Entité Organisationnelle" : "Créer une Entité Organisationnelle"}
              </h3>
              {editingUnitId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  Annuler
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Intitulé Officiel</label>
              <input
                type="text"
                required
                value={unitName}
                onChange={e => setUnitName(e.target.value)}
                placeholder="Ex: Direction de la Scénographie 3D"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Niveau Hiérarchique</label>
                <select
                  value={unitType}
                  onChange={e => setUnitType(e.target.value as OrgUnitType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="direction">Direction Centrale</option>
                  <option value="sous_direction">Sous-Direction</option>
                  <option value="departement">Département</option>
                  <option value="service">Service Technique</option>
                  <option value="bureau">Bureau</option>
                  <option value="poste">Poste / Fonction</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Code / Réf</label>
                <input
                  type="text"
                  value={unitCode}
                  onChange={e => setUnitCode(e.target.value)}
                  placeholder="Ex: DIR-07"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Parent Unit selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Rattaché à (Entité parente)</label>
              <select
                value={unitParentId}
                onChange={e => setUnitParentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Racine (Direction Indépendante) --</option>
                {rootUnits.filter(u => u.id !== editingUnitId).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Mission & Responsabilités</label>
              <textarea
                rows={2}
                value={unitDescription}
                onChange={e => setUnitDescription(e.target.value)}
                placeholder="Rôle stratégique au sein de VIVA..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Responsable Affecté & Coordonnées
              </span>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={unitRespName}
                  onChange={e => setUnitRespName(e.target.value)}
                  placeholder="Nom & Prénom du Responsable"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  value={unitRespEmail}
                  onChange={e => setUnitRespEmail(e.target.value)}
                  placeholder="Email professionnel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <input
                  type="tel"
                  value={unitRespPhone}
                  onChange={e => setUnitRespPhone(e.target.value)}
                  placeholder="Tél / WhatsApp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all"
            >
              {editingUnitId ? "Mettre à jour dans Firestore" : "Créer l'Entité dans Firestore"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
