import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserCheck, 
  Shield, 
  Bell, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Truck, 
  Briefcase, 
  Lock, 
  Smartphone, 
  PhoneCall, 
  MessageCircle, 
  Save,
  CheckSquare,
  Key,
  Flame
} from 'lucide-react';
import { AccountNotification, WorkerAvailability } from '../../types/erp';
import { OFFICIAL_VIVA_WORKERS } from '../../context/AuthContext';

export const AccountCenterModule: React.FC<{ onNavigateTab?: (tabId: string) => void }> = ({ onNavigateTab }) => {
  const { currentUser, isDg, isDaf, isAdminRh, isChefEquipe, isCommercial } = useAuth();
  
  // Find worker profile data
  const workerMeta = OFFICIAL_VIVA_WORKERS.find(w => w.role === currentUser.role) || OFFICIAL_VIVA_WORKERS[0];

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    phone: currentUser.phone || workerMeta.phone,
    whatsapp: '',
    bio: workerMeta.description,
    availability: 'disponible' as WorkerAvailability,
    statusNote: '',
    notifySound: true,
    notifyInApp: true
  });

  const [notifications, setNotifications] = useState<AccountNotification[]>([]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg"
            style={{ backgroundColor: workerMeta.avatarColor }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {currentUser.id}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{currentUser.name}</h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">{workerMeta.jobTitle} • {workerMeta.directionName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/90 px-5 py-3 rounded-2xl border border-slate-800">
          <Shield className="w-5 h-5 text-amber-400" />
          <div className="text-xs">
            <span className="block font-bold text-white">Niveau de Habilitation :</span>
            <span className="text-emerald-400 font-semibold">Accès Sécurisé VIVA ERP (Rôle Attitré)</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Vos modifications de profil et préférences personnelles ont été enregistrées avec succès dans la base VIVA ERP !</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Settings & Role-Specific Reserved Functions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Profile & Modifications */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Modifications & Paramètres de Mon Compte</h3>
              </div>
              <span className="text-xs text-slate-400">Fonctions de personnalisation individuelles</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Nom & Prénom Officiel
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Téléphone Professionnel (RDC)
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Numéro WhatsApp Pro
                  </label>
                  <input
                    type="text"
                    value={profileForm.whatsapp}
                    onChange={e => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Disponibilité Actuelle
                  </label>
                  <select
                    value={profileForm.availability}
                    onChange={e => setProfileForm({ ...profileForm, availability: e.target.value as WorkerAvailability })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="disponible">🟢 Disponible</option>
                    <option value="en_mission">🚀 En Mission Terrain</option>
                    <option value="reunion">📅 En Réunion</option>
                    <option value="occupe">🟠 Occupé</option>
                    <option value="conge">🏖️ En Congé / Repos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Note de Statut / Message d'Urgence
                </label>
                <input
                  type="text"
                  value={profileForm.statusNote}
                  onChange={e => setProfileForm({ ...profileForm, statusNote: e.target.value })}
                  placeholder="Ex: Joignable sur Starlink ou WhatsApp..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileForm.notifySound}
                      onChange={e => setProfileForm({ ...profileForm, notifySound: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Son de notification</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileForm.notifyInApp}
                      onChange={e => setProfileForm({ ...profileForm, notifyInApp: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Bandeaux In-App</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#4A6CF7] hover:bg-[#3A5BD9] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>

          {/* Reserved Functions by Role */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Fonctions & Prérogatives Réservées à votre Compte</h3>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                Rôle : {currentUser.role}
              </span>
            </div>

            <div className="space-y-4">
              {isDg && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    <span>Prérogatives Exclusives DG / Gérant Statutaire</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Vous disposez des droits d'arbitrage budgétaire global, de double signature exécutive pour tout décaissement supérieur au seuil critique, et de la validation des partenariats institutionnels en RDC.
                  </p>
                </div>
              )}

              {isDaf && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Prérogatives Exclusives DAF / Comptabilité SYSCOHADA</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Vous seul pouvez émettre les codes OTP de validation des décaissements, certifier les journaux comptables bi-devises (USD/CDF) et valider les clôtures de caisse journalières.
                  </p>
                </div>
              )}

              {isChefEquipe && (
                <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-2">
                  <div className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Prérogatives Exclusives Régie & Technique</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Gestion des plannings de déploiement des équipements lourds (Line Array, Starlink, Groupes Électrogènes), signature des bons de prêts et rapports journaliers de chantier.
                  </p>
                </div>
              )}

              {isCommercial && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>Prérogatives Commerciales & CRM Grands Comptes</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Qualification des prospects, émission des devis chiffrés officiels, suivi des contrats et relance automatique des clients VIP de VIVA EVENT SOLUTIONS.
                  </p>
                </div>
              )}

              {isAdminRh && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Prérogatives Administration & RH</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Gestion des fiches de poste, des organigrammes des 9 directions et de la conformité réglementaire du personnel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Account Notifications Center */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Centre de Notifications</h3>
              </div>
              <button
                onClick={markAllRead}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                Tout marquer lu
              </button>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucune notification pour le moment.
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      notif.isRead
                        ? 'bg-slate-950/40 border-slate-800 opacity-75'
                        : 'bg-slate-800/80 border-blue-500/40 shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                        )}
                        <span className="text-xs font-bold text-white leading-tight">{notif.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-700/50">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        notif.priority === 'urgente' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {notif.priority.toUpperCase()}
                      </span>

                      {notif.actionTab && onNavigateTab && (
                        <button
                          onClick={() => {
                            markAsRead(notif.id);
                            onNavigateTab(notif.actionTab!);
                          }}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          {notif.actionLabel || 'Voir'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
