<?php
// Конфігурація підключення до бази даних через PDO
// Змінні середовища задаються у docker-compose.yml

$dbHost = getenv('DB_HOST') ?: 'mysql';
$dbName = getenv('DB_NAME') ?: 'tectonic';
$dbUser = getenv('DB_USER') ?: 'tectonic_user';
$dbPass = getenv('DB_PASS') ?: 'tectonic_pass';

$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";

$pdoOptions = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $pdoOptions);
} catch (PDOException $e) {
    // Повертаємо помилку у форматі JSON без розкриття деталей підключення
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Помилка підключення до бази даних']);
    exit;
}
