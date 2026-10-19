const DATA_FILES = {
  streets: 'streets.json',
  districts: 'districts.geojson',
  river: 'river.geojson',
  labels: 'labels.json',
  metadata: 'metadata.json',
};

// Resolve from this module, so project sites also work below /repository-name/.
export const DATA_URLS = Object.fromEntries(
  Object.entries(DATA_FILES).map(([key, filename]) => [key, new URL(`../data/${filename}`, import.meta.url)]),
);

function invalid(reason) {
  throw new Error(`Dati della mappa non validi: ${reason}.`);
}

export function validateStreetData(data) {
  if (!data || !Array.isArray(data.names) || !data.names.length
    || !data.names.every(name => typeof name === 'string' && name.length)
    || !Array.isArray(data.schedules) || !data.schedules.length
    || !Array.isArray(data.arcs) || !data.arcs.length) {
    invalid('struttura delle strade');
  }

  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  for (const schedule of data.schedules) {
    if (!Array.isArray(schedule) || schedule.length !== 4
      || !Number.isInteger(schedule[0]) || schedule[0] < 0 || schedule[0] > 7
      || !Number.isInteger(schedule[1]) || schedule[1] < 0 || schedule[1] > 6
      || !timePattern.test(schedule[2]) || !timePattern.test(schedule[3])) {
      invalid('calendario');
    }
  }

  const codes = new Set();
  for (const arc of data.arcs) {
    if (!Array.isArray(arc) || arc.length !== 4) invalid('tratto');
    const [nameIndex, schedules, coordinates, code] = arc;
    if (!Number.isInteger(nameIndex) || nameIndex < 0 || nameIndex >= data.names.length
      || !Array.isArray(schedules) || !schedules.length
      || !schedules.every(index => Number.isInteger(index) && index >= 0 && index < data.schedules.length)
      || new Set(schedules).size !== schedules.length
      || typeof code !== 'string' || !code || codes.has(code)
      || !Array.isArray(coordinates) || coordinates.length < 2
      || !coordinates.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))) {
      invalid('riferimenti o geometria del tratto');
    }
    codes.add(code);
  }
  return data;
}

export function decodeRoads(data) {
  validateStreetData(data);
  return data.arcs.map(([nameIndex, schedule, coordinates, code], index) => ({
    type: 'Feature',
    properties: { index, nameIndex, name: data.names[nameIndex], code, schedule },
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map(([x, y]) => [11 + x / 100000, 43 + y / 100000]),
    },
  }));
}

export function indexRoadsByName(roads) {
  const index = new Map();
  for (const road of roads) {
    const nameIndex = road.properties.nameIndex;
    if (!index.has(nameIndex)) index.set(nameIndex, []);
    index.get(nameIndex).push(road);
  }
  return index;
}

function validateFeatureCollection(data, label) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)
    || !data.features.length || data.features.some(feature => !feature.geometry)) {
    invalid(label);
  }
}

export async function loadDataset({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Questo browser non supporta il caricamento dei dati.');
  const entries = await Promise.all(Object.entries(DATA_URLS).map(async ([key, url]) => {
    const response = await fetchImpl(url, { credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Impossibile caricare ${DATA_FILES[key]} (${response.status}).`);
    return [key, await response.json()];
  }));
  const { streets, districts, river, labels, metadata } = Object.fromEntries(entries);
  const roads = decodeRoads(streets);
  validateFeatureCollection(districts, 'quartieri');
  validateFeatureCollection(river, 'fiume');
  if (!Array.isArray(labels) || !labels.every(label => typeof label.name === 'string'
    && Array.isArray(label.coordinates) && label.coordinates.length === 2 && label.coordinates.every(Number.isFinite))) {
    invalid('etichette');
  }
  if (!metadata || typeof metadata.snapshot_date !== 'string' || !Array.isArray(metadata.sources)) {
    invalid('metadati');
  }
  return {
    names: streets.names,
    schedules: streets.schedules,
    roads,
    byName: indexRoadsByName(roads),
    base: { districts, river, labels },
    metadata,
  };
}
