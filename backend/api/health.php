<?php
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../db.php';
try {
    $pdo = db();
    $ok = (int)$pdo->query('SELECT 1')->fetchColumn() === 1;
    respond(200, ['success' => $ok, 'data' => ['php' => PHP_VERSION, 'mysql' => 'ok']]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    respond(503, ['success' => false, 'error' => 'No se pudo conectar a la base de datos.']);
}
