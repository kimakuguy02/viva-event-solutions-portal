import { useEffect } from 'react';

/* Métadonnées document par onglet (titre + description) — réel et immédiat :
   écrit dans document.head à chaque navigation. Le SEO éditorial complet
   (sitemap, canonical, OG dynamiques) reste à brancher (R2-20). */

const META: Record<string, { title: string; description: string }> = {
  home: {
    title: 'VIVA EVENT SOLUTIONS — Ingénierie événementielle RDC & Afrique Centrale',
    description: 'Conception, production et logistique événementielle de haute précision à Kinshasa et en Afrique Centrale.',
  },
  'welcome-about': { title: 'À propos — VIVA EVENT SOLUTIONS', description: 'Présentation officielle, vision et valeurs de VIVA EVENT SOLUTIONS SARLU.' },
  departments: { title: 'Nos 15 pôles — VIVA EVENT SOLUTIONS', description: 'Scénographie, son, LED, énergie, protocole, traduction et plus.' },
  partners: { title: 'Partenaires — VIVA EVENT SOLUTIONS', description: '7 collèges de prestataires certifiés.' },
  equipment: { title: 'Parc matériel — VIVA EVENT SOLUTIONS', description: 'Inventaire technique : son, lumière, LED, énergie.' },
  'live-hub': { title: 'Hub Live — VIVA EVENT SOLUTIONS', description: 'Événements hybrides, streaming et participation en direct.' },
  announcements: { title: 'Annonces — VIVA EVENT SOLUTIONS', description: 'Actualités et communiqués officiels.' },
  ticketing: { title: 'Billetterie — VIVA EVENT SOLUTIONS', description: 'Billets et pass pour les événements VIVA.' },
  voting: { title: 'Votes — VIVA EVENT SOLUTIONS', description: 'Sondages et votes en direct.' },
  'quote-simulator': { title: 'Demander un devis — VIVA EVENT SOLUTIONS', description: 'Simulez et demandez votre devis officiel en ligne.' },
  erp: { title: 'Portail interne — VIVA EVENT SOLUTIONS', description: 'Outils de gestion réservés au personnel : projets, ERP et pilotage interne.' },
};

export function usePageMeta(tab: string) {
  useEffect(() => {
    const meta = META[tab] ?? META.home;
    document.title = meta.title;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', meta.description);
  }, [tab]);
}
