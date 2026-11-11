<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax',
        'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'use_strict_mode' => true]);
}
require_once __DIR__ . '/db.php';
function responder($datos, $estado = 200) {
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}
function entrada() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(['ok'=>false,'error'=>'Usá POST.'],405);
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) responder(['ok'=>false,'error'=>'Se requiere JSON.'],415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 4096) responder(['ok'=>false,'error'=>'Solicitud demasiado grande.'],413);
    $d = json_decode(file_get_contents('php://input'), true);
    if (!is_array($d)) responder(['ok'=>false,'error'=>'JSON inválido.'],400);
    return $d;
}
function usuarioActual() {
    if (empty($_SESSION['usuario_id'])) responder(['ok'=>false,'error'=>'Iniciá sesión para continuar.'],401);
    return (int)$_SESSION['usuario_id'];
}
function bloquearUsuario($uid) {
    $q = $GLOBALS['pdo']->prepare('SELECT dinero, tiene_bambu FROM usuarios WHERE id=? FOR UPDATE');
    $q->execute([$uid]);
    $u = $q->fetch();
    if (!$u) responder(['ok'=>false,'error'=>'Usuario inexistente.'],401);
    return $u;
}
function precioCaptura($rareza, $calidad, $riesgo) {
    $bases = [1=>50,2=>120,3=>300,4=>800,5=>2000];
    $multiplicadores = ['comun'=>1,'poco_comun'=>1.5,'raro'=>2.25,'epico'=>3.5,'legendario'=>5.5];
    return (int)round(($bases[$rareza] ?? 10) * $multiplicadores[$calidad] * ($riesgo ? 1.4 : 1));
}
set_exception_handler(function($e) {
    if (isset($GLOBALS['pdo']) && $GLOBALS['pdo']->inTransaction()) $GLOBALS['pdo']->rollBack();
    error_log('BlueHaven API: ' . $e->getMessage());
    responder(['ok'=>false,'error'=>'No se pudo completar la operación. Reintentá.'],500);
});
