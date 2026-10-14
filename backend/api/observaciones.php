<?php
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $rows = db()->query(
            'SELECT id, device_id, nombre, rssi, nota, creado_en
             FROM observaciones
             ORDER BY creado_en DESC, id DESC'
        )->fetchAll();
        foreach ($rows as &$row) {
            $row['id'] = (int)$row['id'];
            $row['rssi'] = $row['rssi'] === null ? null : (int)$row['rssi'];
        }
        unset($row);
        respond(200, ['success' => true, 'data' => $rows]);
    } catch (Throwable $e) {
        error_log('GET observaciones: ' . $e->getMessage());
        respond(500, ['success' => false, 'error' => 'No se pudieron consultar las observaciones.']);
    }
}

if ($method !== 'POST') {
    header('Allow: GET, POST, OPTIONS');
    respond(405, ['success' => false, 'error' => 'Método no permitido.']);
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) {
    respond(400, ['success' => false, 'error' => 'El cuerpo debe ser un objeto JSON válido.']);
}

// device_id: obligatorio, string, máximo 128 caracteres.
$deviceId = $input['device_id'] ?? null;
if (!is_string($deviceId) || trim($deviceId) === '') {
    respond(400, ['success' => false, 'error' => 'device_id es obligatorio y debe ser texto.']);
}
$deviceId = trim($deviceId);
if (mb_strlen($deviceId) > 128) {
    respond(400, ['success' => false, 'error' => 'device_id no puede superar 128 caracteres.']);
}

// nombre: opcional, string de máximo 120 caracteres o null.
$nombre = $input['nombre'] ?? null;
if ($nombre !== null) {
    if (!is_string($nombre)) {
        respond(400, ['success' => false, 'error' => 'nombre debe ser texto o null.']);
    }
    $nombre = trim($nombre);
    if ($nombre === '') {
        $nombre = null;
    } elseif (mb_strlen($nombre) > 120) {
        respond(400, ['success' => false, 'error' => 'nombre no puede superar 120 caracteres.']);
    }
}

// rssi: entero entre -127 y 20, o null cuando no está disponible.
$rssi = $input['rssi'] ?? null;
if ($rssi !== null && (!is_int($rssi) || $rssi < -127 || $rssi > 20)) {
    respond(400, ['success' => false, 'error' => 'rssi debe ser un entero entre -127 y 20, o null.']);
}

// nota: texto de máximo 255 caracteres; puede ir vacía.
$nota = $input['nota'] ?? '';
if (!is_string($nota)) {
    respond(400, ['success' => false, 'error' => 'nota debe ser texto.']);
}
$nota = trim($nota);
if (mb_strlen($nota) > 255) {
    respond(400, ['success' => false, 'error' => 'nota no puede superar 255 caracteres.']);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare(
        'INSERT INTO observaciones (device_id, nombre, rssi, nota) VALUES (:device_id, :nombre, :rssi, :nota)'
    );
    $stmt->bindValue(':device_id', $deviceId, PDO::PARAM_STR);
    $stmt->bindValue(':nombre', $nombre, $nombre === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindValue(':rssi', $rssi, $rssi === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
    $stmt->bindValue(':nota', $nota, PDO::PARAM_STR);
    $stmt->execute();
    respond(201, ['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]]);
} catch (Throwable $e) {
    error_log('POST observaciones: ' . $e->getMessage());
    respond(500, ['success' => false, 'error' => 'No se pudo guardar la observación.']);
}
