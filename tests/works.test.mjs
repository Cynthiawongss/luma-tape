import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDesign, parseWorks, upsertWork} from '../src/works.js';

const themes = [{id: 'stream', colors: ['#7dd8d4', '#207f93', '#ffe7b9']}, {id: 'blank', colors: ['#e9ded2', '#b5a0af', '#ffdfb2']}];

test('a V6 save without the new pattern fields opens with defaults', () => {
  const design = normalizeDesign({theme: 'stream', colors: ['#111111', '#222222', '#333333'], style: 'bead', glitter: .4, density: .2, ripple: .9, art: ''}, themes);
  assert.equal(design.style, 'paper');
  assert.equal(design.scale, 1);
  assert.equal(design.fill, .6);
  assert.deepEqual(design.colors, ['#111111', '#222222', '#333333']);
  assert.equal(design.glitter, .4);
});
test('unknown themes and damaged values never crash a load', () => {
  assert.equal(normalizeDesign({theme: 'gone'}, themes), null);
  assert.equal(normalizeDesign(null, themes), null);
  const design = normalizeDesign({theme: 'blank', colors: ['red'], glitter: 9, scale: 40, art: 'javascript:1'}, themes);
  assert.deepEqual(design.colors, themes[1].colors);
  assert.equal(design.glitter, .85);
  assert.equal(design.scale, 1);
  assert.equal(design.art, '');
});
test('the works list survives broken storage and drops unreadable entries', () => {
  assert.deepEqual(parseWorks('{oops', themes), []);
  assert.deepEqual(parseWorks('{"a":1}', themes), []);
  const works = parseWorks(JSON.stringify([{id: 'a', name: 'One', design: {theme: 'stream'}}, {id: 'b', design: {theme: 'gone'}}]), themes);
  assert.equal(works.length, 1);
  assert.equal(works[0].design.style, 'paper');
});
test('saving again updates in place, a new work goes first', () => {
  const first = upsertWork([], {id: 'a', name: 'One'});
  const second = upsertWork(first, {id: 'b', name: 'Two'});
  assert.deepEqual(second.map(w => w.id), ['b', 'a']);
  assert.equal(upsertWork(second, {id: 'a', name: 'Renamed'})[1].name, 'Renamed');
});
