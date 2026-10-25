import { Department, PartnerCollege, Partner, EquipmentItem } from '../types';
import { POLES_15_OFFICIAL_DATA } from './platformConfig';

export const VIVA_COMPANY_INFO = {
  name: "VIVA EVENT SOLUTIONS SARLU",
  legalForm: "Société à Responsabilité Limitée Unipersonnelle",
  registeredLaw: "Société de droit congolais (RDC)",
  headline: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale",
  subheadline: "Conception scénographique, régie technique 4K et déploiement logistique d'envergure pour sommets d'État, grandes entreprises et institutions internationales.",
  motto: "L'Ingénierie Événementielle Globale de Haute Précision en RDC & Afrique Centrale",
  positioning: "Guichet unique global (one-stop-shop) pour l'ingénierie événementielle, la communication stratégique et les prestations multiservices de haute précision en RDC et Afrique Centrale.",
  address: "Kinshasa / Gombe, République Démocratique du Congo",
  email: "contact@viva-eventsolutions.cd",
  phone: "+243 963 216 780 / +243 855 929 308",
  oapiReference: "OAPI / RCCM : CD/KIN/RCCM/24-B-01492 - ID Nat : 01-G4701-N44921"
};

export const STRATEGIC_PILLARS = [
  {
    number: "01",
    title: "Excellence Opérationnelle et Sécuritaire",
    description: "Planification et direction de projets événementiels de haute complexité en appliquant les protocoles les plus stricts en matière de sécurité du public, gestion des risques et respect rigoureux des cahiers des charges.",
    badge: "Sûreté & Rigueur ERP",
    icon: "ShieldCheck"
  },
  {
    number: "02",
    title: "Innovation Technologique & Event Tech",
    description: "Démocratisation des technologies immersives, des plateformes hybrides interactives, des régies de retransmission 4K en direct, billetterie connectée et analytics prédictifs post-événement.",
    badge: "Hybride & Data Analytics",
    icon: "Cpu"
  },
  {
    number: "03",
    title: "Autonomie Logistique & Intégration Verticale",
    description: "Parcs matériels propres de haute puissance (Line Array, chapiteaux modulaires, groupes insonorisés, écrans LED géants) et pôle de commerce direct pour s'affranchir des aléas locaux.",
    badge: "Parc Propre & Zéro Intermédiaire",
    icon: "Truck"
  },
  {
    number: "04",
    title: "Ancrage Territorial & Développement Durable",
    description: "Professionnalisation des talents en RDC, éco-conception événementielle, gestion raisonnée des déchets, bilan carbone maîtrisé et partenariats régionaux à fort impact.",
    badge: "RDC & Éco-Conception",
    icon: "Leaf"
  }
];

export const DEPARTMENTS_DATA: Department[] = POLES_15_OFFICIAL_DATA;

export const PARTNER_COLLEGES_DATA: PartnerCollege[] = [
  {
    id: 1,
    name: "Collège des Fournisseurs Technologiques & Fabricants Internationaux",
    code: "COL-TECH-FAB",
    description: "Accords de distribution préférentielle et partenariats directs avec les manufacturiers mondiaux pour l'accès prioritaire aux dernières innovations Event Tech et équipements lourds de pointe.",
    iconName: "Cpu",
    keyResponsibilities: [
      "Approvisionnement prioritaire en matériel scénique de dernière génération",
      "Support technique direct des ingénieurs constructeurs",
      "Maintenance préventive et calibration certifiée usine",
      "Garantie de pièces de rechange d'origine sous 48h"
    ],
    sopCriteria: [
      "Certifications CE, FCC et TÜV obligatoires",
      "Disponibilité d'un stock tampon sous 24h",
      "Formation continue dispensée aux équipes VIVA"
    ],
    memberCount: 14,
    status: "active"
  },
  {
    id: 2,
    name: "Collège des Spécialistes du Numérique, de l'Ingénierie Web & de la Digitalisation",
    code: "COL-NUM-DIGIT",
    description: "Réseau d'ingénieurs logiciels, développeurs d'applications mobiles, architectes cloud et spécialistes en cybersécurité pour des portails interactifs, billetteries et analytics sécurisés.",
    iconName: "Globe",
    keyResponsibilities: [
      "Développement de plateformes d'engagement et billetteries numériques",
      "Garantie de haute disponibilité serveur (SLA 99.99%)",
      "Sécurité des paiements Mobile Money et bancaires conformes PCI-DSS",
      "Extraction et restitution des analyses de données post-événement"
    ],
    sopCriteria: [
      "Chiffrement AES-256 et conformité RGPD / lois congolaises",
      "Tests de charge jusqu'à 100 000 requêtes/seconde",
      "Support d'astreinte 24/7 durant les jours J"
    ],
    memberCount: 8,
    status: "active"
  },
  {
    id: 3,
    name: "Collège des Acteurs de l'Hôtellerie, de l'Hébergement & de la Location de Véhicules",
    code: "COL-HOTEL-MOB",
    description: "Conventions directes et tarifs négociés avec les structures hôtelières 4 et 5 étoiles de référence et les flottes de prestige pour assurer un confort maximal aux délégations.",
    iconName: "Building2",
    keyResponsibilities: [
      "Mise à disposition de contingents de chambres VIP bloquées à l'avance",
      "Tarifs négociés 'grand compte' garantis",
      "Parcs automobiles récents, entretenus et climatisés",
      "Chauffeurs bilingues formés à la conduite diplomatique"
    ],
    sopCriteria: [
      "Standard hôtelier 4* minimum certifié",
      "Contrôle technique des véhicules de moins de 3 mois",
      "Assurance tous risques passagers illimitée"
    ],
    memberCount: 18,
    status: "active"
  },
  {
    id: 4,
    name: "Collège des Experts Linguistiques & Protocolaires",
    code: "COL-LING-PROT",
    description: "Réseau exclusif d'interprètes assermentés de haut niveau (AIIC) et de conseillers en protocole d'État assurant le strict respect des usages diplomatiques lors des sommets.",
    iconName: "Languages",
    keyResponsibilities: [
      "Interprétation simultanée de haut vol pour chefs d'État et ministres",
      "Conseil sur l'ordre de préséance et le placement protocolaire",
      "Traduction certifiée des traités et discours officiels",
      "Accompagnement linguistique personnalisé des délégations étrangères"
    ],
    sopCriteria: [
      "Agrément AIIC ou assermentation auprès des cours d'appel",
      "Minimum 8 ans d'expérience en sommets internationaux",
      "Signature d'engagement de stricte neutralité et confidentialité"
    ],
    memberCount: 22,
    status: "active"
  },
  {
    id: 5,
    name: "Collège des Spécialistes de la Sûreté & de la Sécurité Publique",
    code: "COL-SURETE-SEC",
    description: "Alliances opérationnelles avec des sociétés de sécurité privée agréées et coordination étroite avec les services publics pour la gestion des foules et la protection rapprochée.",
    iconName: "ShieldAlert",
    keyResponsibilities: [
      "Élaboration des plans de sécurité et d'évacuation d'urgence",
      "Déploiement d'agents cynophiles, portiques et vigiles qualifiés",
      "Coordination directe avec la Police Nationale Congolaise et les services d'urgence",
      "Escortes armées et protection rapprochée discrète"
    ],
    sopCriteria: [
      "Agrément du Ministère de l'Intérieur et de la Sécurité",
      "Agents formés aux premiers secours et au maniement des extincteurs",
      "Matériel de détection étalonné hebdomadairement"
    ],
    memberCount: 6,
    status: "active"
  },
  {
    id: 6,
    name: "Collège des Artisans de la Scénographie & des Matières Éphémères",
    code: "COL-SCENO-ART",
    description: "Partenariats avec des ateliers spécialisés (menuiserie, métallerie, décoration florale) sélectionnés pour leur réactivité, créativité et stricte conformité aux normes ERP.",
    iconName: "Hammer",
    keyResponsibilities: [
      "Fabrication rapide de décors sur-mesure et mobiliers d'exposition",
      "Structures scéniques métalliques et bois éco-certifiées",
      "Créations florales fraîches de haute tenue esthétique",
      "Montage et démontage express sans détérioration des sites récepteurs"
    ],
    sopCriteria: [
      "Utilisation exclusive de matériaux ignifugés M1 avec certificats",
      "Respect strict des plans d'exécution et calculs de charge statique",
      "Politique de recyclage des matières premières post-événement"
    ],
    memberCount: 16,
    status: "active"
  },
  {
    id: 7,
    name: "Collège des Acteurs Divers & Prestataires Complémentaires",
    code: "COL-COMPLEM-DIVERS",
    description: "Écosystème stratégique fédérant secourisme médical, techniciens d'urgence, créateurs de cadeaux d'affaires sur-mesure, artisans locaux et conciergerie transversale.",
    iconName: "Sparkle",
    keyResponsibilities: [
      "Poste médical d'urgence et ambulances de réanimation sur site",
      "Fourniture de cadeaux d'affaires et coffrets de prestige personnalisés",
      "Intervention technique d'urgence 24/7 (plomberie, électricité, serrurerie scénique)",
      "Promotion des artisans d'art et du patrimoine culturel congolais"
    ],
    sopCriteria: [
      "Délai d'intervention sur site inférieur à 15 minutes en cas d'urgence",
      "Contrôle qualité systématique sur les cadeaux d'affaires",
      "Personnel médical diplômé et équipé de défibrillateurs mobiles"
    ],
    memberCount: 20,
    status: "active"
  }
];

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: "part-01",
    name: "Acoustics & Lumina International",
    collegeId: 1,
    contactPerson: "Marc Vanderberg",
    email: "m.vanderberg@acoustics-lumina.com",
    phone: "+33 1 45 88 90 00",
    city: "Paris / Kinshasa",
    country: "France / RDC",
    rating: 4.9,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 6,
    specialty: "Fabrication & calibrage de systèmes Line Array L-Acoustics"
  },
  {
    id: "part-02",
    name: "Kinshasa Cloud & Cyber Technologies",
    collegeId: 2,
    contactPerson: "Dr. Patrick Mukendi",
    email: "contact@kincloud-tech.cd",
    phone: "+243 81 555 4321",
    city: "Kinshasa",
    country: "RDC",
    rating: 4.8,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 4,
    specialty: "Architecture Cloud, streaming 4K & sécurité des flux de billetterie"
  },
  {
    id: "part-03",
    name: "Grand Hotel & VIP Fleet Congo",
    collegeId: 3,
    contactPerson: "Hélène de Saint-Germain",
    email: "direction@vipfleet-congo.cd",
    phone: "+243 89 777 8899",
    city: "Kinshasa / Gombe",
    country: "RDC",
    rating: 5.0,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 9,
    specialty: "Suites présidentielles & escorte de berlines de luxe avec chauffeurs d'État"
  },
  {
    id: "part-04",
    name: "Bureau Panafricain des Interprètes Diplomatiques (BPID)",
    collegeId: 4,
    contactPerson: "Mme Clarisse Ngalula",
    email: "c.ngalula@bpid-congo.org",
    phone: "+243 82 444 1122",
    city: "Kinshasa",
    country: "RDC",
    rating: 4.9,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 7,
    specialty: "Interprétation simultanée de sommets présidentiels & traduction certifiée"
  },
  {
    id: "part-05",
    name: "Bouclier Central Sûreté & Protection",
    collegeId: 5,
    contactPerson: "Capitaine (R) Serge Kabeya",
    email: "direction@bouclier-surete.cd",
    phone: "+243 81 999 0011",
    city: "Kinshasa",
    country: "RDC",
    rating: 4.9,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 8,
    specialty: "Protection rapprochée VIP, portiques électroniques & crowd control"
  },
  {
    id: "part-06",
    name: "Ateliers Scéniques du Fleuve",
    collegeId: 6,
    contactPerson: "Joseph Mutombo",
    email: "contact@ateliersdufleuve.cd",
    phone: "+243 84 222 3344",
    city: "Kinshasa",
    country: "RDC",
    rating: 4.7,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 5,
    specialty: "Menuiserie scénique d'art, structures aluminium & toiles ignifugées M1"
  },
  {
    id: "part-07",
    name: "Urgences Médicales Événementielles & Protocoles",
    collegeId: 7,
    contactPerson: "Dr. Sandrine Tshisekedi",
    email: "urgences@med-event.cd",
    phone: "+243 81 333 7788",
    city: "Kinshasa",
    country: "RDC",
    rating: 5.0,
    status: "certified",
    oapiCompliant: true,
    confidentialitySigned: true,
    activeContractsCount: 11,
    specialty: "Postes médicaux avancés, ambulances de réanimation & conciergerie d'urgence"
  }
];

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: "eq-01",
    code: "AUD-LA-01",
    name: "Système Sonorisation Line Array L-Acoustics K2 (Pack 24 Boîtes + 16 Sub KS28)",
    category: "audio",
    departmentId: 7,
    quantityTotal: 4,
    quantityAvailable: 2,
    condition: "excellent",
    powerRatingKW: 45,
    specs: "Diffusion sonore concert 40 000 personnes, amplification LA12X en réseau Dante",
    locationStorage: "Entrepôt Central Limete / Hub A",
    dailyRateUSD: 4500
  },
  {
    id: "eq-02",
    code: "LED-DISP-02",
    name: "Mur d'Écrans Géants LED P2.6 Plein Jour Haute Luminosité (120 m²)",
    category: "led_screens",
    departmentId: 7,
    quantityTotal: 300,
    quantityAvailable: 180,
    condition: "excellent",
    powerRatingKW: 60,
    specs: "6500 nits, dalles aluminium 500x500mm, processeurs Novastar 4K UHD",
    locationStorage: "Entrepôt Central Limete / Hub B",
    dailyRateUSD: 3800
  },
  {
    id: "eq-03",
    code: "GEN-500-03",
    name: "Groupe Électrogène Insonorisé Cummins Power 550 kVA (Zéro Coupure)",
    category: "power_generators",
    departmentId: 7,
    quantityTotal: 6,
    quantityAvailable: 4,
    condition: "excellent",
    powerRatingKW: 440,
    specs: "Insonorisation 68 dB(A) à 7m, inverseur de source automatique ATS, autonomie 24h",
    locationStorage: "Parc Énergie Kingabwa",
    dailyRateUSD: 1600
  },
  {
    id: "eq-04",
    code: "TNT-ALU-04",
    name: "Chapiteau Modulaire Prestige Aluminium Portée 30m x 60m (1 800 m²)",
    category: "tents",
    departmentId: 7,
    quantityTotal: 8,
    quantityAvailable: 5,
    condition: "bon",
    specs: "Toile PVC ignifugée M2, cloisons vitrées panoramiques et plancher bois lourd",
    locationStorage: "Parc Éphémère N'djili",
    dailyRateUSD: 5200
  },
  {
    id: "eq-05",
    code: "TRAD-BOSCH-05",
    name: "Système de Traduction Simultanée Bosch Integrus DCN 8 Canaux (500 Récepteurs)",
    category: "broadcast",
    departmentId: 11,
    quantityTotal: 10,
    quantityAvailable: 7,
    condition: "excellent",
    powerRatingKW: 3,
    specs: "Émetteurs infrarouges haute fidélité, cabines insonorisées certifiées ISO 4043",
    locationStorage: "Hub Conférence Gombe",
    dailyRateUSD: 2200
  },
  {
    id: "eq-06",
    code: "CAM-4K-06",
    name: "Régie de Captation Mobile 4K HDR Sony FX9 Multi-Caméras (4 Postes + Grue)",
    category: "broadcast",
    departmentId: 13,
    quantityTotal: 3,
    quantityAvailable: 2,
    condition: "excellent",
    powerRatingKW: 12,
    specs: "Mélangeur Blackmagic ATEM Constellation 4K, transmission vidéo HF sans fil Teradek",
    locationStorage: "Studio Audiovisuel Gombe",
    dailyRateUSD: 2800
  }
];
