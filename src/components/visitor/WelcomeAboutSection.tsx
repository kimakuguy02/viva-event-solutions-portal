import React from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { EditableSectionWrapper } from '../common/VisualEditOverlayModal';
import {
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  Building2,
  Workflow,
  AlertTriangle,
  Lightbulb,
  Check
} from 'lucide-react';

interface WelcomeAboutSectionProps {
  onExplore15Poles: () => void;
  onOpenClientSpace?: () => void;
  onOpenQuote: () => void;
}

export const WelcomeAboutSection: React.FC<WelcomeAboutSectionProps> = ({
  onExplore15Poles,
  onOpenQuote
}) => {
  const { platformConfig, getCmsValue } = useProjectData();

  const welcomeTitle = getCmsValue('home.welcome.title', 'title', 'Bienvenue chez VIVA EVENT SOLUTIONS');
  const welcomeSubtitle = getCmsValue('home.welcome.title', 'subtitle', 'PORTAIL OFFICIEL DE VIVA EVENT SOLUTIONS');
  const welcomeText = getCmsValue('home.welcome.title', 'content', platformConfig.welcomeMessage)
    .split('notre établissement').join('notre société');
  const welcomePrimaryBtn = getCmsValue('home.welcome.title', 'primaryButtonText', 'NOS 15 PÔLES DE SERVICES');

  return (
    <div className="space-y-16 py-8" id="welcome-about-section">
      {/* 1. OFFICIAL WELCOME MESSAGE BANNER / CARD */}
      <EditableSectionWrapper cmsKey="home.welcome.title" sectionName="Texte de Bienvenue Officiel">
        <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 sm:p-10 lg:p-12 relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--viva-muted-surface)] text-[var(--viva-primary)] border border-[var(--viva-border)]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--viva-primary)]">
                    {welcomeSubtitle}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {welcomeTitle}
                  </h2>
                </div>
              </div>

              <button
                onClick={onExplore15Poles}
                className="px-5 py-2.5 rounded-full font-semibold text-xs text-white bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>{welcomePrimaryBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Welcome Text Content */}
            <div className="prose prose-slate max-w-none">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 text-sm sm:text-base leading-relaxed space-y-4 text-slate-700">
                {welcomeText
                  .split('\n')
                  .filter(p => p.trim())
                  .map((paragraph, idx) => (
                    <p
                      key={idx}
                      className={
                        idx === 0
                          ? "font-bold text-base sm:text-lg text-slate-900"
                          : "text-slate-700"
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </EditableSectionWrapper>

      {/* 2. WHO ARE WE / QUI SOMMES-NOUS ? */}
      <EditableSectionWrapper cmsKey="about.whoWeAre.description" sectionName="Présentation Qui Sommes-Nous">
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[var(--viva-muted-surface)] text-[var(--viva-primary)]">
              VIVA EVENT SOLUTIONS • KINSHASA-RDC
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              {getCmsValue('about.whoWeAre.description', 'title', 'QUI SOMMES-NOUS ?')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              {getCmsValue('about.whoWeAre.description', 'subtitle', 'Une Architecture Unique & Intégrée, au service de projets complexes.')}
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Description */}
          <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 border border-slate-100 bg-white space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--viva-muted-surface)] text-[var(--viva-primary)] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Une Architecture Unique & Intégrée, au service de projets complexes.
              </h3>
            </div>

            <div className="text-sm leading-relaxed space-y-4 text-[var(--viva-text-muted)]">
              {platformConfig.whoWeAreText
                .split('\n')
                .filter(p => p.trim() && !p.includes('Une Architecture Unique & Intégrée'))
                .map((paragraph, idx) => {
                  const isExample = paragraph.startsWith('Prenons une conférence');
                  if (isExample) {
                    return (
                      <div
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl bg-[var(--viva-muted-surface)] border border-[var(--viva-border)] text-slate-800 space-y-2 mt-4"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--viva-primary)]">
                          <Workflow className="w-4 h-4" />
                          <span>Exemple Concret d'Intégration Globale</span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                          {paragraph}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-700">
                      {paragraph}
                    </p>
                  );
                })}
            </div>

            {/* Target Audience Badges */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider block mb-3 text-slate-900">
                Publics & Organisations Accompagnées
              </span>
              <div className="flex flex-wrap gap-2">
                {platformConfig.targetClients.map((client, cIdx) => (
                  <span
                    key={cIdx}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--viva-primary)] shrink-0" />
                    <span>{client}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Why Choose Us & Key Pillars */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-100 bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Pourquoi Choisir VIVA EVENT SOLUTIONS ?
                </h3>
              </div>

              <div className="space-y-3">
                {platformConfig.whyChooseUsPoints.map((point, pIdx) => {
                  const parts = point.split(' : ');
                  const title = parts[0];
                  const desc = parts[1];
                  return (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--viva-muted-surface)] text-[var(--viva-primary)]">
                        <Check className="w-3 h-3 font-bold" />
                      </span>
                      <div className="text-slate-700">
                        {desc ? (
                          <>
                            <strong className="text-slate-900 font-semibold">{title} : </strong>
                            <span className="text-[var(--viva-text-muted)]">{desc}</span>
                          </>
                        ) : (
                          <span className="text-[var(--viva-text-muted)]">{point}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Button for 15 Poles */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[var(--viva-border)] bg-[var(--viva-muted-surface)] shadow-sm flex flex-col justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--viva-primary)]">
                  Écosystème 360°
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-1">
                  Découvrez nos 15 Pôles d'Ingénierie
                </h4>
                <p className="text-xs text-[var(--viva-text-muted)] mt-1.5 leading-relaxed">
                  Chaque pôle possède sa justification technique, ses équipements et ses cas d'usage concrets.
                </p>
              </div>

              <button
                onClick={onExplore15Poles}
                className="w-full py-3 px-4 rounded-full font-semibold text-xs text-white bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>ACCÉDER AUX 15 PÔLES</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </EditableSectionWrapper>

      {/* 3. LES 9 VALEURS FONDAMENTALES & CYCLE MÉTHODOLOGIQUE */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">
            Éthique & Rigueur Opérationnelle
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900">
            Nos 9 Valeurs Fondamentales
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {platformConfig.valuesList.map((val, vIdx) => (
            <div
              key={vIdx}
              className="p-6 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm hover:shadow-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[var(--viva-muted-surface)] text-[var(--viva-primary)]">
                  {val.number}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {val.title}
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--viva-text-muted)]">
                {val.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. LE CYCLE DE MISSION EN 9 ÉTAPES */}
      <section className="p-6 sm:p-10 rounded-3xl border border-slate-100 bg-white shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--viva-primary)]">
              Méthodologie Éprouvée
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-1 text-slate-900">
              Le Cycle d'une Mission VIVA en 9 Étapes
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--viva-primary)]">
            <Workflow className="w-4 h-4" />
            <span>Processus Maîtrisé de Bout en Bout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {platformConfig.missionCyclePoints.map((step, sIdx) => (
            <div
              key={sIdx}
              className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2"
            >
              <span className="text-xs font-bold font-mono text-[var(--viva-primary)] block">
                {step.title}
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--viva-text-muted)]">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PROBLÈMES DU MARCHÉ VS SOLUTIONS APPORTÉES */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Market Problems */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-100 bg-white space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Les 10 Problèmes Constants du Marché
            </h3>
          </div>

          <div className="space-y-3">
            {platformConfig.marketProblems.map((prob, pIdx) => (
              <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {prob.number}
                </span>
                <div>
                  <strong className="text-slate-900 font-semibold">{prob.title} : </strong>
                  <span className="text-[var(--viva-text-muted)]">{prob.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Viva Solutions Response */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-100 bg-white space-y-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--viva-muted-surface)] text-[var(--viva-primary)] flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                La Réponse Globale & Intégrée VIVA EVENTS SOLUTIONS
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[var(--viva-text-muted)] mb-5">
              VIVA EVENTS SOLUTIONS apporte une réponse globale intégrant la totalité des expertises en RDC :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {platformConfig.marketResponsePoints.slice(0, 16).map((resp, rIdx) => (
                <div key={rIdx} className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--viva-primary)] shrink-0" />
                  <span className="truncate">{resp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-4">
            <button
              onClick={onOpenQuote}
              className="w-full py-3 rounded-full font-semibold text-xs uppercase tracking-wider text-white bg-[var(--viva-primary)] hover:bg-[var(--viva-primary-dark)] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Demander un devis avec nos Experts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
