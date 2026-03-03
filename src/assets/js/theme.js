// Модуль перемикання теми (світла/темна)
// Зберігає вибір користувача у localStorage

const ThemeManager = (() => {
  const STORAGE_KEY = 'tectonic_theme';
  const DARK        = 'dark';
  const LIGHT       = 'light';

  // Отримання збереженої теми або системних налаштувань
  function getPreferred() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // Оновлення іконки кнопки перемикача
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === DARK ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || LIGHT;
    apply(current === DARK ? LIGHT : DARK);
  }

  function init() {
    apply(getPreferred());

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);

    // Реакція на зміну системної теми
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        apply(e.matches ? DARK : LIGHT);
      }
    });
  }

  return { init, toggle, apply };
})();

// Ініціалізація після завантаження DOM
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
