import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { decodeRoads } from '../docs/assets/js/data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = path.join(root, 'docs');
const index = await readFile(path.join(site, 'index.html'), 'utf8');
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else files.push(filename);
  }
}

await walk(site);
assert.match(index, /<html lang="it">/, 'La pagina deve dichiarare la lingua italiana');
assert.doesNotMatch(index, /<iframe\b|<style\b|\son\w+=/i, 'HTML senza contenitori o stili e gestori incorporati');
for (const match of index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  assert.match(match[1], /\bsrc=/, 'Gli script devono risiedere in file separati');
  assert.equal(match[2].trim(), '', 'Nessun JavaScript incorporato nella pagina');
}

let references = 0;
async function checkReference(filename, reference, publishedOnly = false) {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) return;
  assert.ok(!reference.startsWith('/'), `Usare percorsi relativi per GitHub Pages: ${reference}`);
  const target = path.resolve(path.dirname(filename), decodeURIComponent(reference.split(/[?#]/)[0]));
  if (publishedOnly) {
    const relative = path.relative(site, target);
    assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative), `File esterno al sito: ${reference}`);
  }
  assert.ok((await stat(target)).isFile(), `Riferimento mancante: ${reference}`);
  references++;
}

for (const filename of files) {
  if (!/\.(?:html|js|css)$/.test(filename)) continue;
  const text = await readFile(filename, 'utf8');
  assert.doesNotMatch(text, /window\.openai|\/Users\/|__MAP_DATA__|__BASE_DATA__/, `Dipendenza locale o dal vecchio contenitore: ${filename}`);
  if (filename.endsWith('.html')) {
    for (const match of text.matchAll(/(?:src|href)="([^"]+)"/g)) await checkReference(filename, match[1], true);
  }
  if (filename.endsWith('.js')) {
    for (const match of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) await checkReference(filename, match[1], true);
    const result = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
}

for (const entry of await readdir(root)) {
  if (!entry.endsWith('.md')) continue;
  const filename = path.join(root, entry);
  const text = await readFile(filename, 'utf8');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) await checkReference(filename, match[1]);
}

const dataRoot = path.join(site, 'assets/data');
const data = JSON.parse(await readFile(path.join(dataRoot, 'streets.json'), 'utf8'));
const metadata = JSON.parse(await readFile(path.join(dataRoot, 'metadata.json'), 'utf8'));
const roads = decodeRoads(data);
assert.equal(roads.length, metadata.counts.road_segments, 'Conteggio tratti nei metadati');
assert.equal(data.names.length, metadata.counts.streets, 'Conteggio strade nei metadati');
assert.equal(data.schedules.length, metadata.counts.schedules, 'Conteggio calendari nei metadati');
assert.equal(data.arcs.reduce((sum, arc) => sum + arc[1].length, 0), metadata.counts.segment_schedule_pairs);
assert.equal(metadata.automatic_updates, false, 'La copia dei dati è statica');
assert.match(metadata.snapshot_date, /^\d{4}-\d{2}-\d{2}$/);
for (const source of metadata.sources) {
  assert.ok(source.license && source.license_url && source.url, 'Fonte senza attribuzione');
  for (const filename of source.files) await checkReference(path.join(dataRoot, 'metadata.json'), filename, true);
}
assert.ok(files.includes(path.join(dataRoot, 'labels.json')));
console.log(`OK: ${files.length} file pubblicabili, ${references} riferimenti, ${roads.length} tratti.`);
