<?php
// API адміністратора для керування користувачами (CRUD)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

// Перевірка прав адміністратора
if (empty($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Доступ заборонено']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = (int)($_GET['id'] ?? 0);

switch ($method) {
    // Отримання списку всіх користувачів
    case 'GET':
        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'Користувача не знайдено']);
                exit;
            }
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            $stmt = $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
            echo json_encode(['success' => true, 'users' => $stmt->fetchAll()]);
        }
        break;

    // Створення нового користувача
    case 'POST':
        $input    = json_decode(file_get_contents('php://input'), true);
        $name     = trim($input['name'] ?? '');
        $email    = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $role     = in_array($input['role'] ?? '', ['user', 'admin']) ? $input['role'] : 'user';

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Усі поля обов\'язкові']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email вже використовується']);
            exit;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $email, $hash, $role]);
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    // Оновлення даних користувача
    case 'PUT':
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID обов\'язковий']);
            exit;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        // Явний білий список дозволених полів для запобігання SQL-ін'єкції
        $allowed = ['name' => true, 'email' => true, 'role' => true, 'password' => true];
        $fields = [];
        $params = [];

        if (!empty($input['name']))  { $fields[] = 'name = ?';  $params[] = trim($input['name']); }
        if (!empty($input['email'])) { $fields[] = 'email = ?'; $params[] = trim($input['email']); }
        if (!empty($input['role']) && in_array($input['role'], ['user', 'admin'])) {
            $fields[] = 'role = ?';
            $params[] = $input['role'];
        }
        if (!empty($input['password'])) {
            $fields[] = 'password = ?';
            $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

        unset($allowed); // використано лише для документування наміру

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Немає даних для оновлення']);
            exit;
        }

        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
        echo json_encode(['success' => true]);
        break;

    // Видалення користувача
    case 'DELETE':
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID обов\'язковий']);
            exit;
        }
        // Захист від видалення самого себе
        if ($id === (int)$_SESSION['user_id']) {
            http_response_code(400);
            echo json_encode(['error' => 'Неможливо видалити власний акаунт']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Метод не дозволений']);
}
