<?php
// API збереження спроби відповіді користувача
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не дозволений']);
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

$input            = json_decode(file_get_contents('php://input'), true);
$plateId          = (int)($input['plate_id'] ?? 0);
$selectedPlateId  = (int)($input['selected_plate_id'] ?? 0);

if ($plateId <= 0 || $selectedPlateId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Невірні дані запиту']);
    exit;
}

// Перевірка існування обох плит у базі даних
$stmt = $pdo->prepare('SELECT id FROM plates WHERE id = ?');
$stmt->execute([$plateId]);
if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Плиту не знайдено']);
    exit;
}
if ($selectedPlateId !== $plateId) {
    $stmt->execute([$selectedPlateId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Обрану плиту не знайдено']);
        exit;
    }
}

$isCorrect = ($plateId === $selectedPlateId) ? 1 : 0;

// Збереження спроби у базі даних
$stmt = $pdo->prepare(
    'INSERT INTO attempts (user_id, plate_id, selected_plate_id, is_correct) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$_SESSION['user_id'], $plateId, $selectedPlateId, $isCorrect]);

// Отримання назви правильної плити для відповіді
$stmt = $pdo->prepare('SELECT name, description FROM plates WHERE id = ?');
$stmt->execute([$plateId]);
$correctPlate = $stmt->fetch();

echo json_encode([
    'success'       => true,
    'is_correct'    => (bool)$isCorrect,
    'correct_plate' => $correctPlate,
]);
