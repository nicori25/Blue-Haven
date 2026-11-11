<?php
require 'comun.php';entrada();$uid=usuarioActual();
$pdo->beginTransaction();$u=bloquearUsuario($uid);
if ($u['tiene_bambu']) { $pdo->commit();responder(['ok'=>true,'dinero'=>(int)$u['dinero']]); }
if ((int)$u['dinero']<150) { $pdo->rollBack();responder(['ok'=>false,'error'=>'Necesitás $150 para la caña.'],409); }
$pdo->prepare('UPDATE usuarios SET dinero=dinero-150,tiene_bambu=1 WHERE id=?')->execute([$uid]);
$pdo->commit();responder(['ok'=>true,'dinero'=>(int)$u['dinero']-150]);
