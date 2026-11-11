<?php
require 'comun.php';
$d = entrada(); $uid = usuarioActual();
$id = filter_var($d['pez_id'] ?? null, FILTER_VALIDATE_INT);
$calidad = $d['calidad'] ?? 'comun'; $riesgo = ($d['riesgo'] ?? false) === true;
$token = $d['captura_token'] ?? '';
if (!$id || !in_array($calidad,['comun','poco_comun','raro','epico','legendario'],true) || !is_string($token) || !preg_match('/^[a-zA-Z0-9-]{16,64}$/',$token)) responder(['ok'=>false,'error'=>'Captura inválida.'],400);
$pdo->beginTransaction(); bloquearUsuario($uid);
$q=$pdo->prepare('SELECT inventario_id, precio FROM eventos_captura WHERE usuario_id=? AND token=?'); $q->execute([$uid,$token]);
if ($prev=$q->fetch()) { $pdo->commit(); responder(['ok'=>true]+$prev); }
$q=$pdo->prepare('SELECT rareza FROM peces WHERE id=?');$q->execute([$id]);$pez=$q->fetch();
if (!$pez) { $pdo->rollBack(); responder(['ok'=>false,'error'=>'Especie inexistente.'],400); }
$precio=precioCaptura((int)$pez['rareza'],$calidad,$riesgo);
$pdo->prepare('INSERT INTO capturas_usuario(usuario_id,pez_id,cantidad_capturada) VALUES(?,?,1) ON DUPLICATE KEY UPDATE cantidad_capturada=cantidad_capturada+1')->execute([$uid,$id]);
$q=$pdo->prepare('SELECT COUNT(*) FROM inventario_peces WHERE usuario_id=?');$q->execute([$uid]);
$inventarioId=null;
if ((int)$q->fetchColumn()<10) {
    $pdo->prepare('INSERT INTO inventario_peces(usuario_id,pez_id,calidad_id,captura_riesgo,precio) VALUES(?,?,?,?,?)')->execute([$uid,$id,$calidad,(int)$riesgo,$precio]);
    $inventarioId=(int)$pdo->lastInsertId();
}
$pdo->prepare('INSERT INTO eventos_captura(usuario_id,token,inventario_id,precio) VALUES(?,?,?,?)')->execute([$uid,$token,$inventarioId,$precio]);
$pdo->commit(); responder(['ok'=>true,'inventario_id'=>$inventarioId,'precio'=>$precio]);
