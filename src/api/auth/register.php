<?php
// API реєстрації нового користувача
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

require_once __DIR__ . '/../../config/database.php';

// Отримання та валідація вхідних даних
$input = json_decode(file_get_contents('php://input'), true);

$name     = trim($input['name'] ?? '');
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Усі поля обов\'язкові']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Невірний формат email']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Пароль повинен містити щонайменше 6 символів']);
    exit;
}

// Перевірка унікальності email
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Користувач з таким email вже існує']);
    exit;
}

// Хешування пароля та збереження користувача
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $email, $hash, 'user']);

$userId = $pdo->lastInsertId();

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Реєстрація успішна',
    'user'    => ['id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'user'],
]);
