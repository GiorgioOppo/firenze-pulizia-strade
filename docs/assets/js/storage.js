const DEFAULT_KEY = 'firenze-pulizia-strade:preferences:v1';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validIndex(value) {
  return value === undefined || value === null
    || (Number.isInteger(value) && value >= 0);
}

function normalizePreferences(value) {
  if (!isRecord(value)) return null;
  const fields = ['arrival', 'departure', 'name', 'selected', 'zoom'];
  if (!fields.some(field => Object.hasOwn(value, field))) return null;
  if (value.arrival !== undefined && typeof value.arrival !== 'string') return null;
  if (value.departure !== undefined && typeof value.departure !== 'string') return null;
  if (!validIndex(value.name) || !validIndex(value.selected)) return null;

  let zoom = null;
  if (value.zoom !== undefined && value.zoom !== null) {
    const { k, x, y } = value.zoom;
    if (!isRecord(value.zoom) || ![k, x, y].every(Number.isFinite) || k <= 0) {
      return null;
    }
    zoom = { k, x, y };
    if (Object.hasOwn(value.zoom, 'center')) {
      const { center } = value.zoom;
      if (!Array.isArray(center) || center.length !== 2
        || !center.every(Number.isFinite)
        || Math.abs(center[0]) > 180 || Math.abs(center[1]) > 90) {
        return null;
      }
      zoom.center = [...center];
    }
  }

  return {
    arrival: value.arrival ?? '',
    departure: value.departure ?? '',
    name: value.name ?? null,
    selected: value.selected ?? null,
    zoom,
  };
}

function parsePreferences(serialized, legacy = false) {
  if (typeof serialized !== 'string') return null;
  try {
    const value = JSON.parse(serialized);
    return normalizePreferences(legacy ? value?.privateContent : value);
  } catch {
    return null;
  }
}

/**
 * Store local map preferences without depending on an embedded widget host.
 * read() returns preferences or null; write() and clear() report success.
 * The storage getter is resolved inside try because browsers can deny access.
 */
export function createPreferenceStore(options = {}) {
  const key = options.key ?? DEFAULT_KEY;
  const pathname = options.pathname ?? globalThis.location?.pathname ?? '/';
  const legacyKey = `codex:visualization-widget-state-v2:${JSON.stringify([pathname, ''])}`;
  let storage;
  try {
    storage = options.storage === undefined ? globalThis.localStorage : options.storage;
  } catch {
    storage = null;
  }

  function write(value) {
    const preferences = normalizePreferences(value);
    if (!preferences || !storage) return false;
    try {
      storage.setItem(key, JSON.stringify(preferences));
      return true;
    } catch {
      return false;
    }
  }

  function read() {
    if (!storage) return null;
    try {
      const preferences = parsePreferences(storage.getItem(key));
      if (preferences) return preferences;

      const legacy = parsePreferences(storage.getItem(legacyKey), true);
      if (legacy) write(legacy);
      return legacy;
    } catch {
      return null;
    }
  }

  function clear() {
    if (!storage) return false;
    let success = true;
    // Remove both formats so the old preference cannot reappear on the next read.
    for (const storedKey of [key, legacyKey]) {
      try {
        storage.removeItem(storedKey);
      } catch {
        success = false;
      }
    }
    return success;
  }

  return { read, write, clear };
}
