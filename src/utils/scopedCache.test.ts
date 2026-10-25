import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adoptLegacyCache, cacheScopeFor, readScopedCache, scopedCacheKey } from './scopedCache.ts';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

describe('cache local cloisonné par compte', () => {
  let storage: MemoryStorage;

  beforeEach(() => { storage = new MemoryStorage(); });

  it('isole un visiteur sous le scope anonyme', () => {
    assert.equal(cacheScopeFor({ id: 'u-1', role: 'visitor' }), 'anonymous');
  });

  it('suffixe la clé par le compte', () => {
    assert.equal(scopedCacheKey('viva_quotes', 'u-1'), 'viva_quotes::u-1');
  });

  it('ne lit jamais le cache d’un autre compte', () => {
    storage.setItem('viva_quotes::u-1', JSON.stringify([{ id: 'q-1' }]));
    assert.equal(readScopedCache(storage, 'viva_quotes', 'u-2'), null);
    assert.deepEqual(readScopedCache(storage, 'viva_quotes', 'u-1'), [{ id: 'q-1' }]);
  });

  it('refuse la reprise du cache historique à un compte non privilégié', () => {
    storage.setItem('viva_quotes', JSON.stringify([{ id: 'legacy' }]));
    assert.equal(adoptLegacyCache(storage, { id: 'u-2', role: 'commercial_secretaire' }, ['viva_quotes']), false);
    assert.equal(storage.getItem('viva_quotes::u-2'), null);
  });

  it('reprend une seule fois le cache historique vers un compte de direction', () => {
    storage.setItem('viva_quotes', JSON.stringify([{ id: 'legacy' }]));
    assert.equal(adoptLegacyCache(storage, { id: 'u-admin', role: 'admin_general' }, ['viva_quotes']), true);
    assert.deepEqual(readScopedCache(storage, 'viva_quotes', 'u-admin'), [{ id: 'legacy' }]);
    assert.equal(adoptLegacyCache(storage, { id: 'u-admin', role: 'admin_general' }, ['viva_quotes']), false);
  });

  it('n’écrase pas un cache de compte déjà rempli', () => {
    storage.setItem('viva_quotes', JSON.stringify([{ id: 'legacy' }]));
    storage.setItem('viva_quotes::u-admin', JSON.stringify([{ id: 'fresh' }]));
    adoptLegacyCache(storage, { id: 'u-admin', role: 'admin_general' }, ['viva_quotes']);
    assert.deepEqual(readScopedCache(storage, 'viva_quotes', 'u-admin'), [{ id: 'fresh' }]);
  });
});
