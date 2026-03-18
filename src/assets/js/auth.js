// Модуль автентифікації — реєстрація, вхід, вихід
const Auth = (() => {
  // Зберігаємо дані поточного користувача у пам'яті
  let currentUser = null;

  // Отримати поточного користувача
  function getUser() { return currentUser; }

  function isLoggedIn() { return currentUser !== null; }

  function isAdmin() { return currentUser && currentUser.role === 'admin'; }

  // Оновлення стану навігаційної панелі залежно від авторизації
  function updateNavbar() {
    const btnLogin    = document.getElementById('nav-login');
    const btnRegister = document.getElementById('nav-register');
    const btnLogout   = document.getElementById('nav-logout');
    const btnAdmin    = document.getElementById('nav-admin');
    const btnProfile  = document.getElementById('nav-profile');
    const userInfo    = document.getElementById('nav-user-info');

    if (isLoggedIn()) {
      if (btnLogin)    btnLogin.style.display    = 'none';
      if (btnRegister) btnRegister.style.display = 'none';
      if (btnLogout)   btnLogout.style.display   = '';
      if (btnProfile)  btnProfile.style.display  = '';
      if (userInfo)    userInfo.textContent       = currentUser.name;
      if (btnAdmin)    btnAdmin.style.display     = isAdmin() ? '' : 'none';
    } else {
      if (btnLogin)    btnLogin.style.display    = '';
      if (btnRegister) btnRegister.style.display = '';
      if (btnLogout)   btnLogout.style.display   = 'none';
      if (btnProfile)  btnProfile.style.display  = 'none';
      if (btnAdmin)    btnAdmin.style.display     = 'none';
      if (userInfo)    userInfo.textContent       = '';
    }
  }

  // Відображення повідомлення про помилку/успіх у формі
  function showFormMessage(containerId, message, type = 'danger') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => { el.innerHTML = ''; }, 5000);
  }

  // Вхід користувача
  async function login(email, password) {
    try {
      const res = await fetch('/api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка входу');

      currentUser = data.user;
      updateNavbar();
      return data;
    } catch (err) {
      throw err;
    }
  }

  // Реєстрація нового користувача
  async function register(name, email, password) {
    try {
      const res = await fetch('/api/auth/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка реєстрації');
      return data;
    } catch (err) {
      throw err;
    }
  }

  // Вихід з системи
  async function logout() {
    try {
      await fetch('/api/auth/logout.php', { method: 'POST' });
    } finally {
      currentUser = null;
      updateNavbar();
      App.navigate('home');
    }
  }

  // Ініціалізація обробників форм
  function init() {
    // Форма входу
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = loginForm.querySelector('[name="email"]').value;
        const password = loginForm.querySelector('[name="password"]').value;
        const btn      = loginForm.querySelector('[type="submit"]');
        btn.disabled = true;
        try {
          await login(email, password);
          App.navigate('game');
        } catch (err) {
          showFormMessage('login-msg', err.message);
        } finally {
          btn.disabled = false;
        }
      });
    }

    // Форма реєстрації
    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name     = regForm.querySelector('[name="name"]').value;
        const email    = regForm.querySelector('[name="email"]').value;
        const password = regForm.querySelector('[name="password"]').value;
        const btn      = regForm.querySelector('[type="submit"]');
        btn.disabled = true;
        try {
          await register(name, email, password);
          showFormMessage('register-msg', 'Реєстрація успішна! Виконайте вхід.', 'success');
          setTimeout(() => App.navigate('login'), 1500);
        } catch (err) {
          showFormMessage('register-msg', err.message);
        } finally {
          btn.disabled = false;
        }
      });
    }

    // Кнопка виходу
    const logoutBtn = document.getElementById('nav-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    updateNavbar();
  }

  return { init, login, register, logout, getUser, isLoggedIn, isAdmin, updateNavbar };
})();
