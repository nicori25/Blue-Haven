<?php
require 'comun.php';
if (empty($_SESSION['usuario_id'])) responder(['autenticado'=>false]);
$q=$pdo->prepare('SELECT id,usuario,dinero,tiene_bambu FROM usuarios WHERE id=?');$q->execute([$_SESSION['usuario_id']]);$u=$q->fetch();
if (!$u) responder(['autenticado'=>false]);
responder(['autenticado'=>true,'usuario_id'=>(int)$u['id'],'usuario'=>$u['usuario'],'dinero'=>(int)$u['dinero'],'tiene_bambu'=>(bool)$u['tiene_bambu']]);
