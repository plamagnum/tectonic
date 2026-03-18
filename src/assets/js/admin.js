// Адмін-панель — CRUD для користувачів та плит
const Admin = (() => {
  // ── Допоміжні функції ──────────────────────────────────────

  function showMsg(id, text, type = 'success') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
    setTimeout(() => { el.innerHTML = ''; }, 4000);
  }

  async function apiFetch(url, options = {}) {
    const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Помилка запиту');
    return data;
  }

  // ── Управління користувачами ───────────────────────────────

  async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="loading-text"><div class="spinner"></div></td></tr>';
    try {
      const data = await apiFetch('/api/admin/users.php');
      tbody.innerHTML = data.users.map((u) => `
        <tr>
          <td>${u.id}</td>
          <td>${escHtml(u.name)}</td>
          <td>${escHtml(u.email)}</td>
          <td><span class="badge badge-${u.role === 'admin' ? 'warning' : 'info'}">${u.role}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" data-action="edit-user"   data-id="${u.id}">✏️ Ред.</button>
            <button class="btn btn-sm btn-danger"    data-action="delete-user" data-id="${u.id}" data-name="${escHtml(u.name)}">🗑 Вид.</button>
          </td>
        </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="alert alert-danger">${err.message}</div></td></tr>`;
    }
  }

  async function editUser(id) {
    try {
      const data = await apiFetch(`/api/admin/users.php?id=${id}`);
      const u    = data.user;
      document.getElementById('u-modal-title').textContent  = 'Редагувати користувача';
      document.getElementById('u-id').value     = u.id;
      document.getElementById('u-name').value   = u.name;
      document.getElementById('u-email').value  = u.email;
      document.getElementById('u-password').value = '';
      document.getElementById('u-role').value   = u.role;
      openModal('user-modal');
    } catch (err) {
      showMsg('admin-users-msg', err.message, 'danger');
    }
  }

  function newUser() {
    document.getElementById('u-modal-title').textContent = 'Новий користувач';
    document.getElementById('user-form').reset();
    document.getElementById('u-id').value = '';
    openModal('user-modal');
  }

  async function saveUser() {
    const id       = document.getElementById('u-id').value;
    const payload  = {
      name:     document.getElementById('u-name').value,
      email:    document.getElementById('u-email').value,
      password: document.getElementById('u-password').value,
      role:     document.getElementById('u-role').value,
    };
    try {
      if (id) {
        await apiFetch(`/api/admin/users.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showMsg('admin-users-msg', 'Користувача оновлено');
      } else {
        await apiFetch('/api/admin/users.php', { method: 'POST', body: JSON.stringify(payload) });
        showMsg('admin-users-msg', 'Користувача створено', 'success');
      }
      closeModal('user-modal');
      loadUsers();
    } catch (err) {
      showMsg('admin-users-msg', err.message, 'danger');
    }
  }

  async function deleteUser(id, name) {
    if (!confirm(`Видалити користувача "${name}"?`)) return;
    try {
      await apiFetch(`/api/admin/users.php?id=${id}`, { method: 'DELETE' });
      showMsg('admin-users-msg', 'Користувача видалено');
      loadUsers();
    } catch (err) {
      showMsg('admin-users-msg', err.message, 'danger');
    }
  }

  // ── Управління плитами ─────────────────────────────────────

  async function loadPlates() {
    const tbody = document.getElementById('plates-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="loading-text"><div class="spinner"></div></td></tr>';
    try {
      const data = await apiFetch('/api/admin/tasks.php');
      tbody.innerHTML = data.plates.map((p) => `
        <tr>
          <td>${p.id}</td>
          <td>
            <span style="display:inline-block;width:14px;height:14px;background:${p.color};
              border-radius:3px;margin-right:6px;vertical-align:middle;"></span>
            ${escHtml(p.name)}
          </td>
          <td>${escHtml((p.description || '').substring(0, 60))}${p.description && p.description.length > 60 ? '…' : ''}</td>
          <td>
            <button class="btn btn-sm btn-secondary" data-action="edit-plate"   data-id="${p.id}">✏️ Ред.</button>
            <button class="btn btn-sm btn-danger"    data-action="delete-plate" data-id="${p.id}" data-name="${escHtml(p.name)}">🗑 Вид.</button>
          </td>
        </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="alert alert-danger">${err.message}</div></td></tr>`;
    }
  }

  async function editPlate(id) {
    try {
      const data = await apiFetch(`/api/admin/tasks.php?id=${id}`);
      const p    = data.plate;
      document.getElementById('p-modal-title').textContent = 'Редагувати плиту';
      document.getElementById('p-id').value          = p.id;
      document.getElementById('p-name').value         = p.name;
      document.getElementById('p-description').value  = p.description || '';
      document.getElementById('p-color').value         = p.color;
      document.getElementById('p-geojson').value       = JSON.stringify(p.geojson, null, 2);
      openModal('plate-modal');
    } catch (err) {
      showMsg('admin-plates-msg', err.message, 'danger');
    }
  }

  function newPlate() {
    document.getElementById('p-modal-title').textContent = 'Нова тектонічна плита';
    document.getElementById('plate-form').reset();
    document.getElementById('p-id').value    = '';
    document.getElementById('p-color').value = '#3388ff';
    openModal('plate-modal');
  }

  async function savePlate() {
    const id     = document.getElementById('p-id').value;
    let geojson;
    try {
      geojson = JSON.parse(document.getElementById('p-geojson').value);
    } catch {
      showMsg('admin-plates-msg', 'Невірний формат GeoJSON', 'danger');
      return;
    }
    const payload = {
      name:        document.getElementById('p-name').value,
      description: document.getElementById('p-description').value,
      color:       document.getElementById('p-color').value,
      geojson,
    };
    try {
      if (id) {
        await apiFetch(`/api/admin/tasks.php?id=${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showMsg('admin-plates-msg', 'Плиту оновлено');
      } else {
        await apiFetch('/api/admin/tasks.php', { method: 'POST', body: JSON.stringify(payload) });
        showMsg('admin-plates-msg', 'Плиту створено', 'success');
      }
      closeModal('plate-modal');
      loadPlates();
    } catch (err) {
      showMsg('admin-plates-msg', err.message, 'danger');
    }
  }

  async function deletePlate(id, name) {
    if (!confirm(`Видалити плиту "${name}"? Пов'язані спроби також будуть видалені.`)) return;
    try {
      await apiFetch(`/api/admin/tasks.php?id=${id}`, { method: 'DELETE' });
      showMsg('admin-plates-msg', 'Плиту видалено');
      loadPlates();
    } catch (err) {
      showMsg('admin-plates-msg', err.message, 'danger');
    }
  }

  // ── Модальні вікна ─────────────────────────────────────────
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  // ── Безпечне екранування HTML ──────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Вкладки ────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(target)?.classList.add('active');
      });
    });
  }

  // ── Ініціалізація ──────────────────────────────────────────
  function init() {
    initTabs();
    loadUsers();
    loadPlates();

    // Кнопки "Додати"
    document.getElementById('btn-new-user')?.addEventListener('click', newUser);
    document.getElementById('btn-new-plate')?.addEventListener('click', newPlate);

    // Збереження форм
    document.getElementById('btn-save-user')?.addEventListener('click', saveUser);
    document.getElementById('btn-save-plate')?.addEventListener('click', savePlate);

    // Делегування подій для динамічних кнопок таблиць (уникнення inline onclick)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id     = parseInt(btn.dataset.id, 10);
      const name   = btn.dataset.name || '';
      if (action === 'edit-user')    editUser(id);
      if (action === 'delete-user')  deleteUser(id, name);
      if (action === 'edit-plate')   editPlate(id);
      if (action === 'delete-plate') deletePlate(id, name);
    });

    // Закриття модальних вікон
    document.querySelectorAll('.modal-close, [data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
      });
    });

    // Закриття по кліку на оверлей
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  }

  return { init, loadUsers, loadPlates, editUser, newUser, deleteUser, editPlate, newPlate, deletePlate };
})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
