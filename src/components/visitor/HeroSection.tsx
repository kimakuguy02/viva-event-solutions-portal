import React from 'react';
import { VIVA_COMPANY_INFO } from '../../data/vivaData';
import { useProjectData } from '../../context/ProjectDataContext';
import { EditableSectionWrapper } from '../common/VisualEditOverlayModal';
import heroEventImage from '../../assets/images/corporate_event_stage_1789481825088.jpg';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  UserPlus
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
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenQuoteModal,
  onExploreDepartments,
  onOpenWelcomeAbout,
  onOpenReservation,
  onOpenClientRegister
}) => {
  const { platformConfig, getCmsValue } = useProjectData();

  const heroTitle = getCmsValue('home.hero.title', 'content', "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale");
  const heroDescription = getCmsValue('home.hero.description', 'content', platformConfig.heroSubtitle || "Conception scénographique 3D, sonorisation Line Array, régie technique 4K et logistique autonome pour sommets d'État, conférences internationales et rassemblements d'affaires.");
  const primaryBtn = getCmsValue('home.hero.title', 'primaryButtonText', 'Réserver un Événement');
  const secondaryBtn = getCmsValue('home.hero.title', 'secondaryButtonText', 'Nos 15 Pôles Spécialisés');

  return (
    <EditableSectionWrapper cmsKey="home.hero.title" sectionName="Bannière Principale (Hero)">
      <section className="relative overflow-hidden bg-white pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-100">
        {/* Abstract Blobs: Floutés Bleus & Violets */}
        <div className="absolute -top-24 -left-20 w-[450px] h-[450px] rounded-full bg-[#4A6CF7]/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[550px] h-[550px] rounded-full bg-[#8B5CF6]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-blue-100/40 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* LEFT: Titre large bleu à gauche + Texte + Boutons */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-xs font-semibold text-[#4A6CF7]">
                <span className="w-2 h-2 rounded-full bg-[#4A6CF7] animate-pulse"></span>
                <span>Guichet Unique • Ingénierie & Régie de Pointe</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                {heroTitle}
              </h1>

              <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-2xl font-normal">
                {heroDescription}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  id="btn-hero-reservation"
                  onClick={onOpenReservation}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white bg-[#4A6CF7] hover:bg-[#3B5CE6] shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{primaryBtn}</span>
                </button>

                <button
                  id="btn-hero-explore-poles"
                  onClick={onExploreDepartments}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer shadow-sm"
                >
                  <Layers className="w-4 h-4 text-[#4A6CF7]" />
                  <span>{secondaryBtn}</span>
                </button>

                <button
                  id="btn-hero-presentation"
                  onClick={() => {
                    const el = document.getElementById('welcome-about-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else if (onOpenWelcomeAbout) {
                      onOpenWelcomeAbout();
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-full font-semibold text-xs text-[#4A6CF7] bg-blue-50/90 hover:bg-blue-100 border border-blue-100 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-[#4A6CF7]" />
                  <span>Présentation Officielle ↓</span>
                </button>
              </div>

              {/* Trust Micro-Bullets */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Parc matériel en propre sans intermédiaire</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Normes de sécurité ERP & protocoles d'État</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Image Événement Corporate Lumineuse */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#4A6CF7]/20 to-[#8B5CF6]/20 blur-xl opacity-70"></div>
                
                <div className="relative rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-xl">
                  <img
                    src={heroEventImage}
                    alt="Scène événementielle corporate VIVA EVENT SOLUTIONS"
                    className="w-full h-[360px] sm:h-[420px] object-cover object-center transform hover:scale-102 transition-transform duration-500"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Régie Technique 4K & Sonorisation</div>
                        <div className="text-[11px] text-[#6B7280]">Kinshasa • Lubumbashi • Goma • Brazzaville</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#4A6CF7] bg-blue-50 px-2.5 py-1 rounded-full">
                      3 200 kVA
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3 Stats en bas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 sm:mt-20 pt-8 border-t border-slate-100">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#4A6CF7] tracking-tight">15 Pôles</div>
              <div className="text-sm font-semibold text-slate-900 mt-2">Ingénierie 360° Intégrée</div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Scénographie, captation broadcast, sonorisation et sûreté sans aucune sous-traitance tierce.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#4A6CF7] tracking-tight">+340 Projets</div>
              <div className="text-sm font-semibold text-slate-900 mt-2">Sommets & Rassemblements</div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Déployés avec succès pour gouvernements, multinationales et institutions régionales.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#4A6CF7] tracking-tight">99.4%</div>
              <div className="text-sm font-semibold text-slate-900 mt-2">Satisfaction & Précision</div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Disponibilité 24/7 de nos 180 techniciens certifiés et autonomie énergétique garantie.
              </p>
            </div>
          </div>

        </div>
      </section>
    </EditableSectionWrapper>
  );
};
