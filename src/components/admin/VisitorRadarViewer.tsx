import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { VisitorTrackingService, VisitorSession } from '../../services/visitorTrackingService';
import {
  Users,
  Eye,
  Activity,
  Phone,
  Mail,
  Building,
  MapPin,
  Clock,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Flame,
  Layers,
  Calendar
} from 'lucide-react';

export const VisitorRadarViewer: React.FC = () => {
  const { activePalette, themeMode } = useTheme();
  const isLight = themeMode === 'light';

  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'identified' | 'hot'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSessions(VisitorTrackingService.getAllSessions());
  }, []);

  const filteredSessions = sessions.filter(session => {
    if (filterType === 'identified' && !session.identified) return false;
    if (filterType === 'hot' && session.interestLevel !== 'Élevé (Projet chaud)') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = session.clientInfo?.name.toLowerCase().includes(q);
      const matchOrg = session.clientInfo?.organization.toLowerCase().includes(q);
      const matchCity = session.ipLocation.toLowerCase().includes(q);
      const matchPhone = session.clientInfo?.phone.toLowerCase().includes(q);
      return matchName || matchOrg || matchCity || matchPhone;
    }
    return true;
  });

  const totalSessions = sessions.length;
  const identifiedCount = sessions.filter(s => s.identified).length;
  const hotLeadsCount = sessions.filter(s => s.interestLevel === 'Élevé (Projet chaud)').length;
  const identificationRate = totalSessions > 0 ? Math.round((identifiedCount / totalSessions) * 100) : 0;

  const exportVisitorsCSV = () => {
    const headers = ["ID Session", "Date/Heure", "Statut", "Nom", "Organisation", "Email", "WhatsApp", "Localisation", "Appareil", "Pages Vues", "Pôles Consultés"];
    const rows = sessions.map(s => [
      s.id,
      s.firstSeen,
      s.identified ? "Identifié" : "Anonyme",
      s.clientInfo?.name || "N/A",
      s.clientInfo?.organization || "N/A",
      s.clientInfo?.email || "N/A",
      s.clientInfo?.phone || "N/A",
      s.ipLocation,
      s.deviceType,
      s.pageViews,
      s.viewedPoles.join(" | ")
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visiteurs_viva_events_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-xl transition-all relative overflow-hidden"
        style={{
          backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
          borderColor: activePalette.colors.borderGlow
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Radar d'Audience & Traçabilité des Visiteurs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
              Identification & Suivi des Visiteurs en Temps Réel
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Consultez les entreprises, institutions et particuliers qui visitent la plateforme, réagissent aux 15 pôles de services, créent des comptes clients ou réservent des événements avant le jour J.
            </p>
          </div>

          <button
            onClick={exportVisitorsCSV}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exporter la Liste des Prospects (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className="p-5 rounded-2xl border shadow-md space-y-2"
          style={{
            backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Visiteurs Totaux</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
            {totalSessions}
          </div>
          <p className="text-[11px] text-slate-400">Sessions enregistrées</p>
        </div>

        <div
          className="p-5 rounded-2xl border shadow-md space-y-2"
          style={{
            backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase">Visiteurs Identifiés</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {identifiedCount}
          </div>
          <p className="text-[11px] text-slate-400">Taux de conversion : {identificationRate}%</p>
        </div>

        <div
          className="p-5 rounded-2xl border shadow-md space-y-2"
          style={{
            backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase">Projets Chauds</span>
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {hotLeadsCount}
          </div>
          <p className="text-[11px] text-slate-400">Réservations & Devis en cours</p>
        </div>

        <div
          className="p-5 rounded-2xl border shadow-md space-y-2"
          style={{
            backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
            borderColor: activePalette.colors.border
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase">Canal Prioritaire</span>
            <Phone className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-400 truncate">
            WhatsApp Direct
          </div>
          <p className="text-[11px] text-slate-400">+243 963 216 780</p>
        </div>
      </div>

      {/* Strategic Advice Box: "Comment Connaître et Convertir les Visiteurs ?" */}
      <div
        className="p-6 rounded-3xl border shadow-lg space-y-4"
        style={{
          backgroundColor: isLight ? '#F8FAFC' : `${activePalette.colors.accent}08`,
          borderColor: activePalette.colors.borderGlow
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
              Stratégie VIVA EVENTS : Comment Connaître Tous les Visiteurs qui Accèdent ou Réagissent ?
            </h3>
            <p className="text-xs text-slate-400">
              Voici les 4 leviers mis en place sur la plateforme pour transformer un visiteur anonyme en client identifié :
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-black/20 border border-slate-700/50 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>1. Compte Client Obligatoire</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              La fenêtre de création de compte capture immédiatement le <strong>Nom, l'Entreprise, l'Email et le WhatsApp</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 border border-slate-700/50 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>2. Fenêtre Réservation Anticipée</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tout organisateur qui transmet son projet pour bloquer la date fournit son <strong>cahier des charges et son contact</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 border border-slate-700/50 space-y-1">
            <div className="font-bold text-blue-400 flex items-center gap-1.5">
              <span>3. Click-to-WhatsApp Direct</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Chaque clic de contact ouvre WhatsApp avec un message pré-rempli, vous révélant instantanément le <strong>numéro et la photo du client</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 border border-slate-700/50 space-y-1">
            <div className="font-bold text-purple-400 flex items-center gap-1.5">
              <span>4. Traçabilité des Actions</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Le système consigne chaque pôle consulté, simulation de devis et heure d'accès dans le journal ci-dessous.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${filterType === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Tous ({totalSessions})
          </button>
          <button
            onClick={() => setFilterType('identified')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${filterType === 'identified' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Identifiés ({identifiedCount})
          </button>
          <button
            onClick={() => setFilterType('hot')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${filterType === 'hot' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Projets Chauds ({hotLeadsCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville, société..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
              borderColor: activePalette.colors.border,
              color: isLight ? '#0F172A' : '#FFFFFF'
            }}
          />
        </div>
      </div>

      {/* Visitors List */}
      <div className="space-y-3">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="p-5 rounded-2xl border shadow-lg transition-all hover:border-amber-500/40"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : activePalette.colors.bgSurface,
              borderColor: session.identified ? 'rgba(16, 185, 129, 0.3)' : activePalette.colors.border
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Visitor Identity & Source */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${session.identified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                >
                  {session.identified ? <CheckCircle2 className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-sm" style={{ color: isLight ? activePalette.colors.textMain : '#FFFFFF' }}>
                      {session.clientInfo ? session.clientInfo.name : `Visiteur ${session.id.split('-').slice(-2).join('-')}`}
                    </span>

                    {session.clientInfo?.organization && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        {session.clientInfo.organization}
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${session.interestLevel === 'Élevé (Projet chaud)' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}`}
                    >
                      {session.interestLevel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{session.ipLocation}</span>
                    </span>

                    <span className="flex items-center gap-1">
                      {session.deviceType === 'Mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                      <span>{session.deviceType} • {session.browser}</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Dernière activité : {session.lastActive}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & WhatsApp Contact */}
              <div className="flex items-center gap-2.5 shrink-0">
                {session.clientInfo?.phone && (
                  <a
                    href={`https://wa.me/${session.clientInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${session.clientInfo.name}, l'équipe de direction de VIVA EVENT SOLUTIONS SARLU a bien reçu votre interaction sur notre plateforme.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contacter WhatsApp ({session.clientInfo.phone})</span>
                  </a>
                )}

                {session.clientInfo?.email && (
                  <a
                    href={`mailto:${session.clientInfo.email}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title={`Envoyer un email à ${session.clientInfo.email}`}
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Interaction History Feed */}
            {session.actions.length > 0 && (
              <div className="mt-3.5 pt-3 border-t flex flex-wrap items-center gap-2" style={{ borderColor: activePalette.colors.border }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Parcours & Réactions :
                </span>
                {session.actions.map((act, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700 font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{act.label}</span>
                    <span className="opacity-50">({act.timestamp})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
