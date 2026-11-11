<?php
require 'comun.php'; $uid=usuarioActual();
$q=$pdo->prepare('SELECT ip.id, p.id AS pez_id, p.nombre, p.rareza, p.sprite, ip.calidad_id AS calidadId, ip.captura_riesgo AS capturaRiesgo, ip.precio FROM inventario_peces ip JOIN peces p ON p.id=ip.pez_id WHERE ip.usuario_id=? ORDER BY ip.id');
$q->execute([$uid]); $filas=$q->fetchAll();
foreach ($filas as &$f) { $f['precio']=(int)$f['precio']; $f['rareza']=(int)$f['rareza']; $f['capturaRiesgo']=(bool)$f['capturaRiesgo']; }
unset($f); responder($filas);
