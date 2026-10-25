import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

/**
 * Styles d'affichage proposés dans le sélecteur public.
 * Tous partagent la même structure fonctionnelle et les mêmes composants :
 * seuls les jetons de couleur, de typographie et de rayon changent.
 */
export type DisplayStyle = 'moderne' | 'clair' | 'sombre' | 'minimaliste' | 'professionnel' | 'dynamique' | 'elegant';

export interface ThemeDesign {
  fontDisplay: string;
  fontBody?: string;
  radiusCard: string;
  radiusControl: string;
  heroGradient: string;
  accentGradient: string;
  cardShadow: string;
  navBackground: string;
  mutedSurface: string;
  heroText: string;
  heroMuted: string;
  heroChipBg: string;
  heroChipBorder: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  displayStyle: DisplayStyle;
  colors: {
    primary: string;       // Couleur de marque principale
    primaryLight: string;
    primaryDark: string;
    accent: string;        // Accent (rose, or, etc.)
    accentLight: string;
    tertiary: string;      // Troisième couleur (bleu électrique)
    bgMain: string;
    bgSurface: string;
    bgSubtle: string;
    textMain: string;
    textMuted: string;
    border: string;
    borderGlow: string;
    onPrimary: string;
    onAccent: string;
  };
  design: ThemeDesign;
}

const SYSTEM_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const PRESET_PALETTES: ThemePalette[] = [
  {
    id: 'moderne',
    name: 'Viva Moderne · Événements',
    description: 'Violet, corail, fond clair et coins arrondis. L’identité de référence de la plateforme.',
    mode: 'light',
    displayStyle: 'moderne',
    colors: {
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      primaryDark: '#7C3AED',
      accent: '#FF5E5E',
      accentLight: '#FFB3B3',
      tertiary: '#3B82F6',
      bgMain: '#F8FAFC',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F1F5F9',
      textMain: '#1F2937',
      textMuted: '#64748B',
      border: '#E9EDF5',
      borderGlow: 'rgba(139, 92, 246, 0.20)',
      onPrimary: '#FFFFFF',
      onAccent: '#FFFFFF'
    },
    design: {
      fontDisplay: `'Plus Jakarta Sans', ${SYSTEM_SANS}`,
      fontBody: `'Plus Jakarta Sans', ${SYSTEM_SANS}`,
      radiusCard: '20px',
      radiusControl: '999px',
      // Voile sombre posé sur la photo du hero : le texte blanc reste lisible.
      heroGradient:
        'linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.74) 42%, rgba(15, 23, 42, 0.28) 100%), linear-gradient(0deg, rgba(15, 23, 42, 0.55) 0%, transparent 45%)',
      accentGradient: 'linear-gradient(135deg, #8B5CF6 0%, #FF5E5E 100%)',
      cardShadow: '0 18px 40px -28px rgba(15, 23, 42, 0.28)',
      navBackground: 'rgba(255, 255, 255, 0.92)',
      mutedSurface: '#F1F5F9',
      heroText: '#FFFFFF',
      heroMuted: 'rgba(255, 255, 255, 0.82)',
      heroChipBg: 'rgba(255, 255, 255, 0.14)',
      heroChipBorder: 'rgba(255, 255, 255, 0.30)'
    }
  },
  {
    id: 'clair',
    name: 'Clair · Viva Lumière',
    description: 'Fond blanc lumineux, violet électrique, rose vif et bleu électrique. Le style de référence de la vitrine.',
    mode: 'light',
    displayStyle: 'clair',
    colors: {
      primary: '#6D28D9',
      primaryLight: '#8B5CF6',
      primaryDark: '#4C1D95',
      accent: '#EC4899',
      accentLight: '#F9A8D4',
      tertiary: '#2563EB',
      bgMain: '#FFFFFF',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F7F5FF',
      textMain: '#170F2B',
      textMuted: '#6B7280',
      border: '#ECE8F8',
      borderGlow: 'rgba(109, 40, 217, 0.18)',
      onPrimary: '#FFFFFF',
      onAccent: '#FFFFFF'
    },
    design: {
      fontDisplay: `'Sora', ${SYSTEM_SANS}`,
      radiusCard: '24px',
      radiusControl: '999px',
      heroGradient:
        'radial-gradient(1100px 620px at 12% 0%, rgba(109, 40, 217, 0.30), transparent 62%), radial-gradient(900px 520px at 88% 10%, rgba(236, 72, 153, 0.24), transparent 60%), radial-gradient(760px 520px at 60% 110%, rgba(37, 99, 235, 0.20), transparent 62%), linear-gradient(160deg, #FFFFFF 0%, #F7F2FF 55%, #EEF4FF 100%)',
      accentGradient: 'linear-gradient(135deg, #6D28D9 0%, #EC4899 52%, #2563EB 100%)',
      cardShadow: '0 22px 45px -28px rgba(23, 15, 43, 0.45)',
      navBackground: 'rgba(255, 255, 255, 0.86)',
      mutedSurface: '#F7F5FF',
      heroText: '#170F2B',
      heroMuted: '#5B5570',
      heroChipBg: 'rgba(109, 40, 217, 0.08)',
      heroChipBorder: 'rgba(109, 40, 217, 0.20)'
    }
  },
  {
    id: 'sombre',
    name: 'Sombre · Nuit Électrique',
    description: 'Nuit profonde, violet néon, rose et bleu glacial. Contraste élevé pour les écrans OLED.',
    mode: 'dark',
    displayStyle: 'sombre',
    colors: {
      primary: '#8B5CF6',
      primaryLight: '#A78BFA',
      primaryDark: '#6D28D9',
      accent: '#F472B6',
      accentLight: '#FBCFE8',
      tertiary: '#38BDF8',
      bgMain: '#08050F',
      bgSurface: '#120B21',
      bgSubtle: '#1A1030',
      textMain: '#F8FAFC',
      textMuted: '#A5A0B8',
      border: 'rgba(167, 139, 250, 0.18)',
      borderGlow: 'rgba(244, 114, 182, 0.35)',
      onPrimary: '#0B0714',
      onAccent: '#2A0E22'
    },
    design: {
      fontDisplay: `'Sora', ${SYSTEM_SANS}`,
      radiusCard: '24px',
      radiusControl: '999px',
      heroGradient:
        'radial-gradient(1100px 620px at 12% 0%, rgba(139, 92, 246, 0.48), transparent 60%), radial-gradient(900px 520px at 88% 12%, rgba(244, 114, 182, 0.34), transparent 58%), radial-gradient(720px 520px at 60% 112%, rgba(56, 189, 248, 0.30), transparent 62%), linear-gradient(160deg, #08050F 0%, #120B21 100%)',
      accentGradient: 'linear-gradient(135deg, #8B5CF6 0%, #F472B6 52%, #38BDF8 100%)',
      cardShadow: '0 28px 60px -32px rgba(0, 0, 0, 0.9)',
      navBackground: 'rgba(8, 5, 15, 0.82)',
      mutedSurface: '#150D26',
      heroText: '#FFFFFF',
      heroMuted: '#C7C1DA',
      heroChipBg: 'rgba(139, 92, 246, 0.18)',
      heroChipBorder: 'rgba(167, 139, 250, 0.35)'
    }
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste · Papier',
    description: 'Blanc cassé, encre noire et gris doux. Angles courts, aucune ombre superflue.',
    mode: 'light',
    displayStyle: 'minimaliste',
    colors: {
      primary: '#111827',
      primaryLight: '#374151',
      primaryDark: '#030712',
      accent: '#6B7280',
      accentLight: '#9CA3AF',
      tertiary: '#4B5563',
      bgMain: '#FCFCFC',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F5F5F5',
      textMain: '#111827',
      textMuted: '#6B7280',
      border: '#E7E7E7',
      borderGlow: 'rgba(17, 24, 39, 0.08)',
      onPrimary: '#FFFFFF',
      onAccent: '#FFFFFF'
    },
    design: {
      fontDisplay: SYSTEM_SANS,
      radiusCard: '12px',
      radiusControl: '8px',
      heroGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F8F8F8 100%)',
      accentGradient: 'linear-gradient(135deg, #111827 0%, #4B5563 100%)',
      cardShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      navBackground: 'rgba(252, 252, 252, 0.92)',
      mutedSurface: '#F5F5F5',
      heroText: '#111827',
      heroMuted: '#6B7280',
      heroChipBg: 'rgba(17, 24, 39, 0.05)',
      heroChipBorder: 'rgba(17, 24, 39, 0.12)'
    }
  },
  {
    id: 'professionnel',
    name: 'Professionnel · Institution',
    description: 'Bleu institutionnel, gris ardoise et cyan. Densité sobre pour les consoles de gestion.',
    mode: 'light',
    displayStyle: 'professionnel',
    colors: {
      primary: '#1D4ED8',
      primaryLight: '#3B82F6',
      primaryDark: '#1E3A8A',
      accent: '#0F172A',
      accentLight: '#334155',
      tertiary: '#0891B2',
      bgMain: '#F5F7FB',
      bgSurface: '#FFFFFF',
      bgSubtle: '#EEF2F9',
      textMain: '#0F172A',
      textMuted: '#5B6474',
      border: '#DCE3EE',
      borderGlow: 'rgba(29, 78, 216, 0.16)',
      onPrimary: '#FFFFFF',
      onAccent: '#FFFFFF'
    },
    design: {
      fontDisplay: SYSTEM_SANS,
      radiusCard: '10px',
      radiusControl: '8px',
      heroGradient:
        'radial-gradient(900px 520px at 10% 0%, rgba(29, 78, 216, 0.16), transparent 62%), radial-gradient(760px 480px at 90% 10%, rgba(8, 145, 178, 0.14), transparent 60%), linear-gradient(160deg, #FFFFFF 0%, #EEF2F9 100%)',
      accentGradient: 'linear-gradient(135deg, #0F172A 0%, #1D4ED8 60%, #0891B2 100%)',
      cardShadow: '0 10px 24px -18px rgba(15, 23, 42, 0.35)',
      navBackground: 'rgba(255, 255, 255, 0.92)',
      mutedSurface: '#EEF2F9',
      heroText: '#0F172A',
      heroMuted: '#5B6474',
      heroChipBg: 'rgba(29, 78, 216, 0.08)',
      heroChipBorder: 'rgba(29, 78, 216, 0.20)'
    }
  },
  {
    id: 'dynamique',
    name: 'Dynamique · Scène Viva',
    description: 'Aplat immersif violet, rose et bleu électrique, très arrondi. L’énergie d’un show en direct.',
    mode: 'dark',
    displayStyle: 'dynamique',
    colors: {
      primary: '#DB2777',
      primaryLight: '#F472B6',
      primaryDark: '#9D174D',
      accent: '#F59E0B',
      accentLight: '#FCD34D',
      tertiary: '#7C3AED',
      bgMain: '#1B0A24',
      bgSurface: '#26102F',
      bgSubtle: '#33153C',
      textMain: '#FFFFFF',
      textMuted: '#E3C9E8',
      border: 'rgba(244, 114, 182, 0.20)',
      borderGlow: 'rgba(124, 58, 237, 0.45)',
      onPrimary: '#FFFFFF',
      onAccent: '#2A0E22'
    },
    design: {
      fontDisplay: `'Sora', ${SYSTEM_SANS}`,
      radiusCard: '30px',
      radiusControl: '999px',
      heroGradient:
        'radial-gradient(900px 620px at 18% 0%, rgba(124, 58, 237, 0.85), transparent 62%), radial-gradient(820px 560px at 86% 8%, rgba(219, 39, 119, 0.75), transparent 58%), radial-gradient(720px 620px at 58% 112%, rgba(37, 99, 235, 0.65), transparent 62%), linear-gradient(160deg, #240C2E 0%, #3A0F3B 55%, #1B0A24 100%)',
      accentGradient: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #2563EB 100%)',
      cardShadow: '0 30px 70px -34px rgba(124, 58, 237, 0.75)',
      navBackground: 'rgba(27, 10, 36, 0.82)',
      mutedSurface: '#2A1132',
      heroText: '#FFFFFF',
      heroMuted: '#F3D9F5',
      heroChipBg: 'rgba(255, 255, 255, 0.12)',
      heroChipBorder: 'rgba(255, 255, 255, 0.28)'
    }
  },
  {
    id: 'elegant',
    name: 'Élégant · Ivoire & Or',
    description: 'Ivoire, encre et or vieilli, titres à empattements. Codes du gala et de la réception officielle.',
    mode: 'light',
    displayStyle: 'elegant',
    colors: {
      primary: '#1F2937',
      primaryLight: '#374151',
      primaryDark: '#0B1220',
      accent: '#B08968',
      accentLight: '#D6BFA6',
      tertiary: '#7C5C3E',
      bgMain: '#FBF8F3',
      bgSurface: '#FFFFFF',
      bgSubtle: '#F5EFE6',
      textMain: '#1F2937',
      textMuted: '#6B6257',
      border: '#EAE0D3',
      borderGlow: 'rgba(176, 137, 104, 0.22)',
      onPrimary: '#FFFFFF',
      onAccent: '#1F2937'
    },
    design: {
      fontDisplay: `Georgia, 'Times New Roman', serif`,
      radiusCard: '6px',
      radiusControl: '4px',
      heroGradient:
        'radial-gradient(880px 560px at 82% 0%, rgba(176, 137, 104, 0.22), transparent 62%), radial-gradient(700px 480px at 8% 10%, rgba(31, 41, 55, 0.08), transparent 60%), linear-gradient(160deg, #FFFFFF 0%, #FBF8F3 60%, #F5EFE6 100%)',
      accentGradient: 'linear-gradient(135deg, #1F2937 0%, #7C5C3E 55%, #B08968 100%)',
      cardShadow: '0 14px 34px -26px rgba(31, 41, 55, 0.45)',
      navBackground: 'rgba(251, 248, 243, 0.92)',
      mutedSurface: '#F5EFE6',
      heroText: '#1F2937',
      heroMuted: '#6B6257',
      heroChipBg: 'rgba(176, 137, 104, 0.14)',
      heroChipBorder: 'rgba(176, 137, 104, 0.35)'
    }
  }
];

export const DISPLAY_STYLES: { id: DisplayStyle; label: string; description: string }[] = [
  { id: 'moderne', label: 'Moderne', description: 'Violet, corail et fond clair — identité Viva' },
  { id: 'clair', label: 'Clair', description: 'Blanc, violet, rose et bleu électrique' },
  { id: 'sombre', label: 'Sombre', description: 'Nuit profonde et néons' },
  { id: 'minimaliste', label: 'Minimaliste', description: 'Papier, encre et gris doux' },
  { id: 'professionnel', label: 'Professionnel', description: 'Bleu institutionnel sobre' },
  { id: 'dynamique', label: 'Dynamique', description: 'Scène immersive très colorée' },
  { id: 'elegant', label: 'Élégant', description: 'Ivoire, or et typographie serif' }
];

const STORAGE_KEY = 'viva_active_theme_v5';
const LEGACY_KEYS = ['viva_active_theme_v4', 'viva_active_theme_v3', 'viva_active_theme_v2'];

interface ThemeContextType {
  activePalette: ThemePalette;
  themeMode: ThemeMode;
  displayStyle: DisplayStyle;
  setPalette: (paletteId: string) => void;
  setDisplayStyle: (style: DisplayStyle) => void;
  setCustomColors: (colors: Partial<ThemePalette['colors']>) => void;
  toggleThemeMode: () => void;
  isThemeStudioOpen: boolean;
  setIsThemeStudioOpen: (open: boolean) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveStoredPalette(raw: string | null): ThemePalette | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ThemePalette>;
    const preset = PRESET_PALETTES.find(p => p.id === parsed.id);
    if (preset) return preset;
    // Ancienne palette (saas-modern-white, pure-white-clean) -> style clair.
    if (parsed.colors) {
      const fallback = PRESET_PALETTES[0];
      return {
        ...fallback,
        id: parsed.id ?? fallback.id,
        name: parsed.name ?? fallback.name,
        description: parsed.description ?? fallback.description,
        mode: parsed.mode ?? fallback.mode,
        displayStyle: fallback.displayStyle,
        colors: { ...fallback.colors, ...parsed.colors },
        design: parsed.design ?? fallback.design
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function readInitialPalette(): ThemePalette {
  const current = resolveStoredPalette(localStorage.getItem(STORAGE_KEY));
  if (current) return current;
  // Un thème entièrement personnalisé (id 'custom') est conservé ; les anciens
  // presets cèdent la place à la nouvelle identité par défaut.
  const previous = resolveStoredPalette(localStorage.getItem('viva_active_theme_v4'));
  if (previous && previous.id === 'custom') return previous;
  return PRESET_PALETTES[0];
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePalette, setActivePalette] = useState<ThemePalette>(readInitialPalette);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);

  // Applique les jetons CSS sur <html> : toutes les vues consomment les mêmes variables.
  useEffect(() => {
    const root = document.documentElement;
    const { colors, mode, design, displayStyle } = activePalette;

    root.style.setProperty('--viva-primary', colors.primary);
    root.style.setProperty('--viva-primary-light', colors.primaryLight);
    root.style.setProperty('--viva-primary-dark', colors.primaryDark);
    root.style.setProperty('--viva-accent', colors.accent);
    root.style.setProperty('--viva-accent-light', colors.accentLight);
    root.style.setProperty('--viva-tertiary', colors.tertiary);
    root.style.setProperty('--viva-bg-main', colors.bgMain);
    root.style.setProperty('--viva-bg-surface', colors.bgSurface);
    root.style.setProperty('--viva-bg-subtle', colors.bgSubtle);
    root.style.setProperty('--viva-text-main', colors.textMain);
    root.style.setProperty('--viva-text-muted', colors.textMuted);
    root.style.setProperty('--viva-border', colors.border);
    root.style.setProperty('--viva-border-glow', colors.borderGlow);
    root.style.setProperty('--viva-on-primary', colors.onPrimary);
    root.style.setProperty('--viva-on-accent', colors.onAccent);

    root.style.setProperty('--viva-font-display', design.fontDisplay);
    root.style.setProperty('--viva-font-body', design.fontBody || SYSTEM_SANS);
    root.style.setProperty('--viva-radius-card', design.radiusCard);
    root.style.setProperty('--viva-radius-control', design.radiusControl);
    root.style.setProperty('--viva-hero-gradient', design.heroGradient);
    root.style.setProperty('--viva-accent-gradient', design.accentGradient);
    root.style.setProperty('--viva-card-shadow', design.cardShadow);
    root.style.setProperty('--viva-nav-bg', design.navBackground);
    root.style.setProperty('--viva-muted-surface', design.mutedSurface);
    root.style.setProperty('--viva-hero-text', design.heroText);
    root.style.setProperty('--viva-hero-muted', design.heroMuted);
    root.style.setProperty('--viva-hero-chip-bg', design.heroChipBg);
    root.style.setProperty('--viva-hero-chip-border', design.heroChipBorder);
    root.style.setProperty('--viva-color-scheme', mode);

    root.setAttribute('data-viva-style', displayStyle);

    if (mode === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode', 'dark');
    } else {
      root.classList.add('dark-mode', 'dark');
      root.classList.remove('light-mode');
    }

    for (const key of LEGACY_KEYS) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activePalette));
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

  const setDisplayStyle = (style: DisplayStyle) => {
    setPalette(style);
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
    setPalette(activePalette.mode === 'dark' ? 'moderne' : 'sombre');
  };

  const resetToDefault = () => {
    setActivePalette(PRESET_PALETTES[0]);
  };

  return (
    <ThemeContext.Provider
      value={{
        activePalette,
        themeMode: activePalette.mode,
        displayStyle: activePalette.displayStyle,
        setPalette,
        setDisplayStyle,
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
