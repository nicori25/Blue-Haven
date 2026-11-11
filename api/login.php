<?php
require 'comun.php';$d=entrada();
$nombre=is_string($d['usuario']??null)?trim($d['usuario']):'';
$pass=is_string($d['password']??null)?$d['password']:'';
$q=$pdo->prepare('SELECT id,usuario,password_hash,dinero,tiene_bambu FROM usuarios WHERE usuario=?');$q->execute([$nombre]);$u=$q->fetch();
if (!$u || !password_verify($pass,$u['password_hash'])) responder(['ok'=>false,'error'=>'Usuario o contraseña incorrectos.'],401);
session_regenerate_id(true);$_SESSION['usuario_id']=(int)$u['id'];
responder(['ok'=>true,'usuario_id'=>(int)$u['id'],'usuario'=>$u['usuario'],'dinero'=>(int)$u['dinero'],'tiene_bambu'=>(bool)$u['tiene_bambu']]);
