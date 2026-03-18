<?php
// API отримання результатів спроб поточного користувача
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

// Перевірка автентифікації
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Необхідна автентифікація']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$userId = (int)$_SESSION['user_id'];

// Загальна статистика користувача
$stmt = $pdo->prepare(
    'SELECT COUNT(*) AS total,
            SUM(is_correct) AS correct,
            ROUND(SUM(is_correct) / COUNT(*) * 100, 1) AS accuracy
     FROM attempts WHERE user_id = ?'
);
$stmt->execute([$userId]);
$stats = $stmt->fetch();

// Останні 20 спроб з назвами плит
$stmt = $pdo->prepare(
    'SELECT a.id, a.is_correct, a.answered_at,
            p.name AS correct_plate,
            sp.name AS selected_plate
     FROM attempts a
     JOIN plates p  ON a.plate_id = p.id
     JOIN plates sp ON a.selected_plate_id = sp.id
     WHERE a.user_id = ?
     ORDER BY a.answered_at DESC
     LIMIT 20'
);
$stmt->execute([$userId]);
$attempts = $stmt->fetchAll();

// Статистика по кожній плиті
$stmt = $pdo->prepare(
    'SELECT p.name,
            COUNT(*) AS total,
            SUM(a.is_correct) AS correct
     FROM attempts a
     JOIN plates p ON a.plate_id = p.id
     WHERE a.user_id = ?
     GROUP BY p.id, p.name
     ORDER BY total DESC'
);
$stmt->execute([$userId]);
$byPlate = $stmt->fetchAll();

echo json_encode([
    'success'  => true,
    'stats'    => $stats,
    'attempts' => $attempts,
    'by_plate' => $byPlate,
]);
