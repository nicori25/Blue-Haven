// Resolución del buffer p5.WEBGL y frecuencia de actualización.
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
  if (typeof mundoP5 !== 'undefined' && mundoP5) {
    mundoP5.resizeCanvas(Math.max(1,Math.round(window.innerWidth*config.escala)),Math.max(1,Math.round(window.innerHeight*config.escala)));
  }
  if (typeof frameRate === 'function') frameRate(config.fps);
}
function actualizarRendimiento() {
  muestrasFPS.push(deltaTime);
  if (muestrasFPS.length > 60) muestrasFPS.shift();
  if (performance.now() - ultimoIndicador < 500) return;
  ultimoIndicador = performance.now();
  const fps = Math.round(1000 / (muestrasFPS.reduce((a,b) => a+b, 0) / muestrasFPS.length));
  const info = `${fps} FPS · ${estadisticasRender.dibujos} lotes 3D · p5.js WEBGL`;
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
