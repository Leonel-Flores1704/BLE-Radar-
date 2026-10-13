<?php
declare(strict_types=1);
// Starter general: los endpoints de cada reto son trabajo de los estudiantes.
function db(): PDO {
    $configPath = __DIR__ . '/config.php';
    if (!is_file($configPath)) {
        throw new RuntimeException('Copiar config.example.php a config.php y configurar la BD');
    }
    $config = require $configPath;
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'], $config['port'], $config['database']);
    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
