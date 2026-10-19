import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreferenceStore } from '../docs/assets/js/storage.js';

const KEY = 'firenze-pulizia-strade:preferences:v1';
const PATHNAME = '/firenze-pulizia-strade/';
const LEGACY_KEY = `codex:visualization-widget-state-v2:${JSON.stringify([PATHNAME, ''])}`;
const preferences = {
  arrival: '2026-10-19T20:00',
  departure: '2026-10-20T09:00',
  name: 42,
  selected: 123,
  zoom: { k: 4.5, x: -0.25, y: 0.1 },
};

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test('preferences round-trip without a widget host and clear persistently', () => {
  const storage = memoryStorage();
  const store = createPreferenceStore({ storage, pathname: PATHNAME });
  assert.equal(store.read(), null);
  assert.equal(store.write(preferences), true);
  assert.deepEqual(store.read(), preferences);
  assert.deepEqual(createPreferenceStore({ storage, pathname: PATHNAME }).read(), preferences);
  assert.deepEqual(JSON.parse(storage.getItem(KEY)), preferences);
  assert.equal(store.clear(), true);
  assert.equal(store.read(), null);
});

test('canonical writes retain selected index zero and omit unknown properties', () => {
  const storage = memoryStorage();
  const store = createPreferenceStore({ storage });
  assert.equal(store.write({ ...preferences, name: 0, selected: 0, extra: 'unused' }), true);
  assert.deepEqual(store.read(), { ...preferences, name: 0, selected: 0 });
  assert.equal(store.write({ name: null, selected: null }), true);
  assert.deepEqual(store.read(), {
    arrival: '', departure: '', name: null, selected: null, zoom: null,
  });
});

test('geographic zoom center round-trips while old preferences keep their original shape', () => {
  const storage = memoryStorage();
  const store = createPreferenceStore({ storage });
  const centered = { ...preferences, zoom: { ...preferences.zoom, center: [11.2558, 43.7696] } };
  assert.equal(store.write(centered), true);
  assert.deepEqual(store.read(), centered);
  assert.deepEqual(createPreferenceStore({ storage }).read(), centered);
  assert.deepEqual(JSON.parse(storage.getItem(KEY)), centered);

  assert.equal(store.write(preferences), true);
  assert.deepEqual(store.read(), preferences);
  assert.equal(Object.hasOwn(store.read().zoom, 'center'), false);
});

test('invalid geographic zoom centers are rejected on write and read', () => {
  const storage = memoryStorage();
  const store = createPreferenceStore({ storage });
  for (const center of [null, '11,43', [], [11], [11, 43, 0], ['11', 43], [NaN, 43], [11, Infinity], [180.01, 43], [-180.01, 43], [11, 90.01], [11, -90.01]]) {
    const invalid = { ...preferences, zoom: { ...preferences.zoom, center } };
    assert.equal(store.write(invalid), false, JSON.stringify(center));
    storage.setItem(KEY, JSON.stringify(invalid));
    assert.equal(store.read(), null, JSON.stringify(center));
  }
  for (const center of [[180, 90], [-180, -90], [0, 0]]) {
    const boundary = { ...preferences, zoom: { ...preferences.zoom, center } };
    assert.equal(store.write(boundary), true);
    assert.deepEqual(store.read(), boundary);
  }
});

test('malformed JSON and invalid shapes are ignored without disabling later writes', () => {
  const storage = memoryStorage();
  const store = createPreferenceStore({ storage });
  for (const serialized of ['{broken', 'null', '[]', '42', '{}', '{"arrival":42}', '{"name":-1}', '{"selected":1.5}', '{"zoom":{"k":0,"x":0,"y":0}}']) {
    storage.setItem(KEY, serialized);
    assert.equal(store.read(), null, serialized);
  }
  assert.equal(store.write(preferences), true);
  assert.deepEqual(store.read(), preferences);
  assert.equal(store.write({ ...preferences, zoom: { k: Infinity, x: 0, y: 0 } }), false);
  assert.deepEqual(store.read(), preferences);
});

test('legacy privateContent is read and migrated using the current pathname', () => {
  const storage = memoryStorage({
    [LEGACY_KEY]: JSON.stringify({ modelContent: { strada: 'Old label' }, privateContent: preferences }),
  });
  const store = createPreferenceStore({ storage, pathname: PATHNAME });
  assert.deepEqual(store.read(), preferences);
  assert.deepEqual(JSON.parse(storage.getItem(KEY)), preferences);
  assert.equal(store.clear(), true);
  assert.equal(storage.getItem(LEGACY_KEY), null);
  assert.equal(store.read(), null);
});

test('new preferences take precedence over legacy values', () => {
  const legacyPreferences = { ...preferences, name: 2 };
  const storage = memoryStorage({
    [KEY]: JSON.stringify(preferences),
    [LEGACY_KEY]: JSON.stringify({ privateContent: legacyPreferences }),
  });
  assert.deepEqual(createPreferenceStore({ storage, pathname: PATHNAME }).read(), preferences);
  assert.equal(createPreferenceStore({ storage, key: 'other-key', pathname: '/other/' }).read(), null);
});

test('quota failure keeps existing preferences and can still read legacy values', () => {
  const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify({ privateContent: preferences }) });
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  const store = createPreferenceStore({ storage, pathname: PATHNAME });
  assert.equal(store.write(preferences), false);
  assert.deepEqual(store.read(), preferences);
  assert.equal(store.clear(), true);
});

test('denied storage methods return null or false without throwing', () => {
  const denied = () => { throw new Error('SecurityError'); };
  const store = createPreferenceStore({
    storage: { getItem: denied, setItem: denied, removeItem: denied },
  });
  assert.equal(store.read(), null);
  assert.equal(store.write(preferences), false);
  assert.equal(store.clear(), false);
  const unavailable = createPreferenceStore({ storage: null });
  assert.equal(unavailable.read(), null);
  assert.equal(unavailable.write(preferences), false);
  assert.equal(unavailable.clear(), false);
});

test('a denied global localStorage getter does not prevent initialization', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError'); },
    });
    const store = createPreferenceStore();
    assert.equal(store.read(), null);
    assert.equal(store.write(preferences), false);
    assert.equal(store.clear(), false);
    const explicit = createPreferenceStore({ storage: memoryStorage() });
    assert.equal(explicit.write(preferences), true);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});
