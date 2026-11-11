<?php
require 'comun.php';entrada();$uid=usuarioActual();
$pdo->beginTransaction();$u=bloquearUsuario($uid);
$q=$pdo->prepare('SELECT COALESCE(SUM(precio),0) FROM inventario_peces WHERE usuario_id=?');$q->execute([$uid]);$total=(int)$q->fetchColumn();
$pdo->prepare('DELETE FROM inventario_peces WHERE usuario_id=?')->execute([$uid]);
$pdo->prepare('UPDATE usuarios SET dinero=dinero+? WHERE id=?')->execute([$total,$uid]);
$pdo->commit();responder(['ok'=>true,'total'=>$total,'dinero'=>(int)$u['dinero']+$total]);
