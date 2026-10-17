import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEnterpriseErp } from '../../context/EnterpriseErpContext';
import { EquipmentLoanRecord, MaintenanceLog } from '../../types/erp';
import {
  Truck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Zap,
  Volume2,
  Tv,
  Layers,
  X,
  FileCheck
} from 'lucide-react';

export const AssetsInventoryModule: React.FC = () => {
  const { currentUser, isChefEquipe, isDg } = useAuth();
  const {
    loanRecords,
    maintenanceLogs,
    exchangeRate,
    issueEquipmentLoan,
    returnEquipmentLoan,
    addMaintenanceLog
  } = useEnterpriseErp();

  const [activeTab, setActiveTab] = useState<'loans' | 'assets' | 'maintenance'>('loans');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<EquipmentLoanRecord | null>(null);

  // New Loan Form
  const [loanEquipmentName, setLoanEquipmentName] = useState('Console Numérique Yamaha CL5 + Rio3224');
  const [loanEquipmentCode, setLoanEquipmentCode] = useState('AUDIO-YAM-001');
  const [loanSerialNumber, setLoanSerialNumber] = useState('SN-YAM-789210');
  const [loanQuantity, setLoanQuantity] = useState(1);
  const [loanBorrowerName, setLoanBorrowerName] = useState('Ing. Serge ILUNGA');
  const [loanBorrowerPhone, setLoanBorrowerPhone] = useState('+243 81 500 0004');
  const [loanBorrowerOrg, setLoanBorrowerOrg] = useState('Régie VIVA EVENT');
  const [loanProjectName, setLoanProjectName] = useState('Sommet CEEAC 2026');
  const [loanDepartureDate, setLoanDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [loanExpectedReturnDate, setLoanExpectedReturnDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [loanConditionDeparture, setLoanConditionDeparture] = useState('Parfait état certifié. Flight case scellé.');

  // Return Form
  const [returnCondition, setReturnCondition] = useState<EquipmentLoanRecord['returnCondition']>('impeccable');
  const [damageCostUSD, setDamageCostUSD] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState('Contrôle technique effectué au dépôt de Gombe.');

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanBorrowerName || !loanEquipmentName) return;

    issueEquipmentLoan({
      equipmentName: loanEquipmentName,
      equipmentCode: loanEquipmentCode,
      serialNumber: loanSerialNumber,
      quantity: Number(loanQuantity),
      borrowerName: loanBorrowerName,
      borrowerPhone: loanBorrowerPhone,
      borrowerOrganization: loanBorrowerOrg,
      projectName: loanProjectName,
      departureDate: `${loanDepartureDate} 08:30`,
      expectedReturnDate: `${loanExpectedReturnDate} 18:00`,
      departureCondition: loanConditionDeparture,
      issuedBy: currentUser.name
    });

    setIsNewLoanOpen(false);
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForReturn) return;

    returnEquipmentLoan(
      selectedLoanForReturn.id,
      returnCondition,
      currentUser.name,
      Number(damageCostUSD)
    );

    // If damaged, also log in maintenance
    if (returnCondition === 'degrade' || returnCondition === 'en_panne') {
      addMaintenanceLog({
        equipmentName: selectedLoanForReturn.equipmentName,
        equipmentCode: selectedLoanForReturn.equipmentCode,
        date: new Date().toISOString().split('T')[0],
        type: 'curative',
        description: `Réparation suite à retour de prêt : ${returnNotes}. Dégradation signalée.`,
        costUSD: Number(damageCostUSD),
        technicianName: currentUser.name
      });
    }

    setSelectedLoanForReturn(null);
  };

  const activeLoans = loanRecords.filter(l => l.status === 'en_cours');
  const closedLoans = loanRecords.filter(l => l.status !== 'en_cours');

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Gestion des Actifs, Stocks & Matériel Lourd
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Traçabilité Rigoureuse des Prêts de Matériel (QUI, QUOI, QUAND)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Émission des bons de sortie officiels, contrôle contradictoire au départ et au retour, suivi de l'état d'usure et maintenance des équipements audiovisuels et groupes électrogènes.
          </p>
        </div>

        <button
          onClick={() => setIsNewLoanOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Émettre Bon de Prêt</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'loans' ? 'bg-purple-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Bons de Sortie & Prêts ({activeLoans.length} en cours)
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'assets' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Catalogue Actifs & Matériel Lourd
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'maintenance' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Historique Maintenance ({maintenanceLogs.length})
        </button>
      </div>

      {/* VIEW 1: BONS DE PRÊT */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {/* Active Loans Sub-Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Matériel actuellement en mission terrain ({activeLoans.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLoans.map(loan => (
                <div key={loan.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-purple-400 uppercase">{loan.voucherNumber}</span>
                      <h4 className="font-bold text-sm text-white mt-0.5">{loan.equipmentName}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase animate-pulse">
                      En mission
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">QUI (Bénéficiaire) :</span>
                      <p className="font-bold text-white">{loan.borrowerName}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{loan.borrowerPhone}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">POUR QUOI (Chantier) :</span>
                      <p className="font-bold text-white line-clamp-1">{loan.projectName}</p>
                      <p className="text-slate-400 text-[11px]">Qté : {loan.quantity} unité(s)</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">QUAND (Sortie) :</span>
                      <p className="font-mono text-slate-300">{loan.departureDate}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-amber-400 font-bold uppercase text-[10px]">RETOUR ATTENDU :</span>
                      <p className="font-mono text-amber-300 font-bold">{loan.expectedReturnDate}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">État au départ :</span>
                    <p className="text-slate-300 italic">{loan.departureCondition}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-500">Émis par {loan.issuedBy}</span>
                    <button
                      onClick={() => setSelectedLoanForReturn(loan)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Réceptionner & Contrôler Retour</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Returned Loans History */}
          {closedLoans.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Bons de Prêt Restitués & Clôturés ({closedLoans.length})
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Bon</th>
                      <th className="p-3">Équipement</th>
                      <th className="p-3">Emprunteur</th>
                      <th className="p-3">Date Restitution</th>
                      <th className="p-3">État Retour</th>
                      <th className="p-3">Inspecteur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                    {closedLoans.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-bold text-purple-400">{l.voucherNumber}</td>
                        <td className="p-3 font-bold text-white">{l.equipmentName}</td>
                        <td className="p-3 text-slate-300">{l.borrowerName}</td>
                        <td className="p-3 font-mono text-slate-400">{l.actualReturnDate}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                            {l.returnCondition}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{l.inspectedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ACTIFS MATÉRIEL LOURD */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Énergie & Groupes Électrogènes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              3 x Groupes électrogènes insonorisés 500 kVA Cummins/Perkins avec inverseurs automatiques de source, câblages cuivre 95 mm² et cuves de réserve 2000L.
            </p>
            <div className="text-xs font-mono text-amber-400 font-bold pt-2 border-t border-slate-800">
              Valeur Actif : $145,000 USD
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 w-fit">
              <Tv className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Murs d'Images LED & Régie Vidéo 4K</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              120 m² d'écrans LED P2.6 Indoor et P3.9 Outdoor, processeurs Novastar 4K, mélangeurs Blackmagic ATEM Constellation 8K et caméras tourelles PTZ Sony.
            </p>
            <div className="text-xs font-mono text-blue-400 font-bold pt-2 border-t border-slate-800">
              Valeur Actif : $210,000 USD
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit">
              <Volume2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Systèmes Audio Line Array & Traduction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Systèmes Line Array L-Acoustics Kara II / RCF HDL-30, consoles numériques Yamaha CL5/QL5, et 8 cabines de traduction simultanée Bosch DCN Next Generation.
            </p>
            <div className="text-xs font-mono text-purple-400 font-bold pt-2 border-t border-slate-800">
              Valeur Actif : $185,000 USD
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Carnet d'Entretien & Maintenance Préventive</h3>
          </div>

          <div className="space-y-3">
            {maintenanceLogs.map(log => (
              <div key={log.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400">{log.equipmentCode}</span>
                    <strong className="text-white text-sm">{log.equipmentName}</strong>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    log.type === 'preventive' ? 'bg-blue-500/20 text-blue-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    Maintenance {log.type}
                  </span>
                </div>

                <p className="text-slate-300">{log.description}</p>

                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <span>Date : {log.date} • Technicien : {log.technicianName}</span>
                  <span className="text-emerald-400 font-bold">Coût : ${log.costUSD} USD ({(log.costUSD * exchangeRate).toLocaleString()} CDF)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODAL ÉMETTRE BON DE PRÊT ==================== */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Émission de Bon de Sortie & Prêt Matériel</h3>
              </div>
              <button onClick={() => setIsNewLoanOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Désignation du Matériel</label>
                  <input
                    type="text"
                    required
                    value={loanEquipmentName}
                    onChange={e => setLoanEquipmentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Code & Numéro de Série</label>
                  <input
                    type="text"
                    required
                    value={loanSerialNumber}
                    onChange={e => setLoanSerialNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Nom Emprunteur (QUI)</label>
                  <input
                    type="text"
                    required
                    value={loanBorrowerName}
                    onChange={e => setLoanBorrowerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Téléphone Contact</label>
                  <input
                    type="text"
                    required
                    value={loanBorrowerPhone}
                    onChange={e => setLoanBorrowerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Quantité Sortie</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={loanQuantity}
                    onChange={e => setLoanQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Projet / Chantier (POUR QUOI)</label>
                  <input
                    type="text"
                    required
                    value={loanProjectName}
                    onChange={e => setLoanProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Date Retour Prévue (QUAND)</label>
                  <input
                    type="date"
                    required
                    value={loanExpectedReturnDate}
                    onChange={e => setLoanExpectedReturnDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">État Constate au Départ</label>
                <textarea
                  rows={2}
                  required
                  value={loanConditionDeparture}
                  onChange={e => setLoanConditionDeparture(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewLoanOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow"
                >
                  Émettre & Sceller le Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL RÉCEPTION RETOUR MATÉRIEL ==================== */}
      {selectedLoanForReturn && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Contrôle Réception Matériel</h3>
                <p className="text-[11px] text-slate-400">Bon : {selectedLoanForReturn.voucherNumber}</p>
              </div>
              <button onClick={() => setSelectedLoanForReturn(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p>Matériel : <strong className="text-white">{selectedLoanForReturn.equipmentName}</strong></p>
                <p>Emprunteur : <strong className="text-slate-300">{selectedLoanForReturn.borrowerName}</strong></p>
                <p>Sorti le : <span className="font-mono text-slate-400">{selectedLoanForReturn.departureDate}</span></p>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">État Constate au Retour</label>
                <select
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="impeccable">✨ Impeccable (Conforme à la sortie)</option>
                  <option value="usure_normale">Usure normale d'usage</option>
                  <option value="degrade">⚠️ Dégradé (Rayures, chocs légers)</option>
                  <option value="en_panne">🚨 En panne (Nécessite réparation immédiate)</option>
                </select>
              </div>

              {(returnCondition === 'degrade' || returnCondition === 'en_panne') && (
                <div>
                  <label className="text-rose-400 font-bold block mb-1">Coût Estimé Remise en État ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={damageCostUSD}
                    onChange={e => setDamageCostUSD(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-rose-500/40 rounded-xl p-2.5 text-rose-400 font-mono font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 font-bold block mb-1">Remarques de l'Inspecteur Technique</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForReturn(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow"
                >
                  Valider le Retour au Dépôt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
