# Validación de la integración

Comprobaciones realizadas el 11 de noviembre de 2026 en Chromium con renderizado por software y viewport de 960 × 540:

- Cinco pruebas de lógica: catálogo, precios, aislamiento de cuentas, límite de mochila y conservación del estado ante errores de red.
- Prueba de navegador: carga del mundo y sus modelos, invitado, guía local, bloqueo de movimiento, ajustes gráficos, enciclopedia, construcción/actualización/dibujo de las cinco familias de minijuegos y recuperación de dinero/caña después de recargar.
- API real con PHP 8.3 y MariaDB 11.4: registro, contraseña incorrecta, inicio/cierre de sesión, nueve especies, capturas de calidad legendaria, riesgo, repetición de solicitudes sin duplicados, propiedad del inventario, venta individual, venta total, compra persistente de caña, límite de diez peces y registro de la undécima captura liberada, validación de entradas y chatbot.
- Sintaxis JavaScript y PHP comprobada.

## Rendimiento

El escenario original contiene aproximadamente 1.670 objetos en la raíz de la escena. El escenario integrado contiene alrededor de 40, incluyendo ocho árboles añadidos. El terreno ahora usa 23 grupos instanciados.

En la posición inicial de la nueva versión, el render original generó 569 llamadas de dibujo en una muestra previa a terminar la carga de la tienda. La versión integrada, con la tienda cargada, generó 62. Son mediciones de llamadas de dibujo, no una garantía de FPS ni un benchmark de hardware del usuario.

El modelo `tiendaPesca.glb` pasó de 45.561.576 bytes a menos de 1 MB. Su geometría visible se conserva; las texturas se redujeron a 512 px y se convirtieron a WebP.

El rendimiento real depende de GPU, navegador y resolución. El selector permite bajar la resolución de renderizado y limitar a 30 FPS en equipos modestos.

## Pendiente

No se hizo una partida manual completa hasta capturar todas las especies ni una medición en el equipo del usuario. La API verifica las operaciones de economía y su propietario; los resultados de minijuego y calidad siguen siendo del cliente, como corresponde al alcance actual de prototipo de un jugador.

# Migración a Supabase — validación vigente

La API PHP y MariaDB de la primera integración fueron reemplazadas por Supabase Auth, PostgreSQL, RLS y RPC. Las verificaciones de la sección anterior describen la versión histórica.

Pruebas del nuevo backend ejecutadas sobre servicios reales de Supabase Auth (GoTrue 2.197), PostgreSQL 16 y PostgREST 14.18 en un stack local:

- Registro y sesión mediante el SDK oficial de Supabase.
- Perfil automático para cada usuario de Auth y catálogo de nueve especies.
- Aislamiento entre dos cuentas con RLS; una cuenta no puede leer inventarios ajenos.
- Escritura directa de saldo e inventario bloqueada; anónimos sin acceso al estado.
- Capturas idempotentes, calidad y riesgo; mochila limitada a diez ejemplares y descubrimiento de la captura liberada.
- Dos ventas simultáneas del mismo ejemplar: una sola acredita dinero.
- Venta total, compra de caña persistente, consultas privadas de la guía y cierre de sesión.

En el proyecto alojado se verificaron la URL y la clave pública y la configuración de Auth. La consulta a `bh_estado` informó que la función todavía no existe: la instalación de `supabase/instalar.sql` debe ejecutarla el propietario en el panel. La clave pública no permite crear el esquema; no se utilizaron credenciales administrativas ni se registraron cuentas de prueba en el proyecto alojado.

También pasó la prueba de navegador contra el stack local real: registro desde el formulario, captura/venta/compra, recarga con sesión recuperada y saldo/caña persistentes, cierre de sesión, invitado con progreso separado y nuevo inicio de sesión por email. La prueba de invitado y las cinco pruebas de lógica siguieron aprobadas.

# Rama independiente p5.js WEBGL

La rama `version/p5-webgl` conserva Supabase y reemplaza completamente el motor de dibujo de `main`. Las bibliotecas Three.js y sus loaders se retiraron de esta rama. El navegador carga OBJ y texturas mediante p5.js; no descarga GLB/glTF.

Validación de esta variante en Chromium, viewport 960 × 540, renderizado por software:

- Ocho pruebas de lógica y geometría aprobadas: economía, aislamiento de partidas, límite de mochila, errores de red, alturas, paredes y archivos convertidos.
- Mundo p5.WEBGL confirmado mediante el contexto WebGL real. `THREE` no existe en el navegador. Se observan 23 geometrías de terreno y 45 lotes de modelos en la vista inicial; el contador incluye modelos, no cada llamada interna de GPU de p5.js.
- Pruebas de teclado WASD, captura del mouse, movimiento de cámara, lanzamiento real al agua, recogida, selección de la caña de la tienda, compra y cambio de tamaño de ventana.
- Interfaz, guía, enciclopedia, las cinco familias de minijuegos y progreso de invitado comprobados.
- Registro, economía, restauración de sesión, cierre de sesión, separación del invitado y nuevo inicio de sesión comprobados en navegador contra Supabase Auth/PostgreSQL/PostgREST locales reales.
- Capturas del lago durante la pesca y del interior de la tienda inspeccionadas visualmente. Se corrigieron las normales de los OBJ y se reinician las luces del buffer p5.Graphics por fotograma para evitar acumulaciones de iluminación.

Los materiales de esta rama usan color base y luces de p5.js. No reproducen los mapas PBR de Three.js. No se midieron FPS en el equipo del usuario ni se realizó una partida manual hasta completar todas las especies.
