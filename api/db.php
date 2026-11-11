<?php
header('Content-Type: application/json; charset=utf-8');
try {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $db = getenv('DB_NAME') ?: 'bluehaven_db';
    $user = getenv('DB_USER') ?: 'bluehaven';
    $pass = getenv('DB_PASSWORD') ?: '';
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    error_log('BlueHaven database: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'La base de datos no está disponible. Podés jugar como invitado.']);
    exit;
}
