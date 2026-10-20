import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useAuth } from '../../context/AuthContext';
import { MediaItem, MediaCategory, YouTubeChannelConfig } from '../../types/cmsAndErp';
import { deleteEnterpriseStorageFile, uploadToEnterpriseStorage } from '../../services/storageService';
import {
  Image,
  Youtube,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  Star,
  Settings,
  Tv
} from 'lucide-react';

export const MediaManager: React.FC = () => {
  const { mediaItems, addMediaItem, updateMediaItem, deleteMediaItem, youtubeConfig, updateYouTubeConfig } = useProjectData();
  const { currentUser, isAdminGeneral } = useAuth();

  const [activeTab, setActiveTab] = useState<'media_list' | 'upload_photo' | 'add_youtube' | 'channel_config'>('media_list');

  // Photo Upload State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<MediaCategory>('sommet_etat');
  const [photoProject, setPhotoProject] = useState('');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPhotoFeatured, setIsPhotoFeatured] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // YouTube Video Add State
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [ytDesc, setYtDesc] = useState('');
  const [ytCategory, setYtCategory] = useState<MediaCategory>('corporate');
  const [ytProject, setYtProject] = useState('');
  const [ytDate, setYtDate] = useState(new Date().toISOString().split('T')[0]);
  const [isYtFeatured, setIsYtFeatured] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  // YouTube Channel Config State
  const [channelUrl, setChannelUrl] = useState(youtubeConfig.youtubeChannelUrl);
  const [channelName, setChannelName] = useState(youtubeConfig.youtubeChannelName);
  const [channelId, setChannelId] = useState(youtubeConfig.youtubeChannelId);
  const [channelDesc, setChannelDesc] = useState(youtubeConfig.youtubeChannelDescription);
  const [channelEnabled, setChannelEnabled] = useState(youtubeConfig.isChannelEnabled);
  const [channelSavedNotice, setChannelSavedNotice] = useState(false);

  // Helper to extract YouTube video ID
  const extractYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const handleDeleteMedia = async (id: string) => {
    setMediaError(null);
    try {
      await deleteMediaItem(id);
    } catch (err) {
      setMediaError(`Suppression média refusée : ${err instanceof Error ? err.message : String(err)}.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !photoTitle) {
      setUploadError("Veuillez sélectionner un fichier image et renseigner le titre.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Supabase Storage is authoritative for Supabase sessions.
      const metadata = await uploadToEnterpriseStorage(photoFile, 'photos');

      try {
        await addMediaItem({
          title: photoTitle,
          description: photoDesc,
          caption: photoCaption,
          type: 'photo',
          category: photoCategory,
          url: metadata.storageUrl,
          storageBucket: metadata.storageBucket,
          storagePath: metadata.storagePath,
          thumbnailUrl: metadata.storageUrl,
          projectName: photoProject,
          realizationDate: photoDate,
          isFeatured: isPhotoFeatured,
          order: mediaItems.length + 1,
          status: 'published',
          uploadedBy: currentUser.name
        });
      } catch (err) {
        try {
          if (!metadata.storageBucket || !metadata.storagePath) {
            throw new Error('Le chemin de stockage du fichier est introuvable.');
          }
          await deleteEnterpriseStorageFile(metadata.storagePath, metadata.storageBucket);
          setUploadError(`Fiche média refusée ; le fichier téléversé a été supprimé. ${err instanceof Error ? err.message : String(err)}`);
        } catch (cleanupError) {
          setUploadError(
            `Fiche média refusée et nettoyage du fichier impossible : ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}.`
          );
        }
        return;
      }

      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoTitle('');
      setPhotoDesc('');
      setPhotoCaption('');
      setPhotoProject('');
      setActiveTab('media_list');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors du téléversement.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vidId = extractYouTubeId(ytUrl);
    if (!ytUrl || !ytTitle) return;

    const embedUrl = ytUrl;
    const thumbUrl = vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : undefined;

    setYoutubeError(null);
    try {
      await addMediaItem({
        title: ytTitle,
        description: ytDesc,
        type: 'youtube',
        category: ytCategory,
        url: embedUrl,
        youtubeVideoId: vidId,
        thumbnailUrl: thumbUrl,
        projectName: ytProject,
        realizationDate: ytDate,
        isFeatured: isYtFeatured,
        order: mediaItems.length + 1,
        status: 'published',
        uploadedBy: currentUser.name
      });

      setYtUrl('');
      setYtTitle('');
      setYtDesc('');
      setYtProject('');
      setActiveTab('media_list');
    } catch (err) {
      setYoutubeError(`Enregistrement média refusé : ${err instanceof Error ? err.message : String(err)}.`);
    }
  };

  const handleSaveChannelConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateYouTubeConfig({
      youtubeChannelUrl: channelUrl,
      youtubeChannelName: channelName,
      youtubeChannelId: channelId,
      youtubeChannelDescription: channelDesc,
      isChannelEnabled: channelEnabled
    });
    setChannelSavedNotice(true);
    setTimeout(() => setChannelSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Image className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white font-serif">
              Gestion de la Médiathèque & Chaîne YouTube
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publication des réalisations et photos dans la médiathèque, avec Firebase réservé aux sessions legacy.
          </p>
        </div>

        {/* Tab navigation buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('media_list')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'media_list'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Médias ({mediaItems.length})
          </button>
          <button
            onClick={() => setActiveTab('upload_photo')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'upload_photo'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Uploader Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('add_youtube')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'add_youtube'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>Ajouter Vidéo YouTube</span>
          </button>
          <button
            onClick={() => setActiveTab('channel_config')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'channel_config'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Chaîne YouTube</span>
          </button>
        </div>
      </div>

      {/* 1. MEDIA LIST */}
      {activeTab === 'media_list' && (
        <div className="space-y-4">
          {mediaError && (
            <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/20 p-3 text-xs text-rose-300">
              {mediaError}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map(item => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Thumbnail */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === 'youtube'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold block">
                      {item.category.toUpperCase()} • {item.projectName || 'VIVA'}
                    </span>
                    <h4 className="font-bold text-white text-xs mt-0.5 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const nextStatus = item.status === 'published' ? 'draft' : 'published';
                      updateMediaItem(item.id, { status: nextStatus });
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                    title={item.status === 'published' ? 'Dépublier' : 'Publier'}
                  >
                    {item.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{item.status === 'published' ? 'Masquer' : 'Publier'}</span>
                  </button>

                  <button
                    onClick={() => {
                      updateMediaItem(item.id, { isFeatured: !item.isFeatured });
                    }}
                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer ${
                      item.isFeatured ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Mettre en vedette"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{item.isFeatured ? 'En Vedette' : 'Standard'}</span>
                  </button>

                  <button
                    onClick={() => { void handleDeleteMedia(item.id); }}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. UPLOAD PHOTO (FIREBASE STORAGE) */}
      {activeTab === 'upload_photo' && (
        <form onSubmit={handlePhotoSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Téléverser une Photo vers Firebase Storage
            </h3>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              {uploadError}
            </div>
          )}

          {/* File input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Fichier Image (JPEG, PNG, WebP)
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 file:cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800"
            />
            {photoPreview && (
              <div className="mt-3 relative aspect-video rounded-xl overflow-hidden bg-slate-950 max-h-48">
                <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Titre de la Réalisation
            </label>
            <input
              type="text"
              required
              value={photoTitle}
              onChange={e => setPhotoTitle(e.target.value)}
              placeholder="Ex: Mur LED Géant Incurvé Sommet Diplomatique"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Catégorie
              </label>
              <select
                value={photoCategory}
                onChange={e => setPhotoCategory(e.target.value as MediaCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="sommet_etat">Sommets d'État</option>
                <option value="scenographie">Scénographie 3D & Murs LED</option>
                <option value="sonorisation">Sonorisation Line Array</option>
                <option value="eclairage">Éclairage Architectural</option>
                <option value="traduction">Traduction Simultanée</option>
                <option value="corporate">Corporate & Galas</option>
                <option value="general">Général</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Nom du Projet / Événement
              </label>
              <input
                type="text"
                value={photoProject}
                onChange={e => setPhotoProject(e.target.value)}
                placeholder="Ex: Forum Économique RDC"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Description Détaillée
            </label>
            <textarea
              rows={3}
              value={photoDesc}
              onChange={e => setPhotoDesc(e.target.value)}
              placeholder="Décrivez les spécifications techniques, équipements mobilisés et le lieu..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Légende / Fiche Technique
            </label>
            <input
              type="text"
              value={photoCaption}
              onChange={e => setPhotoCaption(e.target.value)}
              placeholder="Ex: Fleuve Congo Hotel • 24 modules LED P2.5 • Régie Novastar 4K"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isPhotoFeatured}
              onChange={e => setIsPhotoFeatured(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isFeatured" className="text-xs text-slate-300 cursor-pointer">
              Mettre en avant sur la page d'accueil (En vedette)
            </label>
          </div>

          <button
            type="submit"
            disabled={isUploading || !photoFile}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Téléversement sécurisé en cours...
              </span>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Publier la Réalisation</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 3. ADD YOUTUBE VIDEO */}
      {activeTab === 'add_youtube' && (
        <form onSubmit={handleYouTubeSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <Youtube className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-white text-base">
              Ajouter une Vidéo YouTube Officielle
            </h3>
          </div>

          {youtubeError && (
            <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/20 p-3 text-xs text-rose-300">
              {youtubeError}
            </p>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Lien de la Vidéo YouTube (URL complète ou lien partagé)
            </label>
            <input
              type="url"
              required
              value={ytUrl}
              onChange={e => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
            {ytUrl && extractYouTubeId(ytUrl) && (
              <div className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>ID Vidéo détecté : {extractYouTubeId(ytUrl)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Titre de la Vidéo
            </label>
            <input
              type="text"
              required
              value={ytTitle}
              onChange={e => setYtTitle(e.target.value)}
              placeholder="Ex: Captation 4K & Régie du Sommet International"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Catégorie
              </label>
              <select
                value={ytCategory}
                onChange={e => setYtCategory(e.target.value as MediaCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="corporate">Corporate & Rétrospective</option>
                <option value="sommet_etat">Sommets d'État</option>
                <option value="scenographie">Scénographie & Coulisses</option>
                <option value="sonorisation">Sonorisation Line Array</option>
                <option value="eclairage">Éclairage Architectural</option>
                <option value="traduction">Traduction Simultanée</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Nom du Projet / Événement
              </label>
              <input
                type="text"
                value={ytProject}
                onChange={e => setYtProject(e.target.value)}
                placeholder="Ex: Sommet Panafricain"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Description de la Vidéo
            </label>
            <textarea
              rows={3}
              value={ytDesc}
              onChange={e => setYtDesc(e.target.value)}
              placeholder="Présentez le déroulement de la prestation vidéo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isYtFeatured"
              checked={isYtFeatured}
              onChange={e => setIsYtFeatured(e.target.checked)}
              className="rounded text-red-500 focus:ring-red-500"
            />
            <label htmlFor="isYtFeatured" className="text-xs text-slate-300 cursor-pointer">
              Mettre en avant dans la section principale Vidéos
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
          >
            <Youtube className="w-4 h-4" />
            <span>Enregistrer la Vidéo YouTube</span>
          </button>
        </form>
      )}

      {/* 4. YOUTUBE CHANNEL CONFIGURATION */}
      {activeTab === 'channel_config' && (
        <form onSubmit={handleSaveChannelConfig} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <Tv className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-white text-base">
              Configuration de la Chaîne YouTube Officielle
            </h3>
          </div>

          {channelSavedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Paramètres de la chaîne YouTube enregistrés.</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              URL Complète de la Chaîne YouTube
            </label>
            <input
              type="url"
              required
              value={channelUrl}
              onChange={e => setChannelUrl(e.target.value)}
              placeholder="https://www.youtube.com/@vivaeventsolutions-rdc"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Nom d'Affichage de la Chaîne
              </label>
              <input
                type="text"
                required
                value={channelName}
                onChange={e => setChannelName(e.target.value)}
                placeholder="VIVA EVENT SOLUTIONS TV"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Identifiant Chaîne (Channel ID)
              </label>
              <input
                type="text"
                value={channelId}
                onChange={e => setChannelId(e.target.value)}
                placeholder="UC_viva_event_solutions_rdc"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Description de la Chaîne pour le Public
            </label>
            <textarea
              rows={3}
              value={channelDesc}
              onChange={e => setChannelDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="channelEnabled"
              checked={channelEnabled}
              onChange={e => setChannelEnabled(e.target.checked)}
              className="rounded text-red-500 focus:ring-red-500"
            />
            <label htmlFor="channelEnabled" className="text-xs text-slate-300 cursor-pointer">
              Afficher le bandeau et le bouton officiel "VOIR NOTRE CHAÎNE YOUTUBE" sur le portail
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer la Configuration Chaîne</span>
          </button>
        </form>
      )}
    </div>
  );
};
