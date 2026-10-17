// Magasin de session du Platform Builder — Phase 2.2.
// Rôle EXPLICITE : état de configuration non encore persisté en base
// (arbres de menus, enrichissements modules, workflows, liens form↔workflow,
// métadonnées de flags). Perdu au rechargement — c'est assumé et affiché
// (« Configuration temporaire »). AUCUNE écriture Firestore/localStorage ici.
// Persistance définitive : DATA REQUIREMENTs R2-02 → R2-10.

export interface MenuTreeNode {
  menuId: string;
  parentId: string | null;
}

export interface ModuleEnrichment {
  code: string;
  route: string;
  version: string;
  visibility: 'public' | 'client' | 'staff' | 'admin';
  order: number;
  featureFlag?: string;
  dependencies: string[];
  menuId?: string;
}

export interface StoredWorkflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
  stages: {
    id: string;
    key: string;
    label: string;
    responsibleRole: string;
    dueDays: number;
    status: string;
  }[];
}

type Listener = () => void;

import type { DomainEvent } from '../types/platformBuilder';

class PlatformSessionStore {
  private menuTree = new Map<string, string | null>();
  private enrichments = new Map<string, ModuleEnrichment>();
  private workflows = new Map<string, StoredWorkflow>();
  private formWorkflows = new Map<string, string>();
  private flagMeta = new Map<string, { env: string; target: string; startsAt?: string; endsAt?: string }>();
  private listeners = new Set<Listener>();
  private version = 0;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getVersion(): number {
    return this.version;
  }

  private emit() {
    this.version += 1;
    this.listeners.forEach((fn) => fn());
  }

  // --- Menus : hiérarchie session ---
  getParent(menuId: string): string | null {
    return this.menuTree.has(menuId) ? this.menuTree.get(menuId) ?? null : null;
  }

  setParent(menuId: string, parentId: string | null) {
    if (parentId === menuId) return;
    // Anti-cycle : le parent ne peut pas être un descendant.
    let cursor: string | null = parentId;
    while (cursor) {
      if (cursor === menuId) return;
      cursor = this.menuTree.get(cursor) ?? null;
    }
    this.menuTree.set(menuId, parentId);
    this.emit();
  }

  hasTreeData(): boolean {
    return this.menuTree.size > 0;
  }

  // --- Modules : enrichissements session ---
  getEnrichment(moduleId: string): ModuleEnrichment | undefined {
    return this.enrichments.get(moduleId);
  }

  setEnrichment(moduleId: string, patch: Partial<ModuleEnrichment>) {
    const prev = this.enrichments.get(moduleId) ?? {
      code: moduleId,
      route: '',
      version: '1.0.0',
      visibility: 'staff' as const,
      order: 0,
      dependencies: [],
    };
    this.enrichments.set(moduleId, { ...prev, ...patch });
    this.emit();
  }

  // --- Workflows partagés (WorkflowBuilder + Form Builder) ---
  listWorkflows(): StoredWorkflow[] {
    return [...this.workflows.values()];
  }

  upsertWorkflow(wf: StoredWorkflow) {
    this.workflows.set(wf.id, wf);
    this.emit();
  }

  removeWorkflow(id: string) {
    this.workflows.delete(id);
    for (const [formId, wfId] of this.formWorkflows) {
      if (wfId === id) this.formWorkflows.delete(formId);
    }
    this.emit();
  }

  linkFormWorkflow(formId: string, workflowId: string | null) {
    if (workflowId) this.formWorkflows.set(formId, workflowId);
    else this.formWorkflows.delete(formId);
    this.emit();
  }

  formWorkflow(formId: string): string | null {
    return this.formWorkflows.get(formId) ?? null;
  }

  // --- Journal d'événements domaine (notifications in-app, session) ---
  private domainEvents: DomainEvent[] = [];

  logDomainEvent(kind: DomainEvent['kind'], label: string, actorEmail?: string) {
    this.domainEvents.unshift({
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: new Date().toISOString(),
      kind,
      label,
      actorEmail,
    });
    if (this.domainEvents.length > 60) this.domainEvents.length = 60;
    this.emit();
  }

  listDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  // --- Flags : métadonnées session (l'état on/off reste dans app_settings) ---
  flagMetaOf(code: string) {
    return this.flagMeta.get(code) ?? { env: 'production', target: 'tous' };
  }

  setFlagMeta(code: string, patch: Partial<{ env: string; target: string; startsAt?: string; endsAt?: string }>) {
    this.flagMeta.set(code, { ...this.flagMetaOf(code), ...patch });
    this.emit();
  }
}

export const platformSession = new PlatformSessionStore();

import { useSyncExternalStore } from 'react';

export function usePlatformSession(): void {
  useSyncExternalStore(
    (fn) => platformSession.subscribe(fn),
    () => platformSession.getVersion(),
    () => platformSession.getVersion(),
  );
}
