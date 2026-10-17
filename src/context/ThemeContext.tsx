import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  colors: {
    primary: string;       // Exact Official Blue (#164E8E)
    primaryLight: string;  // Light Blue tint (#2B6CB0)
    primaryDark: string;   // Deep Navy (#0E3562)
    accent: string;        // Exact Official Yellow/Gold (#F3B228)
    accentLight: string;   // Sun Yellow (#FDE047)
    bgMain: string;        // Main background
    bgSurface: string;     // Card / Panel background
    bgSubtle: string;      // Header / Banner background
    textMain: string;      // Primary text color
    textMuted: string;     // Secondary text color
    border: string;        // Subtle borders
    borderGlow: string;    // Glowing border color
  };
}

export const PRESET_PALETTES: ThemePalette[] = [
  {
    id: 'saas-modern-white',
    name: 'Corporate SaaS Moderne (Blanc, Bleu #4A6CF7, Violet #8B5CF6)',
    description: 'Style Stripe / Linear / Eventive : Fond 100% blanc, Bleu vif #4A6CF7, Violet #8B5CF6 et Gris texte #6B7280.',
    mode: 'light',
    colors: {
      primary: '#4A6CF7',
      primaryLight: '#6B8AFF',
      primaryDark: '#3A57D5',
      accent: '#8B5CF6',
      accentLight: '#A78BFA',
      bgMain: '#FFFFFF',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F8FAFC',
      textMain: '#1E293B',
      textMuted: '#6B7280',
      border: '#E5E7EB',
      borderGlow: 'rgba(74, 108, 247, 0.15)'
    }
  },
  {
    id: 'pure-white-clean',
    name: 'Minimaliste Épuré (Blanc & Bleu Électrique)',
    description: 'Style ultra-épuré tout en légèreté sans or ni noir.',
    mode: 'light',
    colors: {
      primary: '#4A6CF7',
      primaryLight: '#60A5FA',
      primaryDark: '#2563EB',
      accent: '#8B5CF6',
      accentLight: '#C4B5FD',
      bgMain: '#FFFFFF',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F9FAFB',
      textMain: '#111827',
      textMuted: '#6B7280',
      border: '#F3F4F6',
      borderGlow: 'rgba(139, 92, 246, 0.2)'
    }
  }
];

interface ThemeContextType {
  activePalette: ThemePalette;
  themeMode: ThemeMode;
  setPalette: (paletteId: string) => void;
  setCustomColors: (colors: Partial<ThemePalette['colors']>) => void;
  toggleThemeMode: () => void;
  isThemeStudioOpen: boolean;
  setIsThemeStudioOpen: (open: boolean) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePalette, setActivePalette] = useState<ThemePalette>(() => {
    try {
      const saved = localStorage.getItem('viva_active_theme_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id === 'saas-modern-white') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    // Default to modern SaaS White, Blue #4A6CF7, Violet #8B5CF6, Text Gray #6B7280
    return PRESET_PALETTES[0];
  });

  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);

  // Apply CSS variables dynamically to document
  useEffect(() => {
    const root = document.documentElement;
    const { colors, mode } = activePalette;

    root.style.setProperty('--viva-primary', colors.primary);
    root.style.setProperty('--viva-primary-light', colors.primaryLight);
    root.style.setProperty('--viva-primary-dark', colors.primaryDark);
    root.style.setProperty('--viva-accent', colors.accent);
    root.style.setProperty('--viva-accent-light', colors.accentLight);
    root.style.setProperty('--viva-bg-main', colors.bgMain);
    root.style.setProperty('--viva-bg-surface', colors.bgSurface);
    root.style.setProperty('--viva-bg-subtle', colors.bgSubtle);
    root.style.setProperty('--viva-text-main', colors.textMain);
    root.style.setProperty('--viva-text-muted', colors.textMuted);
    root.style.setProperty('--viva-border', colors.border);
    root.style.setProperty('--viva-border-glow', colors.borderGlow);

    if (mode === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode', 'dark');
    } else {
      root.classList.add('dark-mode', 'dark');
      root.classList.remove('light-mode');
    }

    try {
      localStorage.setItem('viva_active_theme_v2', JSON.stringify(activePalette));
    } catch {
      // ignore
    }
  }, [activePalette]);

  const setPalette = (paletteId: string) => {
    const found = PRESET_PALETTES.find(p => p.id === paletteId);
    if (found) {
      setActivePalette(found);
    }
  };

  const setCustomColors = (newColors: Partial<ThemePalette['colors']>) => {
    setActivePalette(prev => ({
      ...prev,
      id: 'custom',
      name: 'Thème Personnalisé Sur-Mesure',
      description: 'Couleurs ajustées manuellement.',
      colors: {
        ...prev.colors,
        ...newColors
      }
    }));
  };

  const toggleThemeMode = () => {
    if (activePalette.mode === 'dark') {
      setPalette('official-viva-light');
    } else {
      setPalette('official-viva-dark');
    }
  };

  const resetToDefault = () => {
    setActivePalette(PRESET_PALETTES[0]);
  };

  return (
    <ThemeContext.Provider
      value={{
        activePalette,
        themeMode: activePalette.mode,
        setPalette,
        setCustomColors,
        toggleThemeMode,
        isThemeStudioOpen,
        setIsThemeStudioOpen,
        resetToDefault
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
