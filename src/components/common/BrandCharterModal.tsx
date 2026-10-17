import React, { useState } from 'react';
import { VivaLogo } from './VivaLogo';
import {
  Palette,
  Layers,
  Sparkles,
  Copy,
  Check,
  Eye,
  Sliders,
  Award,
  Zap,
  Shield,
  Download,
  Maximize2,
  Box,
  Lightbulb,
  Sun,
  Moon,
  Compass,
  X,
  Type,
  FileCheck,
  Smartphone,
  Monitor
} from 'lucide-react';

interface BrandCharterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandCharterModal: React.FC<BrandCharterModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'palette' | 'logo-rules' | 'stage-3d' | 'mockups-3d' | 'typography'>('palette');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // 3D Stage Simulator Controls
  const [spotlightColor, setSpotlightColor] = useState<'gold' | 'blue' | 'white' | 'dual'>('dual');
  const [stageFog, setStageFog] = useState<boolean>(true);
  const [ledContent, setLedContent] = useState<'logo' | 'summit' | 'awards'>('logo');
  const [spotlightAngle, setSpotlightAngle] = useState<number>(25);

  // 3D VIP Badge Customizer
  const [badgeName, setBadgeName] = useState<string>('Hon. Jean-Marc KABONGO');
  const [badgeRole, setBadgeRole] = useState<string>('Délégué Ministériel & Chef de Mission');
  const [badgeAccess, setBadgeAccess] = useState<'VIP' | 'ALL_ACCESS' | 'PRESIDENTIAL'>('PRESIDENTIAL');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const brandColors = [
    {
      name: "Bleu Royal VIVA (Image Officielle)",
      hex: "#164E8E",
      rgb: "rgb(22, 78, 142)",
      cmyk: "C: 85% M: 45% Y: 0% K: 44%",
      pantone: "Pantone 2935 C",
      role: "Couleur Institutionnelle Primaire (Monogramme VE & Typographie)",
      description: "Symbolise l'autorité diplomatique, la rigueur d'ingénierie et la souveraineté républicaine.",
      bgClass: "bg-[#164E8E]",
      textLight: true,
      wcagRatio: "8.6:1 (AAA)"
    },
    {
      name: "Jaune Solaire VIVA (Image Officielle)",
      hex: "#F3B228",
      rgb: "rgb(243, 178, 40)",
      cmyk: "C: 0% M: 27% Y: 84% K: 5%",
      pantone: "Pantone 1235 C",
      role: "Couleur d'Accentuation Majeure (Étoile & Croissant Orbital & E Central)",
      description: "Représente la lumière scénique, le prestige des cérémonies et l'excellence des sommets.",
      bgClass: "bg-[#F3B228]",
      textLight: false,
      wcagRatio: "9.5:1 (AAA sur fond sombre)"
    },
    {
      name: "Blanc Pur Immortalisé (Fond de l'Image)",
      hex: "#FFFFFF",
      rgb: "rgb(255, 255, 255)",
      cmyk: "C: 0% M: 0% Y: 0% K: 0%",
      pantone: "Opaque White",
      role: "Fond d'Interface Clair & Support Print",
      description: "Offre une clarté optique absolue sur écrans LED géants et papeterie officielle d'État.",
      bgClass: "bg-[#FFFFFF]",
      textLight: false,
      wcagRatio: "21:1"
    },
    {
      name: "Bleu Nuit Scénique (Midnight Abyssal)",
      hex: "#070E1A",
      rgb: "rgb(7, 14, 26)",
      cmyk: "C: 73% M: 46% Y: 0% K: 90%",
      pantone: "Pantone 532 C",
      role: "Fond d'Interface Sombre & Immersion Scénographique",
      description: "Contraste cinématographique 4K mettant en valeur la scénographie lumineuse et les projecteurs.",
      bgClass: "bg-[#070E1A]",
      textLight: true,
      wcagRatio: "18.8:1"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-gradient-to-b from-[#0B1736] to-[#060B19] border-2 border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(245,184,46,0.15)] text-slate-100 overflow-hidden my-6">
        {/* Header with Brand Identity */}
        <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <VivaLogo size="lg" />
            <div className="hidden sm:block pl-4 border-l border-slate-700">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Brand Book & Studio 3D
              </span>
              <h1 className="text-xl font-black text-white">
                Charte Graphique & Système d'Identité Visuelle
              </h1>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-6 pt-4 border-b border-slate-800 bg-[#081229] overflow-x-auto">
          {[
            { id: 'palette', label: 'Palette Chromatique', icon: Palette },
            { id: 'logo-rules', label: 'Anatomie & Règles Logo', icon: Award },
            { id: 'stage-3d', label: 'Simulateur Scénique 3D', icon: Box },
            { id: 'mockups-3d', label: 'Goodies & Badges 3D', icon: Sparkles },
            { id: 'typography', label: 'Typographie & Scale', icon: Type }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-t from-slate-900 to-[#0F224D] text-amber-400 border-t-2 border-amber-400 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-8">
          {/* TAB 1: PALETTE CHROMATIQUE */}
          {activeTab === 'palette' && (
            <div className="space-y-6">
              <div className="max-w-3xl">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Nuancier Officiel Normé
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Les 5 Couleurs Fondatrices de la Marque VIVA
                </h2>
                <p className="text-sm text-slate-300 mt-2">
                  Harmonie bi-chromatique de prestige articulée autour du <strong className="text-blue-400">Bleu Saphir Royal (#15469C)</strong> et de l’<strong className="text-amber-400">Or Solaire Radiant (#F5B82E)</strong>. Cliquez sur un code couleur pour le copier instantanément.
                </p>
              </div>

              {/* Color Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {brandColors.map(color => (
                  <div
                    key={color.hex}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-amber-500/50 transition-all shadow-lg group relative"
                  >
                    {/* Visual Color Swatch */}
                    <div className={`h-28 rounded-xl ${color.bgClass} flex flex-col justify-between p-3 border border-white/10 shadow-inner relative overflow-hidden`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded ${color.textLight ? 'bg-black/40 text-white' : 'bg-black/60 text-amber-300'}`}>
                          {color.pantone}
                        </span>
                        <span className={`text-[10px] font-bold ${color.textLight ? 'text-white/80' : 'text-slate-900'}`}>
                          WCAG {color.wcagRatio}
                        </span>
                      </div>
                      <span className={`text-xl font-black font-mono tracking-wider ${color.textLight ? 'text-white' : 'text-slate-950'}`}>
                        {color.hex}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {color.name}
                      </h3>
                      <p className="text-xs text-amber-400 font-medium">{color.role}</p>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {color.description}
                      </p>
                    </div>

                    {/* Color Values & Copy Action */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-800 font-mono text-xs">
                      <div
                        onClick={() => copyToClipboard(color.hex, `${color.name} HEX`)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white transition-colors"
                      >
                        <span className="text-slate-400">HEX:</span>
                        <span className="font-bold text-amber-400 flex items-center gap-1">
                          {color.hex}
                          {copiedColor === `${color.name} HEX` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </span>
                      </div>

                      <div
                        onClick={() => copyToClipboard(color.rgb, `${color.name} RGB`)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white transition-colors"
                      >
                        <span className="text-slate-400">RGB:</span>
                        <span className="font-bold text-slate-200">{color.rgb}</span>
                      </div>

                      <div
                        onClick={() => copyToClipboard(color.cmyk, `${color.name} CMYK`)}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white transition-colors"
                      >
                        <span className="text-slate-400">CMYK (Print):</span>
                        <span className="font-bold text-slate-200">{color.cmyk}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contrast Matrix */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <span>Matrice de Contraste & Accessibilité Événementielle (LED Wall & Print)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#060B19] border border-amber-500/30">
                    <p className="font-bold text-amber-400 text-sm mb-1">Texte Or sur Fond Nuit</p>
                    <p className="text-slate-300">Contraste 14.8:1 — Conforme AAA. Idéal pour titres et bandeaux LED géants.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#15469C] border border-white/20">
                    <p className="font-bold text-white text-sm mb-1">Texte Blanc sur Fond Saphir</p>
                    <p className="text-slate-200">Contraste 8.4:1 — Conforme AAA. Idéal pour badges VIP et papeterie.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F5B82E] border border-slate-900 text-slate-950">
                    <p className="font-bold text-slate-950 text-sm mb-1">Texte Noir sur Fond Or</p>
                    <p className="text-slate-900 font-medium">Contraste 16.1:1 — Conforme AAA. Idéal pour signalétique d'urgence et pass VIP.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANATOMIE DU LOGO & RÈGLES */}
          {activeTab === 'logo-rules' && (
            <div className="space-y-8">
              <div className="max-w-3xl">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Construction Géométrique
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Anatomie & Règles d'Usage du Logo Officiel
                </h2>
                <p className="text-sm text-slate-300 mt-2">
                  Le logotype de VIVA EVENT SOLUTIONS SARLU associe 3 éléments sémantiques forts pour exprimer le leadership et la précision scénique.
                </p>
              </div>

              {/* Anatomy Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white">L'Orbite Elliptique Dorée</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Trajectoire dynamique enveloppante symbolisant le guichet unique (one-stop-shop), l'universalité des 14 départements et le rayonnement panafricain.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white">L'Étoile Scénique à 5 Branches</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Placée sur le sommet de l'orbite, elle incarne l'excellence 5 étoiles, la rigueur sécuritaire ERP et le statut de référence diplomatique.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Type className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white">Le « E » Solaire Luminescent</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Le caractère <strong>« E »</strong> de EVENT est traité en Or Solaire (#F5B82E), marquant le point focal scénique et la signature d'ingénierie.
                  </p>
                </div>
              </div>

              {/* Variations Showcase */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-base font-bold text-white">
                  Variantes Officielles Autorisées
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Version Standard Dark */}
                  <div className="p-6 rounded-2xl bg-[#060B19] border border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
                    <VivaLogo size="md" />
                    <span className="text-xs font-bold text-amber-400">Principal (Fond Sombre)</span>
                  </div>

                  {/* Version Standard Light */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-300 flex flex-col items-center justify-center gap-4 text-center">
                    <VivaLogo size="md" />
                    <span className="text-xs font-bold text-slate-900">Fond Clair / Papeterie</span>
                  </div>

                  {/* Version Monogram Only */}
                  <div className="p-6 rounded-2xl bg-[#0F224D] border border-amber-500/30 flex flex-col items-center justify-center gap-4 text-center">
                    <VivaLogo size="lg" variant="icon-only" />
                    <span className="text-xs font-bold text-amber-300">Monogramme App / Favicon</span>
                  </div>

                  {/* Version Compact Badge */}
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
                    <VivaLogo size="badge" />
                    <span className="text-xs font-bold text-slate-400">Badge & Micro-signalétique</span>
                  </div>
                </div>
              </div>

              {/* Clear Space & Minimum Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Zone d'Exclusion (Clear Space)</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    La zone de protection minimale autour du logotype équivaut à la hauteur de la lettre <strong>« V »</strong>. Aucun texte ou élément graphique étranger ne doit pénétrer ce périmètre.
                  </p>
                  <div className="p-4 bg-slate-950 rounded-xl border border-dashed border-amber-500/50 flex items-center justify-center">
                    <div className="p-3 border border-dashed border-amber-400/30 rounded-lg">
                      <VivaLogo size="sm" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Tailles Minimales d'Exploitation</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between p-2 bg-slate-950 rounded-lg">
                      <span>Écrans & Digital :</span>
                      <strong className="text-amber-400 font-mono">120 x 36 px (Complet) / 28 x 28 px (Monogramme)</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-950 rounded-lg">
                      <span>Impression Papeterie :</span>
                      <strong className="text-amber-400 font-mono">35 mm de largeur minimum</strong>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-950 rounded-lg">
                      <span>Signalétique Événementielle :</span>
                      <strong className="text-amber-400 font-mono">800 mm sur Totem / Kakemono</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULATEUR SCÉNIQUE 3D & LIGHTING STUDIO */}
          {activeTab === 'stage-3d' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Infographie & Rendu Scénographique 3D
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">
                    Simulateur 3D de Scène & Faisceaux Volumétriques
                  </h2>
                  <p className="text-sm text-slate-300">
                    Prévisualisez en temps réel l'éclairage de scène avec la charte couleur VIVA (Projecteurs asservis Robe & Claypaky).
                  </p>
                </div>

                {/* Lighting Quick Buttons */}
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setSpotlightColor('dual')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${spotlightColor === 'dual' ? 'bg-gradient-to-r from-blue-600 to-amber-500 text-white shadow' : 'text-slate-400'}`}
                  >
                    Bichromie Or / Saphir
                  </button>
                  <button
                    onClick={() => setSpotlightColor('gold')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${spotlightColor === 'gold' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'}`}
                  >
                    Or Solaire 100%
                  </button>
                  <button
                    onClick={() => setSpotlightColor('blue')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${spotlightColor === 'blue' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}
                  >
                    Bleu Saphir 100%
                  </button>
                </div>
              </div>

              {/* 3D Interactive Stage Canvas */}
              <div className="relative h-96 sm:h-[460px] rounded-3xl bg-[#040814] border-2 border-amber-500/30 overflow-hidden shadow-2xl flex flex-col justify-between p-6 select-none">
                {/* Stage Lighting Truss Grid (Top) */}
                <div className="relative z-10 flex justify-between items-center border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      TRUSS PROLYTE H30V • 48 CH DMX 512
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-amber-400 font-mono">
                    <span>Angle: {spotlightAngle}°</span>
                    <span>Fog: {stageFog ? 'ON (Haze 85%)' : 'OFF'}</span>
                  </div>
                </div>

                {/* Volumetric Spotlights Beams */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Left Spotlight Beam */}
                  {(spotlightColor === 'dual' || spotlightColor === 'blue') && (
                    <div
                      className="absolute top-0 left-1/4 w-32 sm:w-56 h-full opacity-60 transition-all duration-700"
                      style={{
                        background: 'linear-gradient(180deg, rgba(37,99,235,0.7) 0%, rgba(21,70,156,0.3) 50%, transparent 100%)',
                        transform: `rotate(${spotlightAngle}deg) scaleX(1.5)`,
                        transformOrigin: 'top center',
                        filter: stageFog ? 'blur(16px)' : 'blur(4px)'
                      }}
                    />
                  )}

                  {/* Center Golden Spotlight */}
                  {(spotlightColor === 'dual' || spotlightColor === 'gold') && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-40 sm:w-72 h-full opacity-70 transition-all duration-700"
                      style={{
                        background: 'linear-gradient(180deg, rgba(245,184,46,0.8) 0%, rgba(217,119,6,0.35) 60%, transparent 100%)',
                        transform: `scaleX(1.8)`,
                        filter: stageFog ? 'blur(20px)' : 'blur(6px)'
                      }}
                    />
                  )}

                  {/* Right Spotlight Beam */}
                  {(spotlightColor === 'dual' || spotlightColor === 'blue') && (
                    <div
                      className="absolute top-0 right-1/4 w-32 sm:w-56 h-full opacity-60 transition-all duration-700"
                      style={{
                        background: 'linear-gradient(180deg, rgba(37,99,235,0.7) 0%, rgba(21,70,156,0.3) 50%, transparent 100%)',
                        transform: `rotate(-${spotlightAngle}deg) scaleX(1.5)`,
                        transformOrigin: 'top center',
                        filter: stageFog ? 'blur(16px)' : 'blur(4px)'
                      }}
                    />
                  )}
                </div>

                {/* Central LED Screen Wall / 3D Scenery */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                  <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0F224D]/90 via-[#0A1738]/90 to-[#060D22]/95 border-2 border-amber-400/50 shadow-[0_0_50px_rgba(245,184,46,0.25)] text-center backdrop-blur-sm">
                    {ledContent === 'logo' && (
                      <div className="space-y-3">
                        <VivaLogo size="hero" className="justify-center" />
                        <p className="text-xs font-bold text-amber-300 tracking-[0.25em] uppercase animate-pulse">
                          Régie Broadcast 4K • Kinshasa Grand Sommet
                        </p>
                      </div>
                    )}
                    {ledContent === 'summit' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-amber-400 font-mono uppercase bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40">
                          CONFÉRENCE INTERNATIONALE
                        </span>
                        <h3 className="text-2xl font-black text-white">
                          FORUM ÉNERGIES & MINES RDC 2026
                        </h3>
                        <p className="text-xs text-slate-300">
                          Palais de la Nation • Direction Régie Générale : VIVA EVENT SOLUTIONS
                        </p>
                      </div>
                    )}
                    {ledContent === 'awards' && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-amber-300 font-mono uppercase">
                          CÉRÉMONIE OFFICIELLE D'EXCELLENCE
                        </span>
                        <h3 className="text-2xl font-black text-amber-400">
                          PRIX D'HONNEUR DE LA RÉPUBLIQUE
                        </h3>
                        <p className="text-xs text-slate-300">
                          Diffusion en Direct TV & Web Hybride 4K
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3D Stage Floor & Presidential Lectern */}
                <div className="relative z-10 pt-4 border-t border-slate-800 flex justify-between items-end">
                  {/* Left Stage Monitor */}
                  <div className="hidden sm:block p-2 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                    RETURN MONITOR L-1 • 0dB
                  </div>

                  {/* Center Lectern / VIP Stand */}
                  <div className="mx-auto flex flex-col items-center">
                    <div className="w-20 h-10 bg-gradient-to-b from-slate-800 to-slate-950 border border-amber-400/60 rounded-t-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <div className="w-5 h-5 rounded-full bg-amber-400/30 border border-amber-400 flex items-center justify-center text-[9px] font-bold text-amber-300">
                        ★
                      </div>
                    </div>
                    <div className="w-28 h-2 bg-amber-400 rounded-full shadow-[0_0_12px_#F5B82E]"></div>
                  </div>

                  {/* Right Stage Monitor */}
                  <div className="hidden sm:block p-2 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                    RETURN MONITOR R-1 • 0dB
                  </div>
                </div>
              </div>

              {/* Stage Controls Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
                {/* Control 1: Angle */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-300">
                    <span>Angle des Faisceaux DMX :</span>
                    <span className="text-amber-400 font-mono">{spotlightAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    value={spotlightAngle}
                    onChange={e => setSpotlightAngle(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Control 2: Fog */}
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl">
                  <span className="font-bold text-slate-300">Brouillard Scénique (Haze 3D)</span>
                  <button
                    onClick={() => setStageFog(!stageFog)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${stageFog ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {stageFog ? 'ACTIF' : 'INACTIF'}
                  </button>
                </div>

                {/* Control 3: LED Wall Mode */}
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-xl">
                  <span className="font-bold text-slate-300">Affichage Mur LED :</span>
                  <select
                    value={ledContent}
                    onChange={e => setLedContent(e.target.value as any)}
                    className="bg-slate-800 text-amber-400 font-bold rounded px-2 py-1 border border-slate-700"
                  >
                    <option value="logo">Logo & Identité</option>
                    <option value="summit">Sommet Diplomatique</option>
                    <option value="awards">Gala & Trophées</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MOCKUPS 3D & BADGES VIP */}
          {activeTab === 'mockups-3d' && (
            <div className="space-y-6">
              <div className="max-w-3xl">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Générateur 3D de Produits Dérivés & Signalétique
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Générateur de Badges VIP & Kakemonos 3D
                </h2>
                <p className="text-sm text-slate-300">
                  Personnalisez en direct les passes d'accréditation et visualisez le rendu physique des supports officiels VIVA.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Badge Form Inputs (Left: 5 cols) */}
                <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>Paramètres du Badge VIP</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nom complet & Titre :
                    </label>
                    <input
                      type="text"
                      value={badgeName}
                      onChange={e => setBadgeName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Fonction / Délégation :
                    </label>
                    <input
                      type="text"
                      value={badgeRole}
                      onChange={e => setBadgeRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Niveau d'Accréditation :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['VIP', 'ALL_ACCESS', 'PRESIDENTIAL'] as const).map(acc => (
                        <button
                          key={acc}
                          onClick={() => setBadgeAccess(acc)}
                          className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                            badgeAccess === acc
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {acc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3D Visual Rendering (Right: 7 cols) */}
                <div className="lg:col-span-7 flex flex-col sm:flex-row items-center justify-center gap-6 p-6 rounded-2xl bg-gradient-to-b from-[#081229] to-[#040814] border border-amber-500/30 shadow-2xl">
                  {/* VIP Badge 3D Preview */}
                  <div className="relative w-64 sm:w-72 h-[420px] rounded-3xl bg-gradient-to-b from-[#15469C] via-[#0B1E48] to-[#060D20] border-2 border-amber-400 p-5 flex flex-col justify-between text-center shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform hover:rotate-1 hover:scale-105 transition-all">
                    {/* Badge Lanyard Hole */}
                    <div className="mx-auto w-12 h-2.5 bg-slate-950 rounded-full border border-amber-400/80 mb-2"></div>

                    {/* Top Header */}
                    <div>
                      <VivaLogo size="sm" className="justify-center" />
                      <div className="mt-3">
                        <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40">
                          {badgeAccess === 'PRESIDENTIAL' ? '★ ACCRÉDITATION PRÉSIDENTIELLE ★' : badgeAccess === 'ALL_ACCESS' ? 'TOUS ACCÈS RÉGIE' : 'DIGNITAIRE VIP'}
                        </span>
                      </div>
                    </div>

                    {/* Badge Photo Hologram simulation */}
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-blue-700 p-1 shadow-lg">
                      <div className="w-full h-full rounded-xl bg-slate-900 flex flex-col items-center justify-center text-amber-300">
                        <Award className="w-10 h-10" />
                      </div>
                    </div>

                    {/* Attendee Name */}
                    <div>
                      <h4 className="text-base font-black text-white drop-shadow">
                        {badgeName || 'Nom du Délégué'}
                      </h4>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">
                        {badgeRole || 'Fonction'}
                      </p>
                    </div>

                    {/* Barcode & Security Hologram */}
                    <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                      <div className="text-left font-mono text-[9px] text-slate-400">
                        <p>ID: VES-2026-9921</p>
                        <p>SEC: LEVEL 5 (ERP)</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[4, 8, 2, 6, 3, 7, 5, 2, 8, 4].map((h, i) => (
                          <div key={i} className="w-1 bg-amber-400 rounded-sm" style={{ height: `${h * 3}px` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3D Totem / Rollup Banner Preview */}
                  <div className="relative w-36 h-[420px] rounded-2xl bg-gradient-to-b from-[#15469C] via-[#0A1738] to-[#060B19] border border-amber-400/60 p-3 flex flex-col justify-between text-center shadow-xl">
                    <div>
                      <VivaLogo size="badge" className="justify-center" />
                      <div className="mt-4 text-[9px] font-black text-amber-400 uppercase tracking-widest leading-tight">
                        INGÉNIERIE ÉVÉNEMENTIELLE GLOBALE
                      </div>
                    </div>

                    <div className="space-y-2 py-4">
                      <div className="p-1 rounded bg-slate-900/60 text-[8px] text-slate-200">14 DÉPARTEMENTS</div>
                      <div className="p-1 rounded bg-slate-900/60 text-[8px] text-slate-200">7 COLLÈGES PARTENAIRES</div>
                      <div className="p-1 rounded bg-slate-900/60 text-[8px] text-slate-200">PARC MATÉRIEL LOURD</div>
                    </div>

                    <div className="text-[8px] font-mono text-amber-400 font-bold border-t border-slate-800 pt-1">
                      www.viva-eventsolutions.cd
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TYPOGRAPHIE & SCALE */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <div className="max-w-3xl">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Système Typographique Institutionnel
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Échelle Typographique & Hiérarchie Visuelle
                </h2>
                <p className="text-sm text-slate-300 mt-2">
                  L'identité visuelle VIVA EVENT SOLUTIONS repose sur une combinaison de polices géométriques d'impact pour les titres et d'une grande lisibilité pour les données techniques.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                    Titres & Display Principal
                  </span>
                  <h3 className="text-xl font-black text-white">Outfit / Plus Jakarta</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Utilisé pour les grands titres de sections, chiffres clés et bannières promotionnelles. Caractérisé par un fort impact géométrique et une grande élégance.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl text-amber-400 font-black text-lg">
                    Aa Bb Gg 1 2 3 4 5 6 7 8 9 0
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Corps de Texte & UI
                  </span>
                  <h3 className="text-xl font-black text-white">Inter / System UI</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Utilisé pour les paragraphes descriptifs, devis détaillés et interfaces utilisateur. Assure une lisibilité optimale sur mobile et grand écran.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl text-slate-100 font-normal text-sm">
                    L'ingénierie événementielle de référence en RDC et Afrique Centrale.
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Données & Spécifications Tech
                  </span>
                  <h3 className="text-xl font-black text-white">Space Grotesk / JetBrains</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Utilisé pour les numéros de série de matériel, puissances kVA, budgets USD, codes RCCM/OAPI et horodatages des régies.
                  </p>
                  <div className="p-3 bg-slate-950 rounded-xl text-emerald-300 font-mono text-xs">
                    VES-2026-DEV • 550 kVA • $385,000 USD
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-[#081229] flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Document Certifié OAPI & Direction Artistique VIVA EVENT SOLUTIONS SARLU</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(
                `/* Charte Couleurs VIVA EVENT SOLUTIONS */\n:root {\n  --viva-royal-blue: #15469C;\n  --viva-sun-gold: #F5B82E;\n  --viva-midnight-navy: #060B19;\n  --viva-warm-amber: #D97706;\n  --viva-pure-white: #FFFFFF;\n}`,
                'Variables CSS globales'
              )}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copiedColor === 'Variables CSS globales' ? 'Variables Copiées !' : 'Copier Variables CSS'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Fermer le Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
