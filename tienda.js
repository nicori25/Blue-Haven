// Colisiones geométricas del modelo OBJ; no dependen del motor de renderizado.
const TIENDA_COLUMNA = 28.5;
const TIENDA_FILA = 19;
const TIENDA_ESCALA = 27;
const TIENDA_FACTOR = TIENDA_ESCALA / 19;
const TIENDA_AJUSTE_ALTURA = 15;
const TIENDA = { posicion: null, lista: false, baseY: 0, suelo: new Map(), paredes: new Map() };
function tiendaInicializar() {
  TIENDA.posicion = createVector(TAMAÑO_CELDA * TIENDA_COLUMNA,TAMAÑO_CELDA * TIENDA_FILA);
}
function transformarPuntoTienda(v) {
  return { x: TIENDA.posicion.x-v.z*TIENDA_ESCALA, y: TIENDA.baseY+v.y*TIENDA_ESCALA, z: TIENDA.posicion.y+v.x*TIENDA_ESCALA };
}
function _indiceColision(x,z) { return Math.floor(x/64)+','+Math.floor(z/64); }
function _agregarTriangulo(mapa, t) {
  const x0=Math.floor(Math.min(...t.map(p=>p.x))/64),x1=Math.floor(Math.max(...t.map(p=>p.x))/64);
  const z0=Math.floor(Math.min(...t.map(p=>p.z))/64),z1=Math.floor(Math.max(...t.map(p=>p.z))/64);
  for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
    const key=x+','+z;if(!mapa.has(key))mapa.set(key,[]);mapa.get(key).push(t);
  }
}
function tiendaRegistrarColisiones(partes) {
  TIENDA.suelo.clear(); TIENDA.paredes.clear();
  const casa=partes.find(p=>p.nombre==='House');
  TIENDA.baseY=TIENDA_AJUSTE_ALTURA-Math.min(...casa.geometria.vertices.map(v=>v.y))*TIENDA_ESCALA;
  for(const parte of partes){
    const destino=parte.nombre==='Floor'?TIENDA.suelo:/House|Box/.test(parte.nombre)?TIENDA.paredes:null;
    if(!destino)continue;
    for(const face of parte.geometria.faces){
      const t=face.map(i=>transformarPuntoTienda(parte.geometria.vertices[i]));
      _agregarTriangulo(destino,t);
    }
  }
  TIENDA.lista=true;
}
function alturaEnTriangulo(x,z,t) {
  const [a,b,c]=t,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if(Math.abs(den)<0.00001)return null;
  const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den;
  const v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
  if(u<-.0001||v<-.0001||u+v>1.0001)return null;
  return u*a.y+v*b.y+(1-u-v)*c.y;
}
function tiendaAlturaPiso(x,z,referencia=0) {
  let altura=null;
  // Incluye una tolerancia para las rendijas entre las tablas del muelle.
  for(const [dx,dz] of [[0,0],[5,0],[-5,0],[0,5],[0,-5]]){
    for(const t of TIENDA.suelo.get(_indiceColision(x+dx,z+dz))||[]){
      const y=alturaEnTriangulo(x+dx,z+dz,t);
      if(y!==null&&y<=referencia+35&&y>=-5&&(altura===null||y>altura))altura=y;
    }
    if(altura!==null)break;
  }
  return altura===null?0:altura;
}
function distanciaSegmento(x,z,a,b) {
  const dx=b.x-a.x,dz=b.z-a.z;
  const u=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-a.x-dx*u,z-a.z-dz*u);
}
function segmentoEnAltura(t,y) {
  const puntos=[];
  for(let i=0;i<3;i++){
    const a=t[i],b=t[(i+1)%3];
    if((a.y<=y&&b.y>=y)||(b.y<=y&&a.y>=y)){
      if(Math.abs(b.y-a.y)<0.0001)continue;
      const f=(y-a.y)/(b.y-a.y);puntos.push({x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f});
    }
  }
  return puntos.length>=2?puntos:null;
}
function tiendaColisiona(pos) {
  if(!TIENDA.lista)return false;
  const radio=10,base=tiendaAlturaPiso(pos.x,pos.y,typeof jugador!=='undefined'?jugador?.alturaPiso||0:0);
  const candidatos=new Set();
  for(const dx of [-radio,radio])for(const dz of [-radio,radio])for(const t of TIENDA.paredes.get(_indiceColision(pos.x+dx,pos.y+dz))||[])candidatos.add(t);
  for(const t of candidatos)for(const y of [base+8,base+24,base+38]){
    const s=segmentoEnAltura(t,y);if(s&&distanciaSegmento(pos.x,pos.y,s[0],s[1])<radio)return true;
  }
  return false;
}
