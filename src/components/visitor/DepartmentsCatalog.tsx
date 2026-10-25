import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { Department } from '../../types';
import {
  ShoppingBag,
  Compass,
  MonitorPlay,
  Sparkles,
  Palette,
  Utensils,
  Zap,
  Megaphone,
  Award,
  Car,
  Languages,
  ShieldAlert,
  Film,
  Hotel,
  ShieldCheck,
  Search,
  CheckCircle2,
  ArrowRight,
  X,
  FileText,
  HelpCircle,
  Layers,
  Wrench
} from 'lucide-react';

interface DepartmentsCatalogProps {
  onSelectDepartmentForQuote?: (deptId: number) => void;
  onRedirectToClientSpace?: () => void;
}

export const DepartmentsCatalog: React.FC<DepartmentsCatalogProps> = ({
  onSelectDepartmentForQuote
}) => {
  const { departments } = useProjectData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeModalDept, setActiveModalDept] = useState<Department | null>(null);

  const getDepartmentIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'MonitorPlay': return <MonitorPlay className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Megaphone': return <Megaphone className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Car': return <Car className={className} />;
      case 'Languages': return <Languages className={className} />;
      case 'ShieldAlert': return <ShieldAlert className={className} />;
      case 'Film': return <Film className={className} />;
      case 'Hotel': return <Hotel className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const categories = [
    { id: 'all', label: 'Tous les 15 Pôles' },
    { id: 'engineering', label: 'Stratégie & Sommets' },
    { id: 'tech', label: 'Audiovisuel & Tech 4K' },
    { id: 'logistics', label: 'Matériel & Énergie' },
    { id: 'security', label: 'Protocole & Sûreté' },
    { id: 'catering', label: 'Scénographie & Réception' }
  ];

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.meaning && dept.meaning.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dept.justification && dept.justification.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dept.concreteExample && dept.concreteExample.toLowerCase().includes(searchQuery.toLowerCase())) ||
      dept.subPillars.some(sub => sub.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'engineering') return matchesSearch && (dept.category === 'engineering' || dept.category === 'commerce');
    if (activeCategory === 'tech') return matchesSearch && (dept.category === 'tech' || dept.id === 3 || dept.id === 4 || dept.id === 7 || dept.id === 13);
    if (activeCategory === 'logistics') return matchesSearch && (dept.category === 'logistics' || dept.id === 7 || dept.id === 10);
    if (activeCategory === 'security') return matchesSearch && (dept.category === 'security' || dept.id === 8 || dept.id === 11 || dept.id === 12);
    if (activeCategory === 'catering') return matchesSearch && (dept.category === 'catering' || dept.category === 'design' || dept.id === 5 || dept.id === 6 || dept.id === 14);
    return matchesSearch;
  });

  return (
    <section className="py-20 lg:py-28 bg-slate-50/50" id="departments-catalog-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 1. Header Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--viva-muted-surface)] border border-[var(--viva-border)] text-xs font-semibold text-[var(--viva-primary)]">
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Opérationnelle 360°</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Nos 15 Pôles d'Ingénierie Intégrés
          </h2>

          <p className="text-base text-[var(--viva-text-muted)] leading-relaxed">
            Chaque pôle dispose de ses équipes dédiées et de son propre parc matériel, garantissant une exécution millimétrée sans dépendance de sous-traitance.
          </p>
        </div>

        {/* 2. Filters & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          {/* Category Tabs: Rounded Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[var(--viva-primary)] text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-100 text-[var(--viva-text-muted)] border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un pôle, matériel, mot-clé..."
              className="w-full pl-10 pr-8 py-2.5 rounded-full border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--viva-primary)]/20 focus:border-[var(--viva-primary)] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Grid of the 15 Poles: Cartes Blanches, Coins Très Arrondis (rounded-3xl), Ombre Douce, Icônes Bleues Rondes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7" id="poles-grid-container">
          {filteredDepartments.map((dept) => {
            const poleNumberFormatted = dept.number < 10 ? `0${dept.number}` : dept.number;

            return (
              <div
                key={dept.id}
                className="flex flex-col justify-between bg-white rounded-3xl p-7 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-[var(--viva-border)] transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="space-y-5">
                  {/* Round Blue Icon + Pole Number */}
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-full bg-[var(--viva-muted-surface)] text-[var(--viva-primary)] flex items-center justify-center transition-transform group-hover:scale-105">
                      {getDepartmentIcon(dept.iconName, "w-6 h-6")}
                    </div>
                    <span className="text-[11px] font-bold font-mono text-[var(--viva-primary)] bg-[var(--viva-muted-surface)] px-3 py-1 rounded-full">
                      PÔLE {poleNumberFormatted}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-[var(--viva-primary)] transition-colors">
                      {dept.shortName || dept.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#8B5CF6] mt-1 line-clamp-1">
                      {dept.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[var(--viva-text-muted)] leading-relaxed line-clamp-3">
                    {dept.meaning || dept.description}
                  </p>

                  {/* Concrete example or Capabilities pill */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-[var(--viva-text-muted)] space-y-1.5">
                    {dept.concreteExample ? (
                      <p className="line-clamp-2">
                        <strong className="text-slate-900 font-semibold">Exemple : </strong>
                        {dept.concreteExample}
                      </p>
                    ) : (
                      dept.subPillars.slice(0, 2).map((sub, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--viva-primary)] shrink-0" />
                          <span className="truncate font-medium text-slate-700">{sub.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2.5 pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => setActiveModalDept(dept)}
                    className="flex-1 py-2.5 px-4 rounded-full bg-slate-50 hover:bg-[var(--viva-primary)] hover:text-white text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Détails & Spécifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {onSelectDepartmentForQuote && (
                    <button
                      onClick={() => onSelectDepartmentForQuote(dept.id)}
                      title="Ajouter au devis"
                      className="p-2.5 rounded-full bg-[var(--viva-muted-surface)] text-[var(--viva-primary)] hover:bg-[var(--viva-primary)] hover:text-white transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Complete Modal for Pole Details (Clean White SaaS Look) */}
        {activeModalDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto relative">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--viva-muted-surface)] text-[var(--viva-primary)] flex items-center justify-center">
                    {getDepartmentIcon(activeModalDept.iconName, "w-7 h-7")}
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-[var(--viva-primary)] uppercase tracking-wider block">
                      PÔLE {activeModalDept.number < 10 ? `0${activeModalDept.number}` : activeModalDept.number} SUR 15
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {activeModalDept.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalDept(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tagline */}
              <div className="p-4 rounded-2xl bg-[var(--viva-muted-surface)] border border-[var(--viva-border)] text-xs sm:text-sm font-medium text-[var(--viva-primary)] italic">
                « {activeModalDept.tagline} »
              </div>

              {/* Structured Content */}
              <div className="space-y-4 text-xs sm:text-sm">
                {activeModalDept.meaning && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase text-[var(--viva-primary)]">
                      <HelpCircle className="w-4 h-4" />
                      <span>Rôle & Périmètre Stratégique</span>
                    </div>
                    <p className="text-[var(--viva-text-muted)] leading-relaxed">
                      {activeModalDept.meaning}
                    </p>
                  </div>
                )}

                {activeModalDept.justification && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Justification Opérationnelle en RDC</span>
                    </div>
                    <p className="text-[var(--viva-text-muted)] leading-relaxed">
                      {activeModalDept.justification}
                    </p>
                  </div>
                )}

                {activeModalDept.concreteExample && (
                  <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase text-[#8B5CF6]">
                      <Sparkles className="w-4 h-4" />
                      <span>Cas Réel & Intervention Concrète</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {activeModalDept.concreteExample}
                    </p>
                  </div>
                )}

                {activeModalDept.equipmentAvailable && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase text-[var(--viva-primary)]">
                      <Wrench className="w-4 h-4" />
                      <span>Équipements & Matériels Clés</span>
                    </div>
                    <p className="text-[var(--viva-text-muted)] leading-relaxed font-mono text-xs">
                      {activeModalDept.equipmentAvailable}
                    </p>
                  </div>
                )}
              </div>

              {/* Subpillars */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Axes d'Intervention Spécialisés
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeModalDept.subPillars.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1"
                    >
                      <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                        <span className="w-2 h-2 rounded-full bg-[var(--viva-primary)]" />
                        <span>{sub.title}</span>
                      </div>
                      <p className="text-[11px] text-[var(--viva-text-muted)] leading-relaxed">
                        {sub.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <button
                  onClick={() => setActiveModalDept(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Fermer
                </button>

                {onSelectDepartmentForQuote && (
                  <button
                    onClick={() => {
                      const id = activeModalDept.id;
                      setActiveModalDept(null);
                      onSelectDepartmentForQuote(id);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] text-white text-xs font-bold shadow-md hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Demander un Devis pour ce Pôle</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
