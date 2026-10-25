
// Taux de change officiel RDC standardisé
export const USD_TO_CDF_RATE = 2850;

// Seuil de double signature anti-fraude
export const DOUBLE_SIGNATURE_THRESHOLD_USD = 100;
export const DOUBLE_SIGNATURE_THRESHOLD_CDF = 285000;
export interface EnterpriseDirection {
  code: string;
  name: string;
  managerName: string;
  headcount: number;
  description: string;
}

export const VIVA_ENTERPRISE_ORGANIGRAM: EnterpriseDirection[] = [
  {
    code: "DIR-01",
    name: "01. Direction Générale & Stratégie",
    managerName: "MALTHUS KILUMBA WA BANZA (DG / Gérant)",
    headcount: 3,
    description: "Pilotage stratégique, investissements capitaux, relations institutionnelles et partenariats d'État."
  },
  {
    code: "DIR-02",
    name: "02. Administration & Ressources Humaines",
    managerName: "MALTHUS KILUMBA WA BANZA (Directeur Général & Administrateur)",
    headcount: 4,
    description: "Gestion des contrats, conformité légale, fiches de poste, sécurité du travail et paie."
  },
  {
    code: "DIR-03",
    name: "03. Direction Financière & Comptabilité SYSCOHADA",
    managerName: "COMPTABLE (Comptable Agréé / DAF)",
    headcount: 3,
    description: "Comptabilité bi-devise USD/CDF, double signature des décaissements, clôtures de caisse et audit fiscal."
  },
  {
    code: "DIR-04",
    name: "04. Juridique, Conformité & Marchés Publics",
    managerName: "Me Christian TSHILUMBA (Conseiller Juridique)",
    headcount: 2,
    description: "Appels d'offres publics, rédaction des conventions de partenariat, propriété intellectuelle et contrats."
  },
  {
    code: "DIR-05",
    name: "05. Marketing, Marque & Communication",
    managerName: "Carine MBAYO (Directrice Communication)",
    headcount: 5,
    description: "Identité de marque VIVA, diffusion multimédia, relations presse et campagnes événementielles."
  },
  {
    code: "DIR-06",
    name: "06. Régie Technique, Énergie & Scénographie",
    managerName: "Ing. Serge ILUNGA (Chef d'Équipe Régie)",
    headcount: 12,
    description: "Sonorisation Line Array, régie LED 4K, distribution électrique autonome, scénographie 3D et Starlink."
  },
  {
    code: "DIR-07",
    name: "07. Logistique, Transport & Stockage",
    managerName: "Alain BUKASA (Responsable Logistique)",
    headcount: 8,
    description: "Flotte de transport lourd, gestion des entrepôts de Limete, maintenance préventive et traçabilité."
  },
  {
    code: "DIR-08",
    name: "08. Direction Commerciale & Relations Clients",
    managerName: "Sarah KALONJI (Responsable Commerciale)",
    headcount: 4,
    description: "CRM grands comptes, prospection entreprises, simulation de devis et fidélisation clients."
  },
  {
    code: "DIR-09",
    name: "09. Restauration, Protocole VIP & Hôtellerie",
    managerName: "Gisèle NGOIE (Responsable Accueil & Protocole)",
    headcount: 10,
    description: "Banquets officiels, accueil protocolaire des délégations présidentielles, hôtellerie et conciergerie VIP."
  }
];
