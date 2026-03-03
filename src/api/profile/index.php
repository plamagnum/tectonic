<?php
// API профілю користувача — перегляд та оновлення власних даних
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
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
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Отримання даних профілю
    $stmt = $pdo->prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Користувача не знайдено']);
        exit;
    }

    echo json_encode(['success' => true, 'user' => $user]);

} elseif ($method === 'PUT') {
    // Оновлення профілю
    $input  = json_decode(file_get_contents('php://input'), true);
    $fields = [];
    $params = [];

    if (!empty($input['name'])) {
        $fields[] = 'name = ?';
        $params[] = trim($input['name']);
        $_SESSION['user_name'] = trim($input['name']);
    }

    if (!empty($input['password'])) {
        if (strlen($input['password']) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Пароль повинен містити щонайменше 6 символів']);
            exit;
        }
        $fields[] = 'password = ?';
        $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Немає даних для оновлення']);
        exit;
    }

    $params[] = $userId;
    $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Профіль оновлено']);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не дозволений']);
}
