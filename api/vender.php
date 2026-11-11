<?php
require 'comun.php'; $d=entrada(); $uid=usuarioActual();
$id=filter_var($d['inventario_id']??null,FILTER_VALIDATE_INT);
if (!$id) responder(['ok'=>false,'error'=>'Falta inventario_id.'],400);
$pdo->beginTransaction();$u=bloquearUsuario($uid);
$q=$pdo->prepare('SELECT precio FROM inventario_peces WHERE id=? AND usuario_id=? FOR UPDATE');$q->execute([$id,$uid]);$f=$q->fetch();
if (!$f) { $pdo->rollBack(); responder(['ok'=>false,'error'=>'Ese pez ya no está en tu mochila.'],404); }
$precio=(int)$f['precio'];
$pdo->prepare('DELETE FROM inventario_peces WHERE id=? AND usuario_id=?')->execute([$id,$uid]);
$pdo->prepare('UPDATE usuarios SET dinero=dinero+? WHERE id=?')->execute([$precio,$uid]);
$pdo->commit();responder(['ok'=>true,'precio'=>$precio,'dinero'=>(int)$u['dinero']+$precio]);
