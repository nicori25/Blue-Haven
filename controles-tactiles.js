// Pointer Events permiten mantener varios botones a la vez (direcciones y acordes).
window.ControlTactil={activo:matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0,teclas:new Set(),punteros:new Map(),acciones:new Set()};
try{const preferencia=localStorage.getItem('BLUEHAVEN_TACTIL');if(preferencia!==null)ControlTactil.activo=preferencia==='true';}catch(_){}
if(ControlTactil.activo&&!localStorage.getItem('BLUEHAVEN_AJUSTES')){opcionesGraficas.calidad='baja';document.getElementById('calidad-grafica').value='baja';}
const tactil=document.createElement('div');tactil.id='controles-tactiles';tactil.hidden=true;
tactil.innerHTML=`<div id="tactil-mirar" aria-label="Deslizá para mirar"><span>Deslizá para mirar</span></div><nav class="tactil-utiles" aria-label="Menús del juego"><button data-menu="mochila" type="button">Mochila</button><button data-menu="tienda" type="button">Tienda</button><button data-menu="especies" type="button">Especies</button><button data-menu="guia" type="button">Guía</button></nav><div id="tactil-direcciones" aria-label="Movimiento"><button data-tecla="87" aria-label="Adelante" type="button">▲</button><button data-tecla="65" aria-label="Izquierda" type="button">◀</button><button id="tactil-saltar" aria-label="Saltar" type="button">Saltar</button><button data-tecla="68" aria-label="Derecha" type="button">▶</button><button data-tecla="83" aria-label="Atrás" type="button">▼</button></div><div id="tactil-ritmo" aria-label="Pistas de ritmo"><button data-tecla="65" type="button">A</button><button data-tecla="83" type="button">S</button><button data-tecla="68" type="button">D</button></div><div class="tactil-acciones"><p id="tactil-ayuda" role="status"></p><button id="tactil-pescar" type="button">Pescar</button><div id="tactil-riesgo"><button id="tactil-seguro" type="button">Asegurar</button><button id="tactil-arriesgar" type="button">Arriesgar</button></div><button id="tactil-cancelar" type="button">Cancelar pesca</button></div><section id="tactil-presentacion"><small>BLUE HAVEN</small><h2>El lago, en tus manos</h2><p>Usá las flechas para moverte y deslizá el dedo por el lado derecho para mirar.</p><p>Tocá Lanzar caña para pescar. Cada minijuego muestra sus botones: pulsar, mantener, soltar o tocar varias pistas a la vez.</p><p>Desde los botones superiores abrís la mochila, la tienda, la guía y el ranking. Podés jugar en vertical u horizontal.</p></section><button id="tactil-comenzar" type="button">Empezar a jugar</button>`;
document.body.appendChild(tactil);
function teclaJuegoPresionada(codigo){return ControlTactil.teclas.has(codigo)||keyIsDown(codigo);}
ControlTactil.soltarTodo=()=>{
 for(const codigo of ControlTactil.teclas){if(typeof sistemaCaptura!=='undefined'&&sistemaCaptura)sistemaCaptura.soltarTecla(String.fromCharCode(codigo).toLowerCase(),codigo);}
 ControlTactil.teclas.clear();ControlTactil.punteros.clear();ControlTactil.acciones.clear();
 if(typeof sistemaCaptura!=='undefined'&&sistemaCaptura)sistemaCaptura.soltarBoton();
 tactil.querySelectorAll('.presionado').forEach(b=>b.classList.remove('presionado'));
};
function disponibleTactil(){return ControlTactil.activo&&!interfazBloqueada()&&!ENCICLOPEDIA.abierta&&!bienvenidaActiva();}
let ultimoToqueRetenido=null;
document.addEventListener('pointerdown',()=>ultimoToqueRetenido=null,{capture:true});
document.addEventListener('click',e=>{
 if(ultimoToqueRetenido&&e.detail!==0&&performance.now()-ultimoToqueRetenido.tiempo<500&&Math.hypot(e.clientX-ultimoToqueRetenido.x,e.clientY-ultimoToqueRetenido.y)<24){e.preventDefault();e.stopImmediatePropagation();ultimoToqueRetenido=null;}
},{capture:true});
function retener(b,alPresionar,alSoltar){
 b.addEventListener('pointerdown',e=>{if(!disponibleTactil()||b.disabled)return;e.preventDefault();e.stopPropagation();b.setPointerCapture(e.pointerId);b.classList.add('presionado');alPresionar(e);});
 const liberar=e=>{if(e.type==='pointerup'||e.type==='pointercancel')ultimoToqueRetenido={x:e.clientX,y:e.clientY,tiempo:performance.now()};b.classList.remove('presionado');alSoltar(e);};
 b.addEventListener('pointerup',liberar);b.addEventListener('pointercancel',liberar);b.addEventListener('lostpointercapture',liberar);
}
for(const b of tactil.querySelectorAll('[data-tecla]')){
 const codigo=Number(b.dataset.tecla),letra=String.fromCharCode(codigo).toLowerCase();
 retener(b,e=>{const nueva=!ControlTactil.teclas.has(codigo);ControlTactil.punteros.set(e.pointerId,codigo);ControlTactil.teclas.add(codigo);if(nueva){sistemaCaptura.presionarTecla(letra,codigo);window.AudioJuego?.efecto('pulso');}},e=>{ControlTactil.punteros.delete(e.pointerId);if(![...ControlTactil.punteros.values()].includes(codigo)){ControlTactil.teclas.delete(codigo);sistemaCaptura?.soltarTecla(letra,codigo);}});
}
function accionPescaTactil(){
 if(sistemaCaptura.estado==='inactivo')ejecutarAccionPesca();
 else if(sistemaCaptura.estado==='esperando_mordida'&&anzueloLanzado)ejecutarAccionPesca();
 else {sistemaCaptura.presionarBoton();window.AudioJuego?.efecto('pulso');}
}
retener(document.getElementById('tactil-pescar'),e=>{ControlTactil.acciones.add(e.pointerId);accionPescaTactil();},e=>{ControlTactil.acciones.delete(e.pointerId);if(!ControlTactil.acciones.size)sistemaCaptura?.soltarBoton();});
document.getElementById('tactil-saltar').addEventListener('click',()=>{if(disponibleTactil()&&sistemaCaptura.estado==='inactivo')jugador.saltar();});
document.getElementById('tactil-cancelar').addEventListener('click',()=>{if(disponibleTactil())cancelarPesca();});
document.getElementById('tactil-seguro').addEventListener('click',()=>{if(disponibleTactil()&&sistemaCaptura.timerFase<=0)sistemaCaptura.elegirRiesgo(false);});
document.getElementById('tactil-arriesgar').addEventListener('click',()=>{if(disponibleTactil()&&sistemaCaptura.timerFase<=0)sistemaCaptura.elegirRiesgo(true);});
document.getElementById('tactil-comenzar').addEventListener('click',()=>{cerrarBienvenida();});
for(const b of tactil.querySelectorAll('[data-menu]'))b.addEventListener('click',()=>{
 if(!disponibleTactil()||sistemaCaptura.estado!=='inactivo'||estadoLanzamiento!=='reposo')return;
 ControlTactil.soltarTodo();
 if(b.dataset.menu==='mochila')abrirMenuInventario();
 if(b.dataset.menu==='tienda'&&cercaDeTienda())abrirMenuTienda();
 if(b.dataset.menu==='especies')abrirLibroMovil();
 if(b.dataset.menu==='guia')abrirChat();
});
let gestoMirada=null;
const padMirada=document.getElementById('tactil-mirar');
padMirada.addEventListener('pointerdown',e=>{if(!disponibleTactil()||sistemaCaptura.estado!=='inactivo')return;e.preventDefault();padMirada.setPointerCapture(e.pointerId);gestoMirada={id:e.pointerId,x:e.clientX,y:e.clientY};});
padMirada.addEventListener('pointermove',e=>{if(!gestoMirada||gestoMirada.id!==e.pointerId||!disponibleTactil())return;jugador.girarMouse((e.clientX-gestoMirada.x)*1.25);jugador.mirarMouse((gestoMirada.y-e.clientY)*1.25);gestoMirada.x=e.clientX;gestoMirada.y=e.clientY;});
for(const evento of ['pointerup','pointercancel','lostpointercapture'])padMirada.addEventListener(evento,()=>gestoMirada=null);
function activarTactil(valor){ControlTactil.soltarTodo();ControlTactil.activo=valor;document.body.classList.toggle('tactil',valor);document.getElementById('activar-tactil').checked=valor;if(valor&&document.pointerLockElement){cursorLibre=true;document.exitPointerLock();}localStorage.setItem('BLUEHAVEN_TACTIL',String(valor));}
document.getElementById('activar-tactil').checked=ControlTactil.activo;document.body.classList.toggle('tactil',ControlTactil.activo);
document.getElementById('activar-tactil').addEventListener('change',e=>activarTactil(e.target.checked));
window.addEventListener('blur',ControlTactil.soltarTodo);document.addEventListener('visibilitychange',()=>{if(document.hidden)ControlTactil.soltarTodo();});
let firmaControles="";
function actualizarControlesTactiles(){
 const visible=ControlTactil.activo&&document.body.classList.contains('jugando')&&!interfazBloqueada()&&!ENCICLOPEDIA.abierta;
 tactil.hidden=!visible;if(!visible){firmaControles="";if(ControlTactil.teclas.size||ControlTactil.acciones.size)ControlTactil.soltarTodo();return;}
 const bienvenida=bienvenidaActiva(),estado=sistemaCaptura.estado,mini=sistemaCaptura.minijuego,ritmo=estado==='lucha'&&mini?.aceptaTeclas();
 const tipo=(mini?.actual?.mini||mini)?.constructor.name;
 const firma=[bienvenida,estado,ritmo,tipo,mini?.enQTE,mini?.indice,estadoLanzamiento,preparandoLance,sistemaCaptura.timerFase>0,cercaDeTienda()].join('|');if(firma===firmaControles)return;firmaControles=firma;
 tactil.dataset.modo=bienvenida?'bienvenida':estado==='inactivo'?'mundo':'pesca';tactil.classList.toggle('ritmo-activo',!!ritmo);
 document.getElementById('tactil-direcciones').hidden=!!ritmo||estado==='decidiendo_riesgo';document.getElementById('tactil-ritmo').hidden=!ritmo;
 document.getElementById('tactil-riesgo').hidden=estado!=='decidiendo_riesgo';
 const boton=document.getElementById('tactil-pescar');boton.hidden=estado==='decidiendo_riesgo'||!!ritmo;boton.disabled=preparandoLance;
 boton.textContent=estado==='inactivo'?(estadoLanzamiento==='reposo'?'Lanzar caña':'Recoger'):estado==='esperando_mordida'?'Recoger':estado==='lucha'?(mini?.enQTE?'Acción · ¡Ahora!':tipo==='MinijuegoBrújula'?'Frenar · mantener':tipo==='MinijuegoAnillo'?'Pulsar anillo':'Acción'):'Enganchar';
 const cancelar=document.getElementById('tactil-cancelar'),sinPesca=estado==='inactivo'&&estadoLanzamiento==='reposo'&&!preparandoLance;cancelar.disabled=sinPesca;cancelar.style.visibility=sinPesca?'hidden':'visible';
 document.getElementById('tactil-saltar').disabled=estado!=='inactivo';
 document.getElementById('tactil-seguro').disabled=document.getElementById('tactil-arriesgar').disabled=sistemaCaptura.timerFase>0;
 document.getElementById('tactil-ayuda').textContent=ritmo?'A / S / D: mantené las notas largas; podés tocar dos a la vez.':estado==='lucha'?(mini?.enQTE?'Tocá Acción cuando el marcador entre en verde.':tipo==='MinijuegoBrújula'?'Izquierda/derecha para orientar. Mantené para frenar y soltá para deshacer nudos.':tipo==='MinijuegoAnillo'?'Tocá Pulsar cuando el anillo llegue a la zona.':'Usá las cuatro flechas para esquivar.'):estado==='decidiendo_riesgo'?'Elegí asegurar la captura o arriesgar por más valor.':'';
 tactil.querySelectorAll('[data-menu]').forEach(b=>{b.disabled=estado!=='inactivo'||estadoLanzamiento!=='reposo';if(b.dataset.menu==='tienda')b.hidden=!cercaDeTienda();});
}
function enEspacioPesca(fn,dibujar=false){
 if(!ControlTactil.activo||(dibujar&&sistemaCaptura.estado==='inactivo'))return fn();
 const w=window.width,h=window.height,vertical=h>w,escala=Math.max(.2,Math.min(1.5,(w-(vertical?12:260))/480,(h-(vertical?260:100))/300));
 if(dibujar){push();noStroke();fill(0,14,22,200);rect(0,0,w,h);translate((w-480*escala)/2,vertical?70+(h-260-300*escala)/2:50+(h-100-300*escala)/2);scale(escala);drawingContext.beginPath();drawingContext.rect(0,0,480,300);drawingContext.clip();}
 window.width=480;window.height=300;
 try{return fn();}finally{window.width=w;window.height=h;if(dibujar)pop();}
}
// Libro DOM en teléfonos: conserva las especies bloqueadas hasta descubrirlas.
const libroMovil=document.createElement('dialog');libroMovil.id='libro-movil';libroMovil.setAttribute('aria-labelledby','libro-movil-titulo');libroMovil.innerHTML='<h2 id="libro-movil-titulo">Enciclopedia del lago</h2><label>Especie <select id="libro-movil-especie"></select></label><article id="libro-movil-datos"></article><button id="libro-movil-cerrar" type="button">Volver al juego</button>';document.body.append(libroMovil);
function renderLibroMovil(){const indice=Number(document.getElementById('libro-movil-especie').value),pez=CATALOGO_ESPECIES[indice],datos=document.getElementById('libro-movil-datos');datos.replaceChildren();if(!pez)return;const registro=REGISTRO_CAPTURAS[pez.nombre];if(!registro){datos.textContent='Capturá esta especie para descubrir su ficha.';return;}const img=document.createElement('img');img.src='textures/peces/'+pez.sprite;img.alt=pez.nombre;datos.append(img);for(const [titulo,valor] of [['Nombre',pez.nombre],['Nombre científico',pez.nombreCientifico],['Descripción',pez.descripcion],['Hábitat',pez.habitat],['Alimentación',pez.alimentacion],['Tamaño',pez.tamaño],['Peso',pez.peso],['Cebo',pez.ceboRecomendado],['Dato curioso',pez.datoCurioso],['Capturas',registro.capturas]]){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=titulo+': ';p.append(strong,document.createTextNode(String(valor)));datos.append(p);}}
function abrirLibroMovil(){if(interfazBloqueada())return;const select=document.getElementById('libro-movil-especie');select.replaceChildren();CATALOGO_ESPECIES.forEach((pez,i)=>{const op=document.createElement('option');op.value=i;op.textContent=REGISTRO_CAPTURAS[pez.nombre]?pez.nombre:'Especie '+(i+1)+' · sin descubrir';select.append(op)});libroMovil.showModal();renderLibroMovil();}
document.getElementById('libro-movil-especie').addEventListener('change',renderLibroMovil);document.getElementById('libro-movil-cerrar').addEventListener('click',()=>libroMovil.close());
