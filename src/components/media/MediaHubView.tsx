import React, { useState, useMemo } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useAuth } from '../../context/AuthContext';
import { MediaItem, MediaCategory } from '../../types/cmsAndErp';
import {
  Image,
  Video,
  Youtube,
  Play,
  Filter,
  Search,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  X,
  Plus,
  Tv,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface MediaHubViewProps {
  onOpenAdminUpload?: () => void;
}

export const MediaHubView: React.FC<MediaHubViewProps> = ({ onOpenAdminUpload }) => {
  const { mediaItems, youtubeConfig, cmsSections } = useProjectData();
  const { isAdmin, isStaffWorker } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeType, setActiveType] = useState<'all' | 'photo' | 'youtube' | 'video_file'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Page title from CMS or default
  const pageTitle = cmsSections.find(s => s.contentKey === 'mediaPageTitle')?.content ||
    "Galerie Officielle des Réalisations & Événements d'Envergure";

  // Filtered Media items
  const filteredItems = useMemo(() => {
    return mediaItems.filter(item => {
      if (item.status !== 'published' && !isAdmin) return false;
      if (activeType !== 'all' && item.type !== activeType) return false;
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesProject = item.projectName?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesDesc || matchesProject;
      }
      return true;
    }).sort((a, b) => (a.order || 99) - (b.order || 99));
  }, [mediaItems, activeType, activeCategory, searchQuery, isAdmin]);

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'Toutes les Catégories' },
    { key: 'sommet_etat', label: "Sommets d'État" },
    { key: 'scenographie', label: 'Scénographie 3D & Murs LED' },
    { key: 'sonorisation', label: 'Sonorisation Line Array' },
    { key: 'eclairage', label: 'Éclairage Architectural' },
    { key: 'traduction', label: 'Traduction Simultanée' },
    { key: 'corporate', label: 'Corporate & Galas' }
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 shadow-2xl">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Médiathèque & Réalisations Officielles</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight leading-tight">
            {pageTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Explorez notre portefeuille de prouesses scénographiques, déploiements d'écrans LED géants, systèmes acoustiques Line Array et sommets diplomatiques d'envergure en République Démocratique du Congo.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {youtubeConfig.isChannelEnabled ? (
              <a
                href={youtubeConfig.youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
                <span>Voir Notre Chaîne YouTube</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
              </a>
            ) : (
              <p className="text-[11px] text-slate-500 italic">Chaîne YouTube non configurée — aucune synchronisation API réelle (état affiché, pas simulé).</p>
            )}

            {(isAdmin || isStaffWorker) && onOpenAdminUpload && (
              <button
                onClick={onOpenAdminUpload}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un Média / Vidéo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official YouTube Channel Spotlight Banner */}
      {youtubeConfig.isChannelEnabled && (
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-950 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/30">
              <Tv className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{youtubeConfig.youtubeChannelName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">Officiel</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 max-w-xl">
                {youtubeConfig.youtubeChannelDescription}
              </p>
            </div>
          </div>
          <a
            href={youtubeConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 shrink-0 cursor-pointer transition-all"
          >
            <span>Accéder aux Vidéos 4K</span>
            <ExternalLink className="w-3.5 h-3.5 text-red-400" />
          </a>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Type filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveType('all')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeType === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({mediaItems.length})
            </button>
            <button
              onClick={() => setActiveType('photo')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeType === 'photo' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Photos ({mediaItems.filter(m => m.type === 'photo').length})</span>
            </button>
            <button
              onClick={() => setActiveType('youtube')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeType === 'youtube' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>Vidéos YouTube ({mediaItems.filter(m => m.type === 'youtube').length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un projet, matériel, lieu..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                activeCategory === cat.key
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid View */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Image className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Aucun média ne correspond à votre filtre</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Modifiez vos mots-clés ou réinitialisez les catégories pour consulter l'ensemble des réalisations.
          </p>
          <button
            onClick={() => { setActiveCategory('all'); setActiveType('all'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-amber-400 text-xs font-bold hover:bg-slate-750 cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className="group bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg transition-all hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              {/* Thumbnail / Visual container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>

                {/* Media Type Badge */}
                <div className="absolute top-3 left-3">
                  {item.type === 'youtube' ? (
                    <span className="px-2.5 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                      <Youtube className="w-3 h-3" />
                      <span>YouTube 4K</span>
                    </span>
                  ) : item.type === 'video_file' ? (
                    <span className="px-2.5 py-1 rounded-md bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                      <Video className="w-3 h-3" />
                      <span>Vidéo</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                      <Image className="w-3 h-3" />
                      <span>Photo HD</span>
                    </span>
                  )}
                </div>

                {/* Play button overlay for videos */}
                {(item.type === 'youtube' || item.type === 'video_file') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>
                )}

                {/* Zoom icon on hover for photos */}
                {item.type === 'photo' && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 p-1.5 rounded-lg text-white">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 font-mono text-[10px] border border-slate-700">
                    {item.category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  {item.projectName && (
                    <div className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      <span>{item.projectName}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  {item.realizationDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.realizationDate}</span>
                    </span>
                  ) : (
                    <span>VIVA Réalisation</span>
                  )}
                  <span className="text-amber-400 font-bold flex items-center gap-0.5 text-xs">
                    <span>Aperçu</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Video Player Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
            {/* Modal header */}
            <div className="p-4 sm:p-6 pb-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  {selectedMedia.category.replace('_', ' ')} • {selectedMedia.projectName || 'VIVA EVENT'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {selectedMedia.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Media player container */}
            <div className="px-4 sm:px-6">
              {selectedMedia.type === 'youtube' && selectedMedia.youtubeVideoId ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedMedia.youtubeVideoId}?autoplay=1`}
                    title={selectedMedia.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : selectedMedia.type === 'video_file' ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="max-h-[60vh] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.title}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
              )}
            </div>

            {/* Modal caption & details */}
            <div className="p-4 sm:p-6 pt-0 space-y-3">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedMedia.description}
              </p>
              {selectedMedia.caption && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono">
                  {selectedMedia.caption}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Date : {selectedMedia.realizationDate || '2026'}</span>
                </span>

                {selectedMedia.type === 'youtube' && (
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Ouvrir sur YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
