import type { Project } from '../types';

/**
 * Catalogue public d'événements.
 *
 * Deux sources, jamais mélangées :
 *  - `projectToPublicEvent` : projets réellement chargés depuis Supabase
 *    (aucune donnée budgétaire ni client exposée) ;
 *  - `DEMO_PUBLIC_EVENTS` : fiches de démonstration déjà utilisées par la
 *    billetterie, explicitement signalées comme telles dans l'interface.
 */

export type EventCategory = 'Sommet' | 'Gala' | 'Forum' | 'Concert' | 'Conférence' | 'Exposition' | 'Autre';

export interface PublicEvent {
  id: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  dateISO: string;
  dateLabel: string;
  time: string;
  location: string;
  organizer: string;
  description: string;
  statusLabel: string;
  statusTone: 'upcoming' | 'active' | 'closed';
  attendees?: number;
  source: 'supabase' | 'demo';
  imageUrl?: string;
  gradient: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, #6D28D9 0%, #EC4899 100%)',
  'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  'linear-gradient(135deg, #DB2777 0%, #F59E0B 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #6D28D9 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
  'linear-gradient(135deg, #B08968 0%, #1F2937 100%)'
];

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function formatDateFr(iso: string): string {
  if (!iso) return 'Date à confirmer';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

export function deriveCategory(...values: string[]): EventCategory {
  const haystack = values.join(' ').toLowerCase();
  if (/sommet|summit|état|etat|institution/.test(haystack)) return 'Sommet';
  if (/gala|prestige|cérémonie|ceremonie|dîner|diner/.test(haystack)) return 'Gala';
  if (/forum|b2b|invest|business|affaires/.test(haystack)) return 'Forum';
  if (/concert|symphon|festival|spectacle/.test(haystack)) return 'Concert';
  if (/conférence|conference|séminaire|seminaire|congrès|congres|atelier/.test(haystack)) return 'Conférence';
  if (/exposition|expo|salon|foire/.test(haystack)) return 'Exposition';
  return 'Autre';
}

const STATUS_LABELS: Record<Project['status'], { label: string; tone: PublicEvent['statusTone'] }> = {
  conception: { label: 'En conception', tone: 'upcoming' },
  retroplanning: { label: 'Rétroplanning', tone: 'upcoming' },
  en_cours: { label: 'En cours', tone: 'active' },
  cloture: { label: 'Clôturé', tone: 'closed' },
  archive: { label: 'Archivé', tone: 'closed' }
};

/** Projet → fiche publique. Les budgets, clients et identifiants internes sont exclus. */
export function projectToPublicEvent(project: Project): PublicEvent {
  const status = STATUS_LABELS[project.status] ?? { label: project.status, tone: 'upcoming' as const };
  return {
    id: `project-${project.code || project.id}`,
    title: project.title,
    subtitle: project.type || 'Événement VIVA Event Solutions',
    category: deriveCategory(project.type, project.title),
    dateISO: project.startDate,
    dateLabel: formatDateFr(project.startDate),
    time: '',
    location: project.location || 'Lieu à confirmer',
    organizer: 'VIVA EVENT SOLUTIONS',
    description: project.description || 'Description non renseignée dans la fiche projet.',
    statusLabel: status.label,
    statusTone: status.tone,
    attendees: project.metrics?.attendeesExpected || undefined,
    source: 'supabase',
    gradient: gradientFor(project.code || project.title)
  };
}

/**
 * Fiches de démonstration (mêmes intitulés que la billetterie existante).
 * Toujours affichées avec le badge « Démonstration ».
 */
export const DEMO_PUBLIC_EVENTS: PublicEvent[] = [
  {
    id: 'evt-01',
    title: 'Sommet Économique & Technologique RDC 2026',
    subtitle: 'Grandes tendances de l’ingénierie & numérique en Afrique Centrale',
    category: 'Sommet',
    dateISO: '2026-10-28',
    dateLabel: '28 octobre 2026',
    time: '09:00 - 18:00',
    location: 'Hôtel Pullman Grand Karavia / Fleuve Congo Hotel, Kinshasa',
    organizer: 'VIVA EVENT SOLUTIONS & Partenaires',
    description: 'Fiche de démonstration utilisée par le module de billetterie : plénières, ateliers et espace d’exposition.',
    statusLabel: 'À venir',
    statusTone: 'upcoming',
    attendees: 600,
    source: 'demo',
    gradient: GRADIENTS[0]
  },
  {
    id: 'evt-02',
    title: 'Gala Prestige & Concert Symphonique VIVA',
    subtitle: 'Célébration des 15 pôles d’excellence & prestation live',
    category: 'Gala',
    dateISO: '2026-11-15',
    dateLabel: '15 novembre 2026',
    time: '18:30 - 23:30',
    location: 'Salle de Congrès Internationale, Gombe, Kinshasa',
    organizer: 'VIVA ENTERTAINMENT',
    description: 'Fiche de démonstration : dîner de gala, programme scénique et protocole VIP.',
    statusLabel: 'À venir',
    statusTone: 'upcoming',
    attendees: 350,
    source: 'demo',
    gradient: GRADIENTS[2]
  },
  {
    id: 'evt-03',
    title: 'Forum des Investisseurs & B2B Matchmaking',
    subtitle: 'Opportunités d’affaires et infrastructures modernes',
    category: 'Forum',
    dateISO: '2026-12-02',
    dateLabel: '2 décembre 2026',
    time: '08:30 - 17:00',
    location: 'Centre Financier de Kinshasa (CFK)',
    organizer: 'VIVA GROUPE RDC',
    description: 'Fiche de démonstration : conférences, rendez-vous B2B et vitrine institutionnelle.',
    statusLabel: 'À venir',
    statusTone: 'upcoming',
    attendees: 420,
    source: 'demo',
    gradient: GRADIENTS[3]
  },
  {
    id: 'evt-04',
    title: 'Convention Annuelle des Partenaires Certifiés',
    subtitle: 'Sept collèges de prestataires réunis autour des standards VIVA',
    category: 'Conférence',
    dateISO: '2027-01-22',
    dateLabel: '22 janvier 2027',
    time: '09:00 - 16:00',
    location: 'Kinshasa, République Démocratique du Congo',
    organizer: 'VIVA EVENT SOLUTIONS',
    description: 'Fiche de démonstration : revue des protocoles, audits qualité et plan de charge annuel.',
    statusLabel: 'À venir',
    statusTone: 'upcoming',
    attendees: 180,
    source: 'demo',
    gradient: GRADIENTS[1]
  }
];
