import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import type { Project, ProjectMilestone, ProjectDeliverable } from '../../types';
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
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDate, setMsDate] = useState('');
  const [msOwner, setMsOwner] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex justify-end">
        <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400">{project.code}</span>
              <h3 className="text-xl font-black text-white mt-1">{project.title}</h3>
              <p className="text-xs text-slate-400">Client : {project.client} • {project.location} • {project.startDate} → {project.endDate}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          {err && <p className="text-xs text-rose-400 font-bold">{err}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={project.priority ?? 'normale'}
              onChange={e => save({ priority: e.target.value as Project['priority'] })}
              disabled={busy}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="basse">Priorité basse</option>
              <option value="normale">Priorité normale</option>
              <option value="haute">Priorité haute</option>
              <option value="urgente">Priorité urgente</option>
            </select>
            <button onClick={() => onDuplicate(project)} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
              <Copy className="w-3.5 h-3.5" /> Dupliquer
            </button>
            <button onClick={() => save({ archived: !project.archived })} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
              <Archive className="w-3.5 h-3.5" /> {project.archived ? 'Désarchiver' : 'Archiver'}
            </button>
          </div>

          {/* Brief événementiel */}
          <section className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <h4 className="font-black text-white uppercase text-[11px] tracking-wider">Brief événementiel</h4>
            <p className="text-slate-300">{project.type} — {project.location}</p>
            <p className="text-slate-400">Budget : <strong className="text-white">${project.budgetUSD.toLocaleString()} USD</strong> • Progression : <strong className="text-amber-400">{project.progressPercent}%</strong></p>
            <p className="text-slate-400">Régie : {project.leadManager || '—'} • Protocole VIP : {project.vipProtocolRequired ? 'Oui' : 'Non'} • Habilitation : {project.securityClearance}</p>
            <p className="text-slate-400">Pôles mobilisés : {project.departmentsAssigned.length > 0 ? project.departmentsAssigned.map(d => `D${d}`).join(', ') : '—'}</p>
          </section>

          {/* Timeline jalons */}
          <section className="space-y-3">
            <h4 className="font-black text-white uppercase text-[11px] tracking-wider">Rétroplanning — Jalons ({milestones.length})</h4>
            {milestones.length === 0 && <p className="text-xs text-slate-500 italic">Aucun jalon défini.</p>}
            <div className="space-y-2">
              {[...milestones].sort((a, b) => (a.date < b.date ? -1 : 1)).map(m => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-white flex-1 min-w-[10rem]">{m.title}</span>
                  <span className="font-mono text-slate-400">{m.date}</span>
                  {m.owner && <span className="text-slate-400">{m.owner}</span>}
                  <select value={m.status} onChange={e => save({ detailedMilestones: milestones.map(x => (x.id === m.id ? { ...x, status: e.target.value as ProjectMilestone['status'] } : x)) })} className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white">
                    {MILESTONE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => save({ detailedMilestones: milestones.filter(x => x.id !== m.id) })} className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input value={msTitle} onChange={e => setMsTitle(e.target.value)} placeholder="Jalon" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:col-span-2" />
              <input type="date" value={msDate} onChange={e => setMsDate(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
              <div className="flex gap-2">
                <input value={msOwner} onChange={e => setMsOwner(e.target.value)} placeholder="Responsable" className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
                <button onClick={addMilestone} className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </section>

          {/* Tâches liées (réelles) */}
          <section className="space-y-2">
            <h4 className="font-black text-white uppercase text-[11px] tracking-wider">Tâches liées ({linkedTasks.length})</h4>
            {linkedTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucune tâche rattachée à ce code projet.</p>
            ) : (
              linkedTasks.slice(0, 8).map(t => (
                <div key={t.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-bold truncate">{t.title}</span>
                  <span className="font-mono text-slate-400">{t.status.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </section>

          {/* Équipe */}
          <section className="space-y-2">
            <h4 className="font-black text-white uppercase text-[11px] tracking-wider">Équipe ({team.length})</h4>
            {team.map((m, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-200">{m}</span>
                <button onClick={() => save({ team: team.filter((_, j) => j !== i) })} className="text-slate-500 hover:text-rose-400 cursor-pointer text-[11px]">Retirer</button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Nom — fonction (ex. A. Mbuyi — Régisseur)" className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
              <button
                onClick={() => {
                  if (!memberName.trim()) return;
                  save({ team: [...team, memberName.trim()] });
                  setMemberName('');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </section>

          {/* Livrables */}
          <section className="space-y-2">
            <h4 className="font-black text-white uppercase text-[11px] tracking-wider">Livrables ({deliverables.length})</h4>
            {deliverables.map(d => (
              <div key={d.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-200 font-bold truncate">{d.name}</span>
                <button onClick={() => save({ detailedDeliverables: deliverables.map(x => (x.id === d.id ? { ...x, status: x.status === 'ready' ? 'pending' : 'ready' } : x)) })} className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 cursor-pointer">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {d.status === 'ready' ? 'Prêt' : 'En attente'}
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={delName} onChange={e => setDelName(e.target.value)} placeholder="Nouveau livrable" className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
              <button onClick={() => { if (delName.trim()) { save({ detailedDeliverables: [...deliverables, { id: `dlv-${Date.now()}`, name: delName.trim(), status: 'pending' }] }); setDelName(''); } }} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer">Ajouter</button>
            </div>
          </section>

          {/* Devis liés (réels) */}
          <section className="space-y-2">
            <h4 className="font-black text-white uppercase text-[11px] tracking-wider">Devis liés ({linkedQuotes.length})</h4>
            {linkedQuotes.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Aucun devis rattaché (code projet).</p>
            ) : (
              linkedQuotes.map(q => (
                <div key={q.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-mono">{q.referenceNumber} — {q.eventName}</span>
                  <span className="text-emerald-400 font-black">${q.estimatedBudgetUSD.toLocaleString()}</span>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
