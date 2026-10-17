import React, { useState } from 'react';
import { useTheme, PRESET_PALETTES } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { VivaLogo } from './VivaLogo';
import {
  X,
  Palette,
  Sun,
  Moon,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  Layers,
  Pipette,
  CheckCircle2,
  Lock,
  ShieldAlert
} from 'lucide-react';

interface ThemeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({ isOpen, onClose }) => {
  const {
    activePalette,
    themeMode,
    setPalette,
    setCustomColors,
    toggleThemeMode,
    resetToDefault
  } = useTheme();

  const { isAdmin, isSimulatingVisitor } = useAuth();
  const isUserAdmin = isAdmin && !isSimulatingVisitor;

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Local state for custom color inputs
  const [customPrimary, setCustomPrimary] = useState(activePalette.colors.primary);
  const [customAccent, setCustomAccent] = useState(activePalette.colors.accent);
  const [customBgMain, setCustomBgMain] = useState(activePalette.colors.bgMain);
  const [customBgSurface, setCustomBgSurface] = useState(activePalette.colors.bgSurface);
  const [customTextMain, setCustomTextMain] = useState(activePalette.colors.textMain);

  if (!isOpen) return null;

  if (!isUserAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div className="relative max-w-md w-full rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
              Sécurité Instituée • Studio Verrouillé
            </span>
            <h3 className="text-xl font-black text-white">
              Studio de Couleurs Restreint
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour garantir le respect strict de la charte graphique officielle de <strong className="text-amber-400">VIVA EVENT SOLUTIONS SARLU</strong>, la modification des couleurs et thèmes de l'interface est verrouillée pour les clients et visiteurs. Seuls les administrateurs disposent des privilèges requis.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Compris / Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApplyCustomColors = () => {
    setCustomColors({
      primary: customPrimary,
      primaryLight: customPrimary,
      primaryDark: customPrimary,
      accent: customAccent,
      accentLight: customAccent,
      bgMain: customBgMain,
      bgSurface: customBgSurface,
      bgSubtle: customBgSurface,
      textMain: customTextMain,
      border: `${customPrimary}40`,
      borderGlow: `${customAccent}60`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0F172A] border border-slate-700 shadow-2xl overflow-hidden my-auto text-slate-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Studio de Thèmes & Couleurs de Marque</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Temps Réel
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ajustez les couleurs exactes de votre logo, image ou charte graphique officielle.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleThemeMode}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Basculer Mode Clair / Sombre"
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Mode Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Mode Sombre</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'presets'
                  ? 'border-amber-400 text-amber-400 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Palettes Prédéfinies Officielles ({PRESET_PALETTES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'custom'
                  ? 'border-amber-400 text-amber-400 bg-slate-800/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Sélecteur Sur-Mesure (Pipette & Code HEX)</span>
            </button>
          </div>

          <button
            onClick={resetToDefault}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors pb-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Live Preview Box */}
          <div
            className="p-5 rounded-2xl border transition-all duration-300 shadow-xl relative overflow-hidden"
            style={{
              backgroundColor: activePalette.colors.bgSurface,
              borderColor: activePalette.colors.border,
              boxShadow: `0 10px 30px ${activePalette.colors.border}`
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activePalette.colors.accent }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activePalette.colors.accent }}>
                  Aperçu en Direct • {activePalette.name}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/40 text-slate-300 font-mono">
                Mode : {activePalette.mode === 'dark' ? '🌙 Sombre' : '☀️ Clair'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <VivaLogo size="lg" />
                <p className="text-xs mt-3 line-clamp-2" style={{ color: activePalette.colors.textMuted }}>
                  {activePalette.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-end">
                <button
                  className="px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: activePalette.colors.primary,
                    color: '#FFFFFF'
                  }}
                >
                  Bouton Principal
                </button>
                <button
                  className="px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: activePalette.colors.accent,
                    color: '#0F172A'
                  }}
                >
                  Bouton Accent Or
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: Preset Palettes */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Choisissez la palette correspondant à votre image :</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {PRESET_PALETTES.map(palette => {
                  const isSelected = activePalette.id === palette.id;
                  return (
                    <div
                      key={palette.id}
                      onClick={() => setPalette(palette.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-slate-800 shadow-lg shadow-amber-500/20 scale-[1.02]'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800/60'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        {/* Color Swatch Circles */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <span
                            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: palette.colors.primary }}
                            title={`Primaire: ${palette.colors.primary}`}
                          />
                          <span
                            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: palette.colors.accent }}
                            title={`Accent: ${palette.colors.accent}`}
                          />
                          <span
                            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: palette.colors.bgMain }}
                            title={`Fond: ${palette.colors.bgMain}`}
                          />
                          <span className="text-[10px] ml-auto text-slate-400 font-semibold uppercase">
                            {palette.mode === 'light' ? 'Clair' : 'Sombre'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                          {palette.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {palette.description}
                        </p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPalette(palette.id);
                        }}
                        className={`mt-3 w-full py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? 'Actif' : 'Appliquer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Custom Color Mixer */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                <Pipette className="w-5 h-5 shrink-0 text-amber-400" />
                <p>
                  Saisissez les codes HEX précis issus de votre image ou utilisez le sélecteur visuel pour adapter l'application à 100% à votre logo d'origine.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Color 1: Primary */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Couleur Primaire (Marque & Logo)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={e => setCustomPrimary(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={e => setCustomPrimary(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 uppercase"
                    />
                  </div>
                </div>

                {/* Color 2: Accent */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Couleur d'Accent / Or / Énergie
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={e => setCustomAccent(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customAccent}
                      onChange={e => setCustomAccent(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 uppercase"
                    />
                  </div>
                </div>

                {/* Color 3: Main Background */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Fond Principal de l'Application
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgMain}
                      onChange={e => setCustomBgMain(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customBgMain}
                      onChange={e => setCustomBgMain(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 uppercase"
                    />
                  </div>
                </div>

                {/* Color 4: Surface / Card Background */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Fond des Cartes & Panneaux
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBgSurface}
                      onChange={e => setCustomBgSurface(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customBgSurface}
                      onChange={e => setCustomBgSurface(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 uppercase"
                    />
                  </div>
                </div>

                {/* Color 5: Text Color */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">
                    Couleur du Texte Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customTextMain}
                      onChange={e => setCustomTextMain(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customTextMain}
                      onChange={e => setCustomTextMain(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleApplyCustomColors}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Appliquer les Couleurs Personnalisées</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Les modifications sont sauvegardées automatiquement dans votre navigateur.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
