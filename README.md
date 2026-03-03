# 🌍 Тектоніка України

Інтерактивна навчальна веб-застосунок для визначення та вивчення тектонічних структур України.

## Технічний стек

| Компонент | Технологія |
|-----------|-----------|
| Frontend  | HTML5, CSS3, JavaScript (Vanilla + Leaflet.js) |
| Backend   | PHP 8.2 (FPM) |
| Сервер    | Nginx (Alpine) |
| База даних| MySQL 8.0 |
| Адмін БД  | phpMyAdmin |
| Деплой    | Docker + Docker Compose |

## Функціональність

- 🗺️ Інтерактивна карта України (Leaflet.js) з 8 тектонічними структурами
- 🎯 Ігровий режим — вгадування плит за назвою з підсвіченням правильної відповіді
- 📊 Статистика спроб з розбивкою по кожній плиті
- 👤 Реєстрація, вхід, профіль користувача (сесійна автентифікація)
- ⚙️ Адмін-панель для управління користувачами та плитами (CRUD)
- 🌙 Перемикання темної/світлої теми

## Тектонічні структури

1. Український щит
2. Дніпровсько-Донецька западина
3. Волино-Подільська плита
4. Причорноморська западина
5. Донецька складчаста область
6. Закарпатський прогин
7. Передкарпатський прогин
8. Складчаста область Карпат

## Запуск

### Передумови

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/install/) ≥ 2

### Кроки

```bash
# 1. Клонуйте репозиторій
git clone <url> tectonic
cd tectonic

# 2. Скопіюйте файл змінних середовища
cp .env.example .env

# 3. (Опційно) Відредагуйте паролі у .env

# 4. Запустіть контейнери
docker compose up -d --build

# 5. Зачекайте кілька секунд на ініціалізацію MySQL
```

### Доступ

| Сервіс       | URL                          |
|--------------|------------------------------|
| Застосунок   | http://localhost              |
| phpMyAdmin   | http://localhost:8080         |

### Обліковий запис адміністратора

| Поле  | Значення          |
|-------|-------------------|
| Email | admin@tectonic.ua |
| Пароль| admin123          |

## Структура проєкту

```
tectonic/
├── docker-compose.yml        # Оркестрація сервісів
├── Dockerfile                # PHP-FPM образ
├── nginx/
│   └── default.conf          # Конфігурація Nginx
├── mysql/
│   └── init.sql              # Схема БД та початкові дані
├── src/
│   ├── config/
│   │   └── database.php      # PDO підключення
│   ├── api/
│   │   ├── auth/             # Реєстрація / вхід / вихід
│   │   ├── admin/            # CRUD для адміністратора
│   │   ├── plates/           # API тектонічних плит
│   │   ├── attempts/         # Збереження та результати спроб
│   │   └── profile/          # Профіль користувача
│   ├── assets/
│   │   ├── css/style.css     # Стилі (темна/світла тема)
│   │   └── js/               # app.js, map.js, auth.js, admin.js, theme.js
│   ├── index.html            # Головна SPA-сторінка
│   └── admin.html            # Адмін-панель
├── .env.example
├── .gitignore
└── README.md
```

## API

Усі відповіді у форматі JSON.

| Метод | URL | Опис |
|-------|-----|------|
| POST | `/api/auth/register.php` | Реєстрація |
| POST | `/api/auth/login.php` | Вхід |
| POST | `/api/auth/logout.php` | Вихід |
| GET  | `/api/plates/index.php` | Список плит |
| POST | `/api/attempts/submit.php` | Зберегти спробу |
| GET  | `/api/attempts/results.php` | Результати |
| GET/PUT | `/api/profile/index.php` | Профіль |
| GET/POST/PUT/DELETE | `/api/admin/users.php` | Управління користувачами |
| GET/POST/PUT/DELETE | `/api/admin/tasks.php` | Управління плитами |

## Зупинка

```bash
docker compose down          # зупинити контейнери
docker compose down -v       # зупинити та видалити дані MySQL
```
