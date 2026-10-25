import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * La dégradation Supabase → legacy était jusqu'ici uniquement lisible dans le
 * tableau de bord Super Admin. Elle est affichée ici à chaque session staff :
 * un collaborateur qui travaille sur l'autorité legacy ne retrouve pas ses
 * écritures dans Supabase, et doit le savoir pendant qu'il saisit.
 */
export const SessionAuthorityBanner: React.FC = () => {
  const { authMode, isAuthenticated, isStaffWorker, isSimulatingVisitor } = useAuth();

  if (!isAuthenticated || !isStaffWorker || isSimulatingVisitor || authMode !== 'legacy') {
    return null;
  }

  return (
    <div
      role="status"
      className="px-4 py-3 bg-amber-950/80 border-b border-amber-500/40 text-amber-100 flex items-start gap-3 text-xs sm:text-sm"
    >
      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
      <p className="leading-relaxed">
        <strong className="font-black">Session servie par l&apos;autorité legacy (Firebase / Express).</strong>{' '}
        Le schéma Supabase n&apos;a pas répondu ou la session PostgreSQL est absente : les saisies faites
        maintenant n&apos;alimentent <strong>pas</strong> la base de production et ne seront pas reprises après
        bascule. Vérifiez les migrations 024, 026 et 027 puis reconnectez-vous avec un compte Supabase avant
        de continuer à saisir.
      </p>
    </div>
  );
};
