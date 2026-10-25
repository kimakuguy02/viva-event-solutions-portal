import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { Truck, Zap, Volume2, Tv, Building, Radio, ArrowRight, ShieldCheck } from 'lucide-react';

interface EquipmentShowcaseProps {
  onOpenQuoteWithEquipment: () => void;
}

export const EquipmentShowcase: React.FC<EquipmentShowcaseProps> = ({ onOpenQuoteWithEquipment }) => {
  const { equipment } = useProjectData();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'audio': return <Volume2 className="w-5 h-5 text-[var(--viva-primary)]" />;
      case 'led_screens': return <Tv className="w-5 h-5 text-[#8B5CF6]" />;
      case 'power_generators': return <Zap className="w-5 h-5 text-[var(--viva-primary)]" />;
      case 'tents': return <Building className="w-5 h-5 text-[var(--viva-primary)]" />;
      case 'broadcast': return <Radio className="w-5 h-5 text-[#8B5CF6]" />;
      default: return <Truck className="w-5 h-5 text-[var(--viva-primary)]" />;
    }
  };

  return (
    <section className="py-16 bg-white" id="equipment-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--viva-primary)] bg-blue-50 px-3.5 py-1.5 rounded-full inline-block">
            Autonomie Logistique & Intégration Verticale
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Parc Matériel Technique & Scénique Lourd
          </h2>
          <p className="text-sm sm:text-base text-[var(--viva-text-muted)] leading-relaxed">
            Le plus grand parc d'équipements de pointe en propre en RDC pour s'affranchir des aléas de sous-traitance et garantir une souveraineté technique totale.
          </p>
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map(item => (
            <div
              key={item.id}
              className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-100 transition-all duration-300 shadow-sm hover:shadow-xl transform hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getCategoryIcon(item.category)}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                    {item.quantityAvailable} / {item.quantityTotal} Dispos
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold text-[var(--viva-primary)] bg-blue-50/60 px-2 py-0.5 rounded-md">
                  RÉF : {item.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-[var(--viva-primary)] transition-colors">
                  {item.name}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--viva-text-muted)] mt-3 leading-relaxed">
                  {item.specs}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-[var(--viva-text-muted)]">
                  {item.powerRatingKW && (
                    <div className="flex items-center justify-between">
                      <span>Puissance requise :</span>
                      <span className="font-semibold text-slate-800">{item.powerRatingKW} kW</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Base logistique :</span>
                    <span className="text-slate-800 font-medium">{item.locationStorage}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[var(--viva-text-muted)] block font-medium">Tarif Journalier</span>
                  <div className="text-xl font-extrabold text-slate-900">
                    ${item.dailyRateUSD.toLocaleString()} <span className="text-xs text-[var(--viva-text-muted)] font-normal">USD/j</span>
                  </div>
                </div>

                <button
                  onClick={onOpenQuoteWithEquipment}
                  className="px-4 py-2.5 rounded-full bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Réserver</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
