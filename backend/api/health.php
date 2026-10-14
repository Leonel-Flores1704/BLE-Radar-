<?php
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../db.php';
try {
    $pdo = db();
    $ok = (int)$pdo->query('SELECT 1')->fetchColumn() === 1;
    if (!$ok) {
        respond(503, ['success' => false, 'error' => 'La base de datos no respondió correctamente.']);
    }
    respond(200, ['success' => true, 'data' => ['php' => PHP_VERSION, 'mysql' => 'ok']]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond(503, ['success' => false, 'error' => 'No se pudo conectar a la base de datos.']);
}
