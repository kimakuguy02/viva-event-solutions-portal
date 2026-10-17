import React, { useEffect, useState } from 'react';
import { syncService, SyncStatus } from '../../services/syncService';
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [pendingCount, setPendingCount] = useState<number>(syncService.getPendingCount());
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [showStatusDetails, setShowStatusDetails] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await syncService.flushQueue();
    setTimeout(() => setIsManualSyncing(false), 800);
  };

  const getStatusBadge = () => {
    switch (syncStatus) {
      case 'offline':
        return {
          label: 'Hors ligne',
          icon: <WifiOff className="w-3.5 h-3.5 animate-pulse" />,
          bgColor: 'bg-amber-600',
          textColor: 'text-slate-950',
          description: 'Connexion réseau coupée. Opérations conservées en file IndexedDB (cache + queue, jamais source de vérité). Conflits : dernière écriture gagne (transitoire — R4-28/R4-30).'
        };
      case 'syncing':
        return {
          label: 'Synchronisation',
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
          bgColor: 'bg-blue-600',
          textColor: 'text-white',
          description: `Transmission des écritures vers la base centrale VIVA... (${pendingCount} en attente)`
        };
      case 'synced':
        return {
          label: 'Synchronisé',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          bgColor: 'bg-emerald-700',
          textColor: 'text-white',
          description: 'Toutes les données locales sont alignées avec le serveur central.'
        };
      case 'error':
        return {
          label: 'Erreur de synchronisation',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          bgColor: 'bg-rose-600',
          textColor: 'text-white',
          description: 'Échec de transmission avec la base centrale. Nouvel essai automatique en cours. File conservée, aucune donnée perdue ni validée.'
        };
      case 'online':
      default:
        return {
          label: 'En ligne',
          icon: <Wifi className="w-3.5 h-3.5 text-emerald-400" />,
          bgColor: 'bg-slate-900 border-b border-emerald-500/30',
          textColor: 'text-slate-300',
          description: 'Connecté en temps réel à la base centrale VIVA EVENT SOLUTIONS.'
        };
    }
  };

  const currentBadge = getStatusBadge();

  // If online and fully synced with no errors and 0 pending, show discreet status strip or minimal indicator
  if (syncStatus === 'online' && pendingCount === 0 && !showStatusDetails) {
    return (
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            En ligne
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-slate-400">Base Centrale Connectée (Sync Auto)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusDetails(true)}
            className="hover:text-amber-400 transition-colors cursor-pointer text-[10px] font-mono underline"
          >
            Détails synchronisation
          </button>
          <button
            onClick={handleManualSync}
            disabled={isManualSyncing}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
            title="Forcer la synchronisation avec le serveur central"
          >
            <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>Synchroniser</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${currentBadge.bgColor} ${currentBadge.textColor} px-4 py-2 shadow-md flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold transition-all z-40`}>
      <div className="flex items-center gap-2 max-w-4xl">
        <div className="p-1 rounded-md bg-slate-950 text-amber-400 shrink-0">
          {currentBadge.icon}
        </div>
        <div>
          <span className="font-black uppercase tracking-wider">État : {currentBadge.label}</span>
          {pendingCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-amber-300 font-mono text-[10px]">
              {pendingCount} opération{pendingCount > 1 ? 's' : ''} en attente
            </span>
          )}
          <span className="ml-2 font-normal opacity-95 text-xs hidden sm:inline">
            {currentBadge.description}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 mt-1 sm:mt-0">
        <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-black/20 px-2 py-0.5 rounded font-mono">
          <Database className="w-3 h-3" /> IndexedDB Cache & Queue
        </span>
        <button
          onClick={handleManualSync}
          disabled={isManualSyncing}
          className="px-2.5 py-1 rounded bg-slate-950 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
          <span>Synchroniser Maintenant</span>
        </button>
        {showStatusDetails && (
          <button
            onClick={() => setShowStatusDetails(false)}
            className="text-xs opacity-75 hover:opacity-100 ml-1 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
