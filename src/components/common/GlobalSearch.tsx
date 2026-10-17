import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { Search } from 'lucide-react';

/* Recherche globale — respecte le périmètre du rôle :
   staff = tous domaines chargés ; client = ses devis/projets (e-mail) ;
   visiteur = non rendue. Ne remonte que des données chargées, jamais de
   contournement (les stores appliquent déjà l'isolation). */

interface Props {
  onNavigateClientTab?: (tab: string) => void;
}

export const GlobalSearch: React.FC<Props> = () => {
  const { currentUser, isStaffWorker, isSimulatingVisitor } = useAuth();
  const { projects, quotes, mediaItems } = useProjectData();
  const { crmClients, tasks, transactions } = useEnterpriseErp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const email = (currentUser.email || '').toLowerCase();
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out: { kind: string; label: string; detail: string }[] = [];
    const push = (kind: string, label: string, detail: string) => {
      if (out.length < 12 && label.toLowerCase().includes(query)) out.push({ kind, label, detail });
    };
    if (isStaffWorker && !isSimulatingVisitor) {
      crmClients.forEach(c => push('Client', c.name, c.organization));
      projects.forEach(p => push('Projet', `${p.code} — ${p.title}`, p.client));
      quotes.forEach(x => push('Devis', `${x.referenceNumber} — ${x.eventName}`, x.clientEmail));
      tasks.forEach(t => push('Tâche', t.title, t.projectCode));
      transactions.forEach(t => push('Écriture', `${t.pieceReference} — ${t.description}`, `${t.amountUSD} USD`));
      mediaItems.forEach(m => push('Média', m.title, m.type));
    } else if (currentUser.role === 'client') {
      quotes.filter(x => (x.clientEmail || '').toLowerCase() === email).forEach(x => push('Devis', `${x.referenceNumber} — ${x.eventName}`, x.status));
      projects.filter(p => (p.client || '').toLowerCase().includes((currentUser.organization || currentUser.name || '').toLowerCase())).forEach(p => push('Projet', `${p.code} — ${p.title}`, p.status));
    }
    return out;
  }, [q, isStaffWorker, isSimulatingVisitor, currentUser, crmClients, projects, quotes, tasks, transactions, mediaItems, email]);

  if (currentUser.role === 'visitor' || isSimulatingVisitor) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-all">
        <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
          placeholder="Recherche globale…"
          className="bg-transparent outline-none text-xs w-28 focus:w-40 transition-all text-slate-700 placeholder-slate-400"
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50">
          {results.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3">Aucune donnée disponible pour « {q} » dans votre périmètre.</p>
          ) : (
            results.map((r, i) => (
              <div key={`${r.kind}-${i}`} className="p-2.5 rounded-xl hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-[#4A6CF7]">{r.kind}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate">{r.label}</p>
                <p className="text-[11px] text-slate-500 truncate">{r.detail}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
