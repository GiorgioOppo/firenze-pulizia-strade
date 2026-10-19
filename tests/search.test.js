import assert from 'node:assert/strict';
import test from 'node:test';
import { findStreetMatches, normalizeStreetName } from '../docs/assets/js/format.js';

const names = [
  "VIA DE' TORNABUONI",
  "VIA DE' NERI",
  'VIA DI NOVOLI',
  "PIAZZA DELLA LIBERTA'",
  'VIALE GIUSEPPE MAZZINI',
  "VIA SANT'ANTONINO",
  'VIA DANTE ALIGHIERI',
  'VIA ANDANTE',
  'PIAZZA DANTE',
];
const found = query => findStreetMatches(query, names).map(item => item.name);

test('street search tolerates omitted prepositions in central Florence names', () => {
  assert.deepEqual(found('via Tornabuoni'), [names[0]]);
  assert.deepEqual(found('via neri'), [names[1]]);
  assert.deepEqual(found('via novoli'), [names[2]]);
  assert.deepEqual(found('Tornabuoni'), [names[0]]);
});

test('search handles accents, apostrophes, punctuation, and common street abbreviations', () => {
  assert.deepEqual(found('V. de’ Neri'), [names[1]]);
  assert.deepEqual(found('p.zza Libertà'), [names[3]]);
  assert.deepEqual(found('Piazza della Libertà!'), [names[3]]);
  assert.deepEqual(found('v.le Giuseppe Mazzini'), [names[4]]);
  for (const query of ['via Sant’Antonino', 'via sant antonino', 'via santantonino']) {
    assert.deepEqual(found(query), [names[5]], query);
  }
});

test('search returns original street names and indices, with exact normalization first', () => {
  const streets = ['VIA ROMAGNA', "VIA DE' ROMA", 'VIA ROMA'];
  assert.deepEqual(findStreetMatches('via Roma', streets), [
    { name: 'VIA ROMA', index: 2 },
    { name: "VIA DE' ROMA", index: 1 },
    { name: 'VIA ROMAGNA', index: 0 },
  ]);
  assert.equal(normalizeStreetName("Vìa de’ Neri"), 'viadeneri');
});

test('ambiguous street names remain separate and explicit street types are respected', () => {
  assert.deepEqual(found('dante'), [names[8], names[6]]);
  assert.deepEqual(found('via dante'), [names[6]]);
  assert.deepEqual(found('piazza dante'), [names[8]]);
  assert.deepEqual(found('via neri'), [names[1]]);
});

test('completion matches word prefixes without arbitrary substrings or fuzzy guesses', () => {
  assert.deepEqual(found('via torna'), [names[0]]);
  assert.deepEqual(found('viale gius mazz'), [names[4]]);
  assert.deepEqual(found('via dante'), [names[6]]);
  for (const query of ['ner', 'nerri', 'via esistente neri', 'via dante dante', 'tornabouni']) {
    assert.deepEqual(found(query), query === 'ner' ? [names[1]] : [], query);
  }
});

test('empty input, punctuation, and street types alone do not match every street', () => {
  for (const query of ['', ' ', '---', 'via', 'via dei', null, undefined]) {
    assert.deepEqual(found(query), [], String(query));
  }
});

test('the documented Calzaiuoli variant finds the municipal Calzaioli name', () => {
  assert.deepEqual(findStreetMatches('via Calzaiuoli', ['VIA DEI CALZAIOLI']), [
    { name: 'VIA DEI CALZAIOLI', index: 0 },
  ]);
});
