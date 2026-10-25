import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Save,
  Sparkles,
  Layers,
  FileText,
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Check
} from 'lucide-react';

export const AdminContentEditor: React.FC = () => {
  const { platformConfig, updatePlatformConfig, departments, updateDepartment } = useProjectData();
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const [activeTab, setActiveTab] = useState<'general' | 'poles' | 'values' | 'problems'>('general');
  const [selectedPoleId, setSelectedPoleId] = useState<number>(departments[0]?.id || 1);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form local state
  const [configDraft, setConfigDraft] = useState(platformConfig);

  const selectedPole = departments.find(d => d.id === selectedPoleId) || departments[0];

  const handleSaveGeneral = () => {
    updatePlatformConfig(configDraft);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6"
        style={{ borderColor: activePalette.colors.border }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              CMS Back-Office Intégré
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-1"
            style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}
          >
            Gestionnaire & Éditeur de Contenu Intégral
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Modifiez en temps réel tous les textes, menus, 15 pôles de services, messages d'accueil et valeurs de la plateforme.
          </p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: activePalette.colors.border }}>
        {[
          { id: 'general', label: '1. Textes Généraux & Accueil', icon: Building2 },
          { id: 'poles', label: '2. Les 15 Pôles des Services', icon: Layers },
          { id: 'values', label: '3. 9 Valeurs & Cycle de Mission', icon: Sparkles },
          { id: 'problems', label: '4. Problèmes & Réponses Marché', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border"
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

      {/* TAB 1: Textes Généraux & Accueil */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
            style={{
              backgroundColor: activePalette.colors.bgSurface,
              borderColor: activePalette.colors.border
            }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
              <h3 className="text-lg font-bold" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
                Haut de Page & Message d'Accueil
              </h3>
              <button
                onClick={handleSaveGeneral}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                style={{
                  backgroundColor: activePalette.colors.accent,
                  color: activePalette.colors.primaryDark
                }}
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les Modifications</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <Check className="w-4 h-4" />
                <span>Modifications enregistrées avec succès et appliquées à toute la plateforme !</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: activePalette.colors.accent }}>
                  Titre Principal Hero (Page d'accueil)
                </label>
                <input
                  type="text"
                  value={configDraft.heroTitle}
                  onChange={e => setConfigDraft({ ...configDraft, heroTitle: e.target.value })}
                  className="w-full p-3 rounded-xl border text-xs sm:text-sm font-semibold"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: activePalette.colors.accent }}>
                  Sous-titre / Description Principale
                </label>
                <textarea
                  rows={3}
                  value={configDraft.heroSubtitle}
                  onChange={e => setConfigDraft({ ...configDraft, heroSubtitle: e.target.value })}
                  className="w-full p-3 rounded-xl border text-xs sm:text-sm leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: activePalette.colors.accent }}>
                  Message d'Accueil Complet (Espace Bienvenue)
                </label>
                <textarea
                  rows={6}
                  value={configDraft.welcomeMessage}
                  onChange={e => setConfigDraft({ ...configDraft, welcomeMessage: e.target.value })}
                  className="w-full p-3 rounded-xl border text-xs sm:text-sm leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: activePalette.colors.accent }}>
                  Texte "Qui Sommes-Nous ?"
                </label>
                <textarea
                  rows={6}
                  value={configDraft.whoWeAreText}
                  onChange={e => setConfigDraft({ ...configDraft, whoWeAreText: e.target.value })}
                  className="w-full p-3 rounded-xl border text-xs sm:text-sm leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              {/* Branding & Assets Customization */}
              <div className="pt-6 border-t space-y-4" style={{ borderColor: activePalette.colors.border }}>
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Personnalisation des Actifs Visuels & Identité (God Mode)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Arrière-plan Principal (Hero Image URL)</label>
                    <input
                      type="text"
                      value={configDraft.heroImageUrl || ''}
                      onChange={e => setConfigDraft({ ...configDraft, heroImageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-3 rounded-xl border text-xs font-mono"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Logo de l'Entreprise (URL / Image)</label>
                    <input
                      type="text"
                      value={configDraft.companyLogoUrl || ''}
                      onChange={e => setConfigDraft({ ...configDraft, companyLogoUrl: e.target.value })}
                      placeholder="URL du logo officiel"
                      className="w-full p-3 rounded-xl border text-xs font-mono"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Cachet Officiel de l'Entreprise (URL)</label>
                    <input
                      type="text"
                      value={configDraft.companyStampUrl || ''}
                      onChange={e => setConfigDraft({ ...configDraft, companyStampUrl: e.target.value })}
                      placeholder="URL du cachet (tampon)"
                      className="w-full p-3 rounded-xl border text-xs font-mono"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Signature du Responsable (URL)</label>
                    <input
                      type="text"
                      value={configDraft.managerSignatureUrl || ''}
                      onChange={e => setConfigDraft({ ...configDraft, managerSignatureUrl: e.target.value })}
                      placeholder="URL de la signature"
                      className="w-full p-3 rounded-xl border text-xs font-mono"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Legal & Contact Info Editor */}
              <div className="pt-6 border-t space-y-4" style={{ borderColor: activePalette.colors.border }}>
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Informations Légales & Contact Officiel (RCCM & ID.NAT)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">RCCM</label>
                    <input
                      type="text"
                      value={configDraft.contactInfo?.rccm || ''}
                      onChange={e => setConfigDraft({
                        ...configDraft,
                        contactInfo: { ...(configDraft.contactInfo || { phone: '', email: '', address: '', idNat: '', website: '' }), rccm: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border text-xs font-mono font-bold"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">ID.NAT</label>
                    <input
                      type="text"
                      value={configDraft.contactInfo?.idNat || ''}
                      onChange={e => setConfigDraft({
                        ...configDraft,
                        contactInfo: { ...(configDraft.contactInfo || { phone: '', email: '', address: '', rccm: '', website: '' }), idNat: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border text-xs font-mono font-bold"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={configDraft.contactInfo?.phone || ''}
                      onChange={e => setConfigDraft({
                        ...configDraft,
                        contactInfo: { ...(configDraft.contactInfo || { email: '', address: '', rccm: '', idNat: '', website: '' }), phone: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Email</label>
                    <input
                      type="text"
                      value={configDraft.contactInfo?.email || ''}
                      onChange={e => setConfigDraft({
                        ...configDraft,
                        contactInfo: { ...(configDraft.contactInfo || { phone: '', address: '', rccm: '', idNat: '', website: '' }), email: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Adresse</label>
                    <input
                      type="text"
                      value={configDraft.contactInfo?.address || ''}
                      onChange={e => setConfigDraft({
                        ...configDraft,
                        contactInfo: { ...(configDraft.contactInfo || { phone: '', email: '', rccm: '', idNat: '', website: '' }), address: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Site Web</label>
                    <input
                      type="text"
                      value={configDraft.contactInfo?.website || ''}
                      onChange={e => setConfigDraft({
                        ...configDraft,
                        contactInfo: { ...(configDraft.contactInfo || { phone: '', email: '', address: '', rccm: '', idNat: '' }), website: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                        borderColor: activePalette.colors.border,
                        color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Menu Names Customization */}
              <div className="pt-6 border-t space-y-4" style={{ borderColor: activePalette.colors.border }}>
                <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Renommage des Menus et Options de l'Application
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(configDraft.navigationMenuLabels || {}).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Menu : <code className="text-amber-400 font-mono">{key}</code>
                      </label>
                      <input
                        type="text"
                        value={label}
                        onChange={e => setConfigDraft({
                          ...configDraft,
                          navigationMenuLabels: {
                            ...configDraft.navigationMenuLabels,
                            [key]: e.target.value
                          }
                        })}
                        className="w-full p-2.5 rounded-xl border text-xs font-bold"
                        style={{
                          backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                          borderColor: activePalette.colors.border,
                          color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Les 15 Pôles des Services */}
      {activeTab === 'poles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of 15 Poles */}
          <div className="lg:col-span-4 rounded-3xl p-4 border space-y-2 max-h-[700px] overflow-y-auto"
            style={{
              backgroundColor: activePalette.colors.bgSurface,
              borderColor: activePalette.colors.border
            }}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 block mb-2" style={{ color: activePalette.colors.accent }}>
              Sélectionnez un pôle à modifier :
            </span>

            {departments.map(dept => {
              const isSelected = dept.id === selectedPoleId;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedPoleId(dept.id)}
                  className="w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer"
                  style={{
                    backgroundColor: isSelected ? activePalette.colors.primary : (isLight ? '#F8FAFC' : activePalette.colors.bgSubtle),
                    borderColor: isSelected ? activePalette.colors.borderGlow : activePalette.colors.border,
                    color: isSelected ? '#FFFFFF' : (isLight ? activePalette.colors.textMain : '#CBD5E1')
                  }}
                >
                  <div className="truncate">
                    <span className="text-[10px] font-mono font-bold block opacity-80">
                      PÔLE {dept.number < 10 ? `0${dept.number}` : dept.number}
                    </span>
                    <span className="text-xs font-bold truncate block">{dept.shortName || dept.name}</span>
                  </div>
                  <Edit3 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </button>
              );
            })}
          </div>

          {/* Edit Form for Selected Pole */}
          {selectedPole && (
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
              style={{
                backgroundColor: activePalette.colors.bgSurface,
                borderColor: activePalette.colors.border
              }}
            >
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    PÔLE {selectedPole.number < 10 ? `0${selectedPole.number}` : selectedPole.number} / 15
                  </span>
                  <h3 className="text-lg font-black" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
                    Édition : {selectedPole.name}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
                  style={{
                    backgroundColor: activePalette.colors.accent,
                    color: activePalette.colors.primaryDark
                  }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer ce Pôle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: activePalette.colors.accent }}>
                    Nom Officiel du Pôle
                  </label>
                  <input
                    type="text"
                    value={selectedPole.name}
                    onChange={e => updateDepartment(selectedPole.id, { name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                      borderColor: activePalette.colors.border,
                      color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: activePalette.colors.accent }}>
                    Nom Court (Menu / Cartes)
                  </label>
                  <input
                    type="text"
                    value={selectedPole.shortName}
                    onChange={e => updateDepartment(selectedPole.id, { shortName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border text-xs font-semibold"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                      borderColor: activePalette.colors.border,
                      color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: activePalette.colors.accent }}>
                  Slogan / Tagline
                </label>
                <input
                  type="text"
                  value={selectedPole.tagline}
                  onChange={e => updateDepartment(selectedPole.id, { tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border text-xs italic"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: activePalette.colors.accent }}>
                  Signification & Rôle du Pôle
                </label>
                <textarea
                  rows={3}
                  value={selectedPole.meaning || ''}
                  onChange={e => updateDepartment(selectedPole.id, { meaning: e.target.value })}
                  className="w-full p-2.5 rounded-xl border text-xs leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-emerald-400">
                  Justification (Pourquoi ce pôle ?)
                </label>
                <textarea
                  rows={3}
                  value={selectedPole.justification || ''}
                  onChange={e => updateDepartment(selectedPole.id, { justification: e.target.value })}
                  className="w-full p-2.5 rounded-xl border text-xs leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-amber-400">
                  Exemple Concret d'Intervention
                </label>
                <textarea
                  rows={2}
                  value={selectedPole.concreteExample || ''}
                  onChange={e => updateDepartment(selectedPole.id, { concreteExample: e.target.value })}
                  className="w-full p-2.5 rounded-xl border text-xs leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-sky-400">
                  Matériel & Équipements Clés Déployés
                </label>
                <textarea
                  rows={2}
                  value={selectedPole.equipmentAvailable || ''}
                  onChange={e => updateDepartment(selectedPole.id, { equipmentAvailable: e.target.value })}
                  className="w-full p-2.5 rounded-xl border text-xs font-mono"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 9 Valeurs & Cycle de Mission */}
      {activeTab === 'values' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
          style={{
            backgroundColor: activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
              Les 9 Valeurs Fondamentales VIVA EVENTS
            </h3>
            <button
              onClick={handleSaveGeneral}
              className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
              style={{
                backgroundColor: activePalette.colors.accent,
                color: activePalette.colors.primaryDark
              }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {configDraft.valuesList.map((val, idx) => (
              <div key={idx} className="p-4 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: isLight ? '#F8FAFC' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold" style={{ color: activePalette.colors.accent }}>
                    {val.number}
                  </span>
                </div>
                <input
                  type="text"
                  value={val.title}
                  onChange={e => {
                    const newVals = [...configDraft.valuesList];
                    newVals[idx] = { ...newVals[idx], title: e.target.value };
                    setConfigDraft({ ...configDraft, valuesList: newVals });
                  }}
                  className="w-full p-2 rounded-lg border text-xs font-bold"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
                <textarea
                  rows={2}
                  value={val.text}
                  onChange={e => {
                    const newVals = [...configDraft.valuesList];
                    newVals[idx] = { ...newVals[idx], text: e.target.value };
                    setConfigDraft({ ...configDraft, valuesList: newVals });
                  }}
                  className="w-full p-2 rounded-lg border text-[11px]"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
                    borderColor: activePalette.colors.border,
                    color: isLight ? '#475569' : '#CBD5E1'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Problèmes & Réponses Marché */}
      {activeTab === 'problems' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6"
          style={{
            backgroundColor: activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
              Les 10 Problèmes Constants du Marché & Réponses VIVA EVENTS
            </h3>
            <button
              onClick={handleSaveGeneral}
              className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg cursor-pointer"
              style={{
                backgroundColor: activePalette.colors.accent,
                color: activePalette.colors.primaryDark
              }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>

          <div className="space-y-4">
            {configDraft.marketProblems.map((prob, idx) => (
              <div key={idx} className="p-4 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: isLight ? '#F8FAFC' : activePalette.colors.bgSubtle,
                  borderColor: activePalette.colors.border
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-500 font-bold text-xs flex items-center justify-center shrink-0">
                    {prob.number}
                  </span>
                  <input
                    type="text"
                    value={prob.title}
                    onChange={e => {
                      const newProbs = [...configDraft.marketProblems];
                      newProbs[idx] = { ...newProbs[idx], title: e.target.value };
                      setConfigDraft({ ...configDraft, marketProblems: newProbs });
                    }}
                    className="flex-1 p-2 rounded-lg border text-xs font-bold text-rose-400"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
                      borderColor: activePalette.colors.border
                    }}
                  />
                </div>
                <textarea
                  rows={2}
                  value={prob.desc}
                  onChange={e => {
                    const newProbs = [...configDraft.marketProblems];
                    newProbs[idx] = { ...newProbs[idx], desc: e.target.value };
                    setConfigDraft({ ...configDraft, marketProblems: newProbs });
                  }}
                  className="w-full p-2 rounded-lg border text-xs"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
                    borderColor: activePalette.colors.border,
                    color: isLight ? '#475569' : '#CBD5E1'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
