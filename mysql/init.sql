-- =====================================================
-- Ініціалізація бази даних для проєкту "Тектоніка України"
-- =====================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Таблиця користувачів
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблиця тектонічних плит/структур
CREATE TABLE IF NOT EXISTS plates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(20) NOT NULL DEFAULT '#3388ff',
    geojson LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблиця спроб відповідей користувачів
CREATE TABLE IF NOT EXISTS attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    plate_id INT UNSIGNED NOT NULL,
    selected_plate_id INT UNSIGNED NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plate_id) REFERENCES plates(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_plate_id) REFERENCES plates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Початковий адміністратор (пароль: admin123)
-- УВАГА: Змініть пароль адміністратора після першого входу!
-- =====================================================
INSERT INTO users (name, email, password, role) VALUES
('Адміністратор', 'admin@tectonic.ua', '$2y$10$jZnIv0YTa4rqwAdLWUg4UeLGBtIvxk7cH3jwwSP6ry/BK.r4OhhPW', 'admin');

-- =====================================================
-- Тектонічні структури України з GeoJSON координатами
-- Формат GeoJSON: [longitude, latitude]
-- =====================================================

-- 1. Український щит (центральна Україна)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Український щит',
    'Давня докембрійська кристалічна платформа, що займає центральну частину України. Складається з архейських і протерозойських порід. Виходить на поверхню в Кіровоградській, Дніпропетровській та Запорізькій областях.',
    '#8B4513',
    '{"type":"Feature","properties":{"name":"Український щит"},"geometry":{"type":"Polygon","coordinates":[[[28,46],[30,46],[35,47],[38,48],[35,51],[30,51],[26,49],[27,47],[28,46]]]}}'
);

-- 2. Дніпровсько-Донецька западина (північно-східна Україна)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Дніпровсько-Донецька западина',
    'Велика тектонічна западина, що простягається від Чернігівської до Харківської областей. Містить потужні осадові відклади та є основним нафтогазоносним регіоном України.',
    '#4682B4',
    '{"type":"Feature","properties":{"name":"Дніпровсько-Донецька западина"},"geometry":{"type":"Polygon","coordinates":[[[30,49],[35,49],[38,50],[36,52],[32,52],[29,51],[30,49]]]}}'
);

-- 3. Волино-Подільська плита (західна Україна)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Волино-Подільська плита',
    'Стійка тектонічна плита на заході України, що охоплює Волинську, Рівненську та Хмельницьку області. Складається з осадових порід палеозою та мезозою.',
    '#228B22',
    '{"type":"Feature","properties":{"name":"Волино-Подільська плита"},"geometry":{"type":"Polygon","coordinates":[[[22,48],[27,48],[27,50],[24,52],[22,52],[22,48]]]}}'
);

-- 4. Причорноморська западина (південна Україна)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Причорноморська западина',
    'Молода тектонічна западина на півдні України вздовж узбережжя Чорного моря. Охоплює Одеську, Миколаївську та Херсонську області. Заповнена потужними кайнозойськими відкладами.',
    '#20B2AA',
    '{"type":"Feature","properties":{"name":"Причорноморська западина"},"geometry":{"type":"Polygon","coordinates":[[[28,45],[34,45],[36,46],[34,47],[30,47],[27,46],[28,45]]]}}'
);

-- 5. Донецька складчаста область (східна Україна)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Донецька складчаста область',
    'Герцинська складчаста споруда на сході України у Донецькій та Луганській областях. Багата кам''яновугільними відкладами, є основним вугільним басейном країни.',
    '#DC143C',
    '{"type":"Feature","properties":{"name":"Донецька складчаста область"},"geometry":{"type":"Polygon","coordinates":[[[36,47],[40,47],[40,49],[38,50],[36,49],[36,47]]]}}'
);

-- 6. Закарпатський прогин (крайній захід України)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Закарпатський прогин',
    'Вузький міжгірський прогин на крайньому заході України у Закарпатській області. Відокремлює Карпати від Паннонської западини. Містить вулканічні породи.',
    '#9370DB',
    '{"type":"Feature","properties":{"name":"Закарпатський прогин"},"geometry":{"type":"Polygon","coordinates":[[[22,47.5],[24,47.5],[24,48.5],[22,48.5],[22,47.5]]]}}'
);

-- 7. Передкарпатський прогин (захід України)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Передкарпатський прогин',
    'Крайовий прогин на захід від Карпат, що охоплює Львівську та Івано-Франківську області. Важливий нафтогазоносний район. Сформований в альпійський орогенез.',
    '#FF8C00',
    '{"type":"Feature","properties":{"name":"Передкарпатський прогин"},"geometry":{"type":"Polygon","coordinates":[[[23,48],[26,48],[26,49],[24,50],[23,49],[23,48]]]}}'
);

-- 8. Складчаста область Карпат (Карпатські гори)
INSERT INTO plates (name, description, color, geojson) VALUES (
    'Складчаста область Карпат',
    'Альпійська складчаста споруда Карпатських гір. Охоплює гірську частину Львівської, Івано-Франківської, Закарпатської та Чернівецької областей. Сформована в крейдово-палеогеновий час.',
    '#556B2F',
    '{"type":"Feature","properties":{"name":"Складчаста область Карпат"},"geometry":{"type":"Polygon","coordinates":[[[22,47],[24,47],[25,48.5],[23,49],[22,48.5],[22,47]]]}}'
);
