// Conversión de desarrollo: el navegador solo carga OBJ + texturas con p5.js.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const salida='models/p5'; await mkdir(salida,{recursive:true});
const manifest={};
const dot=(a,b)=>a.reduce((v,n,i)=>v+n*b[i],0);
const norm=v=>{const m=Math.hypot(...v)||1;return v.map(n=>n/m)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const transform=(v,m)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]];
const round=n=>Number(n.toFixed(6));
async function convertir(id,ruta,rod=false){
 const doc=await io.read(ruta), grupos=new Map();
 for(const node of doc.getRoot().listNodes()){
  if(!node.getMesh()||/water|robe|hook/i.test(node.getName()))continue;
  for(const prim of node.getMesh().listPrimitives()){
   const mat=prim.getMaterial(), key=mat?.getName()||'material';
   if(!grupos.has(key))grupos.set(key,{nombre:key,vertices:[],uv:[],faces:[],material:mat});
   const g=grupos.get(key),pos=prim.getAttribute('POSITION'),uv=prim.getAttribute('TEXCOORD_0'),indices=prim.getIndices(),base=g.vertices.length;
   for(let i=0;i<pos.getCount();i++){g.vertices.push(transform(pos.getElement(i,[]),node.getWorldMatrix()));g.uv.push(uv?uv.getElement(i,[]):[0,0]);}
   const n=indices?indices.getCount():pos.getCount();for(let i=0;i<n;i+=3)g.faces.push([0,1,2].map(k=>base+(indices?indices.getScalar(i+k):i+k)));
  }
 }
 const all=[...grupos.values()].flatMap(g=>g.vertices);
 if(rod){
  const center=[0,1,2].map(i=>all.reduce((s,p)=>s+p[i],0)/all.length);
  const covariance=Array.from({length:3},()=>[0,0,0]);
  for(const p of all)for(let i=0;i<3;i++)for(let j=0;j<3;j++)covariance[i][j]+=(p[i]-center[i])*(p[j]-center[j]);
  let axis=[0,0,1];for(let i=0;i<25;i++)axis=norm(covariance.map(row=>dot(row,axis)));
  if(axis[2]>0)axis=axis.map(n=>-n);
  const right=norm(cross(axis,[0,1,0])),up=norm(cross(right,axis));
  const ds=all.map(p=>dot(p.map((v,i)=>v-center[i]),axis)),lo=Math.min(...ds),hi=Math.max(...ds),len=hi-lo;
  for(const g of grupos.values())g.vertices=g.vertices.map(p=>{const d=p.map((v,i)=>v-center[i]);return[dot(d,right)/len,dot(d,up)/len,-(dot(d,axis)-lo)/len]});
 }
 const vertices=[...grupos.values()].flatMap(g=>g.vertices);
 const min=[0,1,2].map(i=>Math.min(...vertices.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...vertices.map(p=>p[i])));
 manifest[id]={min,max,partes:[]};
 for(const [index,g] of [...grupos.values()].entries()){
  const archivo=`${id}-${index}.obj`, tex=g.material?.getBaseColorTexture();
  const lines=['# Blue Haven — convertido para p5.js; ver docs/PROCEDENCIA.md',...g.vertices.map(p=>'v '+p.map(round).join(' ')),...g.uv.map(uv=>'vt '+[round(uv[0]),round(1-uv[1])].join(' ')),...g.faces.map(f=>'f '+f.map(i=>`${i+1}/${i+1}`).join(' '))];
  await writeFile(`${salida}/${archivo}`,lines.join('\n')+'\n');
  let textura=null;if(tex){const ext=tex.getMimeType()==='image/webp'?'webp':tex.getMimeType()==='image/jpeg'?'jpg':'png';textura=`${salida}/${id}-${index}.${ext}`;await writeFile(textura,tex.getImage());}
  const color=g.material?.getBaseColorFactor()?.slice(0,3).map(x=>Math.round(x*255))||[210,210,210];
  manifest[id].partes.push({nombre:g.nombre,ruta:`${salida}/${archivo}`,textura,color});
 }
}
await convertir('tienda','models/fishing_house/tiendaPesca.glb');
await convertir('basica','models/fishing_rod/scene.gltf',true);
await convertir('bambu','models/bamboo_fishing_rod/scene.gltf',true);
// OBJ del vendedor separado por material; conserva sus texturas originales.
const kiwi=await readFile('models/3D/KIWIFINA.obj','utf8'),pref=[],groups=new Map();let group;
for(const l of kiwi.split(/\r?\n/)){if(/^(v |vt |vn )/.test(l))pref.push(l);else if(l.startsWith('usemtl ')){group=l.slice(7).trim();if(!groups.has(group))groups.set(group,[])}else if(l.startsWith('f ')&&group)groups.get(group).push(l)}
manifest.kiwi={partes:[]};const texturas={Bot:'Bot.png',Gradiant:'Gradiantes.png',KiwiFace:'CaraKIWIFINAL.png'};
for(const [name,faces] of groups){const ruta=`${salida}/kiwi-${name}.obj`;await writeFile(ruta,pref.concat(faces).join('\n')+'\n');manifest.kiwi.partes.push({nombre:name,ruta,textura:'models/3D/'+texturas[name],color:[255,255,255]})}
const pts=pref.filter(l=>l.startsWith('v ')).map(l=>l.slice(2).trim().split(/\s+/).map(Number));manifest.kiwi.min=[0,1,2].map(i=>Math.min(...pts.map(p=>p[i])));manifest.kiwi.max=[0,1,2].map(i=>Math.max(...pts.map(p=>p[i])));
await writeFile(`${salida}/manifest.js`,'// Generado por scripts/convertir-modelos-p5.mjs\nconst MODELOS_P5 = '+JSON.stringify(manifest,null,2)+';\n');
console.log(Object.fromEntries(Object.entries(manifest).map(([k,v])=>[k,{min:v.min,max:v.max,partes:v.partes.length}])));
