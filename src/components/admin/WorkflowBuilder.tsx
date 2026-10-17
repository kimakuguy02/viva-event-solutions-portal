import React, { useEffect, useState } from 'react';
import { AdminCard, AdminEmpty, StatusPill } from './AdminUI';
import type { WorkflowDefinition, WorkflowStage } from '../../types/platformBuilder';
import { platformSession } from '../../services/platformSession';
import { Plus, Trash2, Play, CheckCircle2, Clock, Bell } from 'lucide-react';

/* Workflow Builder — expérience complète, persistance NON branchée.
   Les définitions vivent en session avec mention explicite : tables
   `workflows`/`workflow_steps`/`workflow_instances` à créer (R2-02).
   Aucune exécution réelle, aucune écriture legacy ajoutée. */

const STAGE_KEYS = ['REQUEST', 'SUBMISSION', 'VERIFICATION', 'VALIDATION', 'EXECUTION', 'CLOSURE'] as const;
const STAGE_LABELS: Record<string, string> = {
  REQUEST: 'Demande', SUBMISSION: 'Soumission', VERIFICATION: 'Vérification',
  VALIDATION: 'Validation', EXECUTION: 'Exécution', CLOSURE: 'Clôture',
};
const ROLE_OPTIONS = ['CLIENT', 'COMMERCIAL_SECRETAIRE', 'CHEF_EQUIPE', 'ADMIN_RH', 'DAF_COMPTABLE', 'DG_GERANT', 'ADMIN_GENERAL', 'SUPER_ADMIN'];

function blankWorkflow(): WorkflowDefinition {
  return {
    id: `wf-${Date.now()}`,
    name: '',
    description: '',
    isActive: true,
    stages: STAGE_KEYS.map((key, i) => ({
      id: `st-${Date.now()}-${i}`,
      key,
      label: STAGE_LABELS[key],
      responsibleRole: i === 0 ? 'CLIENT' : i >= 4 ? 'CHEF_EQUIPE' : 'ADMIN_RH',
      dueDays: [0, 2, 3, 5, 15, 2][i],
      status: 'pending',
      conditions: [],
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkflowDefinition>(blankWorkflow);
  const [editing, setEditing] = useState(false);

  // Miroir vers le magasin partagé (Form Builder, matrices) — session uniquement.
  useEffect(() => {
    for (const w of workflows) {
      platformSession.upsertWorkflow({
        id: w.id,
        name: w.name,
        description: w.description,
        isActive: w.isActive,
        updatedAt: w.updatedAt,
        stages: w.stages.map((s) => ({
          id: s.id,
          key: s.key,
          label: s.label,
          responsibleRole: s.responsibleRole,
          dueDays: s.dueDays,
          status: s.status,
        })),
      });
    }
  }, [workflows]);

  const selected = workflows.find((w) => w.id === (selectedId ?? draft.id)) ?? null;

  const saveDraft = () => {
    if (!draft.name.trim()) return;
    const wf = { ...draft, updatedAt: new Date().toISOString() };
    setWorkflows((prev) => {
      const exists = prev.some((w) => w.id === wf.id);
      return exists ? prev.map((w) => (w.id === wf.id ? wf : w)) : [...prev, wf];
    });
    setSelectedId(wf.id);
    setEditing(false);
  };

  const updateStage = (stageId: string, patch: Partial<WorkflowStage>) => {
    setDraft((d) => ({ ...d, stages: d.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)) }));
  };

  const advanceSimulation = (wfId: string) => {
    // Simulation VISUELLE d'avancement (aucune exécution réelle).
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== wfId) return w;
        const idx = w.stages.findIndex((s) => s.status === 'active');
        const next = idx === -1 ? 0 : idx + 1;
        return {
          ...w,
          stages: w.stages.map((s, i) => ({ ...s, status: i < next ? 'done' : i === next ? 'active' : 'pending' }) as WorkflowStage),
        };
      }),
    );
  };

  return (
    <div className="space-y-4">
      <AdminCard
        title="Workflows"
        subtitle="Définitions de session — moteur de persistance à créer (R2-02). La simulation ci-dessous est visuelle, sans exécution."
        action={
          <button
            onClick={() => { setDraft(blankWorkflow()); setEditing(true); }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nouveau workflow
          </button>
        }
      >
        {workflows.length === 0 && !editing ? (
          <AdminEmpty title="Aucun workflow défini" hint="Créez votre premier circuit : demande → soumission → vérification → validation → exécution → clôture." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workflows.map((w) => (
              <div key={w.id} className={`p-4 rounded-2xl border ${selectedId === w.id ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800 bg-slate-950'}`}>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => { setSelectedId(w.id); setDraft(w); setEditing(false); }} className="text-left min-w-0 cursor-pointer">
                    <div className="text-sm font-bold text-white truncate">{w.name || '(sans nom)'}</div>
                    <div className="text-[11px] text-slate-400 truncate">{w.description || '—'}</div>
                  </button>
                  <StatusPill active={w.isActive} />
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <button onClick={() => advanceSimulation(w.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer">
                    <Play className="w-3 h-3" /> Simuler l'étape suivante
                  </button>
                  <button
                    onClick={() => { platformSession.removeWorkflow(w.id); setWorkflows((p) => p.filter((x) => x.id !== w.id)); if (selectedId === w.id) setSelectedId(null); }}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                    title="Supprimer (session)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {w.stages.map((s) => (
                    <div
                      key={s.id}
                      title={`${s.label} — ${s.responsibleRole} — J+${s.dueDays}`}
                      className={`flex-1 h-2 rounded-full ${s.status === 'done' ? 'bg-emerald-500' : s.status === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-slate-800'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {(editing || selected) && (
        <AdminCard
          title={editing ? 'Édition du workflow (session)' : `Détail — ${selected?.name}`}
          subtitle="Responsables, délais, conditions, notifications par étape."
          action={
            editing ? (
              <button onClick={saveDraft} disabled={!draft.name.trim()} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs cursor-pointer">
                Enregistrer (session)
              </button>
            ) : undefined
          }
        >
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nom du workflow (ex. Validation devis > 10 000 USD)" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
                <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="rounded text-amber-500" />
                Workflow actif
              </label>
              <div className="space-y-2">
                {draft.stages.map((s, i) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <div className="text-xs font-bold text-white">
                      {i + 1}. {s.label}
                    </div>
                    <select value={s.responsibleRole} onChange={(e) => updateStage(s.id, { responsibleRole: e.target.value })} className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white">
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> J+
                      <input type="number" min={0} value={s.dueDays} onChange={(e) => updateStage(s.id, { dueDays: Number(e.target.value) })} className="w-14 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs" />
                    </label>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1"><Bell className="w-3 h-3" /> Notification auto (future)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : selected ? (
            <div className="space-y-2">
              {selected.stages.map((s, i) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${s.status === 'done' ? 'bg-emerald-500 text-slate-950' : s.status === 'active' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {s.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="font-bold text-white">{s.label}</span>
                  <span className="font-mono text-amber-400">{s.responsibleRole}</span>
                  <span className="text-slate-400">Délai J+{s.dueDays}</span>
                  <span className="text-slate-500">Statut : {s.status}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AdminCard>
      )}
    </div>
  );
};
