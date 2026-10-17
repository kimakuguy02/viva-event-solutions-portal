import React, { useEffect, useState } from 'react';
import type { DynamicMenu, DynamicModule } from '../../types/cmsAndErp';
import { AdminCard } from './AdminUI';
import { useTheme } from '../../context/ThemeContext';
import { getSetting, SETTING_KEYS } from '../../services/supabase/settingsService';
import { MonitorSmartphone } from 'lucide-react';

/* PREVIEW PLATEFORME — bac à sable en lecture seule, isolé de l'application
   réelle (aucune mutation, aucun état partagé en écriture). Montre menus,
   modules, thème et feature flags tels que configurés. */

interface Props {
  menus: DynamicMenu[];
  modules: DynamicModule[];
  flags?: Record<string, boolean>;
}

export const PlatformPreview: React.FC<Props> = ({ menus, modules, flags: flagsProp }) => {
  const { activePalette } = useTheme();
  const [flags, setFlags] = useState<Record<string, boolean>>(flagsProp ?? {});
  useEffect(() => {
    if (flagsProp) {
      setFlags(flagsProp);
      return;
    }
    getSetting<Record<string, boolean>>(SETTING_KEYS.features, {})
      .then((r) => setFlags(r.value))
      .catch(() => setFlags({}));
  }, [flagsProp]);
  const visibleMenus = menus.filter((m) => m.active && m.showInNavbar).sort((a, b) => a.order - b.order);
  const activeModules = modules.filter((m) => m.active && !m.archived);

  return (
    <AdminCard
      title="Preview plateforme"
      subtitle="Bac à sable — lecture seule, séparé de l'application réelle. Aucune modification ici ne touche les données."
      action={
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300">
          <MonitorSmartphone className="w-4 h-4" /> Aperçu isolé
        </span>
      }
    >
      <div className="rounded-2xl overflow-hidden border border-slate-700">
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: activePalette.colors.bgSubtle }}>
          {visibleMenus.slice(0, 7).map((m) => (
            <span key={m.id} className="px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: `${activePalette.colors.accent}22`, color: activePalette.colors.accent }}>
              {m.displayName || m.name}
            </span>
          ))}
          {visibleMenus.length > 7 && <span className="text-[11px] text-slate-500">+{visibleMenus.length - 7}</span>}
          {visibleMenus.length === 0 && <span className="text-[11px] text-slate-500">Aucun menu visible</span>}
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ backgroundColor: activePalette.colors.bgMain }}>
          {activeModules.slice(0, 9).map((m) => (
            <div key={m.id} className="p-3 rounded-xl border" style={{ borderColor: activePalette.colors.border, backgroundColor: activePalette.colors.bgSurface }}>
              <div className="text-xs font-black" style={{ color: activePalette.colors.textMain }}>{m.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{m.description}</div>
            </div>
          ))}
          {activeModules.length === 0 && <span className="text-[11px] text-slate-500">Aucun module actif</span>}
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-1.5" style={{ backgroundColor: activePalette.colors.bgSubtle }}>
          {Object.entries(flags).map(([k, v]) => (
            <span key={k} className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${v ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-600'}`}>
              {k}: {v ? 'on' : 'off'}
            </span>
          ))}
        </div>
      </div>
    </AdminCard>
  );
};
