import * as THREE from 'three';
export const WIDTH=1.52, RADIUS=.94, ROLL_X=-1.8, ROLL_Y=1.03;

export function tapePath(extension=1,sample=false){
 const path=new THREE.CurvePath();
 if(sample){path.add(new THREE.CubicBezierCurve3(new THREE.Vector3(-2,.28,0),new THREE.Vector3(-.8,.15,0),new THREE.Vector3(.6,.15,0),new THREE.Vector3(1.1+extension*2,.32,0)));return path;}
 const end=1.55+extension*2;
 path.add(new THREE.CubicBezierCurve3(new THREE.Vector3(ROLL_X+RADIUS,ROLL_Y,0),new THREE.Vector3(ROLL_X+RADIUS,.38,0),new THREE.Vector3(-.36,.1,0),new THREE.Vector3(.42,.1,0)));
 path.add(new THREE.CubicBezierCurve3(new THREE.Vector3(.42,.1,0),new THREE.Vector3(.95,.1,0),new THREE.Vector3(end-.55,.1,0),new THREE.Vector3(end,.18,0)));
 return path;
}

// One surface, one arc-length coordinate, one material across the peel point.
// The clockwise outer turn meets the tail with exactly the same tangent.
export function tapeSurface(extension=.75,sample=false){
 const tail=tapePath(extension,sample),tailLength=tail.getLength();
 const arcLength=sample?0:Math.PI*2*RADIUS;
 return {tail,tailLength,arcLength,length:arcLength+tailLength,
  at(s){
   if(!sample&&s<0){const a=-s/RADIUS;return {p:new THREE.Vector3(ROLL_X+RADIUS*Math.cos(a),ROLL_Y+RADIUS*Math.sin(a),0),t:new THREE.Vector3(Math.sin(a),-Math.cos(a),0)};}
   const u=THREE.MathUtils.clamp(s/tailLength,0,1);return {p:tail.getPointAt(u),t:tail.getTangentAt(u)};
  }
 };
}
export function surfacePoint(surface,s,v,offset=0){
 const {p,t}=surface.at(s),n=new THREE.Vector3(-t.y,t.x,0).normalize();
 const curl=Math.pow(Math.abs(v-.5)*2,4)*.004;
 p.addScaledVector(n,offset+curl);p.z=(v-.5)*WIDTH;
 return {p,t,n};
}
export function ribbonGeometry(surface,{offset=0,depth=.009,closed=true}={}){
 // Explicitly include s=0, so the join shares vertices rather than merely coinciding.
 const arcSteps=surface.arcLength?240:0,tailSteps=200,ny=20;
 const distances=[];
 for(let i=0;i<arcSteps;i++)distances.push(-surface.arcLength+i/arcSteps*surface.arcLength);
 for(let i=0;i<=tailSteps;i++)distances.push(i/tailSteps*surface.tailLength);
 const nx=distances.length-1,stride=ny+1,layer=distances.length*stride;
 const pos=[],uv=[],tangent=[],index=[],normals=[];
 for(let k=0;k<(closed?2:1);k++)for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){
  const s=distances[i],v=j/ny,{p,t,n}=surfacePoint(surface,s,v,offset+(k===0?1:-1)*depth/2);
  if(i===nx)p.x+=Math.sin(j*1.73)*.002;
  pos.push(p.x,p.y,p.z);uv.push(s,v);tangent.push(t.x,t.y,t.z);normals.push(n.x*(k? -1:1),n.y*(k?-1:1),n.z);
 }
 for(let k=0;k<(closed?2:1);k++)for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
  const a=k*layer+i*stride+j,b=a+stride;
  if(k===0)index.push(a,a+1,b,b,a+1,b+1);else index.push(a,b,a+1,b,b+1,a+1);
 }
 if(closed){for(let i=0;i<nx;i++)for(const j of [0,ny]){const a=i*stride+j,b=a+stride;index.push(a,b,a+layer,b,b+layer,a+layer);}for(const i of [0,nx])for(let j=0;j<ny;j++){const a=i*stride+j,b=a+1;index.push(a,a+layer,b,b,a+layer,b+layer);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('tapeTangent',new THREE.Float32BufferAttribute(tangent,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(index);return g;
}
