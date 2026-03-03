<?php
// API отримання всіх тектонічних плит з GeoJSON даними
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не дозволений']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

// Вибірка всіх плит, декодування GeoJSON з рядка
$stmt = $pdo->query('SELECT id, name, description, color, geojson FROM plates ORDER BY id');
$rows = $stmt->fetchAll();

$plates = array_map(function ($row) {
    $row['geojson'] = json_decode($row['geojson'], true);
    return $row;
}, $rows);

echo json_encode(['success' => true, 'plates' => $plates]);
