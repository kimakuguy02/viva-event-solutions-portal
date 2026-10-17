import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Search, Home, ArrowLeft } from 'lucide-react';

interface NotFound404Props {
  onGoHome: () => void;
}

export const NotFound404: React.FC<NotFound404Props> = ({ onGoHome }) => {
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div
        className="max-w-md w-full text-center p-8 sm:p-10 rounded-3xl border shadow-2xl space-y-6 animate-fadeIn"
        style={{
          backgroundColor: activePalette.colors.bgSurface,
          borderColor: activePalette.colors.border
        }}
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 shadow-inner">
          <Search className="w-10 h-10 text-amber-400/80" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            ERREUR 404
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Page Introuvable
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            La ressource demandée n'existe pas ou n'est pas accessible sur cette adresse. Veuillez vérifier l'URL ou retourner sur la page d'accueil.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onGoHome}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
            style={{
              backgroundColor: activePalette.colors.primary,
              color: '#FFFFFF'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner à l'Accueil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
