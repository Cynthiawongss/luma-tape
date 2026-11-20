import test from 'node:test';
import assert from 'node:assert/strict';
import {hexToOklch, oklchToHex, harmonize} from '../src/color.js';

test('OKLCH conversion round-trips ordinary tape colours', () => {
  for (const hex of ['#7dd8d4', '#ff7f6e', '#2f6fe0', '#ffffff', '#161616']) assert.equal(oklchToHex(hexToOklch(hex)), hex);
});
test('a derived palette keeps the base and separates the print colours in lightness', () => {
  for (const base of ['#7dd8d4', '#edc8db', '#2f6fe0', '#ffd24a', '#242a57']) {
    const [same, deep, accent] = harmonize(base);
    assert.equal(same, base);
    for (const c of [deep, accent]) assert.match(c, /^#[0-9a-f]{6}$/);
    const [l0] = hexToOklch(base), [l1] = hexToOklch(deep), [l2] = hexToOklch(accent);
    assert.ok(Math.abs(l0 - l1) >= .12 || l0 < .45, `deep too close to ${base}`);
    assert.ok(l2 >= .88, 'accent stays pale enough to read as a highlight');
  }
});
