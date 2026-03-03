// Модуль карти — ігрова логіка з тектонічними плитами України

// Безпечне екранування HTML для запобігання XSS
function escHtmlMap(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MapModule = (() => {
  let map          = null;  // Екземпляр Leaflet-карти
  let plates       = [];    // Масив плит із бази даних
  let layers       = {};    // Leaflet-шари за plate.id
  let currentPlate = null;  // Поточна плита для вгадування
  let answered     = false; // Чи відповів користувач на поточне питання
  let score        = { correct: 0, total: 0 }; // Лічильник сесії

  // Ініціалізація карти Leaflet
  function initMap() {
    if (map) return;

    // Центруємо на Україні
    map = L.map('map').setView([48.5, 31.5], 6);

    // Базовий шар OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
  }

  // Завантаження плит з API
  async function loadPlates() {
    try {
      const res  = await fetch('/api/plates/index.php');
      const data = await res.json();
      if (!data.success) throw new Error('Помилка завантаження плит');
      plates = data.plates;
      renderLayers();
      nextQuestion();
    } catch (err) {
      console.error('Помилка завантаження плит:', err);
      document.getElementById('game-question-text').textContent =
        'Помилка завантаження даних. Перевірте підключення до сервера.';
    }
  }

  // Відображення GeoJSON-полігонів на карті
  function renderLayers() {
    // Очищення попередніх шарів
    Object.values(layers).forEach((l) => map.removeLayer(l));
    layers = {};

    plates.forEach((plate) => {
      const layer = L.geoJSON(plate.geojson, {
        style: {
          color:       plate.color,
          fillColor:   plate.color,
          fillOpacity: 0.35,
          weight:      2,
        },
      });

      // Підпис назви плити на центроїді полігону
      const bounds  = layer.getBounds();
      const center  = bounds.getCenter();
      const label   = L.divIcon({
        className: 'plate-label',
        html:      `<span>${plate.name}</span>`,
      });
      L.marker(center, { icon: label, interactive: false }).addTo(map);

      // Обробник кліку по полігону
      layer.on('click', () => handleAnswer(plate));
      layer.on('mouseover', () => {
        if (!answered) {
          layer.setStyle({ fillOpacity: 0.55, weight: 3 });
        }
      });
      layer.on('mouseout', () => {
        if (!answered) {
          layer.setStyle({ fillOpacity: 0.35, weight: 2 });
        }
      });

      layer.addTo(map);
      layers[plate.id] = layer;
    });
  }

  // Вибір випадкової плити для нового запитання
  function nextQuestion() {
    if (!plates.length) return;

    answered = false;
    // Скидання стилів усіх шарів
    plates.forEach((p) => {
      if (layers[p.id]) {
        layers[p.id].setStyle({
          color:       p.color,
          fillColor:   p.color,
          fillOpacity: 0.35,
          weight:      2,
        });
      }
    });

    // Приховання блоку з поясненням
    const feedback = document.getElementById('answer-feedback');
    if (feedback) { feedback.style.display = 'none'; feedback.className = 'answer-feedback'; }

    // Обираємо випадкову плиту
    currentPlate = plates[Math.floor(Math.random() * plates.length)];

    const questionEl = document.getElementById('game-question-text');
    if (questionEl) {
      questionEl.innerHTML = `Знайдіть на карті: <span>${currentPlate.name}</span>`;
    }
    updateScore();

    // Кнопка "далі" — прихована до відповіді
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.style.display = 'none';
  }

  // Обробка відповіді користувача
  async function handleAnswer(clickedPlate) {
    if (answered || !currentPlate) return;
    answered = true;

    const isCorrect = (clickedPlate.id === currentPlate.id);
    score.total += 1;
    if (isCorrect) score.correct += 1;
    updateScore();

    // Підсвічення правильної та обраної плит
    if (!isCorrect && layers[currentPlate.id]) {
      layers[currentPlate.id].setStyle({ fillColor: '#16a34a', fillOpacity: 0.65, color: '#16a34a', weight: 3 });
    }
    if (layers[clickedPlate.id]) {
      const style = isCorrect
        ? { fillColor: '#16a34a', fillOpacity: 0.65, color: '#16a34a', weight: 3 }
        : { fillColor: '#dc2626', fillOpacity: 0.65, color: '#dc2626', weight: 3 };
      layers[clickedPlate.id].setStyle(style);
    }

    // Відображення пояснення
    const feedback = document.getElementById('answer-feedback');
    if (feedback) {
      feedback.style.display = 'block';
      feedback.className     = `answer-feedback ${isCorrect ? 'correct' : 'wrong'}`;
      if (isCorrect) {
        feedback.innerHTML = `✅ <strong>Правильно!</strong> Це дійсно <em>${escHtmlMap(currentPlate.name)}</em>.<br>
          <small>${escHtmlMap(currentPlate.description || '')}</small>`;
      } else {
        feedback.innerHTML = `❌ <strong>Неправильно.</strong> Ви обрали <em>${escHtmlMap(clickedPlate.name)}</em>,
          а правильна відповідь — <em>${escHtmlMap(currentPlate.name)}</em>.<br>
          <small>${escHtmlMap(currentPlate.description || '')}</small>`;
      }
    }

    // Збереження спроби на сервері (тільки для авторизованих)
    if (Auth.isLoggedIn()) {
      try {
        await fetch('/api/attempts/submit.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate_id:          currentPlate.id,
            selected_plate_id: clickedPlate.id,
          }),
        });
      } catch (err) {
        console.warn('Помилка збереження спроби:', err);
      }
    }

    // Показ кнопки "Наступне запитання"
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.style.display = '';
  }

  // Оновлення лічильника балів
  function updateScore() {
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) {
      scoreEl.innerHTML =
        `Правильно: <strong>${score.correct}</strong> / <strong>${score.total}</strong>`;
    }
  }

  // Ініціалізація модуля
  function init() {
    initMap();
    loadPlates();

    // Кнопка "Наступне запитання"
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', nextQuestion);
    }

    // Кнопка "Скинути рахунок"
    const resetBtn = document.getElementById('btn-reset-score');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        score = { correct: 0, total: 0 };
        updateScore();
        nextQuestion();
      });
    }
  }

  return { init, loadPlates };
})();
