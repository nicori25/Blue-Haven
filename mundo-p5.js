// Todo el dibujo 3D usa la API de p5.js WEBGL.
const modelosP5 = {};
const recursosP5 = {};
const lotesTerreno = [];
const estadisticasRender = { dibujos: 0, triangulos: 0, motor: 'p5.js WEBGL' };
let geometriaAgua;
let numeroGeometria = 0;
function precargarMundoP5() {
  for(const [tipo,modelo] of Object.entries(MODELOS_P5)) {
    modelosP5[tipo]=modelo.partes.map(parte=>({ ...parte, geometria:loadModel(parte.ruta,false), imagen:parte.textura?loadImage(parte.textura):null }));
  }
  recursosP5.arbol=loadModel('models/3D/Modelo_arbol.obj',true);
  recursosP5.suelo=loadImage('textures/mundo/Materiales_Suelo.png');
  recursosP5.pared=loadImage('textures/mundo/pared.png');
  recursosP5.agua=loadImage('textures/mundo/Agua.gif');
}
function nuevaGeometria() {
  const geo=new p5.Geometry();geo.gid='bluehaven-p5-'+numeroGeometria++;return geo;
}
function agregarCuadrilatero(geo,puntos,uv=[[0,0],[0,1],[1,1],[1,0]]) {
  const base=geo.vertices.length;
  for(let i=0;i<4;i++){geo.vertices.push(createVector(...puntos[i]));geo.uvs.push(...uv[i]);}
  geo.faces.push([base,base+1,base+2],[base,base+2,base+3]);
}
function compilarTerrenoP5() {
  const lotes=new Map(); geometriaAgua=nuevaGeometria();
  for(let f=0;f<MAPA_ALTO;f++)for(let c=0;c<MAPA_ANCHO;c++) {
    const tipo=MAPA[f][c],x=c*TAMAÑO_CELDA,z=f*TAMAÑO_CELDA,t=TAMAÑO_CELDA;
    const puntos=[[x,0,z],[x,0,z+t],[x+t,0,z+t],[x+t,0,z]];
    if(tipo===3){
      const n=!esAgua(c,f-1),s=!esAgua(c,f+1),o=!esAgua(c-1,f),e=!esAgua(c+1,f);
      let tile=3,rot=0,flip=false;
      if(n&&o)tile=0;else if(n&&e){tile=0;flip=true}else if(s&&o){tile=0;rot=2;flip=true}else if(s&&e){tile=0;rot=2}
      else if(n)tile=1;else if(s){tile=1;rot=2}else if(o){tile=1;rot=3}else if(e){tile=1;rot=1}
      let uv=[[0,0],[0,1],[1,1],[1,0]].map(([u,v])=>[flip?1-u:u,v]);
      for(let k=0;k<rot;k++)uv=uv.map(([u,v])=>[v,1-u]);
      uv=uv.map(([u,v])=>[(tile+(0.01+u*.98))/4,.01+v*.98]);
      agregarCuadrilatero(geometriaAgua,puntos.map(([a,b,d])=>[a,.2,d]),uv);continue;
    }
    const clave=tipo===1?'pared':obtenerClaveBaldosa(f,c);
    if(!lotes.has(clave))lotes.set(clave,nuevaGeometria());
    const geo=lotes.get(clave);
    if(tipo!==1)agregarCuadrilatero(geo,puntos);
    else {
      agregarCuadrilatero(geo,puntos.map(([a,b,d])=>[a,t,d]));
      for(let i=0;i<4;i++){
        const a=puntos[i],b=puntos[(i+1)%4];agregarCuadrilatero(geo,[a,[a[0],t,a[2]],[b[0],t,b[2]],b]);
      }
    }
  }
  for(const [clave,geometria] of lotes) {
    geometria.computeNormals();
    let imagen=recursosP5.pared;
    if(clave!=='pared'){
      imagen=createImage(16,16);
      renderizarTileEnCanvas(imagen.canvas.getContext('2d'),recursosP5.suelo.canvas,clave);
      imagen.loadPixels();imagen.updatePixels();
    }
    lotesTerreno.push({geometria,imagen});
  }
  geometriaAgua.computeNormals();
}
function inicializarMundoP5() {
  mundoP5=createGraphics(windowWidth,windowHeight,WEBGL);
  mundoP5.pixelDensity(1);
  mundoP5.setAttributes({antialias:false,alpha:false});
  mundoP5.noStroke();mundoP5.textureMode(NORMAL);
  for (const partes of Object.values(modelosP5)) {
    for (const parte of partes) parte.geometria.computeNormals();
  }
  compilarTerrenoP5();
  tiendaRegistrarColisiones(modelosP5.tienda);
}
function dibujarGeometria(geo,imagen,color=[255,255,255]) {
  mundoP5.push();
  mundoP5.fill(...color);
  if(imagen)mundoP5.texture(imagen);else mundoP5.ambientMaterial(...color);
  mundoP5.model(geo);mundoP5.pop();
  estadisticasRender.dibujos++;estadisticasRender.triangulos+=geo.faces.length;
}
function dibujarModeloP5(tipo) {
  for(const parte of modelosP5[tipo])dibujarGeometria(parte.geometria,parte.imagen,parte.imagen?[255,255,255]:parte.color);
}
function direccionMirada() {
  return createVector(Math.cos(jugador.angulo)*Math.cos(jugador.inclinacion),Math.sin(jugador.inclinacion),Math.sin(jugador.angulo)*Math.cos(jugador.inclinacion));
}
function posicionOjos() {
  const piso=tiendaAlturaPiso(jugador.posicion.x,jugador.posicion.y,jugador.alturaPiso||0);
  jugador.alturaPiso=lerp(jugador.alturaPiso||0,piso,.35);
  return createVector(jugador.posicion.x,44.8+jugador.alturaPiso+jugador.alturaSalto-jugador.factorAgachado*22.4,jugador.posicion.y);
}
function transformarDesdeCamara(x,y,z,ojos) {
  const ang=jugador.angulo,inc=jugador.inclinacion;
  const frente=direccionMirada(),derecha=createVector(-Math.sin(ang),0,Math.cos(ang));
  const arriba=createVector(-Math.cos(ang)*Math.sin(inc),Math.cos(inc),-Math.sin(ang)*Math.sin(inc));
  return ojos.copy().add(derecha.mult(x)).add(arriba.mult(y)).add(frente.mult(-z));
}
function puntoCañaMundo(x,y,z) {
  const tilt=.45+calcularAnimacionCaña().x;
  const a=y*Math.cos(tilt)-z*Math.sin(tilt),b=y*Math.sin(tilt)+z*Math.cos(tilt);
  const ojos=createVector(jugador.posicion.x,44.8+(jugador.alturaPiso||0)+jugador.alturaSalto-jugador.factorAgachado*22.4,jugador.posicion.y);
  return transformarDesdeCamara(14+x*58,-18+a*58,-14+b*58,ojos);
}
function posicionExhibicion() { return {x:TIENDA.posicion.x-15,y:TIENDA_AJUSTE_ALTURA+25,z:TIENDA.posicion.y-62}; }
function mirandoCañaTienda() {
  if(!jugador)return false;
  const p=posicionExhibicion(),ojo=createVector(jugador.posicion.x,44.8+(jugador.alturaPiso||0)+jugador.alturaSalto,jugador.posicion.y);
  const dir=createVector(p.x,p.y,p.z).sub(ojo),dist=dir.mag();
  return dist<200&&dist>1&&dir.normalize().dot(direccionMirada())>.975;
}
function dibujarIndicadorCañaTienda() {
  push();noStroke();fill(0,0,0,160);rect(width/2-140,height*.82,280,36,8);
  fill(180,255,170);textAlign(CENTER,CENTER);textSize(14);text('Clic: ver Caña de Bambú ($150)',width/2,height*.82+18);pop();
}
function equiparCaña(tipo) {
  // El modelo que dibuja p5.model() se elige por el estado del inventario.
  cañaEquipada=tipo==='bambu'&&tieneCañaBambu?'bambu':'basica';
}
function dibujarTiendaP5() {
  const g=mundoP5;
  g.push();g.translate(TIENDA.posicion.x,TIENDA.baseY,TIENDA.posicion.y);g.rotateY(-Math.PI/2);g.scale(TIENDA_ESCALA);dibujarModeloP5('tienda');g.pop();
  const meta=MODELOS_P5.kiwi,alto=meta.max[1]-meta.min[1],scale=46/alto;
  g.push();g.translate(TIENDA.posicion.x+40,TIENDA_AJUSTE_ALTURA-meta.min[1]*scale,TIENDA.posicion.y-40);g.rotateY(-Math.PI/2);g.scale(scale);dibujarModeloP5('kiwi');g.pop();
  const p=posicionExhibicion();
  g.push();g.translate(p.x,p.y-25,p.z);g.rotateZ(-.18);g.rotateX(Math.PI/2);g.scale(65);dibujarModeloP5('bambu');g.pop();
}
function dibujarCañaP5(ojos) {
  const g=mundoP5;
  g.push();g.translate(ojos.x,ojos.y,ojos.z);g.rotateY(-jugador.angulo-Math.PI/2);g.rotateX(jugador.inclinacion);
  g.translate(14,-18,-14);g.rotateX(.45+calcularAnimacionCaña().x);g.scale(58);dibujarModeloP5(cañaEquipada);g.pop();
  const inicio=calcularPuntaCañaMundo();
  const preparado=estadoLanzamiento==='lanzando'&&preparacionLanzamiento<TIEMPO_PREPARACION_LANZAMIENTO;
  let fin;
  if(anzueloLanzado&&!preparado){fin=posicionAnzueloMundo.copy();}
  else fin=inicio.copy().add(0,-8,0);
  g.push();g.stroke(225,230,215);g.strokeWeight(1);
  const sag=Math.min(4,inicio.dist(fin)*.008);g.noFill();g.beginShape();
  for(let i=0;i<=16;i++){const p=p5.Vector.lerp(inicio,fin,i/16);g.vertex(p.x,p.y-Math.sin(i/16*Math.PI)*sag,p.z)}
  g.endShape();g.noStroke();g.pop();
  if(estadoLanzamiento==='en_agua'||estadoLanzamiento==='esperando'){
    g.push();g.translate(fin.x,1.3+Math.sin(millis()*.003)*.5,fin.z);g.ambientMaterial(220,70,60);g.sphere(1.8,8,5);g.pop();
    g.push();g.noFill();g.stroke(200,235,255,150);g.strokeWeight(1);g.translate(fin.x,.6,fin.z);g.rotateX(Math.PI/2);
    const r=4+(millis()*.005%8)+faseSalpicadura*8;g.ellipse(0,0,r*2,r*2,16);g.pop();
  }
}
function dibujarMundoP5(mostrarCaña) {
  const g=mundoP5,ojos=posicionOjos(),dir=direccionMirada();
  estadisticasRender.dibujos=0;estadisticasRender.triangulos=0;
  g.reset();
  g.background(143,193,232);
  g.perspective(Math.PI*58/180,g.width/g.height,1,TAMAÑO_CELDA*80);
  g.camera(ojos.x,-ojos.y,ojos.z,ojos.x+dir.x,-ojos.y-dir.y,ojos.z+dir.z,0,1,0);
  g.ambientLight(130,130,130);g.directionalLight(100,95,80,.3,1,-.4);
  g.push();g.scale(1,-1,1);g.noStroke();
  for(const lote of lotesTerreno)dibujarGeometria(lote.geometria,lote.imagen);
  if(recursosP5.agua.numFrames()>1)recursosP5.agua.setFrame(Math.floor(millis()/100)%recursosP5.agua.numFrames());
  dibujarGeometria(geometriaAgua,recursosP5.agua);
  dibujarTiendaP5();
  for(const [c,f] of [[5,5],[12,5],[20,5],[35,6],[40,12],[39,27],[15,30],[5,22]]){
    g.push();g.translate(c*TAMAÑO_CELDA,57.5,f*TAMAÑO_CELDA);g.scale(0.575);dibujarGeometria(recursosP5.arbol,null,[77,118,75]);g.pop();
  }
  if(mostrarCaña)dibujarCañaP5(ojos);
  g.pop();
}
