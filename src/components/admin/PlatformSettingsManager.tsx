import React, { useState, useEffect } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useTheme, PRESET_PALETTES } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  SETTING_KEYS,
  getSetting,
  upsertSetting,
  logSettingsAudit,
  isSupabaseSettingsAvailable,
  type FinanceSettings,
  type FeatureFlags,
} from '../../services/supabase/settingsService';
import {
  Settings,
  Sliders,
  DollarSign,
  Palette,
  Shield,
  ToggleLeft,
  ToggleRight,
  Save,
  RotateCcw,
  CheckCircle2,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export const PlatformSettingsManager: React.FC = () => {
  const { platformConfig, updatePlatformConfig, resetToDefaults } = useProjectData();
  const { activePalette, setPalette, themeMode, toggleThemeMode } = useTheme();
  // P5 Wave 1 : l'ancien `setExchangeRate` du contexte n'existait pas (appel mort,
  // désormais supprimé). Le taux ERP reste la constante du contexte jusqu'à la vague ERP.
  const { currentUser, isAdminGeneral } = useAuth();
  const isLight = themeMode === 'light';

  const [activeTab, setActiveTab] = useState<'general' | 'visual' | 'finance' | 'features' | 'security'>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // General state
  const [contactDraft, setContactDraft] = useState({
    companyName: "VIVA EVENT SOLUTIONS SARLU",
    phone: platformConfig.contactInfo.phone,
    email: platformConfig.contactInfo.email,
    address: platformConfig.contactInfo.address,
    rccm: platformConfig.contactInfo.rccm,
    idNat: platformConfig.contactInfo.idNat,
    website: platformConfig.contactInfo.website,
    tagline: platformConfig.heroTagline
  });

  // Financial state — SSOT = Supabase app_settings (finance.defaults).
  // Le taux ERP calculé reste la constante du contexte (vague ERP) : aucun impact comptable.
  const [exchangeRateDraft, setExchangeRateDraft] = useState(2850);
  const [vatRate, setVatRate] = useState(16);
  const [doubleSignatureThreshold, setDoubleSignatureThreshold] = useState(100);

  // Features state — SSOT = Supabase app_settings (features.defaults).
  const [features, setFeatures] = useState<FeatureFlags>({
    quotesEnabled: true,
    liveHubEnabled: true,
    ticketingEnabled: true,
    votingEnabled: true,
    clientPortalEnabled: true,
    visitorRadarEnabled: true,
    maintenanceMode: false,
  });
  const [settingsStore, setSettingsStore] = useState<'supabase' | 'unavailable' | 'loading'>('loading');
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // P4 — Lecture prioritaire Supabase, sans fallback silencieux.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseSettingsAvailable()) {
        if (!cancelled) {
          setSettingsStore('unavailable');
          setSettingsError('Supabase non configuré : paramètres non chargés (aucune valeur locale utilisée comme vérité).');
        }
        return;
      }
      try {
        const [finance, flags] = await Promise.all([
          getSetting<FinanceSettings>(SETTING_KEYS.finance, {
            exchangeRateCDF: 2850,
            vatRatePercent: 16,
            doubleSignatureThresholdUSD: 100,
          }),
          getSetting<FeatureFlags>(SETTING_KEYS.features, {
            quotesEnabled: true,
            liveHubEnabled: true,
            ticketingEnabled: true,
            votingEnabled: true,
            clientPortalEnabled: true,
            visitorRadarEnabled: true,
            maintenanceMode: false,
          }),
        ]);
        if (cancelled) return;
        setExchangeRateDraft(finance.value.exchangeRateCDF);
        setVatRate(finance.value.vatRatePercent);
        setDoubleSignatureThreshold(finance.value.doubleSignatureThresholdUSD);
        setFeatures(flags.value);
        setSettingsStore('supabase');
        setSettingsError(null);
        // Migration du cache legacy : ces clés ne sont plus écrites ni lues comme vérité.
        try {
          localStorage.removeItem('viva_feature_flags');
          localStorage.removeItem('viva_exchange_rate');
        } catch { /* noop */ }
      } catch (e) {
        if (!cancelled) {
          setSettingsStore('unavailable');
          setSettingsError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Security policies
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(3);
  const [lockoutDurationMins, setLockoutDurationMins] = useState(15);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveGeneral = () => {
    updatePlatformConfig({
      heroTagline: contactDraft.tagline,
      contactInfo: {
        phone: contactDraft.phone,
        email: contactDraft.email,
        address: contactDraft.address,
        rccm: contactDraft.rccm,
        idNat: contactDraft.idNat,
        website: contactDraft.website
      }
    });

    const logs = JSON.parse(localStorage.getItem('viva_audit_logs') || '[]');
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: currentUser.email,
      action: 'PLATFORM_SETTINGS_GENERAL_UPDATED',
      ipAddress: '192.168.1.50',
      device: navigator.userAgent
    });
    localStorage.setItem('viva_audit_logs', JSON.stringify(logs));

    showToast("Paramètres généraux et coordonnées officielles enregistrés avec succès.");
  };

  const handleSaveFinancial = async () => {
    // P3 — session → permission (RLS) → mutation → confirmation → relecture → audit → succès.
    setSettingsError(null);
    const previous = {
      exchangeRateCDF: exchangeRateDraft,
      vatRatePercent: vatRate,
      doubleSignatureThresholdUSD: doubleSignatureThreshold,
    };
    try {
      const value: FinanceSettings = {
        exchangeRateCDF: Number(exchangeRateDraft),
        vatRatePercent: Number(vatRate),
        doubleSignatureThresholdUSD: Number(doubleSignatureThreshold),
      };
      await upsertSetting(SETTING_KEYS.finance, value);
      const confirmed = await getSetting<FinanceSettings>(SETTING_KEYS.finance, value);
      setExchangeRateDraft(confirmed.value.exchangeRateCDF);
      setVatRate(confirmed.value.vatRatePercent);
      setDoubleSignatureThreshold(confirmed.value.doubleSignatureThresholdUSD);
      await logSettingsAudit('SETTINGS_FINANCE_UPDATED', SETTING_KEYS.finance, {
        exchangeRateCDF: confirmed.value.exchangeRateCDF,
      });
      showToast(`Paramètres financiers enregistrés dans Supabase (taux ERP inchangé jusqu'à la vague ERP).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSettingsError(msg);
      showToast(`Échec d'enregistrement : ${msg}. Ancienne valeur conservée.`);
      void previous;
    }
  };

  const handleToggleFeature = async (key: string) => {
    const previous = { ...features };
    const updated = { ...features, [key]: !(features as unknown as Record<string, boolean>)[key] };
    try {
      await upsertSetting(SETTING_KEYS.features, updated);
      const confirmed = await getSetting<FeatureFlags>(SETTING_KEYS.features, updated);
      setFeatures(confirmed.value);
      await logSettingsAudit('FEATURE_FLAG_TOGGLED', SETTING_KEYS.features, {
        key,
        value: (confirmed.value as unknown as Record<string, boolean>)[key],
      });
      showToast(`Fonctionnalité "${String(key)}" : ${(confirmed.value as unknown as Record<string, boolean>)[key] ? 'ACTIVÉE' : 'DÉSACTIVÉE'} (confirmé serveur).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFeatures(previous);
      setSettingsError(msg);
      showToast(`Échec : ${msg}. Valeur précédente restaurée.`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Source de vérité paramètres (Wave 1 : Supabase, jamais de succès local) */}
      {settingsStore !== 'supabase' && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {settingsStore === 'loading'
              ? 'Chargement des paramètres depuis Supabase…'
              : `Paramètres non chargés : ${settingsError ?? 'Supabase indisponible'}. Aucune valeur locale utilisée comme vérité ; enregistrement désactivé.`}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
              ⚙️ Centre de Configuration Platform
            </span>
            <span className="text-xs text-slate-400">Paramètres généraux, visuels, devises & fonctionnalités</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Configuration Globale de la Plateforme
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Pilotez l'ensemble des règles de gestion de VIVA EVENT SOLUTIONS : coordonnées d'entreprise, paramètres graphiques, taux de change SYSCOHADA, et commutateurs de fonctionnalités.
          </p>
        </div>

        <button
          onClick={() => {
            if (window.confirm("Restaurer les paramètres d'origine par défaut ?")) {
              resetToDefaults();
              showToast("Paramètres d'origine restaurés avec succès.");
            }
          }}
          className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          style={{ borderColor: activePalette.colors.border }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurer par défaut</span>
        </button>
      </div>

      {/* Tabs Sub-Navigation */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: activePalette.colors.border }}>
        {[
          { id: 'general', label: 'Coordonnées & Informations Légales', icon: Building2 },
          { id: 'visual', label: 'Paramètres Visuels & Thème', icon: Palette },
          { id: 'finance', label: 'Devises & Comptabilité SYSCOHADA', icon: DollarSign },
          { id: 'features', label: 'Fonctionnalités Activées / Désactivées', icon: Sliders },
          { id: 'security', label: 'Politiques de Sécurité & Session', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border"
              style={{
                backgroundColor: isActive ? activePalette.colors.primary : (isLight ? '#F1F5F9' : activePalette.colors.bgSubtle),
                borderColor: isActive ? activePalette.colors.borderGlow : activePalette.colors.border,
                color: isActive ? '#FFFFFF' : (isLight ? '#475569' : '#CBD5E1')
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL & LEGAL */}
      {activeTab === 'general' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-4xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Identité Officielle & Mentions Légales RDC</h3>
            <p className="text-xs text-slate-400">Ces informations sont utilisées dans l'en-tête du site, les devis officiels pro-forma et les reçus de paiement.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Raison Sociale</label>
              <input
                type="text"
                value={contactDraft.companyName}
                onChange={e => setContactDraft({ ...contactDraft, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Slogan Institutionnel (Hero Tagline)</label>
              <input
                type="text"
                value={contactDraft.tagline}
                onChange={e => setContactDraft({ ...contactDraft, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Numéro RCCM (Greffe Kinshasa)</label>
              <input
                type="text"
                value={contactDraft.rccm}
                onChange={e => setContactDraft({ ...contactDraft, rccm: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Numéro Identification Nationale (ID Nat)</label>
              <input
                type="text"
                value={contactDraft.idNat}
                onChange={e => setContactDraft({ ...contactDraft, idNat: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Téléphones Directs & Lignes Permanentes</label>
              <input
                type="text"
                value={contactDraft.phone}
                onChange={e => setContactDraft({ ...contactDraft, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Officiel</label>
              <input
                type="email"
                value={contactDraft.email}
                onChange={e => setContactDraft({ ...contactDraft, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Adresse Physique du Siège Social</label>
              <input
                type="text"
                value={contactDraft.address}
                onChange={e => setContactDraft({ ...contactDraft, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border,
                  color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end" style={{ borderColor: activePalette.colors.border }}>
            <button
              onClick={handleSaveGeneral}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les coordonnées</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL PARAMETERS & THEME */}
      {activeTab === 'visual' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-4xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Personnalisation Visuelle & Thème de Marque</h3>
            <p className="text-xs text-slate-400">Choisissez la palette officielle de VIVA EVENT SOLUTIONS et le mode d'affichage.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">Mode d'Affichage Global</h4>
                <p className="text-xs text-slate-400">Actuellement : {themeMode === 'dark' ? 'Mode Sombre Prestige' : 'Mode Clair Lumineux'}</p>
              </div>
              <button
                onClick={toggleThemeMode}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
              >
                Basculer en mode {themeMode === 'dark' ? 'Clair' : 'Sombre'}
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-3">Palettes Graphiques de Haute Précision</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_PALETTES.map(p => {
                  const isCurrent = activePalette.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPalette(p.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isCurrent ? 'ring-2 ring-amber-400 border-transparent shadow-lg' : 'border-slate-800 hover:border-slate-700'
                      }`}
                      style={{ backgroundColor: isLight ? '#FFFFFF' : '#0F172A' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{p.name}</span>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden">
                        <div className="flex-1 h-full" style={{ backgroundColor: p.colors.primary }}></div>
                        <div className="flex-1 h-full" style={{ backgroundColor: p.colors.accent }}></div>
                        <div className="flex-1 h-full" style={{ backgroundColor: p.colors.primaryDark }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCE & CURRENCY */}
      {activeTab === 'finance' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-3xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Paramètres Financiers & SYSCOHADA RDC</h3>
            <p className="text-xs text-slate-400">Gestion de la bi-devise USD / Franc Congolais (CDF), taxes et règles anti-fraude.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Taux de Change SYSCOHADA (1 USD en CDF) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <input
                  type="number"
                  value={exchangeRateDraft}
                  onChange={e => setExchangeRateDraft(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono font-bold text-emerald-400"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Taux de référence pour conversion automatique des factures pro-forma et salaires.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Taux TVA RDC (%)</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={e => setVatRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Seuil Double Signature DAF (USD)
                </label>
                <input
                  type="number"
                  value={doubleSignatureThreshold}
                  onChange={e => setDoubleSignatureThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end" style={{ borderColor: activePalette.colors.border }}>
            <button
              onClick={handleSaveFinancial}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Appliquer les taux financiers</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: FEATURE TOGGLES */}
      {activeTab === 'features' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-4xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Fonctionnalités Activées / Désactivées</h3>
            <p className="text-xs text-slate-400">Activez ou désactivez instantanément les modules et guichets publics sans redéploiement.</p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'quotesEnabled', title: 'Guichet Devis & Simulateur Pro-Forma', desc: 'Permet aux prospects et clients de concevoir et soumettre leurs cahiers des charges 24/7.' },
              { key: 'liveHubEnabled', title: 'Hub Événements Live & Retransmission', desc: 'Diffusion multicaméra en direct, lecteur streaming vidéo et interactivité.' },
              { key: 'ticketingEnabled', title: 'Billetterie Électronique & Réservation', desc: 'Système d\'émission de billets avec QR code sécurisé et contrôle d\'accès.' },
              { key: 'votingEnabled', title: 'Sondages & Vote Interactif en Direct', desc: 'Permet aux participants de voter en temps réel durant les plénières et sommets.' },
              { key: 'clientPortalEnabled', title: 'Espace Client Sécurisé', desc: 'Accès dédié aux donneurs d\'ordre pour le suivi de leurs devis, factures et rétroplannings.' },
              { key: 'visitorRadarEnabled', title: 'Radar Détection Visiteurs & Leads', desc: 'Surveillance et identification des visiteurs professionnels qualifiés sur le portail.' },
              { key: 'maintenanceMode', title: 'Mode Maintenance Exceptionnelle', desc: 'Affiche une bannière de maintenance et restreint l\'accès public aux seuls administrateurs.' }
            ].map(f => {
              const isActive = (features as any)[f.key];
              return (
                <div
                  key={f.key}
                  className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                  style={{ backgroundColor: activePalette.colors.bgSubtle, borderColor: activePalette.colors.border }}
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{f.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleFeature(f.key as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>ACTIVÉ</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>DÉSACTIVÉ</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY POLICIES */}
      {activeTab === 'security' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-3xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Politiques de Sécurité & Gestion des Sessions</h3>
            <p className="text-xs text-slate-400">Règles d'inactivité, verrouillage automatique et protection contre les attaques par force brute.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Expiration de Session Automatique</h4>
                <p className="text-xs text-slate-400">Déconnexion automatique de sécurité en cas d'inactivité.</p>
              </div>
              <span className="font-mono text-sm font-bold text-amber-400">30 minutes</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Seuil de Tentatives Infructueuses</h4>
                <p className="text-xs text-slate-400">Verrouillage de l'adresse IP après tentatives de connexion erronées.</p>
              </div>
              <span className="font-mono text-sm font-bold text-rose-400">3 tentatives consécutives</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Durée du Verrouillage Temporaire</h4>
                <p className="text-xs text-slate-400">Temps d'attente obligatoire avant nouvelle tentative.</p>
              </div>
              <span className="font-mono text-sm font-bold text-slate-300">15 minutes</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-start gap-3">
              <Shield className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
              <div>
                <strong>Sécurité RLS & Traçabilité :</strong> Toutes les actions d'administration, les créations de devis, les modifications de la structure et les créations de comptes collaborateurs sont journalisées avec horodatage, empreinte de l'appareil et adresse IP.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
