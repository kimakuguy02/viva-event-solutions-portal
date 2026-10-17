import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import type { PurchaseRequest, PurchaseStatus } from '../../types/platformBuilder';
import { AdminCard, AdminEmpty } from '../admin/AdminUI';
import { Plus, CheckCircle2, XCircle, Truck } from 'lucide-react';

/* Demandes d'achat — SESSION uniquement (tables dédiées : R4-12/R4-13).
   Workflow : draft → pending_validation → validated → ordered → delivered →
   closed (rejected possible). Aucune écriture financière réelle, aucun montant
   inventé : montants saisis par l'utilisateur. Persistance : R4-12. */

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  draft: 'Brouillon', pending_validation: 'En validation', validated: 'Validée',
  ordered: 'Commandée', delivered: 'Livrée', closed: 'Clôturée', rejected: 'Rejetée',
};

export const PurchasesModule: React.FC = () => {
  const { currentUser } = useAuth();
  const { projects } = useProjectData();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [filter, setFilter] = useState<'all' | PurchaseStatus>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [justification, setJustification] = useState('');
  const [lines, setLines] = useState<{ label: string; quantity: number; unitPriceUSD: number }[]>([
    { label: '', quantity: 1, unitPriceUSD: 0 },
  ]);

  const totalOf = (r: PurchaseRequest) => r.lines.reduce((n, l) => n + l.quantity * l.unitPriceUSD, 0);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lines.filter(l => l.label.trim() && l.quantity > 0);
    if (clean.length === 0) return;
    const req: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      reference: `DA-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`,
      requester: currentUser.name,
      direction: currentUser.organization || '',
      projectCode: projectCode || undefined,
      supplierName: supplier.trim() || undefined,
      lines: clean.map((l, i) => ({ id: `ln-${Date.now()}-${i}`, ...l })),
      currency: 'USD',
      justification: justification.trim(),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setRequests(prev => [req, ...prev]);
    setIsOpen(false);
    setSupplier(''); setProjectCode(''); setJustification('');
    setLines([{ label: '', quantity: 1, unitPriceUSD: 0 }]);
  };

  const transition = (id: string, status: PurchaseStatus) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status, validator: status === 'validated' ? currentUser.name : r.validator, validatedAt: status === 'validated' ? new Date().toISOString() : r.validatedAt } : r)));
  };

  const shown = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-4">
      <AdminCard
        title="Demandes d'achat"
        subtitle="Session uniquement — moteur financier définitif : R4-12/R4-13. Montants saisis, jamais inventés."
        action={
          <button onClick={() => setIsOpen(true)} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </button>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'draft', 'pending_validation', 'validated', 'ordered', 'delivered', 'closed', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${filter === s ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
              {s === 'all' ? 'Toutes' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <AdminEmpty title="Aucune donnée disponible" hint="Aucune demande d'achat dans ce statut pour cette session." />
        ) : (
          <div className="space-y-3">
            {shown.map(r => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-amber-400">{r.reference}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 uppercase">{STATUS_LABEL[r.status]}</span>
                  </div>
                  <span className="text-sm font-black text-white">${totalOf(r).toLocaleString()} USD</span>
                </div>
                <p className="text-xs text-slate-300">{r.supplierName || 'Fournisseur à désigner'} • {r.justification || '—'}</p>
                <p className="text-[11px] text-slate-500">Demandé par {r.requester} • {new Date(r.createdAt).toLocaleString('fr-FR')}{r.projectCode ? ` • Projet ${r.projectCode}` : ''}</p>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  {r.lines.map(l => <div key={l.id}>• {l.label} — {l.quantity} × ${l.unitPriceUSD.toLocaleString()}</div>)}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.status === 'draft' && <button onClick={() => transition(r.id, 'pending_validation')} className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer">Soumettre à validation</button>}
                  {r.status === 'pending_validation' && (
                    <>
                      <button onClick={() => transition(r.id, 'validated')} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"><CheckCircle2 className="w-3 h-3" /> Valider</button>
                      <button onClick={() => transition(r.id, 'rejected')} className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"><XCircle className="w-3 h-3" /> Rejeter</button>
                    </>
                  )}
                  {r.status === 'validated' && <button onClick={() => transition(r.id, 'ordered')} className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold cursor-pointer">Passer commande</button>}
                  {r.status === 'ordered' && <button onClick={() => transition(r.id, 'delivered')} className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold cursor-pointer">Marquer livrée</button>}
                  {r.status === 'delivered' && <button onClick={() => transition(r.id, 'closed')} className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold cursor-pointer">Clôturer</button>}
                </div>
                {r.validator && <p className="text-[10px] text-slate-500">Validé par {r.validator}{r.validatedAt ? ` le ${new Date(r.validatedAt).toLocaleString('fr-FR')}` : ''}</p>}
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={create} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 my-8">
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Truck className="w-5 h-5 text-amber-400" /> Nouvelle demande d'achat</h3>
            <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Fournisseur pressenti (optionnel)" className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
            <select value={projectCode} onChange={e => setProjectCode(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs">
              <option value="">Projet lié (optionnel)</option>
              {projects.map(p => <option key={p.id} value={p.code}>{p.code} — {p.title}</option>)}
            </select>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input value={l.label} onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Libellé" className="col-span-6 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
                <input type="number" min={1} value={l.quantity} onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} className="col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
                <input type="number" min={0} value={l.unitPriceUSD} onChange={e => setLines(prev => prev.map((x, j) => (j === i ? { ...x, unitPriceUSD: Number(e.target.value) } : x)))} placeholder="PU USD" className="col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
              </div>
            ))}
            <button type="button" onClick={() => setLines(prev => [...prev, { label: '', quantity: 1, unitPriceUSD: 0 }])} className="text-[11px] text-amber-400 hover:underline cursor-pointer">+ Ajouter une ligne</button>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder="Justification" rows={2} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer">Annuler</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer">Créer (session)</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
