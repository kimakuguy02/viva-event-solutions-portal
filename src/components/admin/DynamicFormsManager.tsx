import React, { useState } from 'react';
import { useProjectData } from '../../context/ProjectDataContext';
import { useAuth } from '../../context/AuthContext';
import { DynamicForm, FormField, FormFieldType, FormSubmission } from '../../types/cmsAndErp';
import { platformSession, usePlatformSession } from '../../services/platformSession';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  Inbox,
  Eye,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Settings
} from 'lucide-react';

export const DynamicFormsManager: React.FC = () => {
  const { dynamicForms, addDynamicForm, updateDynamicForm, deleteDynamicForm, formSubmissions, departments } = useProjectData();
  const { currentUser, isAdminGeneral } = useAuth();
  usePlatformSession();
  const sharedWorkflows = platformSession.listWorkflows();

  const [activeTab, setActiveTab] = useState<'forms_list' | 'create_form' | 'submissions'>('forms_list');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Form creation state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formAudience, setFormAudience] = useState<'public' | 'client' | 'staff' | 'admin'>('public');
  const [fields, setFields] = useState<FormField[]>([
    { id: 'f-1', name: 'fullName', label: 'Nom Complet', type: 'text', required: true, order: 1 }
  ]);

  // Field addition sub-state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldHelp, setNewFieldHelp] = useState('');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const nameKey = newFieldName.trim() || newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const opts = ['select', 'radio', 'checkbox', 'multiselect'].includes(newFieldType)
      ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newField: FormField = {
      id: `fld-${Date.now()}`,
      name: nameKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      placeholder: newFieldPlaceholder.trim() || undefined,
      helpText: newFieldHelp.trim() || undefined,
      required: newFieldRequired,
      options: opts,
      order: fields.length + 1
    };

    setFields(prev => [...prev, newField]);
    setNewFieldLabel('');
    setNewFieldName('');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setNewFieldHelp('');
  };

  const moveField = (id: string, dir: -1 | 1) => {
    setFields(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const i = sorted.findIndex(f => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= sorted.length) return prev;
      const a = sorted[i];
      sorted[i] = { ...sorted[j], order: a.order };
      sorted[j] = { ...a, order: sorted[j].order };
      return sorted;
    });
  };

  const duplicateField = (id: string) => {
    setFields(prev => {
      const src = prev.find(f => f.id === id);
      if (!src) return prev;
      const maxOrder = Math.max(...prev.map(f => f.order), 0);
      return [...prev, { ...src, id: `fld-${Date.now()}`, name: `${src.name}_copie`, label: `${src.label} (copie)`, order: maxOrder + 1 }];
    });
  };

  const applyJsonSchema = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!Array.isArray(parsed)) throw new Error('Le schéma doit être un tableau de champs.');
      const validTypes: FormFieldType[] = ['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'image', 'signature', 'currency', 'user', 'department', 'role'];
      const cleaned: FormField[] = parsed.map((f, i) => {
        const r = f as Record<string, unknown>;
        if (typeof r.label !== 'string' || !r.label.trim()) throw new Error(`Champ #${i + 1} : label manquant.`);
        const type = String(r.type ?? 'text');
        if (!validTypes.includes(type as FormFieldType)) throw new Error(`Champ « ${r.label} » : type « ${type} » non supporté.`);
        return {
          id: typeof r.id === 'string' ? r.id : `fld-${Date.now()}-${i}`,
          name: typeof r.name === 'string' && r.name ? r.name : String(r.label).toLowerCase().replace(/[^a-z0-9]/g, '_'),
          label: String(r.label),
          type: type as FormFieldType,
          placeholder: typeof r.placeholder === 'string' ? r.placeholder : undefined,
          helpText: typeof r.helpText === 'string' ? r.helpText : undefined,
          required: Boolean(r.required),
          options: Array.isArray(r.options) ? r.options.map(String) : undefined,
          order: i + 1,
        };
      });
      setFields(cleaned);
      setJsonMode(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRemoveField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleCreateFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || fields.length === 0) return;

    const selectedDept = departments.find(d => String(d.id) === formDeptId);

    addDynamicForm({
      name: formName,
      description: formDescription,
      departmentId: formDeptId || undefined,
      departmentName: selectedDept?.name,
      targetAudience: formAudience,
      allowedRoles: formAudience === 'public' ? ['visitor', 'client', 'staff', 'admin'] : ['client', 'staff', 'admin'],
      status: 'actif',
      fields,
      submissionsCount: 0
    });

    setFormName('');
    setFormDescription('');
    setFormDeptId('');
    setFields([{ id: 'f-1', name: 'fullName', label: 'Nom Complet', type: 'text', required: true, order: 1 }]);
    setActiveTab('forms_list');
  };

  const filteredSubmissions = selectedFormId
    ? formSubmissions.filter(s => s.formId === selectedFormId)
    : formSubmissions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white font-serif">
              Générateur de Formulaires Dynamiques
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Création sans code de formulaires (Recrutement, Cahiers des charges, Audits) et suivi en temps réel dans Firestore.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('forms_list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'forms_list' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Formulaires ({dynamicForms.length})
          </button>
          <button
            onClick={() => setActiveTab('create_form')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'create_form' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer un Formulaire</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'submissions' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Réponses Reçues ({formSubmissions.length})</span>
          </button>
        </div>
      </div>

      {/* 1. FORMS LIST */}
      {activeTab === 'forms_list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicForms.map(form => (
            <div
              key={form.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Public cible : {form.targetAudience.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {form.submissionsCount || 0} soumissions
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm">
                  {form.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {form.description}
                </p>

                {form.departmentName && (
                  <div className="text-[11px] text-amber-400 font-mono">
                    Département : {form.departmentName}
                  </div>
                )}

                {/* Fields count badge */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {form.fields.map(f => (
                    <span key={f.id} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono">
                      {f.label} ({f.type})
                    </span>
                  ))}
                </div>

                {/* Workflow associé (session — R2-10 pour persistance) */}
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 font-bold">Workflow :</span>
                  <select
                    value={platformSession.formWorkflow(form.id) ?? ''}
                    onChange={e => platformSession.linkFormWorkflow(form.id, e.target.value || null)}
                    className="flex-1 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-[11px]"
                  >
                    <option value="">— aucun —</option>
                    {sharedWorkflows.filter(w => w.isActive).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                {platformSession.formWorkflow(form.id) && (
                  <p className="text-[10px] text-slate-500">SIMULATION — aucune exécution métier réelle (moteur : R2-02).</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedFormId(form.id);
                    setActiveTab('submissions');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Voir les réponses</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const next = form.status === 'actif' ? 'inactif' : 'actif';
                      updateDynamicForm(form.id, { status: next });
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                      form.status === 'actif' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {form.status}
                  </button>
                  <button
                    onClick={() => deleteDynamicForm(form.id)}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                    title="Supprimer le formulaire"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. CREATE FORM */}
      {activeTab === 'create_form' && (
        <form onSubmit={handleCreateFormSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Nouveau Formulaire Dynamique
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Nom du Formulaire</label>
              <input
                type="text"
                required
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex: Demande de Stage Son & Éclairage"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Public Autorisé</label>
              <select
                value={formAudience}
                onChange={e => setFormAudience(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="public">Tout Public (Visiteurs, Candidats)</option>
                <option value="client">Clients Partenaires</option>
                <option value="staff">Personnel & Techniciens VIVA</option>
                <option value="admin">Administrateurs Uniquement</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Description & Instructions</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Expliquez à l'utilisateur la finalité de ce formulaire..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Department selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Département d'Assignation</label>
            <select
              value={formDeptId}
              onChange={e => setFormDeptId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Aucun département spécifique --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Fields Editor */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm">Champs du Formulaire ({fields.length})</h4>
              <span className="text-[11px] text-slate-400">Configurez les questions</span>
            </div>

            {/* Existing fields list */}
            <div className="space-y-2">
              {fields.map((f, idx) => (
                <div key={f.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white truncate">{f.label}</span>
                    <span className="text-amber-400 font-mono text-[10px] shrink-0">({f.type})</span>
                    {f.required && (
                      <span className="text-rose-400 text-[10px] font-bold shrink-0">*Obligatoire</span>
                    )}
                    {f.options && (
                      <span className="text-slate-400 text-[10px] truncate">[{f.options.join(', ')}]</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => moveField(f.id, -1)} title="Monter" className="p-1 text-slate-400 hover:text-white cursor-pointer">↑</button>
                    <button type="button" onClick={() => moveField(f.id, 1)} title="Descendre" className="p-1 text-slate-400 hover:text-white cursor-pointer">↓</button>
                    <button
                      type="button"
                      onClick={() => {
                        duplicateField(f.id);
                      }}
                      title="Dupliquer"
                      className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer text-[10px] font-bold"
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mode JSON / schéma */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Le JSON est un modèle de configuration, pas une persistance DB.</span>
              <button
                type="button"
                onClick={() => {
                  setJsonText(JSON.stringify(fields, null, 2));
                  setJsonError(null);
                  setJsonMode(v => !v);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 cursor-pointer"
              >
                {jsonMode ? 'Masquer le JSON' : 'Voir / coller le JSON'}
              </button>
            </div>
            {jsonMode && (
              <div className="space-y-2">
                <textarea
                  rows={8}
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  spellCheck={false}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
                />
                {jsonError && <p className="text-[11px] text-rose-400 font-bold">{jsonError}</p>}
                <button type="button" onClick={applyJsonSchema} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer">
                  Appliquer le schéma (avec validation)
                </button>
              </div>
            )}

            {/* Add Field Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-3">
              <span className="text-xs font-bold text-amber-400 block">+ Ajouter un Nouveau Champ</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Intitulé (ex: Années d'expérience)"
                  value={newFieldLabel}
                  onChange={e => setNewFieldLabel(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />

                <select
                  value={newFieldType}
                  onChange={e => setNewFieldType(e.target.value as FormFieldType)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="text">Texte Court</option>
                  <option value="textarea">Zone de Texte Longue</option>
                  <option value="number">Nombre / Chiffre</option>
                  <option value="email">Adresse E-mail</option>
                  <option value="phone">Téléphone / WhatsApp</option>
                  <option value="date">Date</option>
                  <option value="datetime">Date + Heure</option>
                  <option value="select">Liste Déroulante (Select)</option>
                  <option value="multiselect">Choix Multiples</option>
                  <option value="radio">Choix Unique (Radio)</option>
                  <option value="checkbox">Cases à Cocher (Checkbox)</option>
                  <option value="currency">Montant Devise (USD / CDF)</option>
                  <option value="file">Téléversement Fichier</option>
                  <option value="image">Image</option>
                  <option value="signature">Signature</option>
                  <option value="user">Utilisateur</option>
                  <option value="department">Département</option>
                  <option value="role">Rôle</option>
                </select>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={e => setNewFieldRequired(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>Requis</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Placeholder (ex. +243 …)"
                  value={newFieldPlaceholder}
                  onChange={e => setNewFieldPlaceholder(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Texte d'aide (helpText)"
                  value={newFieldHelp}
                  onChange={e => setNewFieldHelp(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {['select', 'radio', 'checkbox'].includes(newFieldType) && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">Options séparées par des virgules :</label>
                  <input
                    type="text"
                    placeholder="Ex: Option 1, Option 2, Option 3"
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Enregistrer le Formulaire
          </button>
        </form>
      )}

      {/* 3. SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrer par formulaire :</span>
              <select
                value={selectedFormId || ''}
                onChange={e => setSelectedFormId(e.target.value || null)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="">Tous les formulaires</option>
                {dynamicForms.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold">
              {filteredSubmissions.length} réponse(s) enregistrée(s)
            </span>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">Aucune soumission reçue pour ce formulaire.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map(sub => (
                <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="font-bold text-white text-xs">{sub.formName}</span>
                      <span className="text-[11px] text-slate-400 block">
                        Par : <strong className="text-amber-300">{sub.submittedByName}</strong> ({sub.submittedByEmail})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(sub.submittedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  {/* Form fields data */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    {Object.entries(sub.data).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-slate-400 text-[10px] uppercase font-mono block">{key} :</span>
                        <span className="text-white font-semibold">
                          {typeof val === 'boolean' ? (val ? 'Oui' : 'Non') : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
