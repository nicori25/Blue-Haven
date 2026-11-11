// p5.js: canvas 2D para interfaz + buffer WEBGL para el mundo 3D.
let lienzoJuego;
let mundoP5;
let jugador;
let sistemaCaptura;
let spritesPeces = {};
let catalogoEspecies = [];
let ratonBloqueado = false;
let anzueloLanzado = false;
let estadoLanzamiento = "reposo";
let progresoLanzamiento = 0;
let tiempoEnAgua = 0;
let esperaMordida = 0;
let lanzamientoCaeEnAgua = false;
let destinoPescaMundo;
let inicioLanzamientoMundo;
let posicionAnzueloMundo;
let faseSalpicadura = 0;
let ajusteMiradaPesca = null;

function preload() {
  for (const nombre of ["Atun.png", "Calamar.png", "Ballena_azul.png", "Pez_Globo.png"]) {
    spritesPeces[nombre] = loadImage("textures/peces/" + nombre);
  }
  precargarMundoP5();
}
function setup() {
  pixelDensity(1);
  lienzoJuego = createCanvas(windowWidth, windowHeight);
  lienzoJuego.elt.style.position = 'fixed';
  lienzoJuego.elt.style.inset = '0';
  lienzoJuego.elt.style.zIndex = '2';
  jugador = new Jugador(TAMAÑO_CELDA * 18.5, TAMAÑO_CELDA * 27.5);
  jugador.angulo = -Math.PI / 2;
  sistemaCaptura = new SistemaCaptura();
  destinoPescaMundo = createVector(0,0,0);
  inicioLanzamientoMundo = createVector(0,0,0);
  posicionAnzueloMundo = createVector(0,0,0);
  tiendaInicializar();
  inicializarMundoP5();
  aplicarCalidadGrafica();
  lienzoJuego.elt.addEventListener('pointerdown', controlarClicEscena);
  document.addEventListener('pointerup', () => sistemaCaptura.soltarBoton());
  document.addEventListener('pointerlockchange', actualizarEstadoRaton);
  document.addEventListener('wheel', manejarRuedaEnciclopedia, { passive: false });
  noLoop();
  window.juegoPreparado = true;
  window.dispatchEvent(new Event('juego-preparado'));
}
async function iniciarJuego() {
  if (!window.juegoPreparado) {
    await new Promise(resolve => window.addEventListener("juego-preparado", resolve, { once: true }));
  }
  reiniciarEstadoEnMemoria();
  cargarProgresoLocal();
  if (!window.modoInvitado) await cargarDatosUsuario();
  loop();
}

async function cargarDatosUsuario() {
  const estado = await BaseDatos.estado();
  if (!estado?.perfil || !Array.isArray(estado.catalogo) || !Array.isArray(estado.inventario)) {
    throw new Error("No se pudo cargar tu partida de Supabase.");
  }
  window.sesionUsuario = estado.perfil;
  catalogoEspecies = estado.catalogo;
  inventario = estado.inventario;
  CATALOGO_ESPECIES.splice(0, CATALOGO_ESPECIES.length, ...catalogoEspecies.map(p => ({ ...p.datos, ...p })));
  for (const k in REGISTRO_CAPTURAS) delete REGISTRO_CAPTURAS[k];
  for (const especie of catalogoEspecies) {
    if (especie.descubierto) REGISTRO_CAPTURAS[especie.nombre] = {
      capturas: Number(especie.cantidad_capturada), mejorCalidadId: especie.mejorCalidadId,
      mejorPrecio: especie.mejorPrecio
    };
  }
  dinero = Number(estado.perfil.dinero) || 0;
  tieneCañaBambu = estado.perfil.tiene_bambu === true;
  cañaEquipada = tieneCañaBambu && cañaEquipada === "bambu" ? "bambu" : "basica";
  equiparCaña(cañaEquipada);
  guardarProgresoLocal();
}

function draw() {
  if (document.hidden) return;
  const guiaActiva = bienvenidaActiva();
  if (!guiaActiva && !interfazBloqueada()) {
    if (sistemaCaptura.estado === 'inactivo' && menuTienda === 'cerrado' && estadoLanzamiento === 'reposo') jugador.actualizar();
    actualizarLanzamientoAnzuelo();
    sistemaCaptura.actualizar();
    faseSalpicadura = Math.max(0, faseSalpicadura - Math.min(deltaTime/1000,0.05)*1.8);
  }
  dibujarMundoP5(!guiaActiva);
  image(mundoP5,0,0,width,height);
  actualizarRendimiento();
  if (!guiaActiva && !interfazBloqueada()) {
    sistemaCaptura.dibujar();
    if (menuTienda !== 'cerrado') {
      if (menuTienda === 'tienda') dibujarPanelVenta();
      else if (menuTienda === 'comprar_caña') dibujarPanelComprarCaña();
      else dibujarPanelInventario();
    } else if (sistemaCaptura.estado === 'inactivo') {
      if (mirandoCañaTienda()) dibujarIndicadorCañaTienda();
      else if (cercaDelAgua() || estadoLanzamiento !== 'reposo') dibujarIndicadorPesca();
      else if (cercaDeTienda()) dibujarIndicadorTienda();
    }
    dibujarHUD();
    if (ratonBloqueado) dibujarPuntero();
    dibujarEnciclopedia();
  }
  dibujarBienvenida();
}
function actualizarEstadoRaton() {
  ratonBloqueado = document.pointerLockElement === lienzoJuego.elt;
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  aplicarCalidadGrafica();
}
function mouseMoved(evento) {
  moverCamaraConMouse(evento);
}

function moverCamaraConMouse(evento) {
  if (ENCICLOPEDIA.abierta) {
    actualizarHoverEnciclopedia(evento.clientX, evento.clientY);
    return;
  }
  if (interfazBloqueada() || !ratonBloqueado || sistemaCaptura.estado !== "inactivo") return;

  jugador.girarMouse(evento.movementX);
  jugador.mirarMouse(-evento.movementY);
}

function dibujarPuntero() {
  const cx = width / 2;
  const cy = height / 2;

  stroke(255, 255, 255, 220);
  strokeWeight(2);
  line(cx - 9, cy, cx - 3, cy);
  line(cx + 3, cy, cx + 9, cy);
  line(cx, cy - 9, cx, cy - 3);
  line(cx, cy + 3, cx, cy + 9);
  noStroke();
}

function cercaDelAgua() {
  if (!jugador) return false;

  const px = jugador.posicion.x;
  const pz = jugador.posicion.y;
  const celdaX = Math.floor(px / TAMAÑO_CELDA);
  const celdaZ = Math.floor(pz / TAMAÑO_CELDA);
  if (MAPA[celdaZ] && MAPA[celdaZ][celdaX] === 3) return false;

  const radioBusqueda = 2;
  const distanciaMaxima = TAMAÑO_CELDA * 1.15;
  for (
    let fila = celdaZ - radioBusqueda;
    fila <= celdaZ + radioBusqueda;
    fila++
  ) {
    for (
      let columna = celdaX - radioBusqueda;
      columna <= celdaX + radioBusqueda;
      columna++
    ) {
      if (fila < 0 || columna < 0 || fila >= MAPA_ALTO || columna >= MAPA_ANCHO)
        continue;
      if (MAPA[fila][columna] !== 3) continue;

      const minX = columna * TAMAÑO_CELDA;
      const maxX = minX + TAMAÑO_CELDA;
      const minZ = fila * TAMAÑO_CELDA;
      const maxZ = minZ + TAMAÑO_CELDA;
      const dx = Math.max(minX - px, 0, px - maxX);
      const dz = Math.max(minZ - pz, 0, pz - maxZ);
      if (Math.hypot(dx, dz) <= distanciaMaxima) return true;
    }
  }
  return false;
}

function cercaDeTienda() {
  if (!TIENDA.posicion) return false;
  return (
    p5.Vector.dist(jugador.posicion, TIENDA.posicion) <=
    TAMAÑO_CELDA * 3.2 * TIENDA_FACTOR
  );
}

function dibujarIndicadorPesca() {
  const pulso = (sin(frameCount * 0.08) + 1) / 2;

  fill(0, 0, 0, 135);
  noStroke();
  rect(width / 2 - 115, height * 0.85 - 20, 230, 36, 8);

  fill(255, 240, 100, 185 + pulso * 70);
  textAlign(CENTER, CENTER);
  textSize(14);
  let instruccion = "[F] / Clic  Lanzar la caña";
  if (estadoLanzamiento === "reposo" && buscarPuntoPescaEnfrente()) {
    instruccion = "[F] / Clic  Lanzar al agua";
  } else if (
    estadoLanzamiento === "en_agua" ||
    estadoLanzamiento === "esperando"
  ) {
    instruccion = "[F] / Clic  Recoger la línea";
  } else if (estadoLanzamiento === "lanzando") {
    instruccion = "Lanzando...";
  } else if (estadoLanzamiento === "retrayendo") {
    // El anzuelo vuelve a la punta de la caña (que se mueve), no a donde estaba al lanzar
    inicioLanzamientoMundo.set(calcularPuntaCañaMundo());
    instruccion = "Recogiendo...";
  }
  text(instruccion, width / 2, height * 0.85 - 2);
  textAlign(LEFT, BASELINE);
}

function keyPressed() {
  // Con el chat abierto ignoramos las teclas del juego para poder escribir en el input
  if (interfazBloqueada()) return;
  // Cerrar la pantalla de bienvenida con cualquier tecla
  if (bienvenidaActiva()) {
    cerrarBienvenida();
    return false;
  }

  // Si la enciclopedia está abierta, capturar todas las teclas
  if (ENCICLOPEDIA.abierta) {
    const anterior =
      key === "w" ||
      key === "W" ||
      keyCode === UP_ARROW ||
      key === "a" ||
      key === "A" ||
      keyCode === LEFT_ARROW;
    const siguiente =
      key === "s" ||
      key === "S" ||
      keyCode === DOWN_ARROW ||
      key === "d" ||
      key === "D" ||
      keyCode === RIGHT_ARROW;
    if (anterior) navegarEnciclopedia(-1);
    else if (siguiente) navegarEnciclopedia(1);
    else if (
      key === "e" ||
      key === "E" ||
      keyCode === ESCAPE ||
      key === "l" ||
      key === "L"
    )
      cerrarEnciclopedia();
    return false;
  }

  if (keyCode === ESCAPE) {
    if (menuTienda !== "cerrado") {
      cerrarMenu();
      return false;
    }
    cancelarPesca();
    return false;
  }
  if (menuTienda !== "cerrado") {
    const tecla = (key || "").toLowerCase();
    if (menuTienda === "comprar_caña") {
      if (tecla === "e") comprarCañaTienda();
      else if (tecla === "q" || keyCode === ESCAPE) cerrarMenu();
      return false;
    }
    if (tecla === "b" && menuTienda === "tienda") venderTodos();
    else if (
      tecla === "e" ||
      tecla === "i" ||
      tecla === "b" ||
      keyCode === ESCAPE
    )
      cerrarMenu();
    return false;
  }
  if (key === "i" || key === "I") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo"
    ) {
      abrirMenuInventario();
    }
    return false;
  }
  if (key === "l" || key === "L") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo" &&
      menuTienda === "cerrado"
    ) {
      abrirEnciclopedia();
    }
    return false;
  }
  if (key === "e" || key === "E") {
    if (
      sistemaCaptura.estado === "inactivo" &&
      estadoLanzamiento === "reposo" &&
      cercaDeTienda()
    ) {
      if (inventario.length > 0) abrirMenuTienda();
      else mostrarMensaje("No tenés peces para vender.");
    }
    return false;
  }
  if (key === "f" || key === "F") {
    if (sistemaCaptura.estado === "decidiendo_riesgo") {
      sistemaCaptura.elegirRiesgo(true);
      return false;
    }
    if (sistemaCaptura.estado === "esperando_mordida" && anzueloLanzado) {
      sistemaCaptura.cancelar();
      iniciarRecogidaAnzuelo();
    } else if (sistemaCaptura.estado === "inactivo") {
      if (estadoLanzamiento === "reposo" || estadoLanzamiento === "en_agua" || estadoLanzamiento === "esperando") {
        lanzarORecogerCaña();
      }
    }
    return false;
  }
  if (keyCode === 32) {
    if (sistemaCaptura.estado === "inactivo") {
      jugador.saltar();
    } else {
      sistemaCaptura.presionarBoton();
    }
    return false;
  }
  if (sistemaCaptura.estado !== "inactivo") {
    const tecla = (key || "").toLowerCase();
    if (["a", "s", "d", "z", "x", "c"].indexOf(tecla) !== -1) {
      sistemaCaptura.presionarTecla(key, keyCode);
      return false;
    }
  }
}

function keyReleased() {
  if (interfazBloqueada()) return;
  if (keyCode === 32) {
    sistemaCaptura.soltarBoton();
    return false;
  }
  if (sistemaCaptura.estado !== "inactivo") {
    const tecla = (key || "").toLowerCase();
    if (["a", "s", "d", "z", "x", "c"].indexOf(tecla) !== -1) {
      sistemaCaptura.soltarTecla(key, keyCode);
      return false;
    }
  }
}

function controlarClicEscena(evento) {
  if (interfazBloqueada()) return;
  // Cerrar la pantalla de bienvenida con clic
  if (bienvenidaActiva()) {
    cerrarBienvenida();
    return;
  }

  if (ENCICLOPEDIA.abierta) {
    manejarClicEnciclopedia(evento.clientX, evento.clientY);
    return;
  }
  if (menuTienda === "tienda") {
    manejarClicVenta(evento.clientX, evento.clientY);
    return;
  }
  if (menuTienda === "comprar_caña") {
    manejarClicComprarCaña(evento.clientX, evento.clientY);
    return;
  }
  if (menuTienda === "inventario") {
    manejarClicInventario(evento.clientX, evento.clientY);
    return;
  }

  if (mirandoCañaTienda()) {
    abrirMenuComprarCaña();
    return;
  }

  if (sistemaCaptura.estado !== "inactivo") {
    sistemaCaptura.presionarBoton({ x: evento.clientX, y: evento.clientY });
    return;
  }

  if (!ratonBloqueado) {
    lienzoJuego.elt.requestPointerLock();
    return;
  }

  // Con el ratón capturado, el clic lanza la caña (o recoge la línea) desde cualquier lugar
  lanzarORecogerCaña();
}

function cancelarPesca() {
  if (sistemaCaptura.estado === "inactivo" && estadoLanzamiento === "reposo")
    return;

  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  faseSalpicadura = 0;
  ajusteMiradaPesca = null;
  sistemaCaptura.cancelar();
}

// Duración (seg) de la preparación del lanzamiento: la caña se echa hacia atrás con el anzuelo colgando
const TIEMPO_PREPARACION_LANZAMIENTO = 0.28;
let preparacionLanzamiento = 0;

// Lanza el anzuelo desde la punta de la caña. Se puede usar desde cualquier lugar:
// si hay agua enfrente cae ahí; si no, cae en el suelo y la línea se recoge sola.
function lanzarORecogerCaña() {
  if (estadoLanzamiento === "reposo") {
    const agua = buscarPuntoPescaEnfrente();
    if (agua) {
      iniciarLanzamientoAnzuelo(agua, true);
    } else {
      const direccion = direccionMirada();
      direccion.y = 0;
      if (direccion.magSq() < 0.0001) direccion.set(0, 0, -1);
      direccion.normalize();
      const alcance = TAMAÑO_CELDA * 5;
      iniciarLanzamientoAnzuelo(
        createVector(
          jugador.posicion.x + direccion.x * alcance,
          0.08,
          jugador.posicion.y + direccion.z * alcance,
        ),
        false,
      );
    }
  } else if (
    estadoLanzamiento === "en_agua" ||
    estadoLanzamiento === "esperando"
  ) {
    iniciarRecogidaAnzuelo();
  }
}

function iniciarLanzamientoAnzuelo(destino, enAgua = true) {
  if (!destino) return;
  destinoPescaMundo.set(destino);
  // Sin animación de mirar hacia abajo: la cámara no se mueve al lanzar
  ajusteMiradaPesca = null;
  inicioLanzamientoMundo.set(calcularPuntaCañaMundo());
  posicionAnzueloMundo.set(inicioLanzamientoMundo);
  lanzamientoCaeEnAgua = enAgua;
  preparacionLanzamiento = 0;
  anzueloLanzado = true;
  estadoLanzamiento = "lanzando";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  faseSalpicadura = 0;
}

function actualizarEncuadrePesca(dt) {
  if (!ajusteMiradaPesca) return;
  ajusteMiradaPesca.progreso = Math.min(
    1,
    ajusteMiradaPesca.progreso + dt * 2.4,
  );
  const t = ajusteMiradaPesca.progreso;
  const suave = t * t * (3 - 2 * t);
  jugador.inclinacion = lerp(
    ajusteMiradaPesca.origen,
    ajusteMiradaPesca.destino,
    suave,
  );
  if (t >= 1) ajusteMiradaPesca = null;
}

function buscarPuntoPescaEnfrente() {
  if (!jugador) return null;

  const direccion = direccionMirada();
  direccion.y = 0;
  if (direccion.magSq() < 0.0001) return null;
  direccion.normalize();

  const origenX = jugador.posicion.x;
  const origenZ = jugador.posicion.y;
  const paso = 8;
  const distanciaMaxima = TAMAÑO_CELDA * 9;
  for (
    let distancia = TAMAÑO_CELDA * 0.35;
    distancia <= distanciaMaxima;
    distancia += paso
  ) {
    const x = origenX + direccion.x * distancia;
    const z = origenZ + direccion.z * distancia;
    const columna = Math.floor(x / TAMAÑO_CELDA);
    const fila = Math.floor(z / TAMAÑO_CELDA);
    if (fila < 0 || columna < 0 || fila >= MAPA_ALTO || columna >= MAPA_ANCHO)
      break;
    if (MAPA[fila][columna] === 3) {
      return createVector(
        (columna + 0.5) * TAMAÑO_CELDA,
        0.08,
        (fila + 0.5) * TAMAÑO_CELDA,
      );
    }
  }
  return null;
}

function calcularPuntaCañaMundo() {
  return puntoCañaMundo(0,0,-1);
}

function actualizarPosicionAnzueloEnArco(progreso) {
  // Interpola siempre desde la punta ACTUAL de la caña para que el anzuelo
  // salga de la punta y vuelva a la punta aunque el jugador o la caña se muevan.
  inicioLanzamientoMundo.set(calcularPuntaCañaMundo());
  posicionAnzueloMundo
    .set(inicioLanzamientoMundo)
    .lerp(destinoPescaMundo, progreso);
  const distancia = inicioLanzamientoMundo.dist(destinoPescaMundo);
  const alturaArco = Math.min(18, Math.max(7, distancia * 0.08));
  posicionAnzueloMundo.y += Math.sin(progreso * Math.PI) * alturaArco;
}

function iniciarRecogidaAnzuelo() {
  if (!anzueloLanzado || sistemaCaptura.estado !== "inactivo") return;
  estadoLanzamiento = "retrayendo";
  progresoLanzamiento = 1;
  tiempoEnAgua = 0;
}

function retraerAnzuelo() {
  anzueloLanzado = false;
  estadoLanzamiento = "reposo";
  progresoLanzamiento = 0;
  tiempoEnAgua = 0;
  esperaMordida = 0;
  lanzamientoCaeEnAgua = false;
  faseSalpicadura = 0;
  sistemaCaptura.cancelar();
}

function actualizarLanzamientoAnzuelo() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  if (estadoLanzamiento === "esperando" && sistemaCaptura.estado === "inactivo") iniciarRecogidaAnzuelo();
  if (estadoLanzamiento === "lanzando") {
    // Fase 1: preparación. La caña se echa hacia atrás y el anzuelo cuelga de la punta.
    if (preparacionLanzamiento < TIEMPO_PREPARACION_LANZAMIENTO) {
      preparacionLanzamiento += dt;
      inicioLanzamientoMundo.set(calcularPuntaCañaMundo());
      posicionAnzueloMundo.set(inicioLanzamientoMundo);
      return;
    }
    // Fase 2: latigazo. El anzuelo sale disparado desde la punta de la caña en arco.
    progresoLanzamiento = Math.min(1, progresoLanzamiento + dt * 1.05);
    actualizarPosicionAnzueloEnArco(progresoLanzamiento);
    if (progresoLanzamiento >= 1) {
      if (lanzamientoCaeEnAgua) {
        estadoLanzamiento = "en_agua";
        posicionAnzueloMundo.set(destinoPescaMundo);
        faseSalpicadura = 1;
        esperaMordida = random(2, 6);
      } else {
        mostrarMensaje("Ahí no hay agua. Apuntá hacia el lago para pescar.");
        estadoLanzamiento = "retrayendo";
      }
    }
  } else if (estadoLanzamiento === "retrayendo") {
    // El anzuelo vuelve a la punta de la caña (que se mueve), no a donde estaba al lanzar
    inicioLanzamientoMundo.set(calcularPuntaCañaMundo());
    progresoLanzamiento = Math.max(0, progresoLanzamiento - dt * 1.8);
    actualizarPosicionAnzueloEnArco(progresoLanzamiento);
    if (progresoLanzamiento === 0) retraerAnzuelo();
  } else if (estadoLanzamiento === "en_agua") {
    tiempoEnAgua += dt;
    if (tiempoEnAgua >= esperaMordida) {
      estadoLanzamiento = "esperando";
      sistemaCaptura.iniciar(elegirPezAleatorio());
    }
  }
}

function calcularAnimacionCaña() {
  const suavizar = (t) => t * t * (3 - 2 * t);
  const ATRAS = 0.62; // rotateX positivo = punta hacia el jugador
  const ADELANTE = -0.5; // rotateX negativo = punta hacia el agua

  if (estadoLanzamiento === "lanzando") {
    if (preparacionLanzamiento < TIEMPO_PREPARACION_LANZAMIENTO) {
      const t = suavizar(preparacionLanzamiento / TIEMPO_PREPARACION_LANZAMIENTO);
      return { x: ATRAS * t, z: 0.1 * t };
    }
    const p = progresoLanzamiento;
    if (p < 0.2) {
      // Latigazo rápido de atrás hacia adelante
      const t = suavizar(p / 0.2);
      return { x: lerp(ATRAS, ADELANTE, t), z: lerp(0.1, -0.12, t) };
    }
    // Recuperación suave hasta la pose base
    const t = suavizar((p - 0.2) / 0.8);
    return { x: lerp(ADELANTE, 0, t), z: lerp(-0.12, 0, t) };
  }
  if (estadoLanzamiento === "retrayendo") {
    return { x: Math.sin(progresoLanzamiento * Math.PI) * 0.22, z: 0 };
  }
  return { x: 0, z: 0 };
}
