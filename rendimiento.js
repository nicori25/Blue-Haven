// Una llamada de dibujo por tipo de baldosa, en lugar de una por celda.
const OPCIONES_GRAFICAS = {
  baja: { escala: 0.65, fps: 30 },
  media: { escala: 0.85, fps: 60 },
  alta: { escala: 1, fps: 60 },
};
let opcionesGraficas = { calidad: 'media', fps: false };
try { Object.assign(opcionesGraficas, JSON.parse(localStorage.getItem('BLUEHAVEN_AJUSTES') || '{}')); } catch (_) {}
let muestrasFPS = [];
let ultimoIndicador = 0;
function interfazBloqueada() {
  return !document.body.classList.contains('jugando') || !!window.chatAbierto || !!document.getElementById('ajustes')?.open;
}
function aplicarCalidadGrafica() {
  const config = OPCIONES_GRAFICAS[opcionesGraficas.calidad] || OPCIONES_GRAFICAS.media;
  if (typeof renderizador3D !== 'undefined' && renderizador3D) {
    renderizador3D.setPixelRatio(config.escala);
    renderizador3D.setSize(window.innerWidth, window.innerHeight);
  }
  if (typeof frameRate === 'function') frameRate(config.fps);
}
function construirTerrenoInstanciado(materialPared) {
  const grupos = new Map();
  for (let f = 0; f < MAPA_ALTO; f++) for (let c = 0; c < MAPA_ANCHO; c++) {
    const tipo = MAPA[f][c];
    if (tipo === 3) continue;
    const clave = tipo === 1 ? 'pared' : obtenerClaveBaldosa(f, c);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push([f, c]);
  }
  const piso = new THREE.PlaneGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA);
  const pared = new THREE.BoxGeometry(TAMAÑO_CELDA, TAMAÑO_CELDA, TAMAÑO_CELDA);
  const matriz = new THREE.Object3D();
  for (const [clave, celdas] of grupos) {
    const esMuro = clave === 'pared';
    const mesh = new THREE.InstancedMesh(esMuro ? pared : piso, esMuro ? materialPared : obtenerMaterialBaldosa(clave), celdas.length);
    mesh.name = 'terreno-' + clave;
    mesh.frustumCulled = false; // Three r128 no calcula límites de instancias.
    celdas.forEach(([f, c], i) => {
      matriz.position.set((c + 0.5) * TAMAÑO_CELDA, esMuro ? TAMAÑO_CELDA / 2 : 0, (f + 0.5) * TAMAÑO_CELDA);
      matriz.rotation.set(esMuro ? 0 : -Math.PI / 2, 0, 0);
      matriz.updateMatrix();
      mesh.setMatrixAt(i, matriz.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.matrixAutoUpdate = false;
    escena3D.add(mesh);
  }
}
function cargarArboles() {
  // Recurso de la rama diseños, compartiendo geometría y materiales entre árboles.
  new THREE.OBJLoader().load('models/3D/Modelo_arbol.obj', original => {
    const caja = new THREE.Box3().setFromObject(original);
    const alto = caja.max.y - caja.min.y;
    const escala = 115 / Math.max(alto, 1);
    const corteza = new THREE.MeshLambertMaterial({ color: 0x916343 });
    const hojas = new THREE.MeshLambertMaterial({ color: 0x47784c });
    original.traverse(o => { if (o.isMesh) o.material = /tron|trunk/i.test(o.name) ? corteza : hojas; });
    for (const [c, f] of [[5,5],[12,5],[20,5],[35,6],[40,12],[39,27],[15,30],[5,22]]) {
      const arbol = original.clone();
      arbol.scale.setScalar(escala);
      arbol.position.set(c * TAMAÑO_CELDA, -caja.min.y * escala, f * TAMAÑO_CELDA);
      arbol.updateMatrix();
      arbol.matrixAutoUpdate = false;
      escena3D.add(arbol);
    }
  }, undefined, e => console.warn('No se pudo cargar el árbol', e));
}
function actualizarRendimiento() {
  muestrasFPS.push(deltaTime);
  if (muestrasFPS.length > 60) muestrasFPS.shift();
  if (performance.now() - ultimoIndicador < 500) return;
  ultimoIndicador = performance.now();
  const fps = Math.round(1000 / (muestrasFPS.reduce((a,b) => a+b, 0) / muestrasFPS.length));
  const info = `${fps} FPS · ${renderizador3D.info.render.calls} llamadas de dibujo`;
  document.getElementById('detalle-rendimiento').textContent = info;
  const hud = document.getElementById('rendimiento-hud');
  hud.textContent = opcionesGraficas.fps ? info : '';
}
const hudRendimiento = document.createElement('div');
hudRendimiento.id = 'rendimiento-hud';
document.body.appendChild(hudRendimiento);
document.getElementById('boton-ajustes').addEventListener('click', () => {
  if (document.pointerLockElement) document.exitPointerLock();
  sistemaCaptura.soltarBoton();
  document.getElementById('ajustes').showModal();
});
document.getElementById('calidad-grafica').value = opcionesGraficas.calidad;
document.getElementById('mostrar-fps').checked = opcionesGraficas.fps;
document.getElementById('ajustes').addEventListener('change', () => {
  opcionesGraficas.calidad = document.getElementById('calidad-grafica').value;
  opcionesGraficas.fps = document.getElementById('mostrar-fps').checked;
  localStorage.setItem('BLUEHAVEN_AJUSTES', JSON.stringify(opcionesGraficas));
  aplicarCalidadGrafica();
});
document.addEventListener('visibilitychange', () => {
  if (!window.juegoPreparado) return;
  if (document.hidden) { noLoop(); sistemaCaptura.soltarBoton(); }
  else if (document.body.classList.contains('jugando')) loop();
});
