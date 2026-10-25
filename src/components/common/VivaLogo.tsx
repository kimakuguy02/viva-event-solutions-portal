import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface VivaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'badge';
  variant?: 'full' | 'stacked' | 'horizontal' | 'icon-only';
  with3DEffect?: boolean;
  className?: string;
  themeOverride?: {
    primary?: string;
    accent?: string;
  };
}

/**
 * Exact Vector recreation of the official VIVA EVENT SOLUTIONS Logo
 * matching image IMG-20260823-WA0053.jpg:
 * - Intertwined "VE" monogram
 * - Stage truss structure with spotlights
 * - Central broadcast camera on tripod
 * - Urban skyline architecture towers
 * - Double crescent orbital arcs (Yellow #F3B228 & Blue #164E8E)
 * - 5-pointed golden star
 * - Typography: "VIVA" (Blue) + "E" (Yellow) + "VENT" (Blue) + "SOLUTIONS"
 */
export const VivaLogo: React.FC<VivaLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  with3DEffect = true,
  className = '',
  themeOverride
}) => {
  let activePalette;
  try {
    const theme = useTheme();
    activePalette = theme.activePalette;
  } catch {
    activePalette = {
      mode: 'light',
      colors: {
        primary: '#164E8E',
        primaryLight: '#2563EB',
        primaryDark: '#0D3563',
        accent: '#F3B228',
        accentLight: '#FDE047',
        bgMain: '#FFFFFF',
        bgSurface: '#F8FAFC',
        textMain: '#0F172A',
        textMuted: '#475569',
        border: 'rgba(22, 78, 142, 0.2)',
        borderGlow: 'rgba(243, 178, 40, 0.4)'
      }
    };
  }

  // Official Logo Colors from Theme
  const blueColor = themeOverride?.primary || activePalette.colors.primary || '#8B5CF6';
  const accentColor = themeOverride?.accent || activePalette.colors.accent || '#8B5CF6';
  const yellowColor = themeOverride?.accent || '#F3B228';
  const isLight = activePalette.mode === 'light';

  // Sizing definitions
  const dimensions = {
    sm: { icon: 34, text: 'text-sm', subText: 'text-[9px]', tracking: 'tracking-[0.18em]' },
    md: { icon: 46, text: 'text-lg', subText: 'text-[10px]', tracking: 'tracking-[0.22em]' },
    lg: { icon: 64, text: 'text-2xl', subText: 'text-xs', tracking: 'tracking-[0.25em]' },
    xl: { icon: 84, text: 'text-3xl sm:text-4xl', subText: 'text-sm', tracking: 'tracking-[0.28em]' },
    hero: { icon: 110, text: 'text-4xl sm:text-5xl', subText: 'text-base sm:text-lg', tracking: 'tracking-[0.32em]' },
    badge: { icon: 26, text: 'text-xs', subText: 'text-[8px]', tracking: 'tracking-[0.15em]' }
  }[size];

  // SVG Emblem matching exact vector geometry of IMG-20260823-WA0053.jpg
  const renderEmblem = (iconSize: number) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${
        with3DEffect ? 'hover:scale-105 filter drop-shadow-[0_4px_8px_rgba(22,78,142,0.18)]' : ''
      }`}
    >
      <defs>
        <filter id="vivaGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* 1. Violet/Accent Outer Crescent Orbit */}
      <path
        d="M 68 122 C 55 106 58 70 78 52 C 96 36 122 36 142 48 C 132 40 106 38 86 52 C 68 66 64 96 74 116 Z"
        fill={accentColor}
      />
      <path
        d="M 62 108 C 56 86 64 62 82 48 C 104 30 134 34 150 48 C 136 38 108 34 88 48 C 70 60 62 84 66 104 Z"
        fill={accentColor}
      />

      {/* 2. Blue Inner Crescent Orbit (Top to Bottom Swoosh) */}
      <path
        d="M 80 50 C 105 32 140 38 156 60 C 160 65 158 70 152 66 C 138 48 108 44 86 60 C 68 74 62 104 76 130 C 88 152 114 164 138 158 C 120 162 94 154 82 136 C 68 114 70 82 86 62 Z"
        fill={blueColor}
      />
      <path
        d="M 86 140 C 102 156 126 160 148 154 C 130 158 108 152 94 138 Z"
        fill={blueColor}
      />

      {/* 3. 5-Point Accent Star (Top-Right of the Orbit) */}
      <polygon
        points="155,54 157.5,59.5 163.5,60 159,64 160.5,70 155,66.5 149.5,70 151,64 146.5,60 152.5,59.5"
        fill={accentColor}
      />

      {/* 4. Background Skyline Towers / City Architecture inside the V */}
      <g fill={blueColor} opacity="0.95">
        {/* Left tower */}
        <path d="M 86 70 L 93 70 L 93 92 L 86 92 Z" />
        {/* Mid-left taller tower */}
        <path d="M 94 58 L 102 58 L 102 92 L 94 92 Z" />
        {/* Center highest pinnacle tower */}
        <path d="M 103 48 L 112 48 L 112 92 L 103 92 Z" />
        {/* Mid-right tower with angled roof */}
        <polygon points="113,62 120,66 120,92 113,92" />
        {/* Far-right tower */}
        <path d="M 121 72 L 126 72 L 126 92 L 121 92 Z" />
      </g>

      {/* 5. Stage Truss Structure (Crossbeam with grid & spotlights) */}
      <g stroke={blueColor} strokeWidth="1.2" fill="none">
        {/* Top & Bottom Horizontal Truss Bars */}
        <line x1="80" y1="92" x2="128" y2="92" strokeWidth="2.5" />
        <line x1="80" y1="98" x2="128" y2="98" strokeWidth="2.2" />

        {/* Diagonal Cross Struts (X-Grid inside truss) */}
        <line x1="80" y1="92" x2="88" y2="98" />
        <line x1="88" y1="92" x2="80" y2="98" />
        <line x1="88" y1="92" x2="96" y2="98" />
        <line x1="96" y1="92" x2="88" y2="98" />
        <line x1="96" y1="92" x2="104" y2="98" />
        <line x1="104" y1="92" x2="96" y2="98" />
        <line x1="104" y1="92" x2="112" y2="98" />
        <line x1="112" y1="92" x2="104" y2="98" />
        <line x1="112" y1="92" x2="120" y2="98" />
        <line x1="120" y1="92" x2="112" y2="98" />
        <line x1="120" y1="92" x2="128" y2="98" />
        <line x1="128" y1="92" x2="120" y2="98" />

        {/* Hanging Stage Spotlights below truss */}
        <g fill={blueColor}>
          <rect x="84" y="99" width="3.5" height="4" rx="0.8" />
          <polygon points="83,103 88.5,103 89.5,105 82,105" />

          <rect x="94" y="99" width="3.5" height="4" rx="0.8" />
          <polygon points="93,103 98.5,103 99.5,105 92,105" />

          <rect x="110" y="99" width="3.5" height="4" rx="0.8" />
          <polygon points="109,103 114.5,103 115.5,105 108,105" />

          <rect x="120" y="99" width="3.5" height="4" rx="0.8" />
          <polygon points="119,103 124.5,103 125.5,105 118,105" />
        </g>
      </g>

      {/* 6. Broadcast Video Camera on Tripod (Center of the Stage) */}
      <g fill={blueColor}>
        {/* Camera Body & Lens */}
        <rect x="98" y="108" width="11" height="6.5" rx="1.2" />
        <polygon points="98,109.5 94,107.5 94,115 98,113" />
        <rect x="103" y="105.5" width="4" height="2.5" rx="0.5" />
        {/* Tripod Mount & Legs */}
        <rect x="102.5" y="115" width="2" height="3" />
        <line x1="103.5" y1="118" x2="97" y2="134" stroke={blueColor} strokeWidth="1.6" />
        <line x1="103.5" y1="118" x2="103.5" y2="134" stroke={blueColor} strokeWidth="1.6" />
        <line x1="103.5" y1="118" x2="110" y2="134" stroke={blueColor} strokeWidth="1.6" />
        {/* Tripod Spreader bar */}
        <line x1="99" y1="126" x2="108" y2="126" stroke={blueColor} strokeWidth="1" />
      </g>

      {/* 7. The Interlocking "VE" Monogram Frame */}
      {/* V Letter - Left bold arm */}
      <polygon
        points="48,78 68,78 98,150 104,150 78,88 64,88"
        fill={blueColor}
      />
      {/* V Outer Contour */}
      <path
        d="M 48 78 L 68 78 L 104 154 L 104 148 L 74 78 Z"
        fill={blueColor}
      />
      {/* V Inner sharp base */}
      <polygon
        points="98,142 104,154 110,142 104,136"
        fill={blueColor}
      />

      {/* E Letter - Right bold block intertwined with V */}
      {/* E Top Arm */}
      <polygon points="112,88 162,88 152,102 117,102" fill={blueColor} />
      {/* E Middle Arm */}
      <polygon points="120,110 148,110 142,122 124,122" fill={blueColor} />
      {/* E Bottom Arm */}
      <polygon points="107,144 158,144 150,158 98,158" fill={blueColor} />
    </svg>
  );

  // Variant: Text Only (Minimalist modern Stripe/Linear style)
  if (variant === 'text-only' as any) {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
          VIVA
        </span>
        <span className="font-bold text-xl tracking-tight font-sans" style={{ color: blueColor }}>
          EVENT
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] font-sans pl-2 border-l border-slate-200 text-slate-500">
          SOLUTIONS
        </span>
      </div>
    );
  }

  // Variant: Icon Only
  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderEmblem(dimensions.icon)}</div>;
  }

  // Variant: Stacked (Centered vertical like the main brand card in the image)
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        {renderEmblem(dimensions.icon * 1.5)}

        {/* Main Line: VIVA (Blue) + E (Yellow) + VENT (Blue) */}
        <div className="flex items-baseline justify-center font-black tracking-tight leading-none mt-4">
          <span
            className={`${dimensions.text} font-black`}
            style={{ color: blueColor, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            VIVA
          </span>
          <span
            className={`${dimensions.text} font-black`}
            style={{ color: yellowColor, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            E
          </span>
          <span
            className={`${dimensions.text} font-black`}
            style={{ color: blueColor, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            VENT
          </span>
        </div>

        {/* Subtitle: SOLUTIONS */}
        <div
          className={`${dimensions.subText} ${dimensions.tracking} font-extrabold uppercase mt-2`}
          style={{ color: blueColor, letterSpacing: '0.35em' }}
        >
          SOLUTIONS
        </div>
      </div>
    );
  }

  // Variant: Horizontal (Standard for Navbar, Header, Footer)
  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {renderEmblem(dimensions.icon)}

      <div className="flex flex-col justify-center">
        {/* Main Wordmark Line: VIVA (Blue) + E (Yellow) + VENT (Blue) */}
        <div className="flex items-baseline font-black tracking-tight leading-none">
          <span
            className={`${dimensions.text} font-black`}
            style={{ color: blueColor, fontWeight: 900, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            VIVA
          </span>
          <span
            className={`${dimensions.text} font-black`}
            style={{ color: accentColor, fontWeight: 900, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            E
          </span>
          <span
            className={`${dimensions.text} font-black`}
            style={{ color: blueColor, fontWeight: 900, fontFamily: "'Montserrat', 'Inter', sans-serif" }}
          >
            VENT
          </span>

          <span
            className="ml-2 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-black uppercase border tracking-wider"
            style={{
              backgroundColor: `${accentColor}15`,
              color: isLight ? blueColor : accentColor,
              borderColor: `${accentColor}40`
            }}
          >
            SARLU
          </span>
        </div>

        {/* Secondary Line: S O L U T I O N S */}
        <div
          className={`${dimensions.subText} font-extrabold uppercase mt-1`}
          style={{ color: blueColor, letterSpacing: '0.32em', fontWeight: 800 }}
        >
          SOLUTIONS
        </div>
      </div>
    </div>
  );
};
