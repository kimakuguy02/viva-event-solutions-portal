import React from 'react';
import { STRATEGIC_PILLARS } from '../../data/vivaData';
import { ShieldCheck, Cpu, Truck, Leaf, CheckCircle2, ArrowRight } from 'lucide-react';

interface VisionPillarsProps {
  onLearnMore?: () => void;
}

export const VisionPillars: React.FC<VisionPillarsProps> = ({ onLearnMore }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-amber-400" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-purple-400" />;
      case 'Truck':
        return <Truck className="w-6 h-6 text-blue-400" />;
      case 'Leaf':
        return <Leaf className="w-6 h-6 text-emerald-400" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <section className="py-20 bg-slate-900/40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Piliers Fondamentaux
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Quatre Axes Programmatiques Majeurs
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            L'architecture stratégique qui garantit la rigueur, l'autonomie et la souveraineté opérationnelle de VIVA EVENT SOLUTIONS SARLU sur le continent.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {STRATEGIC_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-xl relative overflow-hidden group"
            >
              {/* Pillar Number Background */}
              <div className="absolute top-4 right-6 text-5xl font-black text-slate-800/40 group-hover:text-amber-500/10 transition-colors pointer-events-none">
                {pillar.number}
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 group-hover:bg-slate-750 group-hover:border-amber-500/30 transition-colors">
                  {getIcon(pillar.icon)}
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-1.5">
                    {pillar.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {pillar.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed pt-2">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
