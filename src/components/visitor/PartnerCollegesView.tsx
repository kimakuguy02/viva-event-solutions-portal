import React, { useState } from 'react';
import { PARTNER_COLLEGES_DATA } from '../../data/vivaData';
import { useProjectData } from '../../context/ProjectDataContext';
import { PartnerCollege } from '../../types';
import {
  Users,
  ShieldCheck,
  FileCheck2,
  Lock,
  Cpu,
  Globe,
  Building2,
  Languages,
  ShieldAlert,
  Hammer,
  Sparkle,
  CheckCircle,
  Star,
  CheckCircle2
} from 'lucide-react';

export const PartnerCollegesView: React.FC = () => {
  const { partners } = useProjectData();
  const [activeCollege, setActiveCollege] = useState<PartnerCollege>(PARTNER_COLLEGES_DATA[0]);

  const getCollegeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5 text-[#4A6CF7]" />;
      case 'Globe': return <Globe className="w-5 h-5 text-[#4A6CF7]" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-[#4A6CF7]" />;
      case 'Languages': return <Languages className="w-5 h-5 text-[#8B5CF6]" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-[#4A6CF7]" />;
      case 'Hammer': return <Hammer className="w-5 h-5 text-[#8B5CF6]" />;
      case 'Sparkle': return <Sparkle className="w-5 h-5 text-[#8B5CF6]" />;
      default: return <Users className="w-5 h-5 text-[#4A6CF7]" />;
    }
  };

  const currentPartners = partners.filter(p => p.collegeId === activeCollege.id);

  return (
    <section className="py-16 bg-white" id="partners-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4A6CF7] bg-blue-50 px-3.5 py-1.5 rounded-full inline-block">
            Écosystème Stratégique & Réseau d'Élite
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Les Sept Collèges de Prestataires Agréés
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            Une structuration rigoureuse en collèges spécialisés pour garantir une capacité de montée en charge instantanée, une conformité OAPI et une exécution irréprochable.
          </p>
        </div>

        {/* Governance Pillars Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#4A6CF7] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Procédures SOP</h4>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">Protocoles standardisés de qualité et délais d'exécution stricts.</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#4A6CF7] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Audits Continus</h4>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">Système de notation régulier et audits de performance terrain.</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#4A6CF7] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clause & OAPI</h4>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">Accords de confidentialité et protection rigoureuse des actifs.</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Modularité Agile</h4>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">Mobilisation immédiate des ressources selon l'envergure du projet.</p>
            </div>
          </div>
        </div>

        {/* Interactive Colleges Master-Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column : 7 Colleges Selectors */}
          <div className="lg:col-span-5 space-y-3">
            {PARTNER_COLLEGES_DATA.map(col => {
              const isSelected = activeCollege.id === col.id;
              return (
                <div
                  key={col.id}
                  onClick={() => setActiveCollege(col)}
                  className={`p-4 sm:p-5 rounded-3xl cursor-pointer transition-all duration-200 border flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#4A6CF7] shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#4A6CF7] text-white' : 'bg-blue-50 text-[#4A6CF7]'}`}>
                      {getCollegeIcon(col.iconName)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#4A6CF7] tracking-wider uppercase block">
                        COLLÈGE 0{col.id} • {col.code}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {col.name}
                      </h4>
                    </div>
                  </div>

                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${isSelected ? 'bg-[#4A6CF7] text-white' : 'bg-slate-100 text-[#6B7280]'}`}>
                    {col.memberCount} membres
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column : Detail of Selected College */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-mono font-bold text-[#4A6CF7] tracking-wider uppercase">
                  COLLÈGE D'ÉLITE 0{activeCollege.id}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {activeCollege.name}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Agrément VIVA Actif</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {activeCollege.description}
            </p>

            {/* Responsibilities */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Missions Clés & Engagements Opérationnels
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeCollege.keyResponsibilities.map((resp, rIdx) => (
                  <div key={rIdx} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#4A6CF7] shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SOP Criteria */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2.5">
              <h4 className="text-xs font-bold text-[#4A6CF7] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Critères d'Audit & Protocoles SOP Requis</span>
              </h4>
              <ul className="space-y-1.5 pt-1">
                {activeCollege.sopCriteria.map((crit, cIdx) => (
                  <li key={cIdx} className="text-xs text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A6CF7] shrink-0"></span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sample Accredited Partner in this College */}
            {currentPartners.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Prestataire Élite Associé (Exemple Certifié)
                </h4>
                {currentPartners.map(partner => (
                  <div key={partner.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{partner.name}</span>
                        <span className="flex items-center gap-0.5 text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-blue-600 text-blue-600" />
                          <span>{partner.rating.toFixed(1)}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">{partner.specialty}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{partner.city}, {partner.country} • Contact : {partner.contactPerson}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100">
                        Audit SOP Validé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
