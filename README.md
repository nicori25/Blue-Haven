# 🎣 Blue Haven

Juego de pesca 3D educativo para navegador. Explorá el lago, capturá nueve especies, superá cinco familias de minijuegos, vendé tus capturas y mejorá tu caña.

Esta versión integra el trabajo de [Sebasgvr/BlueHaven](https://github.com/Sebasgvr/BlueHaven), principalmente `backend`, con los recursos adicionales de `diseños`. Conserva el juego original y mejora rendimiento, guardado y funcionamiento local. Ver [procedencia y créditos](docs/PROCEDENCIA.md).

## Jugar como invitado

No requiere PHP ni base de datos. Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

Abrí **http://localhost:8000** y elegí **Jugar sin cuenta**. La partida de invitado se guarda en este navegador. Se puede pescar, vender, comprar/equipar la caña, consultar la enciclopedia y usar la guía local. Las cuentas requieren la instalación completa de abajo. No abras `index.html` directamente con `file://`.

## Jugar con cuentas y base de datos

Requiere Docker y Docker Compose:

```sh
cp .env.example .env
# Editá las dos contraseñas de .env antes de continuar.
docker compose up --build -d
```

Abrí **http://localhost:8080**. Compose crea MariaDB, importa las nueve especies y levanta Apache con PHP 8.3 y PDO MySQL. La base se conserva en el volumen `partida`.

```sh
docker compose down
```

Detiene los servicios y conserva las partidas. No agregues `-v` si querés conservarlas. Las importaciones automáticas ocurren solamente cuando se crea una base vacía.

También se puede usar Apache/PHP 8.1+ con PDO MySQL y MySQL/MariaDB. Creá `bluehaven_db`, importá en orden `bd/bluehaven_db.sql`, `bd/datos_peces.sql` y `bd/002_integracion.sql`, y configurá `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` en el entorno de PHP. `002_integracion.sql` se ejecuta **una sola vez**; para una instalación previa, hacé un respaldo e importá únicamente esa migración si ya tenés los dos primeros archivos. El SQL antiguo `bluehaven.sql` está conservado en `docs/legacy/` y no se utiliza.

## Controles

| Acción | Control |
|---|---|
| Moverte | W, A, S, D |
| Mirar | Mouse, después de hacer clic en la escena |
| Saltar / enganchar / pulso | Espacio |
| Agacharte | Control |
| Lanzar / recoger / arriesgar | F |
| Vender en la tienda | E |
| Mochila y equipar caña | I |
| Enciclopedia | L |
| Guía de pesca | Q o botón inferior derecho |
| Salir de un panel / cancelar | Escape |
| Ritmo | A/S/D o Z/X/C |

La caña de bambú se compra por $150 al hacer clic en su exhibición dentro de la tienda. La bienvenida explica los minijuegos. El juego está pensado para escritorio con teclado y mouse.

## Mejoras incluidas

- Terreno con `InstancedMesh`: 23 grupos en lugar de una malla por cada celda.
- Tienda reducida de **45.561.576 a aproximadamente 1.000.000 bytes**, con texturas WebP de hasta 512 px. Se conserva la geometría del edificio.
- Bibliotecas Three.js locales; el arranque ya no depende de un CDN. Fuentes del sistema.
- Calidad gráfica baja/media/alta, contador opcional de rendimiento y pausa al ocultar la pestaña.
- Movimiento ajustado al tiempo transcurrido; chat y ajustes bloquean los controles.
- Catálogo compartido para pesca, enciclopedia y guía de invitado; Pez Globo agregado a la base.
- Progreso de invitado separado de cada cuenta. El inventario vacío del servidor reemplaza correctamente el local.
- Precio, calidad y riesgo guardados por ejemplar. Las ventas y la compra de caña se realizan en transacciones del servidor.
- Capturas con identificador único, límite de mochila en servidor y registro de especies aun cuando se libera el pez por mochila llena.
- Los errores de conexión se muestran sin transformar una operación fallida en dinero local.
- Árbol de la rama `diseños` incorporado al escenario y logo integrado.

## Desarrollo y pruebas

Node.js 20+ solo es necesario para las herramientas de desarrollo:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:api
```

Las dos últimas pruebas usan `http://127.0.0.1:8080`; se puede cambiar con `TEST_URL`. La prueba de API crea cuentas y capturas de prueba: usala sobre una base de desarrollo. Para usar Chromium ya instalado: `CHROMIUM_PATH=/ruta/a/chromium npm run test:browser`.

`npm run optimize:shop -- entrada.glb salida.glb` reproduce la optimización de modelos. El archivo integrado ya está optimizado; usá como entrada el original al repetir el proceso.

## Alcance actual

Es un juego de un jugador. El servidor valida especies, precios, propiedad del inventario y saldo, pero el resultado del minijuego y la tirada de calidad todavía se originan en el cliente; no es un sistema antitrampas para rankings competitivos. Las cuentas requieren conexión para guardar capturas y efectuar compras/ventas. El invitado funciona de forma independiente y no se importa automáticamente a una cuenta.

Las nueve especies combinan contenido real y fantasía del prototipo. Las especies marinas se pueden capturar en el lago; los biomas y la selección de equipamiento por hábitat quedan para otra etapa.
