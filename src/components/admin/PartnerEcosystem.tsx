import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { PARTNER_COLLEGES_DATA } from '../../data/vivaData';
import { Partner } from '../../types';
import {
  Users,
  ShieldCheck,
  Star,
  FileCheck2,
  Lock,
  Building,
  Mail,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PartnerEcosystem: React.FC = () => {
  const { partners, updatePartnerStatus } = useProjectData();
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | 'all'>('all');

  const filteredPartners = partners.filter(p => {
    if (selectedCollegeId === 'all') return true;
    return p.collegeId === selectedCollegeId;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Écosystème des Partenaires & 7 Collèges
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gouvernance SOP, clauses de confidentialité, audits continus et certification OAPI
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <span>Total Partenaires Élite :</span>
          <span className="font-bold text-amber-400">108 Prestataires Agréés</span>
        </div>
      </div>

      {/* College Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCollegeId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCollegeId === 'all'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Tous les Collèges
        </button>
        {PARTNER_COLLEGES_DATA.map(col => (
          <button
            key={col.id}
            onClick={() => setSelectedCollegeId(col.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCollegeId === col.id
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Collège {col.id} : {col.code}
          </button>
        ))}
      </div>

      {/* Partners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPartners.map(partner => {
          const college = PARTNER_COLLEGES_DATA.find(c => c.id === partner.collegeId);
          return (
            <div
              key={partner.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                      COLLÈGE 0{partner.collegeId} • {college?.code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{partner.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg text-amber-400 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{partner.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3">{partner.specialty}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <p>Contact : <strong className="text-slate-200">{partner.contactPerson}</strong></p>
                  <p>{partner.email} • {partner.phone}</p>
                  <p>{partner.city}, {partner.country}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Conforme OAPI</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>Accord Confidentialité Signé</span>
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <span className="text-slate-500">Statut d'Audit :</span>
                <select
                  value={partner.status}
                  onChange={e => updatePartnerStatus(partner.id, e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-amber-300 focus:outline-none"
                >
                  <option value="certified">Certifié & Validé</option>
                  <option value="pending_audit">Audit en Cours</option>
                  <option value="renewal_needed">Renouvellement Requis</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
