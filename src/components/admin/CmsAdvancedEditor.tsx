import React, { useState } from 'react';
import { CmsSectionItem, CmsVersion } from '../../types/cmsAndErp';
import { useAuth } from '../../context/AuthContext';
import { useProjectData } from '../../context/ProjectDataContext';
import { useTheme } from '../../context/ThemeContext';
import { logAudit } from '../../services/supabase/auditService';
import {
  Edit3,
  FileText,
  History,
  RotateCcw,
  Eye,
  Save,
  Plus,
  CheckCircle2,
  Search,
  Sparkles,
  X,
  Clock,
  User,
  Layers,
  Building2,
  Sliders,
  Check,
  Globe
} from 'lucide-react';

interface CmsAdvancedEditorProps {
  cmsSections: CmsSectionItem[];
  onUpdateCmsSections: (sections: CmsSectionItem[]) => void;
}

export const CmsAdvancedEditor: React.FC<CmsAdvancedEditorProps> = ({ cmsSections, onUpdateCmsSections }) => {
  const { currentUser } = useAuth();
  const { platformConfig, updatePlatformConfig, departments, updateDepartment } = useProjectData();
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const [activeTab, setActiveTab] = useState<'cms-catalog' | 'welcome' | 'poles' | 'institution' | 'seo'>('cms-catalog');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  // SEO conceptuel — SESSION uniquement (colonnes dédiées : R2-20). Jamais injecté dans <head>.
  const [seoMeta, setSeoMeta] = useState<Record<string, { metaTitle: string; metaDesc: string; slug: string }>>({});
  const [selectedSectionId, setSelectedSectionId] = useState<string>(cmsSections[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState<string>('all');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentItem = cmsSections.find(s => s.id === selectedSectionId) || cmsSections[0];
  const [editContent, setEditContent] = useState<string>(currentItem?.content || '');
  const [editTitle, setEditTitle] = useState<string>(currentItem?.title || '');

  // Welcome draft
  const [welcomeDraft, setWelcomeDraft] = useState(platformConfig.welcomeMessage);

  // Selected pole draft
  const [selectedPoleId, setSelectedPoleId] = useState<number>(departments[0]?.id || 1);
  const selectedPole = departments.find(d => d.id === selectedPoleId) || departments[0];

  React.useEffect(() => {
    if (currentItem) {
      setEditContent(currentItem.content);
      setEditTitle(currentItem.title);
    }
  }, [selectedSectionId, currentItem]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const logAuditAction = (action: string, details: string) => {
    void logAudit(action, 'cms', undefined, { details });
  };

  const handleSaveContent = () => {
    if (!currentItem) return;
    const newVersion: CmsVersion = {
      versionId: 'v-' + Date.now(),
      timestamp: new Date().toISOString(),
      author: currentUser.name || currentUser.email,
      title: editTitle,
      content: editContent,
      oldValue: currentItem.content,
      newValue: editContent
    };

    const updated = cmsSections.map(s => {
      if (s.id === currentItem.id) {
        return {
          ...s,
          title: editTitle,
          content: editContent,
          lastModified: new Date().toISOString(),
          author: currentUser.name || currentUser.email,
          versions: [newVersion, ...s.versions]
        };
      }
      return s;
    });

    onUpdateCmsSections(updated);

    // If matches a platformConfig key, live-sync
    if (currentItem.contentKey) {
      updatePlatformConfig({ [currentItem.contentKey]: editContent });
    }

    logAuditAction('CMS_UPDATE_CONTENT', `Mise à jour du contenu CMS key: ${currentItem.contentKey}`);
    showToast(`Contenu "${editTitle}" enregistré et versionné avec succès.`);
  };

  const handleSaveWelcome = () => {
    updatePlatformConfig({ welcomeMessage: welcomeDraft });

    // Also update CMS section if exists
    const welcomeCms = cmsSections.find(s => s.contentKey === 'welcomeMessage');
    if (welcomeCms) {
      const newVersion: CmsVersion = {
        versionId: 'v-' + Date.now(),
        timestamp: new Date().toISOString(),
        author: currentUser.name || currentUser.email,
        title: welcomeCms.title,
        content: welcomeDraft,
        oldValue: welcomeCms.content,
        newValue: welcomeDraft
      };
      const updated = cmsSections.map(s => (s.id === welcomeCms.id ? { ...s, content: welcomeDraft, versions: [newVersion, ...s.versions] } : s));
      onUpdateCmsSections(updated);
    }

    logAuditAction('CMS_WELCOME_UPDATED', 'Texte officiel de bienvenue mis à jour');
    showToast("Message officiel de bienvenue enregistré avec succès.");
  };

  const handleRollbackVersion = (version: CmsVersion) => {
    if (!currentItem) return;
    setEditContent(version.content);
    setEditTitle(version.title);
    const updated = cmsSections.map(s => {
      if (s.id === currentItem.id) {
        return {
          ...s,
          title: version.title,
          content: version.content,
          lastModified: new Date().toISOString(),
          author: `${currentUser.name} (Restauration version)`
        };
      }
      return s;
    });
    onUpdateCmsSections(updated);
    if (currentItem.contentKey) {
      updatePlatformConfig({ [currentItem.contentKey]: version.content });
    }
    setIsHistoryModalOpen(false);
    showToast(`Restauration vers la version du ${new Date(version.timestamp).toLocaleString('fr-FR')} effectuée.`);
  };

  const filteredSections = cmsSections.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPage = filterPage === 'all' || s.page === filterPage;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesPage && matchesStatus;
  });

  const handleDuplicateSection = (id: string) => {
    const src = cmsSections.find(s => s.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: `${src.id}-copie-${Date.now().toString(36)}`,
      title: `${src.title} (copie)`,
      contentKey: `${src.contentKey}-copie-${Date.now().toString(36)}`,
      status: 'draft' as const,
      lastModified: new Date().toISOString(),
      author: `${currentUser.name || currentUser.email} (duplication)`,
      versions: [],
    };
    onUpdateCmsSections([...cmsSections, copy]);
    logAuditAction('CMS_DUPLICATE_SECTION', `Duplication de la section ${src.contentKey}`);
    showToast(`Section dupliquée en brouillon : "${copy.title}".`);
  };

  const handleToggleArchive = (id: string) => {
    const src = cmsSections.find(s => s.id === id);
    if (!src) return;
    const next = src.status === 'archived' ? 'published' : 'archived';
    onUpdateCmsSections(cmsSections.map(s => (s.id === id ? { ...s, status: next as typeof s.status, lastModified: new Date().toISOString() } : s)));
    logAuditAction(next === 'archived' ? 'CMS_ARCHIVE_SECTION' : 'CMS_UNARCHIVE_SECTION', `Section ${src.contentKey} → ${next}`);
    showToast(next === 'archived' ? 'Section archivée (masquée du site).' : 'Section republiée.');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
              ✍️ CMS & Édition des Contenus
            </span>
            <span className="text-xs text-slate-400">Éditeur textuel dynamique avec historique et versioning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Centre de Contrôle Éditorial (CMS)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Modifiez en temps réel les textes institutionnels, le message officiel de bienvenue de VIVA EVENT SOLUTIONS, les 15 pôles et les valeurs d'entreprise.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: activePalette.colors.border }}>
        {[
          { id: 'cms-catalog', label: `Catalogue CMS & Versioning (${cmsSections.length})`, icon: FileText },
          { id: 'seo', label: 'SEO & Métadonnées', icon: Globe },
          { id: 'welcome', label: 'Message Officiel de Bienvenue', icon: Sparkles },
          { id: 'poles', label: `Les 15 Pôles d'Ingénierie (${departments.length})`, icon: Layers },
          { id: 'institution', label: 'Valeurs, Cycle de Mission & Marché', icon: Building2 }
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

      {/* TAB 1: CMS CATALOG & VERSIONING */}
      {activeTab === 'cms-catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Section Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl border space-y-3"
              style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrer les blocs..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div className="flex gap-2">
                {['all', 'accueil', 'presentation'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPage(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                      filterPage === p ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p === 'all' ? 'Toutes' : p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(['all', 'published', 'draft', 'archived'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                      filterStatus === st ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {st === 'all' ? 'Tous statuts' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredSections.map(item => {
                const isSelected = item.id === selectedSectionId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSectionId(item.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono mb-1">
                      <span>{item.page.toUpperCase()} • {item.section}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${item.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : item.status === 'archived' ? 'bg-slate-600/30 text-slate-400' : 'bg-amber-500/20 text-amber-300'}`}>
                        {item.status} • {item.versions.length} version(s)
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.content}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleDuplicateSection(item.id); }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
                        title="Dupliquer en brouillon"
                      >
                        Dupliquer
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleArchive(item.id); }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
                        title={item.status === 'archived' ? 'Republier' : 'Archiver (masquer du site)'}
                      >
                        {item.status === 'archived' ? 'Republier' : 'Archiver'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Editor */}
          {currentItem && (
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl border shadow-xl space-y-5"
              style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
            >
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">
                    Composant : {currentItem.component} • Clé : {currentItem.contentKey}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{currentItem.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: activePalette.colors.border }}
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Historique ({currentItem.versions.length})</span>
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: activePalette.colors.border }}
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isPreviewOpen ? 'Masquer Aperçu' : 'Aperçu'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Titre Administratif</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Contenu du Texte / HTML</label>
                <textarea
                  rows={10}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full p-4 rounded-2xl border text-xs leading-relaxed font-sans"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              {/* Live Preview Panel */}
              {isPreviewOpen && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Rendu en Direct</span>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {editContent}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: activePalette.colors.border }}>
                <span className="text-[11px] text-slate-500">
                  Dernière modification : {new Date(currentItem.lastModified).toLocaleString('fr-FR')} par {currentItem.author}
                </span>

                <button
                  onClick={handleSaveContent}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer & Publier</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB SEO : métadonnées conceptuelles (session — R2-20, jamais injectées dans <head>) */}
      {(activeTab as string) === 'seo' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-4 max-w-4xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <span>SEO par section (brouillon conceptuel)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Ces métadonnées préparent le branchement définitif (R2-20). Elles ne sont PAS injectées dans le document :
            le <head></head> actuel reste celui de index.html jusqu’au branchement.
          </p>
          <div className="space-y-3 max-h-[30rem] overflow-y-auto">
            {cmsSections.map(s => {
              const meta = seoMeta[s.id] ?? { metaTitle: s.title, metaDesc: s.content.slice(0, 150), slug: s.contentKey };
              return (
                <div key={s.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white font-mono">{s.contentKey} <span className="text-slate-500">({s.status})</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input value={meta.metaTitle} onChange={e => setSeoMeta(prev => ({ ...prev, [s.id]: { ...meta, metaTitle: e.target.value } }))} placeholder="Meta title" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
                    <input value={meta.slug} onChange={e => setSeoMeta(prev => ({ ...prev, [s.id]: { ...meta, slug: e.target.value } }))} placeholder="slug" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono" />
                    <input value={meta.metaDesc} onChange={e => setSeoMeta(prev => ({ ...prev, [s.id]: { ...meta, metaDesc: e.target.value } }))} placeholder="Meta description" className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL WELCOME MESSAGE */}
      {activeTab === 'welcome' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-4xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Texte Protocolaire Officiel</span>
            </div>
            <h3 className="text-lg font-bold text-white">Message Officiel de Bienvenue de la Direction Générale</h3>
            <p className="text-xs text-slate-400">
              Ce texte institutionnel s'affiche sur la page d'accueil et dans la présentation de VIVA EVENT SOLUTIONS. Il doit respecter la dénomination officielle de la marque.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <strong>Contrôle de Conformité :</strong> Les 1er et 3e paragraphes mentionnent obligatoirement la dénomination exacte : <strong className="text-white">VIVA EVENT SOLUTIONS</strong>.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Corps du Message de Bienvenue :</label>
              <textarea
                rows={12}
                value={welcomeDraft}
                onChange={e => setWelcomeDraft(e.target.value)}
                className="w-full p-4 rounded-2xl border text-xs leading-relaxed"
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
              onClick={handleSaveWelcome}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Publier le message officiel</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: THE 15 POLES */}
      {activeTab === 'poles' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border flex items-center justify-between"
            style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
          >
            <div>
              <h3 className="text-sm font-bold text-white">Édition des 15 Pôles d'Ingénierie</h3>
              <p className="text-xs text-slate-400">Sélectionnez un pôle pour éditer son intitulé, sa mission, son équipement lourd et ses indicateurs.</p>
            </div>

            <select
              value={selectedPoleId}
              onChange={e => setSelectedPoleId(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                borderColor: activePalette.colors.border,
                color: isLight ? activePalette.colors.textMain : '#FFFFFF'
              }}
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  Pôle {dept.number < 10 ? `0${dept.number}` : dept.number}. {dept.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPole && (
            <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-5 max-w-4xl"
              style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Intitulé Officiel</label>
                  <input
                    type="text"
                    value={selectedPole.name}
                    onChange={e => updateDepartment(selectedPole.id, { name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                      borderColor: activePalette.colors.border,
                      color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={selectedPole.tagline}
                    onChange={e => updateDepartment(selectedPole.id, { tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                      borderColor: activePalette.colors.border,
                      color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Description & Mission du Pôle</label>
                <textarea
                  rows={4}
                  value={selectedPole.description}
                  onChange={e => updateDepartment(selectedPole.id, { description: e.target.value })}
                  className="w-full p-3.5 rounded-xl border text-xs leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Sens profond & Attributions concrètes</label>
                <textarea
                  rows={4}
                  value={selectedPole.meaningText}
                  onChange={e => updateDepartment(selectedPole.id, { meaningText: e.target.value })}
                  className="w-full p-3.5 rounded-xl border text-xs leading-relaxed"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                    borderColor: activePalette.colors.border,
                    color: isLight ? activePalette.colors.textMain : '#FFFFFF'
                  }}
                />
              </div>

              <div className="pt-3 border-t flex justify-end" style={{ borderColor: activePalette.colors.border }}>
                <button
                  onClick={() => showToast(`Pôle "${selectedPole.name}" synchronisé avec succès.`)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Valider les modifications du pôle
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INSTITUTIONAL SECTIONS */}
      {activeTab === 'institution' && (
        <div className="p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 max-w-4xl"
          style={{ backgroundColor: activePalette.colors.bgSurface, borderColor: activePalette.colors.border }}
        >
          <div className="border-b pb-4" style={{ borderColor: activePalette.colors.border }}>
            <h3 className="text-lg font-bold text-white">Présentation Institutionnelle "Qui Nous Sommes"</h3>
            <p className="text-xs text-slate-400">Texte fondateur expliquant l'architecture unique et intégrée de VIVA EVENT SOLUTIONS.</p>
          </div>

          <div>
            <textarea
              rows={8}
              value={platformConfig.whoWeAreText}
              onChange={e => updatePlatformConfig({ whoWeAreText: e.target.value })}
              className="w-full p-4 rounded-2xl border text-xs leading-relaxed"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSubtle,
                borderColor: activePalette.colors.border,
                color: isLight ? activePalette.colors.textMain : '#FFFFFF'
              }}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-xs font-bold text-white uppercase mb-3">9 Valeurs Fondamentales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {platformConfig.valuesList.map((val, idx) => (
                <div key={val.number} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{val.number}</span>
                  <div className="text-xs font-bold text-white">{val.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{val.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end" style={{ borderColor: activePalette.colors.border }}>
            <button
              onClick={() => showToast("Présentation institutionnelle et valeurs synchronisées.")}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase cursor-pointer"
            >
              Enregistrer les textes institutionnels
            </button>
          </div>
        </div>
      )}

      {/* History Version Modal */}
      {isHistoryModalOpen && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full max-h-[80vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Historique des Versions • {currentItem.title}</h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {currentItem.versions.map((ver, idx) => (
                <div key={ver.versionId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Version #{currentItem.versions.length - idx}</span>
                    <span className="text-slate-500 text-[11px]">{new Date(ver.timestamp).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>Auteur : {ver.author}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] line-clamp-3">
                    {ver.content}
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => handleRollbackVersion(ver)}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurer cette version</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
