import React, { useState } from 'react';
import { FRONTEND_FILE_TREE, BACKEND_FILE_TREE, DATABASE_SQL_DDL } from '../../data/architectureDocs';
import {
  Code2,
  Database,
  FolderTree,
  Shield,
  Layers,
  FileCode,
  Copy,
  Check,
  Server,
  Smartphone
} from 'lucide-react';

export const TechArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tree' | 'db' | 'rbac' | 'role-switch'>('tree');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Spécifications & Architecture Logicielle
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Arborescence complète (Frontend & Backend), schéma de base de données PostgreSQL DDL, matrice RBAC et basculement dynamique
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
            Livrables Techniques Officiels
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tree'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Arborescence des Dossiers (Frontend / Backend)</span>
        </button>

        <button
          onClick={() => setActiveTab('db')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'db'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Schéma Base de Données (PostgreSQL DDL)</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rbac'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Matrice des Rôles (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('role-switch')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'role-switch'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Code du Switcher Dynamique</span>
        </button>
      </div>

      {/* Tab 1: Folder Tree */}
      {activeTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frontend Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Arborescence Frontend & PWA (React / Vite)</h3>
              </div>
              <button
                onClick={() => copyToClipboard(FRONTEND_FILE_TREE, 'frontend_tree')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                {copiedKey === 'frontend_tree' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-[500px]">
              {FRONTEND_FILE_TREE.trim()}
            </pre>
          </div>

          {/* Backend Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Arborescence Backend & APIs (Express / Node.js)</h3>
              </div>
              <button
                onClick={() => copyToClipboard(BACKEND_FILE_TREE, 'backend_tree')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                {copiedKey === 'backend_tree' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-purple-300 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-[500px]">
              {BACKEND_FILE_TREE.trim()}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Database Schemas SQL DDL */}
      {activeTab === 'db' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Schéma Relationnel SQL DDL (PostgreSQL)</h3>
                <p className="text-xs text-slate-400">8 tables maîtresses avec clés primaires UUID, types énumérés et contraintes d'intégrité</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(DATABASE_SQL_DDL, 'sql_ddl')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              {copiedKey === 'sql_ddl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>Copier le Script SQL</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-amber-200 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-[550px]">
            {DATABASE_SQL_DDL.trim()}
          </pre>
        </div>
      )}

      {/* Tab 3: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            Matrice des Rôles & Permissions (RBAC)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-3">Module / Fonctionnalité</th>
                  <th className="p-3">Visiteur / Client Public</th>
                  <th className="p-3">Chef de Projet</th>
                  <th className="p-3">Responsable Logistique</th>
                  <th className="p-3">Super Administrateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-white">Vitrine Institutionnelle & 14 Pôles</td>
                  <td className="p-3 text-emerald-400 font-bold">Lecture Seule</td>
                  <td className="p-3 text-emerald-400 font-bold">Lecture Seule</td>
                  <td className="p-3 text-emerald-400 font-bold">Lecture Seule</td>
                  <td className="p-3 text-emerald-400 font-bold">Lecture & Édition</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Simulateur & Soumission de Devis</td>
                  <td className="p-3 text-emerald-400 font-bold">Création Devis</td>
                  <td className="p-3 text-emerald-400 font-bold">Chiffrage & Édition</td>
                  <td className="p-3 text-slate-500">Lecture Stocks</td>
                  <td className="p-3 text-emerald-400 font-bold">Approbation & Signature</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Pilotage de Projets & Rétroplanning</td>
                  <td className="p-3 text-slate-500">Non Accessible</td>
                  <td className="p-3 text-emerald-400 font-bold">Gestion Complète</td>
                  <td className="p-3 text-blue-400">Affectation Matériel</td>
                  <td className="p-3 text-emerald-400 font-bold">Supervision Totale</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Parc Matériel Lourd & Énergie</td>
                  <td className="p-3 text-slate-400">Consultation Disponibilité</td>
                  <td className="p-3 text-blue-400">Réservation Sommets</td>
                  <td className="p-3 text-emerald-400 font-bold">Gestion Stock & Entrepôts</td>
                  <td className="p-3 text-emerald-400 font-bold">Gestion Achat/Cession</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Écosystème 7 Collèges & SOP</td>
                  <td className="p-3 text-slate-400">Consultation Collèges</td>
                  <td className="p-3 text-blue-400">Mobilisation Prestataires</td>
                  <td className="p-3 text-blue-400">Suivi Logistique</td>
                  <td className="p-3 text-emerald-400 font-bold">Audits, OAPI & Contrats</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Bascule Rapide Mode Visiteur / Admin</td>
                  <td className="p-3 text-slate-500">Non Actif</td>
                  <td className="p-3 text-emerald-400 font-bold">Aperçu Client</td>
                  <td className="p-3 text-emerald-400 font-bold">Aperçu Client</td>
                  <td className="p-3 text-amber-400 font-bold">Switch Instantané 1-Clic</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Dynamic Role Switcher Code */}
      {activeTab === 'role-switch' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Implémentation du Switch Dynamique (React / TypeScript)</h3>
              <p className="text-xs text-slate-400">Extrait du gestionnaire d'état AuthContext & Barre d'outils flottante</p>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-[500px]">
{`// Extrait du composant RoleSwitcherBar & AuthContext (VIVA EVENT SOLUTIONS)
export const RoleSwitcherBar = () => {
  const { currentUser, isSimulatingVisitor, isAdmin, toggleVisitorMode } = useAuth();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <button 
        onClick={toggleVisitorMode}
        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center gap-2"
      >
        {isAdmin ? (
          <>
            <Eye className="w-4 h-4" />
            <span>Basculer en Mode Visiteur (Front-Office)</span>
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            <span>Basculer en Mode Administrateur (Back-Office)</span>
          </>
        )}
      </button>
    </div>
  );
};`}
          </pre>
        </div>
      )}
    </div>
  );
};
