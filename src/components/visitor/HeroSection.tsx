import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useTheme } from '../../context/ThemeContext';
import { EditableSectionWrapper } from '../common/VisualEditOverlayModal';
import heroEventImage from '../../assets/images/corporate_event_stage_1789481825088.jpg';
import {
  Search,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Radio,
  Users,
  PartyPopper
} from 'lucide-react';

interface HeroSectionProps {
  onOpenQuoteModal: () => void;
  onExploreDepartments: () => void;
  onOpenWelcomeAbout?: () => void;
  onExplorePartners?: () => void;
  onOpenBrandCharter?: () => void;
  onOpenThemeStudio?: () => void;
  onOpenReservation?: () => void;
  onOpenClientRegister?: () => void;
  onOpenCatalog?: () => void;
  onSearch?: (query: string) => void;
}

const HERO_CATEGORIES = [
  { label: 'Sommets & conférences', icon: Layers, tab: 'departments' },
  { label: 'Galas & réceptions', icon: Sparkles, tab: 'partners' },
  { label: 'Concerts & live', icon: Radio, tab: 'live-hub' },
  { label: 'Production technique', icon: Truck, tab: 'equipment' },
  { label: 'B2B & partenaires', icon: Users, tab: 'partners' }
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreDepartments,
  onOpenWelcomeAbout,
  onOpenReservation,
  onOpenCatalog,
  onSearch
}) => {
  const { platformConfig, getCmsValue } = useProjectData();
  const { displayStyle } = useTheme();
  const [query, setQuery] = useState('');

  const heroTitle = getCmsValue('home.hero.title', 'content', "L'ingénierie événementielle globale de haute précision en RDC & Afrique Centrale");
  const heroDescription = getCmsValue('home.hero.description', 'content', platformConfig.heroSubtitle || "Conception scénographique 3D, sonorisation Line Array, régie technique 4K et logistique autonome pour sommets d'État, conférences internationales et rassemblements d'affaires.");
  const primaryBtn = getCmsValue('home.hero.title', 'primaryButtonText', 'Réserver un événement');
  const secondaryBtn = getCmsValue('home.hero.title', 'secondaryButtonText', 'Nos 15 pôles spécialisés');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSearch) onSearch(query.trim());
    else onOpenCatalog?.();
  };

  // Identité Viva Moderne : hero immersif plein cadre, texte blanc, recherche
  // blanche et cartes en verre — la structure éditoriale reste identique.
  if (displayStyle === 'moderne') {
    return (
      <EditableSectionWrapper cmsKey="home.hero.title" sectionName="Bannière Principale (Hero)">
        <section className="relative isolate overflow-hidden">
          <img
            src={heroEventImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10" style={{ background: 'var(--viva-hero-gradient)' }} aria-hidden="true" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 sm:pt-24 sm:pb-20">
            <div className="max-w-3xl space-y-6 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--viva-accent)' }} />
                <span>Guichet unique • RDC & Afrique Centrale</span>
              </div>

              <h1 className="viva-heading text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
                {heroTitle}
              </h1>

              <p className="max-w-2xl text-sm sm:text-lg leading-relaxed text-white/80">
                {heroDescription}
              </p>

              <form onSubmit={handleSearch} className="max-w-2xl pt-1" role="search">
                <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-2xl shadow-black/25">
                  <Search className="w-5 h-5 shrink-0 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Rechercher un événement, un lieu, une expertise…"
                    aria-label="Rechercher un événement"
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Rechercher"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
                    style={{ backgroundColor: 'var(--viva-accent)' }}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button onClick={onOpenReservation} className="viva-btn-accent px-6 py-3 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{primaryBtn}</span>
                </button>
                <button
                  onClick={onExploreDepartments}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <Layers className="w-4 h-4" />
                  <span>{secondaryBtn}</span>
                </button>
                <button
                  onClick={onOpenCatalog}
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 text-xs font-semibold text-white/85 transition-opacity hover:opacity-100"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Voir le catalogue</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 pt-1 text-[11px] text-white/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Parc matériel en propre, sans intermédiaire</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Normes de sécurité & protocoles d'État</span>
                </div>
              </div>
            </div>

            {/* Univers d'exploration */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 lg:grid-cols-5">
              {HERO_CATEGORIES.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.label}
                    onClick={() => {
                      if (category.tab === 'departments') onExploreDepartments();
                      else if (onSearch) onSearch(category.label);
                      else onOpenCatalog?.();
                    }}
                    className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-white sm:text-xs">{category.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chiffres clés — éditoriaux, aucune donnée d'exploitation inventée */}
            <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-3">
              {[
                { value: '15 pôles', title: 'Ingénierie 360° intégrée', text: 'Scénographie, captation broadcast, sonorisation et sûreté sans sous-traitance tierce.' },
                { value: 'Grands comptes', title: 'Sommets & rassemblements', text: 'Gouvernements, multinationales et institutions régionales accompagnés de bout en bout.' },
                { value: 'Sur mesure', title: 'Satisfaction & précision', text: 'Exigence de précision, autonomie énergétique et continuité de service pendant vos événements.' }
              ].map(stat => (
                <div key={stat.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <div className="viva-heading text-xl font-extrabold text-white sm:text-2xl">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold text-white">{stat.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/70">{stat.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={onOpenWelcomeAbout}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80 hover:text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Présentation officielle de la structure ↓</span>
              </button>
            </div>
          </div>
        </section>
      </EditableSectionWrapper>
    );
  }

  return (
    <EditableSectionWrapper cmsKey="home.hero.title" sectionName="Bannière Principale (Hero)">
      <section className="viva-hero relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
        {/* Halos colorés : violet, rose et bleu électrique */}
        <div
          className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-[110px] pointer-events-none opacity-60"
          style={{ backgroundColor: 'var(--viva-primary)' }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full blur-[120px] pointer-events-none opacity-45"
          style={{ backgroundColor: 'var(--viva-accent)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-1/2 w-[420px] h-[420px] rounded-full blur-[110px] pointer-events-none opacity-40"
          style={{ backgroundColor: 'var(--viva-tertiary)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-6 sm:space-y-7">
              <div className="viva-hero-chip inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--viva-accent)' }} />
                <span>Guichet unique • Ingénierie & régie de pointe</span>
              </div>

              <h1 className="viva-heading text-3xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.08]">
                {heroTitle}
              </h1>

              <p className="viva-muted text-sm sm:text-lg leading-relaxed max-w-2xl">
                {heroDescription}
              </p>

              {/* Recherche principale */}
              <form onSubmit={handleSearch} className="max-w-xl" role="search">
                <div
                  className="flex items-center gap-2 p-1.5 pl-4 rounded-full border"
                  style={{
                    borderColor: 'var(--viva-hero-chip-border)',
                    backgroundColor: 'var(--viva-bg-surface)',
                    boxShadow: 'var(--viva-card-shadow)'
                  }}
                >
                  <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--viva-text-muted)' }} />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Rechercher un événement, un lieu, une expertise…"
                    aria-label="Rechercher un événement"
                    className="flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0"
                    style={{ color: 'var(--viva-text-main)' }}
                  />
                  <button type="submit" className="viva-btn-primary px-4 py-2 text-xs shrink-0">
                    <span>Rechercher</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="btn-hero-reservation"
                  onClick={onOpenReservation}
                  className="viva-btn-primary px-6 py-3 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{primaryBtn}</span>
                </button>

                <button
                  id="btn-hero-explore-poles"
                  onClick={onExploreDepartments}
                  className="viva-btn-ghost px-5 py-3 text-sm"
                  style={{ color: 'var(--viva-hero-text)', borderColor: 'var(--viva-hero-chip-border)' }}
                >
                  <Layers className="w-4 h-4" />
                  <span>{secondaryBtn}</span>
                </button>

                <button
                  onClick={onOpenCatalog}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold rounded-full hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--viva-hero-text)' }}
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Voir le catalogue</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                  <span className="viva-muted">Parc matériel en propre, sans intermédiaire</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                  <span className="viva-muted">Normes de sécurité & protocoles d'État</span>
                </div>
              </div>
            </div>

            {/* Visuel principal */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div
                  className="absolute -inset-3 rounded-[2rem] blur-2xl opacity-50"
                  style={{ background: 'var(--viva-accent-gradient)' }}
                  aria-hidden="true"
                />
                <div
                  className="relative overflow-hidden border"
                  style={{
                    borderRadius: 'var(--viva-radius-card)',
                    borderColor: 'var(--viva-hero-chip-border)',
                    boxShadow: 'var(--viva-card-shadow)',
                    backgroundColor: 'var(--viva-bg-surface)'
                  }}
                >
                  <img
                    src={heroEventImage}
                    alt="Scène événementielle produite par VIVA Event Solutions"
                    className="w-full h-[300px] sm:h-[380px] object-cover"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl border backdrop-blur-md"
                      style={{
                        backgroundColor: 'var(--viva-nav-bg)',
                        borderColor: 'var(--viva-border)'
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: 'var(--viva-text-main)' }}>
                            Régie technique 4K & sonorisation
                          </div>
                          <div className="text-[10px] truncate" style={{ color: 'var(--viva-text-muted)' }}>
                            Kinshasa • Lubumbashi • Goma • Brazzaville
                          </div>
                        </div>
                      </div>
                      <span className="viva-chip shrink-0 !text-[10px]" style={{ color: 'var(--viva-primary)' }}>
                        Énergie autonome
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catégories rapides */}
          <div className="mt-10 sm:mt-12">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] viva-muted">Explorer par univers</span>
              <span className="flex-1 h-px" style={{ backgroundColor: 'var(--viva-hero-chip-border)' }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HERO_CATEGORIES.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.label}
                    onClick={() => {
                      if (category.tab === 'departments') onExploreDepartments();
                      else if (onSearch) onSearch(category.label);
                      else onOpenCatalog?.();
                    }}
                    className="viva-hero-chip inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chiffres clés — éditoriaux, pas de données d'exploitation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 sm:mt-14">
            {[
              { value: '15 pôles', title: 'Ingénierie 360° intégrée', text: 'Scénographie, captation broadcast, sonorisation et sûreté sans sous-traitance tierce.' },
              { value: 'Grands comptes', title: 'Sommets & rassemblements', text: 'Gouvernements, multinationales et institutions régionales accompagnés de bout en bout.' },
              { value: 'Sur mesure', title: 'Satisfaction & précision', text: 'Exigence de précision, autonomie énergétique et continuité de service pendant vos événements.' }
            ].map(stat => (
              <div
                key={stat.title}
                className="p-5 rounded-2xl border backdrop-blur-sm"
                style={{ borderColor: 'var(--viva-hero-chip-border)', backgroundColor: 'var(--viva-hero-chip-bg)' }}
              >
                <div className="viva-heading text-2xl sm:text-3xl font-extrabold viva-gradient-text">{stat.value}</div>
                <div className="text-sm font-semibold mt-1.5" style={{ color: 'var(--viva-hero-text)' }}>{stat.title}</div>
                <p className="viva-muted text-[11px] mt-1 leading-relaxed">{stat.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={onOpenWelcomeAbout}
              className="text-[11px] font-semibold inline-flex items-center gap-1.5 hover:opacity-80"
              style={{ color: 'var(--viva-hero-muted)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Présentation officielle de la structure ↓</span>
            </button>
          </div>
        </div>
      </section>
    </EditableSectionWrapper>
  );
};
