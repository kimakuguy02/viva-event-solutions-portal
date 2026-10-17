import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Mail,
  Send,
  FileText,
  KeyRound,
  CheckCircle2,
  Users,
  Eye,
  Server
} from 'lucide-react';

export const GovernanceSecurityModule: React.FC = () => {
  const { currentUser, isDg } = useAuth();
  const { notices } = useEnterpriseErp();

  const [activeTab, setActiveTab] = useState<'rbac' | 'audit' | 'notices'>('rbac');

  // Simulated audit logs
  const auditLogs = [
    {
      id: 'log-01',
      date: '11/09/2026 13:45:10',
      user: 'COMPTABLE (DAF)',
      action: 'DOUBLE_SIGNATURE_OTP_VALIDATED_TX_7821',
      terminal: 'DAF-STATION-GOMBE • IP 192.168.1.10',
      status: 'Conforme'
    },
    {
      id: 'log-02',
      date: '11/09/2026 12:20:04',
      user: 'MALTHUS KILUMBA WA BANZA (Administrateur)',
      action: 'UPDATE_JOB_POSITION_CHEF_EQUIPE',
      terminal: 'HR-TERMINAL-01 • IP 192.168.1.12',
      status: 'Conforme'
    },
    {
      id: 'log-03',
      date: '11/09/2026 11:15:33',
      user: 'MALTHUS KILUMBA WA BANZA (DG)',
      action: 'APPROVE_BUDGET_LINE_SOMMET_CEEAC',
      terminal: 'DG-EXECUTIVE-SECURED • IP 192.168.1.2',
      status: 'Conforme'
    },
    {
      id: 'log-04',
      date: '11/09/2026 09:00:15',
      user: 'Ing. Serge ILUNGA (Chef Équipe)',
      action: 'VOUCHER_LOAN_ISSUED_BON-PRET-7841',
      terminal: 'REGIE-DEPOT-02 • IP 192.168.2.4',
      status: 'Conforme'
    },
    {
      id: 'log-05',
      date: '10/09/2026 18:30:22',
      user: 'COMPTABLE (DAF)',
      action: 'DAILY_CASH_CLOSURE_SEALED_PV_USD_742',
      terminal: 'DAF-STATION-GOMBE • IP 192.168.1.10',
      status: 'Conforme'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              Gouvernance, Sécurité des Données & RBAC
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Matrice des Habilitations & Audit Trail Traçable
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Contrôle d'accès basé sur les rôles (RBAC), double signature des opérations sensibles, intégrité des logs d'audit et historique des notifications multicanales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === 'rbac' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Matrice RBAC
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === 'audit' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Journal d'Audit
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === 'notices' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Centre Multicanal ({notices.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: MATRICE DES RÔLES (RBAC) */}
      {activeTab === 'rbac' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Matrice d'Habilitations par Profil Métier</h3>
            <p className="text-xs text-slate-400 mt-1">
              Chaque travailleur dispose d'un périmètre d'action strictement délimité sans privilège superflu.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-4">Rôle / Travailleur</th>
                  <th className="p-4">Vision & Stratégie</th>
                  <th className="p-4">Comptabilité & OTP</th>
                  <th className="p-4">Clôture Caisse</th>
                  <th className="p-4">Tâches & Régie</th>
                  <th className="p-4">Prêt Matériel</th>
                  <th className="p-4">CRM & Devis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                <tr>
                  <td className="p-4 font-bold text-white">
                    <div>DG / Gérance</div>
                    <div className="text-[11px] text-amber-400 font-normal">MALTHUS KILUMBA WA BANZA</div>
                  </td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Illimité (God Mode)</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Visa Manager</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Audit & Visa</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Global</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Contrôle Total</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Tous Comptes</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-white">
                    <div>Administrateur & RH</div>
                    <div className="text-[11px] text-blue-400 font-normal">MALTHUS KILUMBA WA BANZA</div>
                  </td>
                  <td className="p-4 text-blue-400 font-bold">✓ Stratégie & RH</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Visa Manager</td>
                  <td className="p-4 text-slate-400">Consultation</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Affectation</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Sortie/Entrée</td>
                  <td className="p-4 text-slate-400">Consultation</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-white">
                    <div>Comptable / DAF</div>
                    <div className="text-[11px] text-emerald-400 font-normal">COMPTABLE</div>
                  </td>
                  <td className="p-4 text-slate-500 font-medium">⊘ Restreint (RH exclu)</td>
                  <td className="p-4 text-emerald-400 font-black">✓ OTP DAF Dépositaire</td>
                  <td className="p-4 text-emerald-400 font-black">✓ Signataire PV Caisse</td>
                  <td className="p-4 text-slate-500 font-medium">⊘ Restreint terrain</td>
                  <td className="p-4 text-slate-500 font-medium">⊘ Restreint parcs</td>
                  <td className="p-4 text-emerald-400 font-bold">✓ Facturation & Acomptes</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-white">
                    <div>Chef d'Équipe Régie</div>
                    <div className="text-[11px] text-purple-400 font-normal">Ing. Serge ILUNGA</div>
                  </td>
                  <td className="p-4 text-slate-500">Terrain</td>
                  <td className="p-4 text-slate-500">Dépenses &le; 100$</td>
                  <td className="p-4 text-slate-500">Non habilité</td>
                  <td className="p-4 text-emerald-400 font-black">✓ Responsable Régie</td>
                  <td className="p-4 text-emerald-400 font-black">✓ Bons Sortie / Retour</td>
                  <td className="p-4 text-slate-500">Non habilité</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-white">
                    <div>Commercial / Secrétaire</div>
                    <div className="text-[11px] text-pink-400 font-normal">Sarah KALONJI</div>
                  </td>
                  <td className="p-4 text-slate-500">Non habilité</td>
                  <td className="p-4 text-slate-500">Factures acompte</td>
                  <td className="p-4 text-slate-500">Non habilité</td>
                  <td className="p-4 text-slate-500">Tâches Com</td>
                  <td className="p-4 text-slate-500">Non habilité</td>
                  <td className="p-4 text-emerald-400 font-black">✓ Responsable CRM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: JOURNAL D'AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Journal des Événements & d'Audit Immuable</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enregistrement cryptographique des accès et signatures</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
              Intégrité Certifiée
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="p-4">Horodatage (Kinshasa)</th>
                  <th className="p-4">Opérateur</th>
                  <th className="p-4">Action Enregistrée</th>
                  <th className="p-4">Terminal & Réseau</th>
                  <th className="p-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/20 font-mono text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-4 text-slate-400">{log.date}</td>
                    <td className="p-4 text-white font-bold">{log.user}</td>
                    <td className="p-4 text-amber-400">{log.action}</td>
                    <td className="p-4 text-slate-300">{log.terminal}</td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CENTRE MULTICANAL */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Historique des Messages Multicanaux</h3>
            <span className="text-xs text-slate-400">{notices.length} messages émis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map(notice => (
              <div key={notice.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    {notice.channel === 'sms' && <Smartphone className="w-4 h-4 text-purple-400" />}
                    {notice.channel === 'email' && <Mail className="w-4 h-4 text-blue-400" />}
                    {notice.channel === 'notification_push' && <Send className="w-4 h-4 text-amber-400" />}
                    <span className="font-bold text-white uppercase text-[10px]">Canal {notice.channel}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase">
                    {notice.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white">{notice.subject}</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {notice.content}
                  </p>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-1 text-[11px] font-mono">
                  <span>Destinataire : <strong className="text-slate-200">{notice.recipientName}</strong> ({notice.targetRecipient})</span>
                  <span>{notice.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
