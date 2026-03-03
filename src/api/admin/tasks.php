<?php
// API адміністратора для керування тектонічними плитами (CRUD)
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
    // Отримання плити або списку всіх плит
    case 'GET':
        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT id, name, description, color, geojson FROM plates WHERE id = ?');
            $stmt->execute([$id]);
            $plate = $stmt->fetch();
            if (!$plate) {
                http_response_code(404);
                echo json_encode(['error' => 'Плиту не знайдено']);
                exit;
            }
            $plate['geojson'] = json_decode($plate['geojson'], true);
            echo json_encode(['success' => true, 'plate' => $plate]);
        } else {
            $stmt = $pdo->query('SELECT id, name, description, color, geojson FROM plates ORDER BY id');
            $rows = $stmt->fetchAll();
            $plates = array_map(function ($r) {
                $r['geojson'] = json_decode($r['geojson'], true);
                return $r;
            }, $rows);
            echo json_encode(['success' => true, 'plates' => $plates]);
        }
        break;

    // Створення нової плити
    case 'POST':
        $input       = json_decode(file_get_contents('php://input'), true);
        $name        = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $color       = trim($input['color'] ?? '#3388ff');
        $geojson     = $input['geojson'] ?? null;

        if (empty($name) || empty($geojson)) {
            http_response_code(400);
            echo json_encode(['error' => 'Назва та GeoJSON обов\'язкові']);
            exit;
        }

        $geojsonStr = is_array($geojson) ? json_encode($geojson) : $geojson;
        $stmt = $pdo->prepare(
            'INSERT INTO plates (name, description, color, geojson) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$name, $description, $color, $geojsonStr]);
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    // Оновлення існуючої плити
    case 'PUT':
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID обов\'язковий']);
            exit;
        }
        $input  = json_decode(file_get_contents('php://input'), true);
        // Явний білий список дозволених полів для запобігання SQL-ін'єкції
        $fields = [];
        $params = [];

        if (!empty($input['name']))       { $fields[] = 'name = ?';        $params[] = trim($input['name']); }
        if (isset($input['description'])) { $fields[] = 'description = ?'; $params[] = trim($input['description']); }
        if (!empty($input['color']))      { $fields[] = 'color = ?';       $params[] = trim($input['color']); }
        if (!empty($input['geojson'])) {
            $fields[] = 'geojson = ?';
            $params[] = is_array($input['geojson']) ? json_encode($input['geojson']) : $input['geojson'];
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Немає даних для оновлення']);
            exit;
        }

        $params[] = $id;
        $stmt = $pdo->prepare('UPDATE plates SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
        echo json_encode(['success' => true]);
        break;

    // Видалення плити
    case 'DELETE':
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'ID обов\'язковий']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM plates WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Метод не дозволений']);
}
