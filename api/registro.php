<?php
require 'comun.php';$d=entrada();
$nombre=is_string($d['usuario']??null)?trim($d['usuario']):'';
$email=is_string($d['email']??null)?trim($d['email']):'';
$pass=is_string($d['password']??null)?$d['password']:'';
if (!preg_match('/^[\p{L}\p{N}_-]{3,50}$/u',$nombre) || !filter_var($email,FILTER_VALIDATE_EMAIL) || strlen($email)>100 || strlen($pass)<6 || strlen($pass)>72) responder(['ok'=>false,'error'=>'Usuario de 3 a 50 letras/números, email válido y contraseña de 6 a 72 caracteres.'],400);
try {
    $q=$pdo->prepare('INSERT INTO usuarios(usuario,email,password_hash) VALUES(?,?,?)');$q->execute([$nombre,$email,password_hash($pass,PASSWORD_DEFAULT)]);
    responder(['ok'=>true,'usuario_id'=>(int)$pdo->lastInsertId()]);
} catch(PDOException $e) {
    if ($e->getCode()==='23000') responder(['ok'=>false,'error'=>'Usuario o email ya registrado.'],409);
    throw $e;
}
