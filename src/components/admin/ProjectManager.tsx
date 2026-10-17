import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { DEPARTMENTS_DATA } from '../../data/vivaData';
import { Project } from '../../types';
import {
  Compass,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sliders,
  Filter,
  X
} from 'lucide-react';

import { ProjectDetailDrawer } from './ProjectDetailDrawer';

export const ProjectManager: React.FC = () => {
  const { projects, addProject, updateProjectStatus, updateProjectDetails } = useProjectData();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New project modal form state
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [type, setType] = useState('Sommet Diplomatique & Institutionnel');
  const [startDate, setStartDate] = useState('2026-10-10');
  const [endDate, setEndDate] = useState('2026-10-12');
  const [location, setLocation] = useState('Kinshasa / Gombe');
  const [budgetUSD, setBudgetUSD] = useState<number>(150000);
  const [leadManager, setLeadManager] = useState('Guy Kimaku (Directeur des Opérations)');
  const [selectedDepts, setSelectedDepts] = useState<number[]>([1, 2, 7, 8, 12]);
  const [vipProtocol, setVipProtocol] = useState(true);
  const [securityClearance, setSecurityClearance] = useState<'standard' | 'renforce' | 'haut_niveau'>('haut_niveau');

  const filteredProjects = projects.filter(p => {
    if (!showArchived && p.archived) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
    }
    return true;
  });

  const detailProject = projects.find(p => p.id === detailId) ?? null;

  const handleDuplicateProject = async (p: Project) => {
    try {
      await addProject({
        title: `${p.title} (copie)`,
        client: p.client,
        type: p.type,
        startDate: p.startDate,
        endDate: p.endDate,
        location: p.location,
        budgetUSD: p.budgetUSD,
        progressPercent: 0,
        status: 'conception',
        departmentsAssigned: p.departmentsAssigned,
        leadManager: p.leadManager,
        vipProtocolRequired: p.vipProtocolRequired,
        securityClearance: p.securityClearance,
        metrics: { ...p.metrics },
      });
    } catch (e) {
      setFormError(`Duplication refusée : ${e instanceof Error ? e.message : String(e)}.`);
    }
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client) return;
    setFormError(null);

    // Wave 2 — succès affiché seulement après confirmation Supabase.
    try {
      await addProject({
      title,
      client,
      type,
      startDate,
      endDate,
      location,
      budgetUSD,
      progressPercent: 15,
      status: 'conception',
      departmentsAssigned: selectedDepts,
      leadManager,
      vipProtocolRequired: vipProtocol,
      securityClearance,
      metrics: {
        attendeesExpected: 1000,
        equipmentCount: 45,
        partnerCollegesMobilized: 4
      }
      });

      setIsModalOpen(false);
      setTitle('');
      setClient('');
    } catch (err) {
      setFormError(`Projet non enregistré : ${err instanceof Error ? err.message : String(err)}.`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Gestionnaire de Projets & Sommets
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pilotage opérationnel, rétroplanning chronologique et coordination inter-départements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher titre, code, client…"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white min-w-[12rem] focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={() => setShowArchived(v => !v)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${showArchived ? 'bg-slate-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
        >
          {showArchived ? 'Masquer archivés' : 'Voir archivés'}
        </button>
        {['all', 'conception', 'retroplanning', 'en_cours', 'cloture'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === st
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st === 'all' ? 'Tous les Projets' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.map(project => (
          <div
            key={project.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">{project.code}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">{project.type}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">{project.title}</h3>
                <p className="text-xs text-slate-300">Client : <strong className="text-amber-300">{project.client}</strong></p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase">Budget Débloqué</span>
                  <div className="text-base sm:text-lg font-black text-white">${project.budgetUSD.toLocaleString()} USD</div>
                </div>
                <select
                  value={project.status}
                  onChange={e => updateProjectStatus(project.id, e.target.value as any, project.progressPercent).catch(() => {})}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-none"
                >
                  <option value="conception">Conception</option>
                  <option value="retroplanning">Rétroplanning</option>
                  <option value="en_cours">En Cours (Exécution)</option>
                  <option value="cloture">Clôturé avec Succès</option>
                </select>
                <button
                  onClick={() => setDetailId(project.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                >
                  Dossier 360°
                </button>
              </div>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Avancement des opérations & rétroplanning</span>
                <span className="font-mono font-bold text-amber-400">{project.progressPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={project.progressPercent}
                onChange={e => updateProjectStatus(project.id, project.status, Number(e.target.value)).catch(() => {})}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Assigned Departments & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-300 pt-2">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Période & Lieu</span>
                <span className="font-semibold text-white">{project.startDate} au {project.endDate}</span>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{project.location}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Régie Générale</span>
                <span className="font-semibold text-white truncate block">{project.leadManager}</span>
                <span className="text-[11px] text-emerald-400">Protocole VIP : {project.vipProtocolRequired ? 'Oui' : 'Non'}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Sécurité & Habilitation</span>
                <span className="font-semibold text-amber-400 uppercase">{project.securityClearance.replace('_', ' ')}</span>
                <span className="text-[11px] text-slate-400 block">{project.metrics.attendeesExpected} participants attendus</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Pôles VIVA Mobilisés</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.departmentsAssigned.map(dId => (
                    <span key={dId} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
                      D{dId}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dossier 360° */}
      {detailProject && (
        <ProjectDetailDrawer
          project={detailProject}
          onClose={() => setDetailId(null)}
          onDuplicate={p => { handleDuplicateProject(p); setDetailId(null); }}
        />
      )}

      {/* Modal for creating a new project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Nouveau Projet Événementiel</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              {formError && <p className="text-xs text-rose-400 font-bold">{formError}</p>}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Titre du Projet *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Conférence Internationale des Ministres de l'Énergie"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Client / Commanditaire *</label>
                  <input
                    type="text"
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    placeholder="Ex: Ministère de l'Énergie"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Budget Prévu (USD)</label>
                  <input
                    type="number"
                    value={budgetUSD}
                    onChange={e => setBudgetUSD(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Lieu</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ex: Fleuve Congo Hotel, Kinshasa"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-amber-400"
                >
                  Enregistrer le Projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
