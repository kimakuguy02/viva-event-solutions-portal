export const FRONTEND_FILE_TREE = `
viva-event-solutions/
├── public/
│   ├── favicon.ico
│   ├── manifest.json              # Configuration PWA
│   ├── icons/                     # Icônes PWA 192x192, 512x512
│   └── sw.js                      # Service Worker (Cache offline & background sync)
├── src/
│   ├── main.tsx                   # Point d'entrée React 18+ / Vite
│   ├── App.tsx                    # Composant racine avec gestionnaire d'état & switch de rôles
│   ├── index.css                  # Tailwind CSS 4 setup avec charte graphique VIVA
│   │
│   ├── types/
│   │   └── index.ts               # Typage TypeScript strict (User, Department, Project, Quote, Partner, Equipment)
│   │
│   ├── context/
│   │   ├── AuthContext.tsx        # Contexte RBAC & basculement instantané Admin/Visiteur
│   │   └── ProjectDataContext.tsx # Contexte de persistance locale & synchronisation cloud
│   │
│   ├── data/
│   │   ├── vivaData.ts            # Données maîtresses (14 Départements, 7 Collèges, Projets, Équipements)
│   │   └── architectureDocs.ts    # Documentation technique (Arborescence, Schéma SQL DDL, API)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Barre de navigation responsive avec sélecteur de langue & contact rapide
│   │   │   ├── Footer.tsx         # Pied de page institutionnel avec mentions légales & OAPI
│   │   │   ├── RoleSwitcherBar.tsx# Barre flottante de basculement dynamique Mode Admin / Visiteur
│   │   │   └── PwaInstallBanner.tsx # Bannière d'installation PWA native
│   │   │
│   │   ├── visitor/               # VUES FRONT-OFFICE (ESPACE VISITEUR)
│   │   │   ├── HeroSection.tsx    # Vitrine d'impact avec vidéo de fond & devises
│   │   │   ├── VisionPillars.tsx  # Les 4 axes stratégiques fondamentaux
│   │   │   ├── DepartmentsCatalog.tsx # Les 14 grands départements détaillés avec filtres & modales
│   │   │   ├── PartnerCollegesView.tsx# Les 7 Collèges de prestataires d'élite & charte SOP
│   │   │   ├── InteractiveQuoteForm.tsx # Simulateur & calculateur de devis multiservices en direct
│   │   │   ├── VirtualEventHub.tsx# Module d'engagement hybride (Live stream, Q&R modérée, Sondages, QR)
│   │   │   ├── EquipmentShowcase.tsx # Galerie du parc matériel lourd (Line Array, LED, Groupes, Chapiteaux)
│   │   │   └── ContactAndMap.tsx  # Coordonnées Kinshasa, formulaires de contact direct & hotline
│   │   │
│   │   ├── admin/                 # VUES BACK-OFFICE (ESPACE ADMINISTRATEUR)
│   │   │   ├── AdminDashboard.tsx # Tableau de bord exécutif avec KPIs, graphes de performance et alertes
│   │   │   ├── ProjectManager.tsx # Pilotage de projets événementiels, rétroplanning & affectations
│   │   │   ├── QuotesManager.tsx  # Traitement des demandes de devis, édition tarifaire & validation
│   │   │   ├── EquipmentInventory.tsx # Gestion des stocks matériel lourd, disponibilité & maintenance
│   │   │   ├── PartnerEcosystem.tsx # Supervision des 7 collèges, notation, audits & contrats OAPI
│   │   │   ├── LiveEventAdmin.tsx # Modération du live stream, questions du public & sondages
│   │   │   └── TechArchitectureViewer.tsx # Visualiseur de l'arborescence, schéma de DB & API specs
│   │   │
│   │   └── ui/                    # COMPOSANTS D'INTERFACE RÉUTILISABLES
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── StatCard.tsx
│   │       └── SearchFilterBar.tsx
`;

export const BACKEND_FILE_TREE = `
server/ (Node.js / Express / TypeScript ou Microservices Go/NestJS)
├── src/
│   ├── server.ts                  # Point d'entrée Express & intégration Vite middleware
│   ├── config/
│   │   ├── database.ts            # Connexion PostgreSQL / Pool Drizzle ORM / Firestore
│   │   ├── redis.ts               # Cache en mémoire & files d'attente pour live streaming
│   │   └── security.ts            # Configuration CORS, Helmet, Rate-Limiting & JWT
│   │
│   ├── middleware/
│   │   ├── authGuard.ts           # Vérification JWT & validation RBAC (Admin, Manager, Partner, Visitor)
│   │   ├── auditLogger.ts         # Traçabilité des actions sensibles (SOP & sécurité)
│   │   └── validateRequest.ts     # Validation des schémas de payload (Zod / Joi)
│   │
│   ├── routes/
│   │   ├── auth.routes.ts         # Login, switch de mode d'aperçu, rafraîchissement de token
│   │   ├── departments.routes.ts  # Consultation et administration des 14 départements
│   │   ├── quotes.routes.ts       # Soumission de devis, calcul automatique, génération PDF
│   │   ├── projects.routes.ts     # CRUD projets, assignation d'équipes & rétroplanning
│   │   ├── inventory.routes.ts    # Gestion du parc technique et réservation de matériel
│   │   ├── partners.routes.ts     # Gestion des 7 collèges, audits de conformité OAPI & contrats
│   │   └── live-events.routes.ts  # WebSockets pour sondages en direct, live Q&R et contrôle d'accès
│   │
│   ├── controllers/
│   │   ├── quoteController.ts     # Moteur de chiffrage intelligent selon les coefficients techniques
│   │   ├── projectController.ts   # Gestion de cycle de vie de projet événementiel
│   │   ├── inventoryController.ts # Algorithme d'allocation de ressources & détection de conflits
│   │   └── partnerController.ts   # Évaluation des prestataires & suivi des protocoles SOP
│   │
│   ├── services/
│   │   ├── pdfService.ts          # Génération automatique de devis et bons de commande PDF
│   │   ├── smsEmailService.ts     # Notifications SMS (Infobip/Twilio) & Email (SendGrid) pour la RDC
│   │   ├── mobileMoneyService.ts  # Passerelle de paiement (M-Pesa, Orange Money, Airtel Money, Visa)
│   │   └── geminiAiService.ts     # Assistant IA d'estimation de dimensionnement événementiel
│   │
│   └── models/                    # Schémas Drizzle ORM ou TypeORM
│       ├── User.ts
│       ├── Role.ts
│       ├── Department.ts
│       ├── Project.ts
│       ├── QuoteRequest.ts
│       ├── Equipment.ts
│       └── Partner.ts
`;

export const DATABASE_SQL_DDL = `
-- ==============================================================================
-- SCHÉMA DE BASE DE DONNÉES RELATIONNELLE : VIVA EVENT SOLUTIONS SARLU (PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONS & TYPES ENUMÉRÉS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM ('super_admin', 'project_manager', 'logistics_lead', 'partner_evaluator', 'visitor_client');
CREATE TYPE quote_status_enum AS ENUM ('submitted', 'under_review', 'quote_issued', 'approved', 'rejected');
CREATE TYPE project_status_enum AS ENUM ('conception', 'retroplanning', 'en_cours', 'cloture', 'archive');
CREATE TYPE security_level_enum AS ENUM ('standard', 'renforce', 'haut_niveau');
CREATE TYPE equipment_condition_enum AS ENUM ('excellent', 'bon', 'en_maintenance');
CREATE TYPE partner_status_enum AS ENUM ('certified', 'pending_audit', 'renewal_needed');

-- 2. TABLE DES UTILISATEURS & RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50),
    organization_name VARCHAR(200),
    role user_role_enum DEFAULT 'visitor_client' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. TABLE DES 14 DÉPARTEMENTS STRATÉGIQUES
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    key_equipment_specs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. TABLE DES 7 COLLÈGES DE PARTENAIRES PRESTATAIRES
CREATE TABLE partner_colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    sop_protocols JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. TABLE DES PRESTATAIRES ET PARTENAIRES AGRÉÉS
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id INT REFERENCES partner_colleges(id) ON DELETE RESTRICT,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100) DEFAULT 'Kinshasa',
    country VARCHAR(100) DEFAULT 'RDC',
    rating NUMERIC(2,1) DEFAULT 5.0,
    status partner_status_enum DEFAULT 'certified' NOT NULL,
    oapi_compliant BOOLEAN DEFAULT TRUE,
    confidentiality_agreement_signed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. TABLE DES DEMANDES DE DEVIS & GUICHET UNIQUE
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(150) NOT NULL,
    client_organization VARCHAR(200),
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    estimated_attendees INT NOT NULL,
    selected_department_ids INT[] NOT NULL,
    technical_options JSONB NOT NULL,
    custom_notes TEXT,
    estimated_budget_usd NUMERIC(12,2),
    status quote_status_enum DEFAULT 'submitted' NOT NULL,
    priority VARCHAR(20) DEFAULT 'normale',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. TABLE DES PROJETS ÉVÉNEMENTIELS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    client VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    budget_usd NUMERIC(12,2) NOT NULL,
    progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    status project_status_enum DEFAULT 'conception' NOT NULL,
    departments_assigned INT[] NOT NULL,
    lead_manager VARCHAR(150) NOT NULL,
    vip_protocol_required BOOLEAN DEFAULT FALSE,
    security_clearance security_level_enum DEFAULT 'standard',
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. TABLE DU PARC MATÉRIEL TECHNIQUE ET SCÉNIQUE LOURD
CREATE TABLE equipment_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    quantity_total INT NOT NULL,
    quantity_available INT NOT NULL,
    condition equipment_condition_enum DEFAULT 'excellent',
    power_rating_kw NUMERIC(6,2),
    specs TEXT NOT NULL,
    location_storage VARCHAR(150) NOT NULL,
    daily_rate_usd NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- INDEXATION POUR PERFORMANCES DE RECHERCHE
CREATE INDEX idx_quotes_status ON quote_requests(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_partners_college ON partners(college_id);
CREATE INDEX idx_equipment_dept ON equipment_inventory(department_id);
`;
