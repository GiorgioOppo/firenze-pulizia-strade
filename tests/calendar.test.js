// Calendar edge cases use the same ES module loaded by the site.
import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import * as calendar from '../docs/assets/js/calendar.js';

const wall = calendar.parseWall;
const events = (s, a, b) => JSON.parse(JSON.stringify(calendar.scheduleEvents(s, wall(a), wall(b))));
const date = v => new Date(v).toISOString().slice(0,16);
const display = e => e.map(x=>[date(x.start),date(x.end),x.uncertain]);
test('valid leap dates and rejection of invalid input',()=>{
  for(const v of ['2024-02-29T00:00','2026-12-31T23:59','2027-01-01T00:00']) assert.ok(Number.isFinite(wall(v)),v);
  for(const v of ['2026-02-29T00:00','2026-04-31T00:00','2026-00-01T00:00','2026-13-01T00:00','2026-10-19T24:00','2026-10-19T23:60','2026-10-19','',null]) assert.ok(Number.isNaN(wall(v)),String(v));
});
test('first Tuesday is the first occurrence, including months starting on a Sunday',()=>{
  assert.deepEqual(display(events([0,1,'00:00','06:00'],'2026-02-01T00:00','2026-03-01T00:00')),[['2026-02-03T00:00','2026-02-03T06:00',false]]);
  assert.deepEqual(display(events([0,1,'00:00','06:00'],'2026-09-01T00:00','2026-10-01T00:00')),[['2026-09-01T00:00','2026-09-01T06:00',false]]);
});
test('fifth occurrence only exists when that weekday occurs five times',()=>{
  assert.deepEqual(display(events([4,4,'06:30','10:00'],'2026-10-01T00:00','2026-11-01T00:00')),[['2026-10-30T06:30','2026-10-30T10:00',false]]);
  assert.deepEqual(events([4,4,'06:30','10:00'],'2026-11-01T00:00','2026-12-01T00:00'),[]);
});
test('next fifth weekday can skip more than one month and cross a year',()=>{
  const e = calendar.nextConfirmedEvent([4,0,'09:00','12:00'],wall('2026-10-01T00:00'));
  assert.equal(date(e.start),'2026-11-30T09:00');
  const next = calendar.nextConfirmedEvent([4,4,'09:00','12:00'],wall('2026-11-01T00:00'));
  assert.equal(date(next.start),'2027-01-29T09:00');
});
test('monthly reset at year boundary retains both first Fridays',()=>{
  assert.deepEqual(display(events([0,4,'06:00','09:00'],'2026-12-01T00:00','2027-02-01T00:00')),[['2026-12-04T06:00','2026-12-04T09:00',false],['2027-01-01T06:00','2027-01-01T09:00',false]]);
});
test('overnight 00–06 belongs to the coming morning',()=>{
  const s=[2,1,'00:00','06:00'];
  assert.deepEqual(display(events(s,'2026-10-19T20:00','2026-10-20T09:00')),[['2026-10-20T00:00','2026-10-20T06:00',false]]);
  assert.deepEqual(events(s,'2026-10-20T20:00','2026-10-21T09:00'),[]);
});
test('half-open interval allows departure at cleaning start and arrival at cleaning end',()=>{
  const s=[2,1,'00:00','06:00'];
  assert.deepEqual(events(s,'2026-10-19T20:00','2026-10-20T00:00'),[]);
  assert.deepEqual(events(s,'2026-10-20T06:00','2026-10-20T09:00'),[]);
  assert.equal(events(s,'2026-10-19T20:00','2026-10-20T00:01').length,1);
  assert.equal(events(s,'2026-10-20T05:59','2026-10-20T09:00').length,1);
});
test('parity labels remain uncertain on every occurrence without ISO/date inference',()=>{
  for(const code of [5,6]) {
    const s=[code,1,'00:00','06:00'];
    assert.deepEqual(display(events(s,'2026-10-01T00:00','2026-11-01T00:00')),[['2026-10-06T00:00','2026-10-06T06:00',true],['2026-10-13T00:00','2026-10-13T06:00',true],['2026-10-20T00:00','2026-10-20T06:00',true],['2026-10-27T00:00','2026-10-27T06:00',true]]);
    assert.equal(calendar.nextConfirmedEvent(s,wall('2026-10-01T00:00')),null);
    assert.equal(calendar.analyzeSchedule(s,wall('2026-10-20T01:00'),wall('2026-10-20T02:00')).status,1);
    assert.equal(calendar.analyzeSchedule(s,wall('2026-10-21T01:00'),wall('2026-10-21T02:00')).status,0);
  }
});
test('13:30–13:30 is uncertain for its whole scheduled day',()=>{
  const s=[1,3,'13:30','13:30'];
  assert.deepEqual(display(events(s,'2026-10-08T00:00','2026-10-09T00:00')),[['2026-10-08T00:00','2026-10-09T00:00',true]]);
  for(const [a,b] of [['2026-10-08T00:00','2026-10-08T01:00'],['2026-10-08T23:00','2026-10-09T00:00']]) assert.equal(calendar.analyzeSchedule(s,wall(a),wall(b)).status,1);
  assert.deepEqual(events(s,'2026-10-07T23:00','2026-10-08T00:00'),[]);
  assert.deepEqual(events(s,'2026-10-09T00:00','2026-10-09T01:00'),[]);
  assert.equal(calendar.nextConfirmedEvent(s,wall('2026-10-01T00:00')),null);
});
test('synthetic cross-midnight shifts retain previous-day overlap',()=>{
  assert.deepEqual(display(events([4,3,'23:00','02:00'],'2026-12-31T23:30','2027-01-01T01:30')),[['2026-12-31T23:00','2027-01-01T02:00',false]]);
  assert.deepEqual(display(events([4,3,'23:00','02:00'],'2027-01-01T00:30','2027-01-01T01:30')),[['2026-12-31T23:00','2027-01-01T02:00',false]]);
});
test('spring and autumn DST transitions keep Roma wall-clock boundaries',()=>{
  assert.deepEqual(display(events([7,6,'00:00','06:00'],'2026-03-28T20:00','2026-03-29T09:00')),[['2026-03-29T00:00','2026-03-29T06:00',false]]);
  assert.deepEqual(display(events([7,6,'00:00','06:00'],'2026-10-24T20:00','2026-10-25T09:00')),[['2026-10-25T00:00','2026-10-25T06:00',false]]);
  assert.deepEqual(events([7,6,'00:00','06:00'],'2026-03-29T06:00','2026-03-29T07:00'),[]);
  assert.deepEqual(events([7,6,'00:00','06:00'],'2026-10-25T06:00','2026-10-25T07:00'),[]);
});
test('viewer timezone cannot shift recurrence results',()=>{
  const moduleUrl = new URL('../docs/assets/js/calendar.js', import.meta.url).href;
  const child = `import { parseWall, scheduleEvents } from ${JSON.stringify(moduleUrl)};\nprocess.stdout.write(JSON.stringify([parseWall('2026-10-25T06:00'),scheduleEvents([7,6,'00:00','06:00'],parseWall('2026-10-24T20:00'),parseWall('2026-10-25T09:00'))]));`;
  const outputs=['UTC','Europe/Rome','America/Los_Angeles','Pacific/Kiritimati'].map(TZ=>execFileSync(process.execPath,['--input-type=module','-e',child],{env:{...process.env,TZ},encoding:'utf8'}));
  for(const output of outputs) assert.equal(output,outputs[0]);
});
