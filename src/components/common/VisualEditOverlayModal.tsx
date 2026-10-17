import React, { useState, useEffect } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useAuth } from '../../context/AuthContext';
import { CmsSectionItem } from '../../types/cmsAndErp';
import {
  Edit3,
  X,
  Save,
  Send,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

export const VisualEditOverlayModal: React.FC = () => {
  const {
    activeVisualEditKey,
    setActiveVisualEditKey,
    getCmsItem,
    saveCmsDraft,
    publishCmsItem
  } = useProjectData();
  const { isSuperAdmin } = useAuth();

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    content: '',
    primaryButtonText: '',
    secondaryButtonText: ''
  });
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeItem = activeVisualEditKey ? getCmsItem(activeVisualEditKey) : undefined;

  useEffect(() => {
    if (activeItem) {
      setForm({
        title: activeItem.draftTitle ?? activeItem.publishedTitle ?? activeItem.title ?? '',
        subtitle: activeItem.draftSubtitle ?? activeItem.publishedSubtitle ?? activeItem.subtitle ?? '',
        content: activeItem.draftContent ?? activeItem.publishedContent ?? activeItem.content ?? '',
        primaryButtonText: activeItem.draftPrimaryButtonText ?? activeItem.publishedPrimaryButtonText ?? activeItem.primaryButtonText ?? '',
        secondaryButtonText: activeItem.draftSecondaryButtonText ?? activeItem.publishedSecondaryButtonText ?? activeItem.secondaryButtonText ?? ''
      });
      setIsPreviewActive(false);
    }
  }, [activeItem]);

  if (!isSuperAdmin || !activeVisualEditKey || !activeItem) {
    return null;
  }

  const handleSaveDraft = async () => {
    await saveCmsDraft(activeItem.id, {
      title: form.title,
      subtitle: form.subtitle,
      content: form.content,
      primaryButtonText: form.primaryButtonText,
      secondaryButtonText: form.secondaryButtonText
    });
    setToastMsg("💾 Brouillon enregistré avec succès dans Firestore !");
    setTimeout(() => {
      setToastMsg(null);
      setActiveVisualEditKey(null);
    }, 1500);
  };

  const handlePublish = async () => {
    await publishCmsItem(activeItem.id, {
      title: form.title,
      subtitle: form.subtitle,
      content: form.content,
      primaryButtonText: form.primaryButtonText,
      secondaryButtonText: form.secondaryButtonText
    });
    setToastMsg("🚀 Contenu PUBLIÉ en direct sur le site !");
    setTimeout(() => {
      setToastMsg(null);
      setActiveVisualEditKey(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-amber-500/50 text-white shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                CLÉ CMS : {activeItem.contentKey}
              </span>
              <h3 className="text-lg font-black text-white">
                Modifier cette section ({activeItem.section})
              </h3>
            </div>
          </div>

          <button
            onClick={() => setActiveVisualEditKey(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMsg ? (
          <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{toastMsg}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {isPreviewActive ? (
              /* Live In-Modal Preview */
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                  Aperçu du Rendu Visuel
                </span>
                {form.subtitle && (
                  <p className="text-xs font-semibold text-blue-400 uppercase">
                    {form.subtitle}
                  </p>
                )}
                <h4 className="text-xl font-bold text-white">{form.title}</h4>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {form.content}
                </p>
                {(form.primaryButtonText || form.secondaryButtonText) && (
                  <div className="flex items-center gap-2 pt-2">
                    {form.primaryButtonText && (
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#4A6CF7] text-white">
                        {form.primaryButtonText}
                      </span>
                    )}
                    {form.secondaryButtonText && (
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-slate-800">
                        {form.secondaryButtonText}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Editable Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Titre :
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Sous-titre / Sur-titre :
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Description / Texte :
                  </label>
                  <textarea
                    rows={5}
                    value={form.content}
                    onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:border-amber-500 outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Bouton Principal (Texte) :
                    </label>
                    <input
                      type="text"
                      value={form.primaryButtonText}
                      onChange={e => setForm(prev => ({ ...prev, primaryButtonText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Bouton Secondaire (Texte) :
                    </label>
                    <input
                      type="text"
                      value={form.secondaryButtonText}
                      onChange={e => setForm(prev => ({ ...prev, secondaryButtonText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPreviewActive(!isPreviewActive)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>{isPreviewActive ? 'Retour au Formulaire' : '[APERÇU]'}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>[ENREGISTRER BROUILLON]</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>[PUBLIER DANS FIRESTORE]</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const EditableSectionWrapper: React.FC<{
  cmsKey: string;
  sectionName?: string;
  children: React.ReactNode;
}> = ({ cmsKey, sectionName, children }) => {
  const { isVisualEditMode, setActiveVisualEditKey } = useProjectData();
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin || !isVisualEditMode) {
    return <>{children}</>;
  }

  return (
    <div className="relative group/edit border-2 border-dashed border-amber-400/80 rounded-3xl p-1 transition-all hover:bg-amber-500/5">
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 animate-fadeIn">
        <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-950/90 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/40 shadow">
          {cmsKey}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveVisualEditKey(cmsKey);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl flex items-center gap-1.5 cursor-pointer transform hover:scale-105 transition-all border border-amber-300"
          title={`Modifier ${sectionName || cmsKey}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>[✏️ Modifier cette section]</span>
        </button>
      </div>
      {children}
    </div>
  );
};
