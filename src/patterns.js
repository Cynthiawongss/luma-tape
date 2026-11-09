import {motifFor} from './catalog';
export const PATTERN_START=-6, PATTERN_SPAN=12.8;
const rnd=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x);};
export function makePattern(atlas,koi,c,artImage){
 const canvas=document.createElement('canvas');canvas.width=4096;canvas.height=512;const ctx=canvas.getContext('2d');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const motifs=motifFor(c.theme||'stream');
 if(c.art&&artImage){
  const tile=canvas.height*artImage.width/artImage.height;
  for(let x=0;x<canvas.width;x+=tile)ctx.drawImage(artImage,x,0,tile,canvas.height);
 }else if(motifs.length){
  for(let i=0;i<15;i++){
   const id=motifs[i%motifs.length],s=-5.7+i*.92+rnd(i+11)*.12;
   const v=.30+(i%3)*.44+(rnd(i+21)-.5)*.12;
   const size=id===-1?.6:(.49+rnd(i+29)*.20);
   const w=size/PATTERN_SPAN*canvas.width,h=id===-1?w*.5:w;
   ctx.save();ctx.translate((s-PATTERN_START)/PATTERN_SPAN*canvas.width,v/1.52*canvas.height);ctx.rotate((rnd(i+17)-.5)*(id===-1?1.7:.7));
   if(id===-1){if(i%3===0)ctx.scale(-1,1);ctx.drawImage(koi,-w/2,-h/2,w,h);}
   else {const cell=atlas.width/6,x=(id%6)*cell,y=Math.floor(id/6)*cell;ctx.drawImage(atlas,x,y,cell,cell,-w/2,-h/2,w,h);}
   ctx.restore();
  }
 }
 return {canvas,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};
}
export function samplePattern(pattern,s,v){
 const x=Math.max(0,Math.min(pattern.canvas.width-1,Math.floor((s-PATTERN_START)/PATTERN_SPAN*pattern.canvas.width))),y=Math.max(0,Math.min(pattern.canvas.height-1,Math.floor(v*pattern.canvas.height))),i=(y*pattern.canvas.width+x)*4;
 return pattern.data.subarray(i,i+4);
}
