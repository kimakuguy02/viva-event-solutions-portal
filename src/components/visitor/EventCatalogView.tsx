import React, { useEffect, useMemo, useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import {
  DEMO_PUBLIC_EVENTS,
  PublicEvent,
  EventCategory,
  projectToPublicEvent
} from '../../data/publicEvents';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Ticket,
  Users,
  Building2,
  Info,
  PartyPopper,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

interface EventCatalogViewProps {
  initialQuery?: string;
  onOpenReservation: () => void;
  onOpenQuote: () => void;
  onNavigateTab: (tab: string) => void;
}

const CATEGORY_ORDER: Array<EventCategory | 'Toutes'> = [
  'Toutes', 'Sommet', 'Gala', 'Forum', 'Conférence', 'Concert', 'Exposition', 'Autre'
];

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous les statuts' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'active', label: 'En cours' },
  { id: 'closed', label: 'Clôturés' }
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]['id'];

function EventArtwork({ event, large = false }: { event: PublicEvent; large?: boolean }) {
  return (
    <div
      className={`relative w-full ${large ? 'h-64 sm:h-96' : 'h-44'} overflow-hidden`}
      style={{ background: event.gradient }}
      role="img"
      aria-label={`Illustration décorative pour ${event.title}`}
    >
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, #FFFFFF 0%, transparent 45%), radial-gradient(circle at 80% 70%, #FFFFFF 0%, transparent 40%)'
      }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <PartyPopper className={`${large ? 'w-16 h-16' : 'w-10 h-10'} text-white/85`} />
      </div>
      <span className="absolute bottom-3 right-3 text-[10px] font-semibold uppercase tracking-wider text-white/80 bg-black/30 px-2 py-1 rounded-full">
        Visuel d'illustration
      </span>
    </div>
  );
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function dateBadge(dateISO?: string): { day: string; month: string } | null {
  if (!dateISO) return null;
  const [year, month, day] = dateISO.split('-');
  if (!year || !month || !day) return null;
  const monthIndex = Number(month) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  return { day: String(Number(day)), month: MONTHS_SHORT[monthIndex] };
}

export const EventCatalogView: React.FC<EventCatalogViewProps> = ({
  initialQuery = '',
  onOpenReservation,
  onOpenQuote,
  onNavigateTab
}) => {
  const { projects, dataHealth } = useProjectData();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<EventCategory | 'Toutes'>('Toutes');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const realSourceReady = dataHealth.projects.status === 'ok';

  // Fiches de démonstration réservées au développement local : en build de
  // production, la vitrine n'affiche que les projets réellement chargés.
  const isDemo = !realSourceReady && import.meta.env.DEV;

  const events = useMemo<PublicEvent[]>(() => {
    if (realSourceReady) {
      return projects
        .filter(project => project.status !== 'archive')
        .map(projectToPublicEvent);
    }
    return isDemo ? DEMO_PUBLIC_EVENTS : [];
  }, [projects, realSourceReady, isDemo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = events.filter(event => {
      if (category !== 'Toutes' && event.category !== category) return false;
      if (status !== 'all' && event.statusTone !== status) return false;
      if (!q) return true;
      return [event.title, event.subtitle, event.location, event.organizer, event.category]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    return list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'fr');
      return (a.dateISO || '9999').localeCompare(b.dateISO || '9999');
    });
  }, [events, query, category, status, sortBy]);

  const selected = events.find(event => event.id === selectedId) ?? null;

  if (selected) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button
          onClick={() => setSelectedId(null)}
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold hover:opacity-80"
          style={{ color: 'var(--viva-primary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </button>

        <article className="viva-card overflow-hidden">
          <div className="relative">
            <EventArtwork event={selected} large />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white bg-black/35 backdrop-blur-sm">
                {selected.category}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white bg-black/35 backdrop-blur-sm">
                {selected.statusLabel}
              </span>
              {isDemo && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold text-amber-950 bg-amber-300">
                  Démonstration
                </span>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-6">
            <header className="space-y-2">
              <h1 className="viva-heading text-2xl sm:text-4xl font-extrabold leading-tight" style={{ color: 'var(--viva-text-main)' }}>
                {selected.title}
              </h1>
              <p className="text-sm sm:text-base" style={{ color: 'var(--viva-text-muted)' }}>
                {selected.subtitle}
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: CalendarDays, label: 'Date', value: selected.dateLabel },
                    { icon: Clock, label: 'Horaires', value: selected.time || 'À confirmer' },
                    { icon: MapPin, label: 'Lieu', value: selected.location },
                    { icon: Building2, label: 'Organisateur', value: selected.organizer },
                    { icon: Users, label: 'Participants attendus', value: selected.attendees ? `${selected.attendees} personnes` : 'Non renseigné' },
                    { icon: LayoutGrid, label: 'Catégorie', value: selected.category }
                  ].map(info => {
                    const Icon = info.icon;
                    return (
                      <div
                        key={info.label}
                        className="flex items-start gap-3 p-3.5 rounded-2xl border"
                        style={{ borderColor: 'var(--viva-border)', backgroundColor: 'var(--viva-muted-surface)' }}
                      >
                        <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--viva-primary)' }} />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--viva-text-muted)' }}>{info.label}</div>
                          <div className="text-xs sm:text-sm font-semibold break-words" style={{ color: 'var(--viva-text-main)' }}>{info.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <section className="space-y-2">
                  <h2 className="viva-heading text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--viva-text-main)' }}>
                    Informations
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--viva-text-muted)' }}>
                    {selected.description}
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="viva-heading text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--viva-text-main)' }}>
                    Galerie
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(index => (
                      <div key={index} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--viva-border)' }}>
                        <div
                          className="h-20 sm:h-28 w-full opacity-90"
                          style={{ background: selected.gradient, filter: `brightness(${1 - index * 0.12})` }}
                          role="img"
                          aria-label="Vignette d'illustration décorative"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] flex items-start gap-1.5" style={{ color: 'var(--viva-text-muted)' }}>
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Aucune photographie officielle n'est rattachée à cette fiche. Les visuels affichés sont décoratifs.
                    </span>
                  </p>
                </section>
              </div>

              <aside className="space-y-3 lg:sticky lg:top-28 self-start">
                <div className="p-4 rounded-2xl border space-y-3" style={{ borderColor: 'var(--viva-border)', backgroundColor: 'var(--viva-muted-surface)' }}>
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--viva-text-main)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--viva-accent)' }} />
                    <span>Passer à l'action</span>
                  </div>
                  <button onClick={onOpenReservation} className="viva-btn-accent w-full py-2.5 text-xs">
                    <Ticket className="w-4 h-4" />
                    <span>Réserver une place</span>
                  </button>
                  <button onClick={onOpenQuote} className="viva-btn-ghost w-full py-2.5 text-xs" style={{ color: 'var(--viva-text-main)' }}>
                    <ArrowRight className="w-4 h-4" />
                    <span>Demander un devis</span>
                  </button>
                  <button
                    onClick={() => onNavigateTab('ticketing')}
                    className="w-full text-center text-[11px] font-semibold underline underline-offset-4"
                    style={{ color: 'var(--viva-primary)' }}
                  >
                    Voir la billetterie
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--viva-text-muted)' }}>
                  {isDemo
                    ? 'Cette fiche provient du jeu de démonstration : elle illustre le parcours de réservation et ne constitue pas une annonce contractuelle.'
                    : 'Cette fiche provient des projets chargés depuis Supabase. Seules les informations publiques sont affichées.'}
                </p>
              </aside>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <header className="space-y-3">
        <span className="viva-chip" style={{ color: 'var(--viva-primary)' }}>
          <Sparkles className="w-3 h-3" />
          <span>Catalogue événementiel</span>
        </span>
        <h1 className="viva-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight" style={{ color: 'var(--viva-text-main)' }}>
          Trouvez le prochain <span className="viva-gradient-text">événement</span> à produire ou à vivre.
        </h1>
        <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'var(--viva-text-muted)' }}>
          Sommets, galas, forums et conférences : filtrez par catégorie, recherchez par lieu ou par intitulé.
        </p>
      </header>

      {isDemo && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl border text-xs"
          style={{ borderColor: 'rgba(245, 158, 11, 0.45)', backgroundColor: 'rgba(245, 158, 11, 0.10)', color: 'var(--viva-text-main)' }}
          role="status"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#B45309' }} />
          <p className="leading-relaxed">
            <strong>Catalogue de démonstration.</strong> Aucun projet réel n'est chargé pour cette session
            {dataHealth.projects.status === 'error' ? ' (lecture Supabase en erreur)' : ''}. Les fiches ci-dessous
            illustrent l'interface et ne sont pas des événements contractuels publiés.
          </p>
        </div>
      )}

      {/* Recherche + tri */}
      <div className="viva-surface p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--viva-text-muted)' }} />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un événement, une ville, un organisateur…"
              aria-label="Rechercher dans le catalogue d'événements"
              className="viva-input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'title')}
              aria-label="Trier les événements"
              className="viva-input text-xs"
            >
              <option value="date">Trier par date</option>
              <option value="title">Trier par titre</option>
            </select>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as StatusFilter)}
              aria-label="Filtrer par statut"
              className="viva-input text-xs"
            >
              {STATUS_FILTERS.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ORDER.filter(cat => cat === 'Toutes' || events.some(e => e.category === cat)).map(cat => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className="viva-chip cursor-pointer"
                style={active ? {
                  backgroundColor: 'var(--viva-primary)',
                  borderColor: 'var(--viva-primary)',
                  color: 'var(--viva-on-primary)'
                } : undefined}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div className="viva-surface p-10 text-center space-y-2">
          <PartyPopper className="w-8 h-8 mx-auto" style={{ color: 'var(--viva-text-muted)' }} />
          <h3 className="viva-heading text-lg font-bold" style={{ color: 'var(--viva-text-main)' }}>
            {events.length === 0 ? 'Aucun événement publié pour le moment' : 'Aucun événement ne correspond à ces critères'}
          </h3>
          <p className="text-xs" style={{ color: 'var(--viva-text-muted)' }}>
            {events.length === 0
              ? realSourceReady
                ? 'Aucun projet publié dans Supabase pour le moment. Les administrateurs peuvent en créer depuis la console.'
                : 'Le catalogue se remplit depuis les projets publiés dans Supabase. La source de données n’est pas joignable pour cette session.'
              : 'Modifiez la recherche ou réinitialisez les filtres.'}
          </p>
          {(category !== 'Toutes' || status !== 'all' || query) && (
            <button
              onClick={() => { setCategory('Toutes'); setStatus('all'); setQuery(''); }}
              className="viva-btn-ghost px-4 py-2 text-xs"
              style={{ color: 'var(--viva-text-main)' }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(event => (
            <article key={event.id} className="viva-card viva-card-hover overflow-hidden flex flex-col">
              <div className="relative">
                <EventArtwork event={event} />
                {(() => {
                  const badge = dateBadge(event.dateISO);
                  if (!badge) return null;
                  return (
                    <div className="absolute left-3 top-3 rounded-2xl bg-white px-2.5 py-1.5 text-center shadow-md">
                      <div className="text-base font-extrabold leading-none text-slate-900">{badge.day}</div>
                      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">{badge.month}</div>
                    </div>
                  );
                })()}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/35 backdrop-blur-sm">
                    {event.category}
                  </span>
                  {isDemo && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-950 bg-amber-300">
                      Démo
                    </span>
                  )}
                </div>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-slate-900">
                  {event.statusLabel}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="space-y-1">
                  <h3 className="viva-heading text-base font-bold leading-snug line-clamp-2" style={{ color: 'var(--viva-text-main)' }}>
                    {event.title}
                  </h3>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--viva-text-muted)' }}>
                    Par {event.organizer}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] mt-auto" style={{ color: 'var(--viva-text-muted)' }}>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" style={{ color: 'var(--viva-primary)' }} />
                    <span>{event.dateLabel}{event.time ? ` • ${event.time}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--viva-primary)' }} />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedId(event.id)}
                  className="mt-1 flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--viva-primary)' }}
                >
                  <span>Voir la fiche</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="viva-surface p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="viva-heading text-sm font-bold" style={{ color: 'var(--viva-text-main)' }}>
            Vous organisez un événement ?
          </h3>
          <p className="text-xs" style={{ color: 'var(--viva-text-muted)' }}>
            Décrivez votre cahier des charges : nos 15 pôles prennent le relais de la conception à la régie.
          </p>
        </div>
        <button onClick={onOpenQuote} className="viva-btn-primary px-5 py-2.5 text-xs">
          <span>Demander un devis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
