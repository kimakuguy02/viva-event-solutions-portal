import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  useProjectData,
  DATA_SOURCE_LABELS,
  type DataSourceKey,
} from '../../context/ProjectDataContext';
import {
  useEnterpriseErp,
  ERP_SOURCE_LABELS,
  type ErpSourceKey,
} from '../../context/EnterpriseErpContext';

interface SourceFailure {
  id: string;
  label: string;
  message: string;
  retry: () => void;
}

export const DataHealthBanner: React.FC = () => {
  const { dataHealth, reloadDataSource } = useProjectData();
  const { erpDataHealth, reloadErpDataSource } = useEnterpriseErp();

  const failures: SourceFailure[] = [
    ...(Object.keys(dataHealth) as DataSourceKey[])
      .filter(key => dataHealth[key].status === 'error')
      .map(key => ({
        id: `project:${key}`,
        label: DATA_SOURCE_LABELS[key],
        message: dataHealth[key].message ?? 'Erreur inconnue.',
        retry: () => reloadDataSource(key),
      })),
    ...(Object.keys(erpDataHealth) as ErpSourceKey[])
      .filter(key => erpDataHealth[key].status === 'error')
      .map(key => ({
        id: `erp:${key}`,
        label: ERP_SOURCE_LABELS[key],
        message: erpDataHealth[key].message ?? 'Erreur inconnue.',
        retry: () => reloadErpDataSource(key),
      })),
  ];

  if (failures.length === 0) return null;

  return (
    <div className="bg-red-950/95 border-b border-red-700 text-red-100 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider shrink-0">
          <AlertTriangle size={14} />
          Source de vérité Postgres indisponible ({failures.length})
        </span>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {failures.map(failure => (
            <li key={failure.id} title={failure.message}>
              <span className="font-semibold">{failure.label}</span>
              <span className="opacity-75"> — {failure.message.slice(0, 140)}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => failures.forEach(failure => failure.retry())}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded border border-red-500/60 hover:bg-red-900 font-bold cursor-pointer shrink-0"
        >
          <RefreshCw size={12} /> Réessayer
        </button>
      </div>
    </div>
  );
};
