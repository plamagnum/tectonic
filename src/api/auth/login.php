<?php
// API входу користувача (сесійна автентифікація)
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

require_once __DIR__ . '/../../config/database.php';

$input    = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email та пароль обов\'язкові']);
    exit;
}

// Пошук користувача за email
$stmt = $pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Перевірка пароля за допомогою password_verify
if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Невірний email або пароль']);
    exit;
}

// Збереження даних користувача в сесії
$_SESSION['user_id']   = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_role'] = $user['role'];

echo json_encode([
    'success' => true,
    'message' => 'Вхід успішний',
    'user'    => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ],
]);
