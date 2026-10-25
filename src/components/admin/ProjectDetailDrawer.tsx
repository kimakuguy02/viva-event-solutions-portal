import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { useTheme } from '../../context/ThemeContext';
import type { Project, ProjectMilestone } from '../../types';
import { X, Plus, Trash2, Copy, Archive, CheckCircle2 } from 'lucide-react';

/* Dossier projet 360° — dossier métier événementiel : brief, timeline (jalons +
   tâches liées réelles), équipe, livrables, devis liés. Champs étendus persistés
   via updateProjectDetails (miroir legacy ; colonnes PG : R4-01). Aucune donnée
   inventée : vide = vide. */

const MILESTONE_STATUS: ProjectMilestone['status'][] = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'];

export const ProjectDetailDrawer: React.FC<{ project: Project; onClose: () => void; onDuplicate: (p: Project) => void }> = ({
  project,
  onClose,
  onDuplicate,
}) => {
  const { updateProjectDetails, quotes } = useProjectData();
  const { tasks } = useEnterpriseErp();
  const { activePalette } = useTheme();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDate, setMsDate] = useState('');
  const [msOwner, setMsOwner] = useState('');
  const [memberName, setMemberName] = useState('');
  const [delName, setDelName] = useState('');

  const save = async (patch: Partial<Project>, doneMsg?: string) => {
    setErr(null);
    setBusy(true);
    try {
      await updateProjectDetails(project.id, patch);
      if (doneMsg) alert(doneMsg);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const milestones = project.detailedMilestones ?? [];
  const deliverables = project.detailedDeliverables ?? [];
  const team = project.team ?? [];
  const linkedTasks = tasks.filter(t => t.projectCode === project.code);
  const linkedQuotes = quotes.filter(q => q.projectCode === project.code);

  const addMilestone = () => {
    if (!msTitle.trim() || !msDate) return;
    const ms: ProjectMilestone = {
      id: `ms-${Date.now()}`,
      title: msTitle.trim(),
      date: msDate,
      owner: msOwner.trim() || undefined,
      status: 'todo',
      priority: 'normale',
    };
    save({ detailedMilestones: [...milestones, ms] });
    setMsTitle(''); setMsDate(''); setMsOwner('');
  };

  const cellStyle = {
    backgroundColor: activePalette.colors.bgSubtle,
    borderColor: activePalette.colors.border
  };
  const actionButtonStyle = {
    backgroundColor: activePalette.colors.bgSubtle,
    borderColor: activePalette.colors.border,
    color: activePalette.colors.textMain
  };
  const sectionTitleClass = 'font-black viva-heading uppercase text-[11px] tracking-wider';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex justify-end">
        <div
          className="w-full max-w-2xl border-l p-6 sm:p-8 space-y-6"
          style={{
            backgroundColor: activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div
            className="flex items-start justify-between gap-3 border-b pb-4"
            style={{ borderColor: activePalette.colors.border }}
          >
            <div>
              <span className="text-xs font-mono font-bold" style={{ color: activePalette.colors.accent }}>
                {project.code}
              </span>
              <h3 className="text-xl font-black viva-heading mt-1">{project.title}</h3>
              <p className="text-xs viva-muted">
                Client : {project.client} • {project.location} • {project.startDate} → {project.endDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl viva-muted hover:opacity-70 cursor-pointer"
              style={{ backgroundColor: activePalette.colors.bgSubtle }}
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {err && <p className="text-xs text-rose-500 font-bold">{err}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={project.priority ?? 'normale'}
              onChange={e => save({ priority: e.target.value as Project['priority'] })}
              disabled={busy}
              className="viva-input px-3 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <option value="basse">Priorité basse</option>
              <option value="normale">Priorité normale</option>
              <option value="haute">Priorité haute</option>
              <option value="urgente">Priorité urgente</option>
            </select>
            <button
              onClick={() => onDuplicate(project)}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-80"
              style={actionButtonStyle}
            >
              <Copy className="w-3.5 h-3.5" /> Dupliquer
            </button>
            <button
              onClick={() => save({ archived: !project.archived })}
              className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-80"
              style={actionButtonStyle}
            >
              <Archive className="w-3.5 h-3.5" /> {project.archived ? 'Désarchiver' : 'Archiver'}
            </button>
          </div>

          {/* Brief événementiel */}
          <section className="p-4 rounded-2xl border space-y-1 text-xs" style={cellStyle}>
            <h4 className={sectionTitleClass}>Brief événementiel</h4>
            <p style={{ color: activePalette.colors.textMain }}>{project.type} — {project.location}</p>
            <p className="viva-muted">
              Budget : <strong style={{ color: activePalette.colors.textMain }}>${project.budgetUSD.toLocaleString()} USD</strong>
              {' • '}Progression : <strong style={{ color: activePalette.colors.accent }}>{project.progressPercent}%</strong>
            </p>
            <p className="viva-muted">
              Régie : {project.leadManager || '—'} • Protocole VIP : {project.vipProtocolRequired ? 'Oui' : 'Non'} • Habilitation : {project.securityClearance}
            </p>
            <p className="viva-muted">
              Pôles mobilisés : {project.departmentsAssigned.length > 0 ? project.departmentsAssigned.map(d => `D${d}`).join(', ') : '—'}
            </p>
          </section>

          {/* Timeline jalons */}
          <section className="space-y-3">
            <h4 className={sectionTitleClass}>Rétroplanning — Jalons ({milestones.length})</h4>
            {milestones.length === 0 && <p className="text-xs viva-muted italic">Aucun jalon défini.</p>}
            <div className="space-y-2">
              {[...milestones].sort((a, b) => (a.date < b.date ? -1 : 1)).map(m => (
                <div key={m.id} className="p-3 rounded-xl border flex flex-wrap items-center gap-2 text-xs" style={cellStyle}>
                  <span className="font-bold flex-1 min-w-[10rem]" style={{ color: activePalette.colors.textMain }}>{m.title}</span>
                  <span className="font-mono viva-muted">{m.date}</span>
                  {m.owner && <span className="viva-muted">{m.owner}</span>}
                  <select
                    value={m.status}
                    onChange={e => save({ detailedMilestones: milestones.map(x => (x.id === m.id ? { ...x, status: e.target.value as ProjectMilestone['status'] } : x)) })}
                    className="viva-input px-2 py-1 text-[11px]"
                  >
                    {MILESTONE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => save({ detailedMilestones: milestones.filter(x => x.id !== m.id) })}
                    className="p-1.5 viva-muted hover:text-rose-500 cursor-pointer"
                    aria-label="Supprimer le jalon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                value={msTitle}
                onChange={e => setMsTitle(e.target.value)}
                placeholder="Jalon"
                className="viva-input px-3 py-2 text-xs sm:col-span-2"
              />
              <input
                type="date"
                value={msDate}
                onChange={e => setMsDate(e.target.value)}
                className="viva-input px-3 py-2 text-xs"
              />
              <div className="flex gap-2">
                <input
                  value={msOwner}
                  onChange={e => setMsOwner(e.target.value)}
                  placeholder="Responsable"
                  className="viva-input flex-1 px-3 py-2 text-xs"
                />
                <button onClick={addMilestone} className="viva-btn-primary px-3 py-2 text-xs" aria-label="Ajouter le jalon">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Tâches liées (réelles) */}
          <section className="space-y-2">
            <h4 className={sectionTitleClass}>Tâches liées ({linkedTasks.length})</h4>
            {linkedTasks.length === 0 ? (
              <p className="text-xs viva-muted italic">Aucune tâche rattachée à ce code projet.</p>
            ) : (
              linkedTasks.slice(0, 8).map(t => (
                <div key={t.id} className="p-2.5 rounded-xl border flex items-center justify-between text-xs" style={cellStyle}>
                  <span className="font-bold truncate" style={{ color: activePalette.colors.textMain }}>{t.title}</span>
                  <span className="font-mono viva-muted">{t.status.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </section>

          {/* Équipe */}
          <section className="space-y-2">
            <h4 className={sectionTitleClass}>Équipe ({team.length})</h4>
            {team.map((m, i) => (
              <div key={i} className="p-2.5 rounded-xl border flex items-center justify-between text-xs" style={cellStyle}>
                <span style={{ color: activePalette.colors.textMain }}>{m}</span>
                <button
                  onClick={() => save({ team: team.filter((_, j) => j !== i) })}
                  className="viva-muted hover:text-rose-500 cursor-pointer text-[11px]"
                >
                  Retirer
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                placeholder="Nom — fonction (ex. A. Mbuyi — Régisseur)"
                className="viva-input flex-1 px-3 py-2 text-xs"
              />
              <button
                onClick={() => {
                  if (!memberName.trim()) return;
                  save({ team: [...team, memberName.trim()] });
                  setMemberName('');
                }}
                className="px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer hover:opacity-80"
                style={actionButtonStyle}
              >
                Ajouter
              </button>
            </div>
          </section>

          {/* Livrables */}
          <section className="space-y-2">
            <h4 className={sectionTitleClass}>Livrables ({deliverables.length})</h4>
            {deliverables.map(d => (
              <div key={d.id} className="p-2.5 rounded-xl border flex items-center justify-between text-xs" style={cellStyle}>
                <span className="font-bold truncate" style={{ color: activePalette.colors.textMain }}>{d.name}</span>
                <button
                  onClick={() => save({ detailedDeliverables: deliverables.map(x => (x.id === d.id ? { ...x, status: x.status === 'ready' ? 'pending' : 'ready' } : x)) })}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {d.status === 'ready' ? 'Prêt' : 'En attente'}
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={delName}
                onChange={e => setDelName(e.target.value)}
                placeholder="Nouveau livrable"
                className="viva-input flex-1 px-3 py-2 text-xs"
              />
              <button
                onClick={() => { if (delName.trim()) { save({ detailedDeliverables: [...deliverables, { id: `dlv-${Date.now()}`, name: delName.trim(), status: 'pending' }] }); setDelName(''); } }}
                className="px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer hover:opacity-80"
                style={actionButtonStyle}
              >
                Ajouter
              </button>
            </div>
          </section>

          {/* Devis liés (réels) */}
          <section className="space-y-2">
            <h4 className={sectionTitleClass}>Devis liés ({linkedQuotes.length})</h4>
            {linkedQuotes.length === 0 ? (
              <p className="text-xs viva-muted italic">Aucun devis rattaché (code projet).</p>
            ) : (
              linkedQuotes.map(q => (
                <div key={q.id} className="p-2.5 rounded-xl border flex items-center justify-between text-xs" style={cellStyle}>
                  <span className="font-mono" style={{ color: activePalette.colors.textMain }}>{q.referenceNumber} — {q.eventName}</span>
                  <span className="text-emerald-500 font-black">${q.estimatedBudgetUSD.toLocaleString()}</span>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
