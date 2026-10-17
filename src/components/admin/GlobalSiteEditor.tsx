import React, { useState, useMemo } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useAuth } from '../../context/AuthContext';
import { CmsSectionItem, CmsCategory } from '../../types/cmsAndErp';
import {
  Edit3,
  Search,
  Sparkles,
  Eye,
  Save,
  CheckCircle2,
  X,
  FileText,
  RotateCcw,
  Layers,
  ArrowRight,
  Globe,
  Sliders,
  Send,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';

const CATEGORIES: { id: CmsCategory; label: string; icon: string; count?: number }[] = [
  { id: 'ACCUEIL', label: 'ACCUEIL', icon: '🏠' },
  { id: 'A_PROPOS', label: 'À PROPOS', icon: '🏢' },
  { id: 'SERVICES', label: 'SERVICES', icon: '⚙️' },
  { id: 'REALISATIONS', label: 'RÉALISATIONS', icon: '🏆' },
  { id: 'MEDIAS', label: 'MÉDIAS', icon: '📸' },
  { id: 'CONTACT', label: 'CONTACT', icon: '📞' },
  { id: 'FOOTER', label: 'FOOTER', icon: '📑' },
  { id: 'NAVIGATION', label: 'NAVIGATION', icon: '🧭' },
  { id: 'ESPACE_CLIENT', label: 'ESPACE CLIENT', icon: '💼' },
  { id: 'ESPACE_PUBLIC', label: 'ESPACE PUBLIC', icon: '🌐' },
  { id: 'ESPACE_ADMINISTRATEUR', label: 'ESPACE ADMINISTRATEUR', icon: '🛡️' },
  { id: 'PAGES_INSTITUTIONNELLES', label: 'PAGES INSTITUTIONNELLES', icon: '🏛️' },
  { id: 'MESSAGES_SYSTEME', label: 'MESSAGES SYSTÈME', icon: '🔔' }
];

export const GlobalSiteEditor: React.FC = () => {
  const {
    cmsSections,
    saveCmsDraft,
    publishCmsItem,
    previewDraftMode,
    setPreviewDraftMode
  } = useProjectData();
  const { isSuperAdmin } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<CmsCategory | 'ALL'>('ACCUEIL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Welcome dedicated editor state
  const welcomeItem = useMemo(() => {
    return cmsSections.find(s => s.contentKey === 'home.welcome.title' || s.id === 'cms-welcome-main') || cmsSections[0];
  }, [cmsSections]);

  const [welcomeForm, setWelcomeForm] = useState({
    title: welcomeItem?.draftTitle ?? welcomeItem?.publishedTitle ?? welcomeItem?.title ?? '',
    subtitle: welcomeItem?.draftSubtitle ?? welcomeItem?.publishedSubtitle ?? welcomeItem?.subtitle ?? '',
    description: welcomeItem?.draftContent ?? welcomeItem?.publishedContent ?? welcomeItem?.content ?? '',
    primaryButtonText: welcomeItem?.draftPrimaryButtonText ?? welcomeItem?.publishedPrimaryButtonText ?? welcomeItem?.primaryButtonText ?? '',
    secondaryButtonText: welcomeItem?.draftSecondaryButtonText ?? welcomeItem?.publishedSecondaryButtonText ?? welcomeItem?.secondaryButtonText ?? ''
  });

  const [isEditingWelcome, setIsEditingWelcome] = useState(false);
  const [isWelcomePreviewModalOpen, setIsWelcomePreviewModalOpen] = useState(false);

  // Generic edit form state
  const [genericForm, setGenericForm] = useState({
    title: '',
    subtitle: '',
    content: '',
    primaryButtonText: '',
    secondaryButtonText: ''
  });
  const [isGenericPreviewModalOpen, setIsGenericPreviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync welcome item changes
  React.useEffect(() => {
    if (welcomeItem) {
      setWelcomeForm({
        title: welcomeItem.draftTitle ?? welcomeItem.publishedTitle ?? welcomeItem.title ?? '',
        subtitle: welcomeItem.draftSubtitle ?? welcomeItem.publishedSubtitle ?? welcomeItem.subtitle ?? '',
        description: welcomeItem.draftContent ?? welcomeItem.publishedContent ?? welcomeItem.content ?? '',
        primaryButtonText: welcomeItem.draftPrimaryButtonText ?? welcomeItem.publishedPrimaryButtonText ?? welcomeItem.primaryButtonText ?? '',
        secondaryButtonText: welcomeItem.draftSecondaryButtonText ?? welcomeItem.publishedSecondaryButtonText ?? welcomeItem.secondaryButtonText ?? ''
      });
    }
  }, [welcomeItem]);

  // Filtered CMS items
  const filteredItems = useMemo(() => {
    return cmsSections.filter(item => {
      const matchCategory =
        selectedCategory === 'ALL' ||
        item.category === selectedCategory ||
        (!item.category && selectedCategory === 'ACCUEIL');

      const matchSearch =
        !searchTerm.trim() ||
        item.contentKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [cmsSections, selectedCategory, searchTerm]);

  // Welcome actions
  const handleSaveWelcomeDraft = async () => {
    if (!welcomeItem) return;
    await saveCmsDraft(welcomeItem.id, {
      title: welcomeForm.title,
      subtitle: welcomeForm.subtitle,
      content: welcomeForm.description,
      primaryButtonText: welcomeForm.primaryButtonText,
      secondaryButtonText: welcomeForm.secondaryButtonText,
      draftTitle: welcomeForm.title,
      draftSubtitle: welcomeForm.subtitle,
      draftContent: welcomeForm.description,
      draftPrimaryButtonText: welcomeForm.primaryButtonText,
      draftSecondaryButtonText: welcomeForm.secondaryButtonText
    });
    setIsEditingWelcome(false);
    showToast("💾 Brouillon du texte de bienvenue enregistré dans Firestore !");
  };

  const handlePublishWelcome = async () => {
    if (!welcomeItem) return;
    await publishCmsItem(welcomeItem.id, {
      title: welcomeForm.title,
      subtitle: welcomeForm.subtitle,
      content: welcomeForm.description,
      primaryButtonText: welcomeForm.primaryButtonText,
      secondaryButtonText: welcomeForm.secondaryButtonText
    });
    setIsEditingWelcome(false);
    setIsWelcomePreviewModalOpen(false);
    showToast("🚀 Texte de bienvenue PUBLIÉ avec succès ! Visible sur le site en direct.");
  };

  const handleCancelWelcome = () => {
    if (welcomeItem) {
      setWelcomeForm({
        title: welcomeItem.publishedTitle ?? welcomeItem.title ?? '',
        subtitle: welcomeItem.publishedSubtitle ?? welcomeItem.subtitle ?? '',
        description: welcomeItem.publishedContent ?? welcomeItem.content ?? '',
        primaryButtonText: welcomeItem.publishedPrimaryButtonText ?? welcomeItem.primaryButtonText ?? '',
        secondaryButtonText: welcomeItem.publishedSecondaryButtonText ?? welcomeItem.secondaryButtonText ?? ''
      });
    }
    setIsEditingWelcome(false);
    showToast("Modification annulée.");
  };

  // Generic Item Actions
  const handleStartEditGeneric = (item: CmsSectionItem) => {
    setEditingItemId(item.id);
    setGenericForm({
      title: item.draftTitle ?? item.publishedTitle ?? item.title ?? '',
      subtitle: item.draftSubtitle ?? item.publishedSubtitle ?? item.subtitle ?? '',
      content: item.draftContent ?? item.publishedContent ?? item.content ?? '',
      primaryButtonText: item.draftPrimaryButtonText ?? item.publishedPrimaryButtonText ?? item.primaryButtonText ?? '',
      secondaryButtonText: item.draftSecondaryButtonText ?? item.publishedSecondaryButtonText ?? item.secondaryButtonText ?? ''
    });
  };

  const handleSaveGenericDraft = async (itemId: string) => {
    await saveCmsDraft(itemId, {
      title: genericForm.title,
      subtitle: genericForm.subtitle,
      content: genericForm.content,
      primaryButtonText: genericForm.primaryButtonText,
      secondaryButtonText: genericForm.secondaryButtonText,
      draftTitle: genericForm.title,
      draftSubtitle: genericForm.subtitle,
      draftContent: genericForm.content,
      draftPrimaryButtonText: genericForm.primaryButtonText,
      draftSecondaryButtonText: genericForm.secondaryButtonText
    });
    setEditingItemId(null);
    showToast("💾 Brouillon enregistré avec succès dans Firestore !");
  };

  const handlePublishGeneric = async (itemId: string) => {
    await publishCmsItem(itemId, {
      title: genericForm.title,
      subtitle: genericForm.subtitle,
      content: genericForm.content,
      primaryButtonText: genericForm.primaryButtonText,
      secondaryButtonText: genericForm.secondaryButtonText
    });
    setEditingItemId(null);
    setIsGenericPreviewModalOpen(false);
    showToast("🚀 Contenu PUBLIÉ avec succès sur le site web !");
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn">
          <div className="bg-amber-500 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2 border border-amber-300">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-3 text-slate-900 font-bold hover:text-white cursor-pointer">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Contrôle Éditorial Infalsifiable</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Firestore CMS Sync • RLS Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>✏️ ÉDITEUR GLOBAL DU SITE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Point central permettant au SUPER_ADMIN de modifier l'intégralité du contenu textuel, titres, boutons, et descriptions visibles de l'application sans toucher au code source. Les modifications sont enregistrées en direct dans Cloud Firestore avec gestion de brouillons et publication officielle.
          </p>
        </div>

        {/* Global Preview Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => setPreviewDraftMode(!previewDraftMode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
              previewDraftMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{previewDraftMode ? 'Aperçu Brouillons : ACTIF' : 'Activer Aperçu Brouillons'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SECTION EXPLICITE : MODIFICATION DU TEXTE DE BIENVENUE */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
              ✨
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                CLÉ CMS : home.welcome.title • Section Accueil
              </span>
              <h3 className="text-xl font-black text-white">
                TEXTE DE BIENVENUE DU SITE
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingWelcome ? (
              <button
                onClick={() => setIsEditingWelcome(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>[MODIFIER]</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsWelcomePreviewModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>[APERÇU]</span>
                </button>
                <button
                  onClick={handleSaveWelcomeDraft}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>[ENREGISTRER BROUILLON]</span>
                </button>
                <button
                  onClick={handlePublishWelcome}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>[PUBLICATION]</span>
                </button>
                <button
                  onClick={handleCancelWelcome}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>[ANNULER]</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Fields for Welcome Message */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Titre Principal :
              </label>
              {isEditingWelcome ? (
                <input
                  type="text"
                  value={welcomeForm.title}
                  onChange={e => setWelcomeForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
                  placeholder="ex: Bienvenue chez VIVA EVENT SOLUTIONS"
                />
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-bold text-sm">
                  {welcomeForm.title || "Bienvenue chez VIVA EVENT SOLUTIONS"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Sous-titre / Sur-titre :
              </label>
              {isEditingWelcome ? (
                <input
                  type="text"
                  value={welcomeForm.subtitle}
                  onChange={e => setWelcomeForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
                  placeholder="ex: PORTAIL OFFICIEL DE VIVA EVENT SOLUTIONS"
                />
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-sm">
                  {welcomeForm.subtitle || "PORTAIL OFFICIEL DE VIVA EVENT SOLUTIONS"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bouton Principal (Texte) :
                </label>
                {isEditingWelcome ? (
                  <input
                    type="text"
                    value={welcomeForm.primaryButtonText}
                    onChange={e => setWelcomeForm(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none font-bold"
                    placeholder="ex: NOS 15 PÔLES DE SERVICES"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-blue-400 font-bold text-xs flex items-center gap-1.5">
                    <span>{welcomeForm.primaryButtonText || "NOS 15 PÔLES DE SERVICES"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bouton Secondaire (Texte) :
                </label>
                {isEditingWelcome ? (
                  <input
                    type="text"
                    value={welcomeForm.secondaryButtonText}
                    onChange={e => setWelcomeForm(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none font-bold"
                    placeholder="ex: Demander un Devis Immédiat"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs">
                    {welcomeForm.secondaryButtonText || "Demander un Devis Immédiat"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Description / Paragraphes du Message :
            </label>
            {isEditingWelcome ? (
              <textarea
                rows={7}
                value={welcomeForm.description}
                onChange={e => setWelcomeForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:border-amber-500 outline-none font-mono resize-y"
                placeholder="Votre message complet..."
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                {welcomeForm.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. RECHERCHE & CATÉGORIES DE TOUTES LES SECTIONS DU SITE */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>EXPLORATEUR DES SECTIONS PAR CATÉGORIE</span>
            </h3>
            <p className="text-xs text-slate-400">
              Sélectionnez une catégorie pour inspecter et modifier les clés CMS associées.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher une clé, titre, texte..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-amber-500 outline-none placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* 13 Categories Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes les Clés ({cmsSections.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = cmsSections.filter(s => s.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Sections for the Selected Category */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">Aucun élément CMS trouvé</h4>
            <p className="text-xs text-slate-400">
              Aucune clé ne correspond à vos critères de recherche dans cette catégorie.
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isEditingThis = editingItemId === item.id;
            const hasDraft = Boolean(item.draftContent || item.draftTitle);

            return (
              <div
                key={item.id}
                className={`rounded-3xl bg-slate-900 border transition-all duration-200 p-5 sm:p-6 space-y-4 shadow-lg ${
                  isEditingThis
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {item.contentKey}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                          {item.category || item.page}
                        </span>
                        {hasDraft && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                            Brouillon En Attente
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isEditingThis ? (
                      <button
                        onClick={() => handleStartEditGeneric(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>[MODIFIER]</span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setIsGenericPreviewModalOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>[APERÇU]</span>
                        </button>
                        <button
                          onClick={() => handleSaveGenericDraft(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>[ENREGISTRER BROUILLON]</span>
                        </button>
                        <button
                          onClick={() => handlePublishGeneric(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>[PUBLIER]</span>
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>[ANNULER]</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Form or Static View */}
                {isEditingThis ? (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Titre du Contenu :
                        </label>
                        <input
                          type="text"
                          value={genericForm.title}
                          onChange={e => setGenericForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Sous-titre / Sur-titre :
                        </label>
                        <input
                          type="text"
                          value={genericForm.subtitle}
                          onChange={e => setGenericForm(prev => ({ ...prev, subtitle: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Texte / Contenu de la Section :
                      </label>
                      <textarea
                        rows={4}
                        value={genericForm.content}
                        onChange={e => setGenericForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:border-amber-500 outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Texte Bouton Principal :
                        </label>
                        <input
                          type="text"
                          value={genericForm.primaryButtonText}
                          onChange={e => setGenericForm(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Texte Bouton Secondaire :
                        </label>
                        <input
                          type="text"
                          value={genericForm.secondaryButtonText}
                          onChange={e => setGenericForm(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                      {item.publishedContent || item.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      <span>Modifié le : {new Date(item.lastModified).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>Auteur : {item.author}</span>
                      <span>•</span>
                      <span>Statut : <strong className={item.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>{item.status.toUpperCase()}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* PREVIEW MODAL FOR WELCOME TEXT */}
      {/* ============================================================ */}
      {isWelcomePreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-3xl rounded-3xl bg-white text-slate-900 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#4A6CF7] text-xs font-bold uppercase">
                  Aperçu Réel Avant Publication
                </span>
              </div>
              <button
                onClick={() => setIsWelcomePreviewModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-situ Render of the Welcome Card */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A6CF7]">
                {welcomeForm.subtitle || "PORTAIL OFFICIEL DE VIVA EVENT SOLUTIONS"}
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                {welcomeForm.title || "Bienvenue chez VIVA EVENT SOLUTIONS"}
              </h3>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {welcomeForm.description}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {welcomeForm.primaryButtonText && (
                  <button className="px-5 py-2.5 rounded-full font-bold text-xs text-white bg-[#4A6CF7] shadow">
                    {welcomeForm.primaryButtonText}
                  </button>
                )}
                {welcomeForm.secondaryButtonText && (
                  <button className="px-5 py-2.5 rounded-full font-bold text-xs text-slate-700 bg-white border border-slate-200">
                    {welcomeForm.secondaryButtonText}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsWelcomePreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Fermer l'aperçu
              </button>
              <button
                onClick={handlePublishWelcome}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs cursor-pointer hover:bg-emerald-500 flex items-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Publier définitivement dans Firestore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* GENERIC PREVIEW MODAL */}
      {/* ============================================================ */}
      {isGenericPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-white text-slate-900 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Aperçu de la Section
              </span>
              <button onClick={() => setIsGenericPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-200">
              {genericForm.subtitle && (
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  {genericForm.subtitle}
                </p>
              )}
              <h4 className="text-xl font-bold text-slate-900">
                {genericForm.title || "Titre de section"}
              </h4>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pt-2">
                {genericForm.content}
              </p>
              {(genericForm.primaryButtonText || genericForm.secondaryButtonText) && (
                <div className="flex items-center gap-3 pt-3">
                  {genericForm.primaryButtonText && (
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-[#4A6CF7] text-white">
                      {genericForm.primaryButtonText}
                    </span>
                  )}
                  {genericForm.secondaryButtonText && (
                    <span className="px-4 py-2 rounded-full text-xs font-bold bg-white text-slate-700 border">
                      {genericForm.secondaryButtonText}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsGenericPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Fermer
              </button>
              {editingItemId && (
                <button
                  onClick={() => handlePublishGeneric(editingItemId)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-500"
                >
                  Confirmer et Publier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
