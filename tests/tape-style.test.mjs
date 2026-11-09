import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTapeStyle,tapeMaterialSettings} from '../src/tapeStyle.js';

test('ordinary tape stays opaque at every color strength in preview and PNG export',()=>{
  for(const density of [0,.35,1]) for(const exporting of [false,true]) {
    const material=tapeMaterialSettings('paper',density,exporting);
    assert.equal(material.transmission,0);
    assert.equal(material.opacity,1);
    assert.equal(material.transparent,false);
    assert.equal(material.depthWrite,true);
  }
});
test('retired bead saves migrate and transparent tape keeps its independent optics',()=>{
  assert.equal(normalizeTapeStyle('bead'),'paper');
  assert.equal(normalizeTapeStyle(undefined),'paper');
  assert.equal(normalizeTapeStyle('world'),'world');
  assert.equal(tapeMaterialSettings('world',1).transmission,1);
  const exported=tapeMaterialSettings('world',1,true);
  assert.equal(exported.transparent,true);
  assert.ok(exported.opacity<1);
});
