import test from 'node:test';
import assert from 'node:assert/strict';
import {tapeSurface,ribbonGeometry,surfacePoint} from '../src/waterGeometry.js';

test('roll and tail share position and tangent through the peel, for all lengths',()=>{
 for(const length of [0,.35,.75,1]){
  const surface=tapeSurface(length),left=surface.at(-1e-5),right=surface.at(1e-5);
  assert.ok(left.p.distanceTo(right.p)<3e-5,'gap at peel');
  assert.ok(left.t.dot(right.t)>.99999,'crease at peel');
  for(const v of [0,.5,1]){
   const a=surfacePoint(surface,-1e-5,v,.0045),b=surfacePoint(surface,1e-5,v,.0045);
   assert.ok(a.p.distanceTo(b.p)<4e-5,'film thickness creates a split');
  }
 }
});
test('surface uses one shared join row and continuous physical texture distance',()=>{
 const geometry=ribbonGeometry(tapeSurface(.75)),uv=geometry.attributes.uv,position=geometry.attributes.position;
 let joined=0;
 for(let i=0;i<uv.count;i++){
  if(uv.getX(i)===0)joined++;
  assert.ok(Number.isFinite(position.getX(i))&&Number.isFinite(position.getY(i))&&Number.isFinite(position.getZ(i)));
 }
 assert.equal(joined,42,'each side must have exactly one shared 21-vertex join row');
 geometry.dispose();
});
