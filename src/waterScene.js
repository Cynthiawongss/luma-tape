import {assetUrl} from './assets';
import * as THREE from 'three';
import {makePattern} from './patterns';
import {tapeMaterialSettings} from './tapeStyle';
import {motifFor} from './catalog';
import {WIDTH,RADIUS,ROLL_X,ROLL_Y,tapeSurface,surfacePoint,ribbonGeometry} from './waterGeometry';

function studioEnvironment(renderer){
 const env=new THREE.Scene();env.background=new THREE.Color('#b5b5b5');
 const room=new THREE.Mesh(new THREE.BoxGeometry(22,20,22),new THREE.MeshBasicMaterial({color:'#b5b5b5',side:THREE.BackSide}));env.add(room);
 const add=(x,y,z,w,h,intensity)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity,intensity),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m);};
 add(-4,6,4,1.4,6,3);add(4,4,-2,.7,7,2);add(0,8,-4,5,.7,4);add(2,2,6,.22,5,3);add(-6,0,-1,1,8,.25);
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(env,.01);pmrem.dispose();env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return target;
}
const common=`
uniform float waterClock,waterStrength,glitterStrength,filmMode,opaquePaper,colorStrength;uniform sampler2D printedPattern;uniform vec3 foilTint,foilDeep,glitterTint;
varying vec2 foilUv;varying vec3 foilTangent;
float rnd(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
vec2 hash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1.,0.)),f.x),mix(rnd(i+vec2(0.,1.)),rnd(i+1.),f.x),f.y);}
// Multi-scale pulp and short fibers, fixed in the paper's own coordinates.
float paperPulp(vec2 p){
 float grain=noise2(p*42.);
 float strands=noise2(p*vec2(9.,145.)+vec2(noise2(p*15.)*.8,0.));
 float crossFiber=noise2(p*vec2(170.,18.)+19.);
 return grain*.48+strands*.36+crossFiber*.16;
}
float swell(vec2 p){return sin(p.x*2.1+p.y*1.6+waterClock*.22)*.45+sin(p.x*-.8+p.y*2.4-waterClock*.18)*.32+sin(p.x*3.3-p.y*.9+waterClock*.14)*.23;}
float waterFocus(vec2 p){
 p+=vec2(noise2(p*.65+waterClock*.035),noise2(p*.7+13.-waterClock*.03))*1.8;
 vec2 cell=floor(p),f=fract(p);float d1=10.,d2=10.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 g=vec2(float(x),float(y)),h=hash2(cell+g);
  vec2 pt=g+.5+.32*sin(6.28318*h+waterClock*.13)-f;
  float d=dot(pt,pt);if(d<d1){d2=d1;d1=d;}else d2=min(d2,d);
 }
 float edge=sqrt(d2)-sqrt(d1);
 float broken=smoothstep(.24,.79,noise2(p*1.17+waterClock*.025));
 return exp(-edge*edge*30.)*broken;
}
`;
function filmMaterial(uniforms){
 const m=new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.007,transmission:1,thickness:.012,ior:1.46,attenuationColor:'#a6e3ec',attenuationDistance:.2,clearcoat:.65,clearcoatRoughness:.018,envMapIntensity:1.0,side:THREE.FrontSide,iridescence:.025});
 m.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='attribute vec3 tapeTangent;varying vec2 foilUv;varying vec3 foilTangent;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nfoilUv=uv;foilTangent=normalize(mat3(modelViewMatrix)*tapeTangent);');
  shader.fragmentShader=common+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
   if(opaquePaper>.5){
    vec2 p=vec2(foilUv.x,foilUv.y*1.52);
    float pulp=paperPulp(p);
    float fiber=smoothstep(.62,.85,noise2(p*vec2(9.,145.)+7.));
    // Preserve the selected hue; paper lightness is not a transparency control.
    vec3 paperBase=mix(foilTint,vec3(1.),(1.-colorStrength)*.12);
    vec4 printInk=texture2D(printedPattern,vec2((foilUv.x+6.)/12.8,1.-foilUv.y));
    float lum=dot(printInk.rgb,vec3(.2126,.7152,.0722));
    vec3 crispInk=clamp(mix(vec3(lum),printInk.rgb,1.20)*1.06-.018,0.,1.);
    float coverage=pow(printInk.a,.72);
    diffuseColor.rgb=mix(paperBase,crispInk,coverage);
    // Fibers tint and catch light; the ink stays readable over the paper grain.
    float textureAmount=waterStrength*mix(1.,.38,coverage);
    diffuseColor.rgb*=1.+(pulp-.5)*textureAmount*.48;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.88,fiber*textureAmount*.28);
   }
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 tangentX=normalize(foilTangent);vec3 tangentY=normalize(cross(normal,tangentX));vec3 baseNormal=normal;
   vec2 wp=vec2(foilUv.x,foilUv.y*1.52)*2.;float ripple=swell(wp);
   vec2 grad=vec2(swell(wp+vec2(.02,0.))-ripple,swell(wp+vec2(0.,.02))-ripple)/.02;
   if(opaquePaper>.5){
    vec2 pp=vec2(foilUv.x,foilUv.y*1.52);float h=paperPulp(pp);
    vec2 slope=vec2(paperPulp(pp+vec2(.003,0.))-h,paperPulp(pp+vec2(0.,.003))-h)/.003;
    normal=normalize(normal-(tangentX*slope.x+tangentY*slope.y)*waterStrength*.012);
   }else normal=normalize(normal+(tangentX*grad.x+tangentY*grad.y)*waterStrength*.032);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <clearcoat_normal_fragment_begin>','#include <clearcoat_normal_fragment_begin>\n#ifdef USE_CLEARCOAT\nclearcoatNormal=normal;\n#endif');
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   vec2 p=vec2(foilUv.x,foilUv.y*1.52);
   float focus=filmMode<.5?waterFocus(p*2.25):0.;
   float depth=noise2(p*2.8+vec2(waterClock*.035,-waterClock*.017));
   // A transparent ink wash, with broad soft variations rather than opaque gray shading.
   float ink=.21+waterStrength*(.07+.16*depth);
   if(filmMode>4.5)ink+=sin(p.y*32.+sin(p.x*1.4)*2.)*.025*waterStrength;
   if(filmMode>3.5&&filmMode<4.5)ink+=sin(p.x*3.+sin(p.y*3.+waterClock*.1))*.05*waterStrength;
   vec3 dye=mix(foilTint,foilDeep,waterStrength*depth*.12);
   vec3 waterInk=mix(vec3(1.),dye,ink);
   if(opaquePaper<.5){outgoingLight*=waterInk;
   outgoingLight=mix(outgoingLight,vec3(1.),focus*waterStrength*.5);}
   if(opaquePaper>.5){
    // Keep pigment rich under soft studio lighting without flattening the roll shading.
    outgoingLight=mix(outgoingLight,diffuseColor.rgb,.20);
   }
   float foilAmount=glitterStrength*mix(1.,.50,opaquePaper);
   vec3 V=normalize(vViewPosition),L=normalize((viewMatrix*vec4(normalize(vec3(-3.,8.,3.)),0.)).xyz),H=normalize(V+L);
   // All facets stay in the tape's own coordinate frame, including through the roll join.
   vec2 grid=p*22.,cell=floor(grid);vec2 f=fract(grid)-(.18+hash2(cell)*.64);
   float seed=rnd(cell+3.);vec2 tilt=(hash2(cell+39.)-.5)*2.4;
   vec3 facetN=normalize(baseNormal+tangentX*tilt.x+tangentY*tilt.y);
   float spec=pow(max(0.,dot(facetN,H)),145.);
   float shape=1.-smoothstep(.055,.14,length(f));
   float visible=step(1.-foilAmount*.48,seed)*shape;
   vec3 metal=mix(vec3(.48,.76,.81),vec3(.94,.77,.43),rnd(cell+18.));
   outgoingLight=mix(outgoingLight,metal,visible*.18);
   outgoingLight+=mix(vec3(.65,.95,1.),vec3(1.,.88,.55),rnd(cell+91.))*spec*visible*12.;
   vec2 bigGrid=p*6.5,bc=floor(bigGrid),bf=fract(bigGrid)-(.25+hash2(bc+2.)*.5);
   vec2 bt=(hash2(bc+71.)-.5)*3.1;vec3 bn=normalize(baseNormal+tangentX*bt.x+tangentY*bt.y);
   float bspec=pow(max(0.,dot(bn,H)),72.)*step(1.-foilAmount*.65,rnd(bc+11.));
   float ray=exp(-abs(bf.x)*70.)*exp(-abs(bf.y)*5.)+exp(-abs(bf.y)*70.)*exp(-abs(bf.x)*5.);
   float halo=exp(-dot(bf,bf)*32.);
   // Silver/holographic rims give a white glint a visible edge even on a white studio.
   outgoingLight=mix(outgoingLight,vec3(.30,.74,.83),halo*bspec*.65);
   outgoingLight+=mix(vec3(1.),glitterTint,.32)*bspec*(ray*mix(6.,2.4,opaquePaper)+halo*mix(.45,.10,opaquePaper));
   #include <opaque_fragment>
  `);
 };return m;
}
function motifMaterial(texture,clock){
 return new THREE.ShaderMaterial({uniforms:{fishImage:{value:texture},clock,tip:{value:4.5},motifKind:{value:0},patternImage:{value:null}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 uniform sampler2D fishImage,patternImage;uniform float clock,tip,motifKind;varying vec2 vUv;
 float rnd(float x){return fract(sin(x*127.1)*43758.5453);}
 void main(){
 if(motifKind>.5){vec4 ink=texture2D(patternImage,vec2((vUv.x+6.)/12.8,1.-vUv.y));if(ink.a<.18)discard;gl_FragColor=vec4(ink.rgb,1.);
 #include <colorspace_fragment>
 return;}
 vec4 best=vec4(0.);vec2 p=vec2(vUv.x,vUv.y*1.52);
 for(int i=0;i<14;i++){
  float fi=float(i),seed=rnd(fi+5.),dir=seed>.5?1.:-1.;
  float phase=clock*(.085+rnd(fi+8.)*.035)+fi*2.6;
  float cx=-5.7+fi*.92+rnd(fi+11.)*.12+sin(phase)*.12*dir;
  if(cx>tip-.36)continue;float cy=.30+mod(fi,3.)*.44+(rnd(fi+21.)-.5)*.12+sin(phase*.8+fi)*.025;
  float angle=(dir<0.?3.141593:0.)+(rnd(fi+17.)-.5)*1.7+sin(phase*.8+fi)*.065;
  float size=.51+rnd(fi+29.)*.19;
  vec2 q=p-vec2(cx,cy);q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;q/=vec2(size,size*.5);
  float tail=pow(clamp((.28-q.x)/.78,0.,1.),2.);
  q.y+=sin(q.x*7.-clock*(1.7+rnd(fi+7.)*.6)+fi)*.055*tail;q+=.5;
  if(q.x>0.&&q.x<1.&&q.y>0.&&q.y<1.){vec4 c=texture2D(fishImage,q);if(c.a>best.a)best=c;}
 }
 if(best.a<.28)discard;gl_FragColor=vec4(best.rgb,1.);
 #include <colorspace_fragment>
 }`,side:THREE.DoubleSide,depthWrite:true});
}

export function createWaterScene(host,getConfig,onReady,onError){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xffffff,1);renderer.toneMapping=THREE.NoToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('white');const environment=studioEnvironment(renderer);scene.environment=environment.texture;
 const camera=new THREE.PerspectiveCamera(31,1,.1,80);camera.position.set(5.3,5.6,10.5);camera.lookAt(.35,.45,0);
 const group=new THREE.Group();scene.add(group);scene.add(new THREE.HemisphereLight(0xffffff,0xf0ece4,.72));
 const key=new THREE.DirectionalLight(0xffffff,.9);key.position.set(-3,8,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.01;key.shadow.bias=-.0003;scene.add(key);
 const fill=new THREE.DirectionalLight(0xffffff,.5);fill.position.set(5,2,-4);scene.add(fill);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.055}));ground.rotation.x=-Math.PI/2;ground.position.y=-.007;ground.receiveShadow=true;scene.add(ground);
 const clock={value:0},uniforms={waterClock:clock,waterStrength:{value:.6},glitterStrength:{value:.8},foilTint:{value:new THREE.Color('#8bc8d3')},foilDeep:{value:new THREE.Color('#367f91')},glitterTint:{value:new THREE.Color('#fff1c6')},filmMode:{value:0},opaquePaper:{value:0},colorStrength:{value:.35},printedPattern:{value:null}};
 const film=filmMaterial(uniforms);let surface=tapeSurface();const strip=new THREE.Mesh(ribbonGeometry(surface),film);group.add(strip);
 const rollGroup=new THREE.Group();group.add(rollGroup);
 const paper=new THREE.MeshStandardMaterial({color:0xe6e5df,roughness:.72,envMapIntensity:.18,side:THREE.DoubleSide});
 const core=new THREE.Mesh(new THREE.CylinderGeometry(.665,.665,WIDTH-.012,128,1,true),paper);core.rotation.x=Math.PI/2;core.position.set(ROLL_X,ROLL_Y,0);rollGroup.add(core);core.castShadow=true;
 const paperOuter=new THREE.Mesh(new THREE.CylinderGeometry(.707,.707,WIDTH-.012,128,1,true),paper);paperOuter.rotation.x=Math.PI/2;paperOuter.position.copy(core.position);rollGroup.add(paperOuter);
 const ringMat=new THREE.MeshPhysicalMaterial({color:0xffffff,transmission:1,thickness:.05,roughness:.018,ior:1.31,attenuationDistance:.3,attenuationColor:'#b2e3eb',side:THREE.DoubleSide});
 const rims=[];
 for(const z of [-WIDTH/2,WIDTH/2]){
  const end=new THREE.Mesh(new THREE.RingGeometry(.665,.707,128),paper);end.position.set(ROLL_X,ROLL_Y,z);rollGroup.add(end);
  const layers=new THREE.Mesh(new THREE.RingGeometry(.707,RADIUS,128),ringMat);layers.position.set(ROLL_X,ROLL_Y,z);rollGroup.add(layers);
  for(let i=0;i<17;i++){const r=.715+i*.0133,rim=new THREE.Mesh(new THREE.TorusGeometry(r,.001,4,128),new THREE.MeshBasicMaterial({color:'#86c9d4',transparent:true,opacity:.23}));rim.position.set(ROLL_X,ROLL_Y,z+.001*Math.sign(z));rollGroup.add(rim);rims.push(rim);}
 }
 const edgeMat=new THREE.MeshBasicMaterial({color:'#9dd9e4',transparent:true,opacity:.48});
 const edges=[new THREE.Mesh(new THREE.BufferGeometry(),edgeMat),new THREE.Mesh(new THREE.BufferGeometry(),edgeMat)];edges.forEach(e=>group.add(e));
 let fishTexture,atlasTexture,fishMat,fish,patternTexture,pattern,patternKey='',artSource='',artImage=null,disposed=false,assetsLoaded=0;
 const loaded=()=>{if(disposed)return;if(++assetsLoaded===2){fishMat=motifMaterial(fishTexture,clock);fish=new THREE.Mesh(ribbonGeometry(surface,{depth:0,offset:-.002,closed:false}),fishMat);group.add(fish);onReady?.();}};
 const loadAsset=url=>new THREE.TextureLoader().load(url,t=>{if(disposed){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);loaded();},undefined,()=>onError?.('主题素材加载失败，请刷新页面。'));
 fishTexture=loadAsset(assetUrl('koi.png'));atlasTexture=loadAsset(assetUrl('theme-atlas-v1.png'));
 const refreshPattern=c=>{
  if(!fishMat)return;
  if((c.art||'')!==artSource){artSource=c.art||'';artImage=null;if(artSource){const requested=artSource,im=new Image();im.onload=()=>{if(!disposed&&requested===artSource){artImage=im;patternKey='';}};im.src=artSource;}}
  const next=(c.theme||'stream')+'|'+artSource+'|'+!!artImage;
  if(next!==patternKey){patternKey=next;pattern=makePattern(atlasTexture.image,fishTexture.image,c,artImage);patternTexture?.dispose();patternTexture=new THREE.CanvasTexture(pattern.canvas);patternTexture.colorSpace=THREE.SRGBColorSpace;patternTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),16);fishMat.uniforms.patternImage.value=patternTexture;uniforms.printedPattern.value=patternTexture;}
  fishMat.uniforms.motifKind.value=motifFor(c.theme||'stream')[0]===-1&&!c.art?0:1;
 };
 const probe=new THREE.Group();scene.add(probe);for(let i=0;i<5;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.035,.008,2.1),new THREE.MeshBasicMaterial({color:i%2?0xd5dddd:0x536775}));bar.position.set(-.8+i*.5,.012,0);probe.add(bar);}probe.visible=false;
 let lastKey='',angle=0,targetAngle=0,tilt=0,targetTilt=0,lastTime=performance.now(),raf,fit=1,dragging=null;
 const rebuild=c=>{surface=tapeSurface(c.extension,c.view!=='roll');strip.geometry.dispose();strip.geometry=ribbonGeometry(surface);if(fish){fish.geometry.dispose();fish.geometry=ribbonGeometry(surface,{depth:0,offset:-.002,closed:false});}edges.forEach((e,k)=>{const pts=Array.from({length:441},(_,i)=>surfacePoint(surface,-surface.arcLength+i/440*surface.length,k,.002).p);e.geometry.dispose();e.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),440,.0018,4,false);});};
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;fit=Math.min(1,camera.aspect/1.5);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const down=e=>{dragging={x:e.clientX,y:e.clientY,a:targetAngle,t:targetTilt};host.setPointerCapture(e.pointerId);};
 const move=e=>{if(!dragging)return;targetAngle=THREE.MathUtils.clamp(dragging.a+(e.clientX-dragging.x)*.006,-1.3,1.3);targetTilt=THREE.MathUtils.clamp(dragging.t+(e.clientY-dragging.y)*.0025,-.23,.23);};
 const up=()=>dragging=null;host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',up);
 function frame(){const now=performance.now(),dt=Math.min(.25,(now-lastTime)/1000);lastTime=now;const c=getConfig();if(c.motion)clock.value+=dt;refreshPattern(c);
  const key=c.extension+'|'+c.view+'|'+!!fish;if(key!==lastKey){lastKey=key;rebuild(c);}
  const tint=new THREE.Color(c.colors?.[0]||c.color),lightTint=tint.clone();
  uniforms.foilTint.value.copy(lightTint);uniforms.waterStrength.value=c.ripple;uniforms.opaquePaper.value=c.style==='paper'?1:0;uniforms.colorStrength.value=c.density;uniforms.glitterStrength.value=c.glitter;uniforms.foilDeep.value.set(c.colors?.[1]||c.color);uniforms.glitterTint.value.set(c.colors?.[2]||'#fff1c6');uniforms.filmMode.value=['water','garden','cosmic','mineral','ember','sand','blank'].indexOf(c.mode||'water');
  film.attenuationColor.copy(lightTint);film.color.set('white');film.attenuationDistance=.18;
  const materialState=tapeMaterialSettings(c.style,c.density);for(const [key,value] of Object.entries(materialState))film[key]=value;
  ringMat.attenuationColor.copy(lightTint);ringMat.thickness=.05+c.density*.12;ringMat.transmission=c.style==='paper'?0:1;ringMat.roughness=c.style==='paper'?.98:.018;ringMat.envMapIntensity=c.style==='paper'?.08:1;ringMat.specularIntensity=c.style==='paper'?.12:1;ringMat.color.copy(c.style==='paper'?lightTint.clone().lerp(new THREE.Color('white'),(1.-c.density)*.12):new THREE.Color('white'));
  rims.forEach(r=>{r.material.color.copy(c.style==='paper'?tint:lightTint);r.material.opacity=c.style==='paper'?.22:.23;});edgeMat.color.copy(tint).lerp(new THREE.Color('white'),.3);
  rollGroup.visible=c.view==='roll';probe.visible=c.view==='film';if(fish){fish.visible=c.view!=='film'&&c.style!=='paper';fishMat.uniforms.tip.value=surface.tailLength;}
  const ease=1.-Math.exp(-dt*12.);angle+=(targetAngle-angle)*ease;tilt+=(targetTilt-tilt)*ease;group.rotation.y=angle;group.rotation.x=tilt;group.scale.setScalar(1.32*fit*c.zoom);group.position.y=.03;
  renderer.render(scene,camera);host.dataset.angle=group.rotation.y.toFixed(3);host.dataset.glitter=String(c.glitter);host.dataset.motion=String(c.motion);host.dataset.material=c.style;host.dataset.transmission=String(film.transmission);host.dataset.opacity=String(film.opacity);raf=requestAnimationFrame(frame);
 }
 frame();
 return {reset(){targetAngle=0;targetTilt=0;},async exportSticker(){
 const c=getConfig(),size=new THREE.Vector2();renderer.getSize(size);const ratio=renderer.getPixelRatio(),aspect=camera.aspect,oldBackground=scene.background;cancelAnimationFrame(raf);
 const alphaFilm=film.clone();alphaFilm.onBeforeCompile=film.onBeforeCompile;Object.assign(alphaFilm,tapeMaterialSettings(c.style,c.density,true));alphaFilm.color.set(c.style==='paper'?'white':c.colors?.[0]||c.color);
 strip.material=alphaFilm;scene.background=null;renderer.setClearColor(0,0);ground.visible=false;rollGroup.visible=false;probe.visible=false;rebuild({...c,view:'strip'});
 renderer.setPixelRatio(1);renderer.setSize(2400,1400,false);camera.aspect=2400/1400;camera.updateProjectionMatrix();renderer.render(scene,camera);
 const raw=document.createElement('canvas');raw.width=2400;raw.height=1400;const ctx=raw.getContext('2d',{willReadFrequently:true});ctx.drawImage(renderer.domElement,0,0);const data=ctx.getImageData(0,0,2400,1400).data;let x0=2400,y0=1400,x1=0,y1=0;
 for(let y=0;y<1400;y++)for(let x=0;x<2400;x++)if(data[(y*2400+x)*4+3]>5){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 const out=document.createElement('canvas');out.width=2400;out.height=1400;const w=Math.max(1,x1-x0+1),h=Math.max(1,y1-y0+1),scale=Math.min(2240/w,1240/h);out.getContext('2d').drawImage(raw,x0,y0,w,h,(2400-w*scale)/2,(1400-h*scale)/2,w*scale,h*scale);const url=out.toDataURL('image/png');
 strip.material=film;alphaFilm.dispose();scene.background=oldBackground;renderer.setClearColor(0xffffff,1);ground.visible=true;rebuild(c);lastKey='';renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();lastTime=performance.now();frame();return url;
 },async exportPng(){const old=new THREE.Vector2();renderer.getSize(old);const ratio=renderer.getPixelRatio(),aspect=camera.aspect;cancelAnimationFrame(raf);renderer.setPixelRatio(1);renderer.setSize(2400,1600,false);camera.aspect=1.5;camera.updateProjectionMatrix();renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');renderer.setPixelRatio(ratio);renderer.setSize(old.x,old.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();lastTime=performance.now();frame();return url;},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',up);host.removeEventListener('pointercancel',up);const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());fishTexture?.dispose();atlasTexture?.dispose();patternTexture?.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}};
}
