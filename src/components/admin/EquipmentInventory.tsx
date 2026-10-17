import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { EquipmentItem } from '../../types';
import {
  Truck,
  Zap,
  Volume2,
  Tv,
  Building,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Plus
} from 'lucide-react';

export const EquipmentInventory: React.FC = () => {
  const { equipment, updateEquipmentStock, projects } = useProjectData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Affectations projet — SESSION uniquement (table dédiée : R4-08). Le stock
  // affiché reste celui du contexte ; l'affectation est indicative, jamais
  // décrémentée automatiquement.
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specs.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;
    return matchesSearch && item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Gestion du Parc Matériel & Logistique Lourde
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervision des stocks propres, maintenance préventive et allocation aux sommets
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <span>Valeur globale du parc :</span>
          <span className="font-black text-amber-400">$4.8M USD</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['all', 'audio', 'led_screens', 'power_generators', 'tents', 'broadcast'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'Tout le Parc' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filtrer équipement..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Inventory Table / Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEquipment.map(item => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-amber-400">{item.code}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">{item.category}</span>
                <span className="text-slate-600">•</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  item.condition === 'excellent' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {item.condition}
                </span>
              </div>
              <h4 className="text-base font-bold text-white">{item.name}</h4>
              <p className="text-xs text-slate-400">{item.specs}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Entrepôt : {item.locationStorage} {item.powerRatingKW ? `• Puissance : ${item.powerRatingKW} kW` : ''}
              </p>
              {assignments[item.id] ? (
                <p className="text-[11px] font-bold text-blue-300">
                  Affecté : {projects.find(p => p.code === assignments[item.id])?.title ?? assignments[item.id]}
                  <button onClick={() => setAssignments(prev => { const n = { ...prev }; delete n[item.id]; return n; })} className="ml-2 text-slate-500 hover:text-rose-400 underline cursor-pointer">retirer</button>
                </p>
              ) : (
                <div className="pt-1">
                  {assignFor === item.id ? (
                    <select
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) setAssignments(prev => ({ ...prev, [item.id]: e.target.value }));
                        setAssignFor(null);
                      }}
                      className="text-[11px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white max-w-[16rem]"
                    >
                      <option value="">Choisir un projet…</option>
                      {projects.map(p => <option key={p.id} value={p.code}>{p.code} — {p.title}</option>)}
                    </select>
                  ) : (
                    <button onClick={() => setAssignFor(item.id)} className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer">
                      Affecter à un projet (session — R4-08)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick stock adjust controls */}
            <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Total Parc</span>
                <span className="text-base font-bold text-slate-300">{item.quantityTotal}</span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Disponibles</span>
                <span className="text-lg font-black text-amber-400">{item.quantityAvailable}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={item.quantityAvailable <= 0}
                  onClick={() => updateEquipmentStock(item.id, Math.max(0, item.quantityAvailable - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold flex items-center justify-center text-sm"
                >
                  -
                </button>
                <button
                  disabled={item.quantityAvailable >= item.quantityTotal}
                  onClick={() => updateEquipmentStock(item.id, Math.min(item.quantityTotal, item.quantityAvailable + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>

              <div className="text-right pl-3 border-l border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Tarif/j</span>
                <span className="text-sm font-bold text-white">${item.dailyRateUSD}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
