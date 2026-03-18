// Головний модуль додатку — маршрутизація, навігація, стан
const App = (() => {
  // Поточна активна секція
  let currentSection = 'home';

  // Перехід до вказаної секції
  function navigate(section) {
    // Приховання всіх секцій
    document.querySelectorAll('.section').forEach((el) => el.classList.remove('active'));
    // Зняття активного стану з навігаційних посилань
    document.querySelectorAll('.nav-link[data-section]').forEach((el) => el.classList.remove('active'));

    const target = document.getElementById(`section-${section}`);
    if (!target) return;

    target.classList.add('active');
    currentSection = section;

    // Підсвічення активного пункту меню
    const navLink = document.querySelector(`.nav-link[data-section="${section}"]`);
    if (navLink) navLink.classList.add('active');

    // Ледача ініціалізація карти (лише коли вона видима)
    if (section === 'game') {
      setTimeout(() => {
        if (typeof MapModule !== 'undefined' && !window._mapInited) {
          window._mapInited = true;
          MapModule.init();
        } else if (window._mapInited) {
          // Оновлення розмірів карти після відображення
          window.dispatchEvent(new Event('resize'));
        }
      }, 50);
    }

    // Завантаження результатів
    if (section === 'results') {
      loadResults();
    }

    // Завантаження профілю
    if (section === 'profile') {
      loadProfile();
    }
  }

  // Завантаження та відображення результатів користувача
  async function loadResults() {
    if (!Auth.isLoggedIn()) {
      document.getElementById('section-results').innerHTML =
        '<div class="container"><div class="alert alert-info">Для перегляду результатів необхідно увійти в систему.</div></div>';
      return;
    }

    const container = document.getElementById('results-content');
    if (!container) return;
    container.innerHTML = '<div class="loading-text"><div class="spinner"></div> Завантаження...</div>';

    try {
      const res  = await fetch('/api/attempts/results.php');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const s = data.stats;
      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${s.total || 0}</div>
            <div class="stat-label">Всього спроб</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${s.correct || 0}</div>
            <div class="stat-label">Правильних</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${s.accuracy || 0}%</div>
            <div class="stat-label">Точність</div>
          </div>
        </div>
        <div class="results-grid">
          <div class="card">
            <div class="card-header">📋 Останні спроби</div>
            <div class="card-body" style="padding:0">
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Правильна</th><th>Обрана</th><th>Результат</th><th>Час</th></tr></thead>
                  <tbody>
                    ${data.attempts.length ? data.attempts.map((a) => `
                      <tr>
                        <td>${escHtml(a.correct_plate)}</td>
                        <td>${escHtml(a.selected_plate)}</td>
                        <td><span class="badge badge-${a.is_correct ? 'success' : 'danger'}">${a.is_correct ? '✓' : '✗'}</span></td>
                        <td style="font-size:.8rem;color:var(--text-secondary)">${new Date(a.answered_at).toLocaleString('uk-UA')}</td>
                      </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text-secondary)">Спроб ще немає</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">📊 По плитах</div>
            <div class="card-body" style="padding:0">
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Плита</th><th>Спроб</th><th>✓</th><th>%</th></tr></thead>
                  <tbody>
                    ${data.by_plate.length ? data.by_plate.map((b) => `
                      <tr>
                        <td>${escHtml(b.name)}</td>
                        <td>${b.total}</td>
                        <td>${b.correct || 0}</td>
                        <td>${b.total > 0 ? Math.round(b.correct / b.total * 100) : 0}%</td>
                      </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text-secondary)">Даних немає</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>`;
    } catch (err) {
      container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
  }

  // Завантаження та відображення профілю
  async function loadProfile() {
    if (!Auth.isLoggedIn()) {
      navigate('login');
      return;
    }

    try {
      const res  = await fetch('/api/profile/index.php');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const u = data.user;

      const nameEl  = document.getElementById('profile-name-display');
      const emailEl = document.getElementById('profile-email-display');
      const roleEl  = document.getElementById('profile-role-display');
      const sinceEl = document.getElementById('profile-since-display');
      if (nameEl)  nameEl.textContent  = u.name;
      if (emailEl) emailEl.textContent = u.email;
      if (roleEl)  roleEl.textContent  = u.role === 'admin' ? 'Адміністратор' : 'Користувач';
      if (sinceEl) sinceEl.textContent = new Date(u.created_at).toLocaleDateString('uk-UA');

      // Заповнення форми редагування
      const formName = document.getElementById('profile-form-name');
      if (formName) formName.value = u.name;
    } catch (err) {
      console.error('Помилка завантаження профілю:', err);
    }
  }

  // Безпечне екранування HTML
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Ініціалізація навігації
  function initNavigation() {
    document.querySelectorAll('[data-section]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const section = el.dataset.section;
        if (section === 'game' && !Auth.isLoggedIn()) {
          navigate('login');
          return;
        }
        if (section === 'results' && !Auth.isLoggedIn()) {
          navigate('login');
          return;
        }
        if (section === 'profile' && !Auth.isLoggedIn()) {
          navigate('login');
          return;
        }
        navigate(section);
      });
    });
  }

  // Ініціалізація форми профілю
  function initProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name     = document.getElementById('profile-form-name').value;
      const password = document.getElementById('profile-form-password').value;
      const btn      = form.querySelector('[type="submit"]');
      btn.disabled   = true;

      try {
        const payload = {};
        if (name)     payload.name     = name;
        if (password) payload.password = password;

        const res  = await fetch('/api/profile/index.php', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        document.getElementById('profile-msg').innerHTML =
          '<div class="alert alert-success">Профіль оновлено успішно</div>';
        setTimeout(() => { document.getElementById('profile-msg').innerHTML = ''; }, 3000);
        loadProfile();
      } catch (err) {
        document.getElementById('profile-msg').innerHTML =
          `<div class="alert alert-danger">${err.message}</div>`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  // Головна ініціалізація
  function init() {
    Auth.init();
    initNavigation();
    initProfileForm();
    navigate('home');
  }

  return { init, navigate, loadResults, loadProfile };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
