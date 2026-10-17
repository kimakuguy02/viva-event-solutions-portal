import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { DEPARTMENTS_DATA } from '../../data/vivaData';
import { QuoteRequest } from '../../types';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Mail,
  Phone,
  Building,
  User,
  DollarSign,
  AlertCircle,
  ExternalLink,
  X
} from 'lucide-react';

export const QuotesManager: React.FC = () => {
  const { quotes, updateQuoteStatus, submitQuoteRequest } = useProjectData();
  const [dupError, setDupError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showProformaModal, setShowProformaModal] = useState(false);

  const getStatusBadge = (status: QuoteRequest['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">Nouveau Soumis</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">En Étude Ingénierie</span>;
      case 'quote_issued':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">Devis Transmis</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">Approuvé & Signé</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">Rejeté / Annulé</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Guichet Unique : Gestion des Devis
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Traitement des demandes entrantes, chiffrage des prestations multiservices et génération de pro-forma
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="font-bold text-amber-400">{quotes.length}</span> Dossiers enregistrés
        </div>
      </div>

      {/* Quotes Cards Grid */}
      {dupError && <p className="text-xs text-rose-400 font-bold">{dupError}</p>}
      <div className="grid grid-cols-1 gap-4">
        {quotes.map(quote => (
          <div
            key={quote.id}
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-amber-400">{quote.referenceNumber}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">Reçu le {quote.createdAt}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">{quote.priority}</span>
              </div>
              <div>{getStatusBadge(quote.status)}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Event & Client info */}
              <div className="lg:col-span-7 space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-white">{quote.eventName}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <strong>{quote.clientName}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span>{quote.clientOrganization}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{quote.clientPhone}</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quote.selectedDepartmentIds.map(dId => {
                    const dept = DEPARTMENTS_DATA.find(d => d.id === dId);
                    return (
                      <span key={dId} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-amber-300 font-semibold">
                        {dept?.shortName || `Pôle ${dId}`}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Budget & Actions */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] text-slate-500 uppercase">Montant Devis Estimé</span>
                  <div className="text-xl font-black text-amber-400">
                    ${quote.estimatedBudgetUSD.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={quote.status}
                    onChange={e => updateQuoteStatus(quote.id, e.target.value as any).catch(err =>
                      console.error('[Wave 2] Statut devis refusé :', err)
                    )}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="submitted">Soumis</option>
                    <option value="under_review">En Étude</option>
                    <option value="quote_issued">Devis Émis</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Rejeté</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedQuote(quote);
                      setShowProformaModal(true);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
                    title="Imprimer / Visualiser le Pro-Forma"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      setDupError(null);
                      try {
                        await submitQuoteRequest({
                          clientName: quote.clientName,
                          clientOrganization: quote.clientOrganization,
                          clientEmail: quote.clientEmail,
                          clientPhone: quote.clientPhone,
                          eventType: quote.eventType,
                          eventName: `${quote.eventName} (copie)`,
                          eventDate: quote.eventDate,
                          location: quote.location,
                          estimatedAttendees: quote.estimatedAttendees,
                          selectedDepartmentIds: quote.selectedDepartmentIds,
                          requirements: quote.requirements,
                          customNotes: quote.customNotes,
                          estimatedBudgetUSD: quote.estimatedBudgetUSD,
                          priority: quote.priority,
                        });
                      } catch (e) {
                        setDupError(`Duplication refusée : ${e instanceof Error ? e.message : String(e)}.`);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold"
                    title="Dupliquer (nouvelle référence)"
                  >
                    Dupliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proforma View Modal */}
      {showProformaModal && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                  DEVIS PRO-FORMA OFFICIEL
                </span>
                <h3 className="text-xl font-bold text-white">{selectedQuote.referenceNumber}</h3>
              </div>
              <button
                onClick={() => setShowProformaModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-bold text-white text-sm">VIVA EVENT SOLUTIONS SARLU</h4>
                  <p className="text-slate-400">RCCM: CD/KIN/RCCM/24-B-01492 • ID.NAT: 01-G4701-N44921</p>
                  <p className="text-slate-400">Kinshasa / Gombe, RDC</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Client : <strong className="text-white">{selectedQuote.clientName}</strong></p>
                  <p className="text-slate-400">{selectedQuote.clientOrganization}</p>
                  <p className="text-slate-400">{selectedQuote.clientEmail} • {selectedQuote.clientPhone}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase block font-bold">Objet :</span>
                <span className="text-white font-semibold">{selectedQuote.eventName} ({selectedQuote.eventType})</span>
                <p className="text-slate-400 mt-1">Lieu : {selectedQuote.location} • Participants : {selectedQuote.estimatedAttendees}</p>
              </div>

              <div className="pt-2">
                <span className="text-slate-400 uppercase block font-bold mb-2">Pôles & Prestations Intégrées :</span>
                <div className="space-y-1">
                  {selectedQuote.selectedDepartmentIds.map(dId => {
                    const dept = DEPARTMENTS_DATA.find(d => d.id === dId);
                    return (
                      <div key={dId} className="flex justify-between text-slate-300 py-1 border-b border-slate-900">
                        <span>Pôle {dId} : {dept?.name}</span>
                        <span className="font-mono text-amber-400">Inclus</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">TOTAL ESTIMÉ HT (USD) :</span>
                <span className="text-xl font-black text-amber-400">${selectedQuote.estimatedBudgetUSD.toLocaleString()} USD</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Devis Pro-Forma</span>
              </button>
              <button
                onClick={() => setShowProformaModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
