import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useTheme } from '../../context/ThemeContext';
import { Project } from '../../types';
import { Compass, Plus, X } from 'lucide-react';

import { ProjectDetailDrawer } from './ProjectDetailDrawer';

export const ProjectManager: React.FC = () => {
  const { projects, addProject, updateProjectStatus, updateProjectDetails } = useProjectData();
  const { activePalette } = useTheme();
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

  const innerCardStyle = {
    backgroundColor: activePalette.colors.bgSubtle,
    borderColor: activePalette.colors.border
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-3xl p-6 shadow-xl viva-card"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border,
          borderRadius: activePalette.design.radiusCard
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5" style={{ color: activePalette.colors.accent }} />
            <h2 className="text-xl sm:text-2xl font-black viva-heading">
              Gestionnaire de Projets & Sommets
            </h2>
          </div>
          <p className="text-xs viva-muted mt-1">
            Pilotage opérationnel, rétroplanning chronologique et coordination inter-départements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="viva-btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center gap-2"
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
          className="viva-input px-3.5 py-1.5 text-xs min-w-[12rem]"
        />
        <button
          onClick={() => setShowArchived(v => !v)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          style={{
            backgroundColor: showArchived ? activePalette.colors.primary : activePalette.colors.bgSurface,
            color: showArchived ? activePalette.colors.onPrimary : activePalette.colors.textMuted,
            border: `1px solid ${activePalette.colors.border}`
          }}
        >
          {showArchived ? 'Masquer archivés' : 'Voir archivés'}
        </button>
        {['all', 'conception', 'retroplanning', 'en_cours', 'cloture'].map(st => {
          const isActive = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: isActive ? activePalette.colors.accent : activePalette.colors.bgSurface,
                color: isActive ? activePalette.colors.onAccent : activePalette.colors.textMuted,
                border: `1px solid ${isActive ? activePalette.colors.accent : activePalette.colors.border}`
              }}
            >
              {st === 'all' ? 'Tous les Projets' : st.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.map(project => (
          <div
            key={project.id}
            className="p-6 rounded-3xl border space-y-5 shadow-xl transition-colors viva-card"
            style={{
              backgroundColor: activePalette.colors.bgSurface,
              borderColor: activePalette.colors.border,
              borderRadius: activePalette.design.radiusCard
            }}
          >
            <div
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4"
              style={{ borderColor: activePalette.colors.border }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold" style={{ color: activePalette.colors.accent }}>
                    {project.code}
                  </span>
                  <span className="viva-muted">•</span>
                  <span className="text-xs viva-muted">{project.type}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold viva-heading mt-1">{project.title}</h3>
                <p className="text-xs viva-muted">
                  Client : <strong style={{ color: activePalette.colors.accent }}>{project.client}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] viva-muted uppercase">Budget Débloqué</span>
                  <div className="text-base sm:text-lg font-black viva-heading">${project.budgetUSD.toLocaleString()} USD</div>
                </div>
                <select
                  value={project.status}
                  onChange={e => updateProjectStatus(project.id, e.target.value as any, project.progressPercent).catch(() => {})}
                  className="viva-input px-3 py-1.5 text-xs font-bold cursor-pointer"
                >
                  <option value="conception">Conception</option>
                  <option value="retroplanning">Rétroplanning</option>
                  <option value="en_cours">En Cours (Exécution)</option>
                  <option value="cloture">Clôturé avec Succès</option>
                </select>
                <button
                  onClick={() => setDetailId(project.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: activePalette.colors.bgSubtle,
                    color: activePalette.colors.textMain,
                    border: `1px solid ${activePalette.colors.border}`
                  }}
                >
                  Dossier 360°
                </button>
              </div>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="viva-muted">Avancement des opérations & rétroplanning</span>
                <span className="font-mono font-bold" style={{ color: activePalette.colors.accent }}>
                  {project.progressPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={project.progressPercent}
                onChange={e => updateProjectStatus(project.id, project.status, Number(e.target.value)).catch(() => {})}
                className="w-full"
                style={{ accentColor: activePalette.colors.accent }}
              />
            </div>

            {/* Assigned Departments & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
              <div className="p-3 rounded-2xl border" style={innerCardStyle}>
                <span className="text-[10px] viva-muted uppercase block">Période & Lieu</span>
                <span className="font-semibold viva-heading">{project.startDate} au {project.endDate}</span>
                <p className="text-[11px] viva-muted truncate mt-0.5">{project.location}</p>
              </div>

              <div className="p-3 rounded-2xl border" style={innerCardStyle}>
                <span className="text-[10px] viva-muted uppercase block">Régie Générale</span>
                <span className="font-semibold viva-heading truncate block">{project.leadManager}</span>
                <span className="text-[11px] text-emerald-500">Protocole VIP : {project.vipProtocolRequired ? 'Oui' : 'Non'}</span>
              </div>

              <div className="p-3 rounded-2xl border" style={innerCardStyle}>
                <span className="text-[10px] viva-muted uppercase block">Sécurité & Habilitation</span>
                <span className="font-semibold uppercase" style={{ color: activePalette.colors.accent }}>
                  {project.securityClearance.replace('_', ' ')}
                </span>
                <span className="text-[11px] viva-muted block">{project.metrics.attendeesExpected} participants attendus</span>
              </div>

              <div className="p-3 rounded-2xl border" style={innerCardStyle}>
                <span className="text-[10px] viva-muted uppercase block">Pôles VIVA Mobilisés</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.departmentsAssigned.map(dId => (
                    <span
                      key={dId}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                      style={{
                        backgroundColor: `${activePalette.colors.primary}1A`,
                        color: activePalette.colors.primary
                      }}
                    >
                      D{dId}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div
            className="p-10 rounded-3xl border text-center text-xs viva-muted"
            style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
          >
            Aucun projet ne correspond à ces critères. Créez un projet ou ajustez les filtres.
          </div>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div
            className="border rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8"
            style={{
              backgroundColor: activePalette.colors.bgSurface,
              borderColor: activePalette.colors.border,
              borderRadius: activePalette.design.radiusCard
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-4"
              style={{ borderColor: activePalette.colors.border }}
            >
              <h3 className="text-xl font-bold viva-heading">Nouveau Projet Événementiel</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="viva-muted hover:opacity-70 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              {formError && <p className="text-xs text-rose-500 font-bold">{formError}</p>}
              <div>
                <label className="block viva-muted font-bold mb-1">Titre du Projet *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Conférence Internationale des Ministres de l'Énergie"
                  className="viva-input w-full px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block viva-muted font-bold mb-1">Client / Commanditaire *</label>
                  <input
                    type="text"
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    placeholder="Ex: Ministère de l'Énergie"
                    className="viva-input w-full px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block viva-muted font-bold mb-1">Budget Prévu (USD)</label>
                  <input
                    type="number"
                    value={budgetUSD}
                    onChange={e => setBudgetUSD(Number(e.target.value))}
                    className="viva-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block viva-muted font-bold mb-1">Date Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="viva-input w-full px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block viva-muted font-bold mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="viva-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block viva-muted font-bold mb-1">Lieu</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ex: Fleuve Congo Hotel, Kinshasa"
                  className="viva-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div
                className="flex justify-end gap-3 pt-4 border-t"
                style={{ borderColor: activePalette.colors.border }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs viva-muted cursor-pointer"
                  style={{ backgroundColor: activePalette.colors.bgSubtle }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="viva-btn-primary px-6 py-2 text-xs"
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
