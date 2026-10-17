import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { EmployeeProfile } from '../../types/erp';
import { VIVA_ENTERPRISE_ORGANIGRAM } from '../../data/enterpriseErpData';
import {
  Users,
  Briefcase,
  FileCheck2,
  Shield,
  Phone,
  Mail,
  Edit3,
  Layers,
  Award,
  CheckCircle2,
  X
} from 'lucide-react';

export const HumanResourcesModule: React.FC = () => {
  const { currentUser, isDg, isAdminRh } = useAuth();
  const { employees, updateEmployeePosition } = useEnterpriseErp();

  const [activeTab, setActiveTab] = useState<'employees' | 'organigram'>('employees');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(employees[0] || null);

  // Edit Job Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMissions, setEditMissions] = useState('');
  const [editKpis, setEditKpis] = useState('');

  const handleOpenEdit = (emp: EmployeeProfile) => {
    setSelectedEmployee(emp);
    setEditMissions(emp.jobPosition.mainMissions.join('\n'));
    setEditKpis(emp.jobPosition.kpis.join('\n'));
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    updateEmployeePosition(selectedEmployee.id, {
      mainMissions: editMissions.split('\n').filter(m => m.trim().length > 0),
      kpis: editKpis.split('\n').filter(k => k.trim().length > 0)
    });

    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Ressources Humaines & Organisationnelle
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Organigramme Officiel & Fiches de Poste VIVA EVENT
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Définition des 9 départements opérationnels, fiches de poste contractuelles, répartition des missions, objectifs de performance (KPIs) et habilitations ERP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === 'employees' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Fiches de Poste ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('organigram')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === 'organigram' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Organigramme des 9 Directions
          </button>
        </div>
      </div>

      {/* VIEW 1: FICHES DE POSTE PAR TRAVAILLEUR */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Workers List */}
          <div className="lg:col-span-4 space-y-3">
            {employees.map(emp => {
              const isSelected = selectedEmployee?.id === emp.id;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all shadow ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-blue-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                      {emp.id.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {emp.directionName.split('.')[0]}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-1">{emp.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{emp.jobPosition.title}</p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Job Description */}
          <div className="lg:col-span-8">
            {selectedEmployee ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      {selectedEmployee.id.toUpperCase()} • {selectedEmployee.directionName}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">{selectedEmployee.name}</h3>
                    <p className="text-xs text-slate-300 font-semibold">{selectedEmployee.jobPosition.title}</p>
                  </div>

                  {(isDg || isAdminRh) && (
                    <button
                      onClick={() => handleOpenEdit(selectedEmployee)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifier Fiche de Poste</span>
                    </button>
                  )}
                </div>

                {/* Contact & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Pro
                    </span>
                    <p className="font-mono text-white text-xs">{selectedEmployee.email}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Téléphone
                    </span>
                    <p className="font-mono text-white text-xs">{selectedEmployee.phone}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-purple-400" /> Statut Contrat
                    </span>
                    <p className="font-bold text-emerald-400 capitalize">{selectedEmployee.status} (Kinshasa)</p>
                  </div>
                </div>

                {/* Main Missions */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-amber-400 text-[10px] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Missions Principales du Poste :
                  </span>
                  <div className="space-y-1.5 text-slate-200">
                    {selectedEmployee.jobPosition.mainMissions.map((m, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-slate-300 text-[10px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Responsabilités Clés :
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedEmployee.jobPosition.responsibilities.map((resp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPI Targets */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-slate-300 text-[10px] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-400" />
                    Indicateurs Clés de Performance (KPIs) :
                  </h4>
                  <div className="space-y-1.5">
                    {selectedEmployee.jobPosition.kpis.map((kpi, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                        <span className="font-medium">{kpi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* VIEW 2: ORGANIGRAMME DES 9 DIRECTIONS */}
      {activeTab === 'organigram' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VIVA_ENTERPRISE_ORGANIGRAM.map(dept => (
            <div key={dept.code} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-amber-400 text-xs">{dept.code}</span>
                <span className="text-[11px] text-slate-400">{dept.headcount} collaborateurs</span>
              </div>
              <h4 className="font-bold text-sm text-white">{dept.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{dept.description}</p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300">
                Responsable : <strong className="text-white">{dept.managerName}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL MODIFIER FICHE ==================== */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white">Mise à Jour de la Fiche de Poste</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Missions Principales (1 par ligne)</label>
                <textarea
                  rows={3}
                  value={editMissions}
                  onChange={e => setEditMissions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Objectifs KPIs (1 par ligne)</label>
                <textarea
                  rows={4}
                  value={editKpis}
                  onChange={e => setEditKpis(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
