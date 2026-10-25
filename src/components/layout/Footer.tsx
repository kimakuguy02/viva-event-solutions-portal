import React from 'react';
import { VivaLogo } from '../common/VivaLogo';
import { useTheme } from '../../context/ThemeContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { MapPin, Mail, Phone, ShieldCheck, ArrowUpRight, HeartHandshake, Layers } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
  onSelectDepartment?: (id: number) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onSelectDepartment }) => {
  const { activePalette } = useTheme();
  const { departments, platformConfig } = useProjectData();

  const contact = platformConfig.contactInfo || {
    phone: '+243 963 216 780 / +243 855 929 308',
    email: 'contact@viva-eventsolutions.cd',
    address: 'Kinshasa / Gombe, République Démocratique du Congo',
    rccm: 'CD/KIN/RCCM/24-B-01492',
    idNat: '01-G4701-N44921',
    website: 'www.viva-eventsolutions.cd'
  };

  const headingStyle = {
    color: activePalette.colors.accent,
    borderColor: activePalette.colors.border
  };

  return (
    <footer
      className="border-t pt-16 pb-24 text-sm relative transition-colors duration-300"
      style={{
        backgroundColor: activePalette.colors.bgSubtle,
        borderColor: activePalette.colors.border,
        color: activePalette.colors.textMuted
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company presentation */}
          <div className="lg:col-span-2 space-y-4">
            <VivaLogo size="md" />

            <p className="text-xs leading-relaxed pt-2">
              Société à Responsabilité Limitée Unipersonnelle de droit congolais, leader de l'ingénierie événementielle globale, de l'architecture éphémère, de la communication stratégique et du pilotage multiservices en RDC et Afrique Centrale.
            </p>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: activePalette.colors.primary }} />
                <span>{contact.address || 'Kinshasa / Gombe, République Démocratique du Congo'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" style={{ color: activePalette.colors.primary }} />
                <span>{contact.phone || '+243 963 216 780 / +243 855 929 308'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: activePalette.colors.primary }} />
                <span>{contact.email || 'contact@viva-eventsolutions.cd'}</span>
              </div>
            </div>

            {/* Legal badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium"
                style={{
                  borderColor: activePalette.colors.border,
                  backgroundColor: activePalette.colors.bgSurface,
                  color: activePalette.colors.textMain
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>RCCM & ID.NAT Enregistrés</span>
              </span>
            </div>
          </div>

          {/* Quick links : 15 Pôles (1 à 8) */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"
              style={headingStyle}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>15 Pôles (1 à 8)</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              {departments.slice(0, 8).map(dept => (
                <li key={dept.id}>
                  <button
                    onClick={() => {
                      onSelectTab('departments');
                      onSelectDepartment?.(dept.id);
                    }}
                    className="hover:opacity-70 transition-opacity text-left flex items-center gap-1 group cursor-pointer"
                  >
                    <span className="text-[10px] font-mono opacity-70">
                      {dept.number < 10 ? `0${dept.number}` : dept.number}.
                    </span>
                    <span className="truncate">{dept.shortName || dept.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links : 15 Pôles (9 à 15) */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-1.5"
              style={headingStyle}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>15 Pôles (9 à 15)</span>
            </h4>
            <ul className="space-y-1.5 text-xs">
              {departments.slice(8, 15).map(dept => (
                <li key={dept.id}>
                  <button
                    onClick={() => {
                      onSelectTab('departments');
                      onSelectDepartment?.(dept.id);
                    }}
                    className="hover:opacity-70 transition-opacity text-left flex items-center gap-1 group cursor-pointer"
                  >
                    <span className="text-[10px] font-mono opacity-70">
                      {dept.number < 10 ? `0${dept.number}` : dept.number}.
                    </span>
                    <span className="truncate">{dept.shortName || dept.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation institutionnelle & Accès rapides */}
          <div className="space-y-3">
            <h4
              className="text-xs font-bold uppercase tracking-wider border-b pb-2"
              style={headingStyle}
            >
              Navigation Rapide
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('welcome-about')}
                  className="hover:opacity-70 transition-opacity text-left flex items-center gap-1.5 font-semibold"
                  style={{ color: activePalette.colors.accent }}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Message & Qui Sommes-Nous ?</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('events')}
                  className="hover:opacity-70 transition-opacity text-left flex items-center gap-1.5 font-bold"
                  style={{ color: activePalette.colors.accent }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>CATALOGUE DES ÉVÉNEMENTS</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('departments')}
                  className="hover:opacity-70 transition-opacity text-left flex items-center gap-1.5 font-bold"
                  style={{ color: activePalette.colors.accent }}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>NOS 15 PÔLES DES SERVICES</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('partners')}
                  className="hover:opacity-70 transition-opacity text-left"
                >
                  7 Collèges Partenaires
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('equipment')}
                  className="hover:opacity-70 transition-opacity text-left"
                >
                  Parc Matériel Lourd
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('quote-simulator')}
                  className="hover:opacity-70 transition-opacity text-left"
                >
                  Demande de Devis en USD
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('brand-charter')}
                  className="hover:opacity-70 transition-opacity text-left"
                >
                  Charte Graphique & Écosystème
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal bar */}
        <div
          className="border-t mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]"
          style={{ borderColor: activePalette.colors.border }}
        >
          <p>© {new Date().getFullYear()} VIVA EVENT SOLUTIONS SARLU. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono text-[10px]">
            <span>RCCM: {contact.rccm || 'CD/KIN/RCCM/24-B-01492'}</span>
            <span>•</span>
            <span>ID.NAT: {contact.idNat || '01-G4701-N44921'}</span>
            <span>•</span>
            <span>Kinshasa - RDC</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
