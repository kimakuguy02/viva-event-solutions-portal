import React, { useEffect, useRef, useState } from 'react';
import { useTheme, DISPLAY_STYLES, PRESET_PALETTES, DisplayStyle } from '../../context/ThemeContext';
import { Check, Palette, ChevronDown } from 'lucide-react';

interface StyleSwitcherProps {
  /** `inline` affiche la liste déroulée en permanence (menu mobile, pied de page). */
  variant?: 'dropdown' | 'inline';
  align?: 'left' | 'right';
  className?: string;
}

function Swatches({ styleId }: { styleId: DisplayStyle }) {
  const palette = PRESET_PALETTES.find(p => p.id === styleId);
  if (!palette) return null;
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: palette.colors.primary }} />
      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: palette.colors.accent }} />
      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: palette.colors.tertiary }} />
    </span>
  );
}

export const StyleSwitcher: React.FC<StyleSwitcherProps> = ({ variant = 'dropdown', align = 'right', className = '' }) => {
  const { displayStyle, setDisplayStyle } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = DISPLAY_STYLES.find(s => s.id === displayStyle);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const options = (
    <div
      role="menu"
      aria-label="Styles d'affichage"
      className={`grid gap-1 ${variant === 'inline' ? '' : 'p-2'}`}
    >
      {DISPLAY_STYLES.map(style => {
        const isActive = style.id === displayStyle;
        return (
          <button
            key={style.id}
            role="menuitemradio"
            aria-checked={isActive}
            onClick={() => {
              setDisplayStyle(style.id);
              if (variant === 'dropdown') setIsOpen(false);
            }}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer hover:bg-[var(--viva-muted-surface)]"
            style={{ color: 'var(--viva-text-main)' }}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Swatches styleId={style.id} />
              <span className="min-w-0">
                <span className="block text-xs font-bold truncate">{style.label}</span>
                <span className="block text-[10px] truncate" style={{ color: 'var(--viva-text-muted)' }}>{style.description}</span>
              </span>
            </span>
            {isActive && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--viva-primary)' }} />}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 px-3 pb-1">
          <Palette className="w-3.5 h-3.5" style={{ color: 'var(--viva-primary)' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--viva-text-muted)' }}>
            Style d'affichage
          </span>
        </div>
        {options}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Changer le style d'affichage"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer hover:bg-[var(--viva-muted-surface)]"
        style={{ borderColor: 'var(--viva-border)', color: 'var(--viva-text-main)' }}
      >
        <Palette className="w-3.5 h-3.5" style={{ color: 'var(--viva-primary)' }} />
        <span className="hidden xl:inline">{active?.label ?? 'Style'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-72 z-50 rounded-2xl border shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{
            backgroundColor: 'var(--viva-bg-surface)',
            borderColor: 'var(--viva-border)',
            boxShadow: 'var(--viva-card-shadow)'
          }}
        >
          {options}
        </div>
      )}
    </div>
  );
};
