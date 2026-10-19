import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { streetNameKey } from '../docs/assets/js/format.js';

// Input: the municipal SHP converted to WGS84 GeoJSON using its original PRJ.
// Keep its original TOPONIMO / ID attributes. Never derive cleaning schedules.
const input = process.argv[2];
if (!input) {
  console.error('Uso: node scripts/import-street-network.mjs <trattistradali-wgs84.geojson>');
  process.exit(1);
}
const directory = new URL('../docs/assets/data/', import.meta.url);
const streets = JSON.parse(await readFile(new URL('streets.json', directory), 'utf8'));
const source = JSON.parse(await readFile(input, 'utf8'));
assert.equal(source.type, 'FeatureCollection');
const knownNames = new Set(streets.names.map(streetNameKey));
const newNames = new Map();
const names = [];
const arcs = [];
const usedCodes = new Set();
for (const feature of source.features) {
  const name = feature.properties?.TOPONIMO;
  assert.equal(typeof name, 'string', 'TOPONIMO mancante');
  const key = streetNameKey(name);
  if (knownNames.has(key)) continue;
  assert.equal(feature.geometry?.type, 'LineString', 'Geometria non lineare');
  const coordinates = feature.geometry.coordinates.map(([longitude, latitude]) => {
    assert.ok(longitude > 10 && longitude < 12 && latitude > 43 && latitude < 45,
      'Input fuori Firenze o non in coordinate WGS84');
    return [Math.round((longitude - 11) * 100000), Math.round((latitude - 43) * 100000)];
  });
  const id = feature.properties.ID;
  assert.ok(Number.isInteger(id), 'ID del tratto non valido');
  const code = `topo:${id}`;
  assert.ok(!usedCodes.has(code), `ID duplicato: ${code}`);
  usedCodes.add(code);
  if (!newNames.has(key)) {
    newNames.set(key, names.length);
    names.push(name);
  }
  arcs.push([newNames.get(key), coordinates, code]);
}
await writeFile(new URL('street-network.json', directory), `${JSON.stringify({ names, arcs })}\n`);
console.log(`${names.length} strade e ${arcs.length} tratti cartografici aggiunti, senza calendari.`);
