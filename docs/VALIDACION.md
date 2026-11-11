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
