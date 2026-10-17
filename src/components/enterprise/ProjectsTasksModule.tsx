import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { ProjectTask, DailyFieldReport, TaskPriority, TaskStatus } from '../../types/erp';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  Users,
  HardHat,
  X,
  FileText,
  Filter
} from 'lucide-react';

export const ProjectsTasksModule: React.FC = () => {
  const { currentUser, isChefEquipe, isDg, isAdminRh } = useAuth();
  const {
    tasks,
    fieldReports,
    addTask,
    updateTaskStatus,
    addDailyFieldReport
  } = useEnterpriseErp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'reports'>('tasks');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Task Modal
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskService, setTaskService] = useState('06. Régie Technique & Énergie');
  const [taskAssignedTo, setTaskAssignedTo] = useState('Serge ILUNGA');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('haute');
  const [taskDeadline, setTaskDeadline] = useState('');

  // New Field Report Modal
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [reportProjectName, setReportProjectName] = useState('Sommet CEEAC 2026 • Palais de la Nation');
  const [reportTeamCount, setReportTeamCount] = useState(12);
  const [reportProgressSummary, setReportProgressSummary] = useState('');
  const [reportIncidents, setReportIncidents] = useState('');
  const [reportSolutions, setReportSolutions] = useState('');
  const [reportWeather, setReportWeather] = useState('Ensoleillé 31°C - Kinshasa');

  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDeadline) return;
    setTaskFormError(null);

    // Wave 2 — succès affiché seulement après confirmation Supabase.
    try {
      await addTask({
        title: taskTitle,
        description: taskDescription,
        serviceDirection: taskService,
        assignedTo: taskAssignedTo,
        priority: taskPriority,
        status: 'a_faire',
        deadline: taskDeadline
      });

      setIsNewTaskOpen(false);
      setTaskTitle('');
      setTaskDescription('');
    } catch (err) {
      setTaskFormError(`Tâche non enregistrée : ${err instanceof Error ? err.message : String(err)}.`);
    }
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportProjectName || !reportProgressSummary) return;

    addDailyFieldReport({
      projectName: reportProjectName,
      date: new Date().toISOString().split('T')[0],
      supervisorName: currentUser.name,
      teamMembersPresentCount: Number(reportTeamCount),
      weatherConditions: reportWeather,
      progressSummary: reportProgressSummary,
      incidentsEncountered: reportIncidents || 'Aucun incident majeur. Opérations nominales.',
      solutionsApplied: reportSolutions || 'Respect strict des consignes techniques et plannings.'
    });

    setIsNewReportOpen(false);
    setReportProgressSummary('');
    setReportIncidents('');
    setReportSolutions('');
  };

  const filteredTasks = tasks.filter(t => {
    const matchPri = filterPriority === 'all' || t.priority === filterPriority;
    const matchSt = filterStatus === 'all' || t.status === filterStatus;
    return matchPri && matchSt;
  });

  const [kanbanView, setKanbanView] = useState(false);
  const KANBAN_COLS = [
    { id: 'a_faire', label: 'À faire' },
    { id: 'en_cours', label: 'En cours' },
    { id: 'revue', label: 'En revue' },
    { id: 'termine', label: 'Terminé' },
  ] as const;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Gestion de Projets & Tâches • Suivi Terrain
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Pilotage des Chantiers & Tâches par Service
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Attribution des tâches par pôle de compétence, priorisation stricte (Basse, Normale, Haute, Urgente), suivi des échéances et rédaction des rapports journaliers de chantier.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nouvelle Tâche</span>
          </button>

          <button
            onClick={() => setIsNewReportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <HardHat className="w-4 h-4" />
            <span>+ Rapport Journalier Terrain</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tasks' ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Tableau des Tâches ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reports' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Rapports Journaliers de Terrain ({fieldReports.length})
        </button>
      </div>

      {/* VIEW 1: TÂCHES */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-400">Priorité :</span>
              {['all', 'urgente', 'haute', 'normale', 'basse'].map(pri => (
                <button
                  key={pri}
                  onClick={() => setFilterPriority(pri)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize cursor-pointer transition-colors ${
                    filterPriority === pri ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {pri === 'all' ? 'Toutes' : pri}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-400">Statut :</span>
              {[
                { id: 'all', label: 'Tous' },
                { id: 'a_faire', label: 'À faire' },
                { id: 'en_cours', label: 'En cours' },
                { id: 'termine', label: 'Terminé' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    filterStatus === st.id ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => setKanbanView(v => !v)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              {kanbanView ? 'Vue : Kanban' : 'Vue : Liste'}
            </button>
          </div>
          {kanbanView ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {KANBAN_COLS.map(col => {
                const items = filteredTasks.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 min-h-[10rem]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-slate-300 uppercase">{col.label}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-[11px] text-slate-600 italic py-2 text-center">Aucune donnée disponible</p>
                    ) : (
                      items.map(task => (
                        <div key={task.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                          <p className="text-xs font-bold text-white line-clamp-2">{task.title}</p>
                          <p className="font-mono text-[10px] text-slate-500">{task.projectCode} • {task.deadline}</p>
                          <div className="flex items-center gap-1">
                            {KANBAN_COLS.filter(c => c.id !== task.status).map(c => (
                              <button
                                key={c.id}
                                title={`Déplacer vers ${c.label}`}
                                onClick={() => updateTaskStatus(task.id, c.id as typeof task.status).catch(err =>
                                  setTaskFormError(`Statut refusé : ${err instanceof Error ? err.message : String(err)}.`)
                                )}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 cursor-pointer"
                              >
                                → {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => {
              const priorityStyles = {
                urgente: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                haute: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                normale: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                basse: 'bg-slate-800 text-slate-300 border-slate-700'
              };

              const statusStyles = {
                a_faire: 'bg-slate-800 text-slate-300',
                en_cours: 'bg-amber-500/20 text-amber-300',
                en_revue: 'bg-purple-500/20 text-purple-300',
                termine: 'bg-emerald-500/20 text-emerald-300'
              };

              return (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        {task.serviceDirection}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white leading-snug">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigné à : <strong className="text-slate-200">{task.assignedTo}</strong></span>
                      <span className="font-mono text-amber-400 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.deadline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyles[task.status]}`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>

                      {/* Change Status Fast Buttons */}
                      <div className="flex items-center gap-1">
                        {task.status !== 'en_cours' && task.status !== 'termine' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'en_cours').catch(err =>
                              setTaskFormError(`Statut refusé : ${err instanceof Error ? err.message : String(err)}.`)
                            )}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Démarrer
                          </button>
                        )}
                        {task.status !== 'termine' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'termine').catch(err =>
                              setTaskFormError(`Statut refusé : ${err instanceof Error ? err.message : String(err)}.`)
                            )}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Terminer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* VIEW 2: RAPPORTS JOURNALIERS DE TERRAIN */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Archives des Rapports Journaliers de Chantier</h3>
            <button
              onClick={() => setIsNewReportOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <HardHat className="w-4 h-4" /> Rédiger Rapport du Soir
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldReports.map(rep => (
              <div key={rep.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-mono text-amber-400 text-xs font-bold">{rep.date}</span>
                    <h4 className="font-bold text-sm text-white">{rep.projectName}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase flex items-center gap-1">
                    <Users className="w-3 h-3" /> {rep.teamMembersPresentCount} techniciens
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Synthèse de l'Avancement :</span>
                    <p className="text-slate-200 mt-1 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {rep.progressSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-rose-400 uppercase text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Incidents :
                      </span>
                      <p className="text-slate-300 text-[11px]">{rep.incidentsEncountered}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-400 uppercase text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Solutions appliquées :
                      </span>
                      <p className="text-slate-300 text-[11px]">{rep.solutionsApplied}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Superviseur : <strong className="text-slate-200">{rep.supervisorName}</strong></span>
                    <span className="font-mono text-slate-500">Signé le {rep.signedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL NOUVELLE TÂCHE ==================== */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Nouvelle Tâche par Service</h3>
              <button onClick={() => setIsNewTaskOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {taskFormError && <p className="text-xs text-rose-400 font-bold">{taskFormError}</p>}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Intitulé de la Tâche</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Câblage et raccordement réseau Dante audio"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description Détaillée</label>
                <textarea
                  rows={3}
                  placeholder="Consignes techniques, matériel requis..."
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Direction / Service</label>
                  <select
                    value={taskService}
                    onChange={e => setTaskService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="06. Régie Technique & Énergie">06. Régie Technique & Énergie</option>
                    <option value="07. Logistique, Transport & Stock">07. Logistique, Transport & Stock</option>
                    <option value="08. Direction Commerciale">08. Direction Commerciale</option>
                    <option value="03. Direction Financière & Compta">03. Direction Financière & Compta</option>
                    <option value="04. Juridique & Marchés Publics">04. Juridique & Marchés Publics</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Priorité</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="urgente">🚨 URGENTE (Bloquant)</option>
                    <option value="haute">⚠️ Haute (Crucial)</option>
                    <option value="normale">Normale</option>
                    <option value="basse">Basse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Responsable Assigné</label>
                  <input
                    type="text"
                    required
                    value={taskAssignedTo}
                    onChange={e => setTaskAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Date & Heure d'Échéance</label>
                  <input
                    type="datetime-local"
                    required
                    value={taskDeadline}
                    onChange={e => setTaskDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Créer la Tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL RAPPORT JOURNALIER ==================== */}
      {isNewReportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Rapport Journalier de Terrain (Régie)</h3>
              <button onClick={() => setIsNewReportOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom du Projet / Chantier</label>
                <input
                  type="text"
                  required
                  value={reportProjectName}
                  onChange={e => setReportProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Techniciens Présents</label>
                  <input
                    type="number"
                    min="1"
                    value={reportTeamCount}
                    onChange={e => setReportTeamCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Météo & Conditions</label>
                  <input
                    type="text"
                    value={reportWeather}
                    onChange={e => setReportWeather(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Avancement Technique de la Journée</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Description des montages, tests son/lumière, calibrations..."
                  value={reportProgressSummary}
                  onChange={e => setReportProgressSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Incidents Rencontrés</label>
                  <textarea
                    rows={2}
                    placeholder="Pannes, retards transport..."
                    value={reportIncidents}
                    onChange={e => setReportIncidents(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Solutions Immédiates</label>
                  <textarea
                    rows={2}
                    placeholder="Mesures palliatives prises..."
                    value={reportSolutions}
                    onChange={e => setReportSolutions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewReportOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow"
                >
                  Signer & Soumettre le Rapport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
