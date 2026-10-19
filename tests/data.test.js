import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { DATA_URLS, decodeRoads, indexRoadsByName, loadDataset, validateStreetData } from '../docs/assets/js/data.js';

const fixture = () => ({
  names: ['VIA DI PROVA', 'VIA SECONDA'],
  schedules: [[0, 1, '00:00', '06:00'], [6, 4, '00:00', '06:00']],
  arcs: [[0, [0, 1], [[10000, 70000], [10010, 70010]], '123'], [1, [0], [[20000, 80000], [20010, 80010]], '456']],
});

test('decoding retains identifiers, all schedules and longitude/latitude order', () => {
  const roads = decodeRoads(fixture());
  assert.deepEqual(roads[0].properties, { index: 0, nameIndex: 0, name: 'VIA DI PROVA', code: '123', schedule: [0, 1] });
  assert.deepEqual(roads[0].geometry.coordinates[0], [11.1, 43.7]);
  const index = indexRoadsByName(roads);
  assert.deepEqual([...index.keys()], [0, 1]);
  assert.equal(index.get(0)[0], roads[0]);
});

test('corrupt references, duplicate segments and invalid coordinates are rejected', () => {
  for (const mutate of [
    data => { data.arcs[0][0] = 10; },
    data => { data.arcs[0][1] = [10]; },
    data => { data.arcs[0][1] = [0, 0]; },
    data => { data.arcs[1][3] = '123'; },
    data => { data.arcs[0][2][0][0] = Infinity; },
    data => { data.schedules[0][2] = '25:00'; },
  ]) {
    const data = fixture();
    mutate(data);
    assert.throws(() => validateStreetData(data), /Dati della mappa non validi/);
  }
});

test('all dataset URLs resolve relative to the module directory', () => {
  for (const url of Object.values(DATA_URLS)) {
    assert.ok(url.href.startsWith(new URL('../docs/assets/data/', import.meta.url).href));
  }
});

async function readPublishedData(url) {
  return { ok: true, json: async () => JSON.parse(await readFile(url, 'utf8')) };
}

test('the published snapshot preserves every segment and its schedule assignments', async () => {
  const data = await loadDataset({ fetchImpl: readPublishedData });
  assert.equal(data.roads.length, 5576);
  assert.equal(data.names.length, 1537);
  assert.equal(data.schedules.length, 189);
  assert.equal(data.roads.reduce((sum, road) => sum + road.properties.schedule.length, 0), 6249);
  assert.equal(new Set(data.roads.map(road => road.properties.code)).size, 5576);
  assert.equal([...data.byName.values()].reduce((sum, roads) => sum + roads.length, 0), 5576);
  assert.equal(data.base.districts.features.length, 5);
  assert.equal(data.base.river.features.length, 17);
  assert.equal(data.base.labels.length, 5);
  assert.equal(data.metadata.snapshot_date, '2026-10-19');
});

test('failed requests stop loading instead of producing an empty apparently valid map', async () => {
  await assert.rejects(loadDataset({ fetchImpl: async () => ({ ok: false, status: 404 }) }), /Impossibile caricare/);
});
