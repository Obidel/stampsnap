function isLoggedIn() {
  return !!localStorage.getItem('stampsnap_token');
}

function getCurrentUser() {
  const data = localStorage.getItem('stampsnap_user');
  return data ? JSON.parse(data) : null;
}

function updateNavForAuth() {
  const authBtns = document.querySelectorAll('.auth-btn');
  const userMenu = document.querySelectorAll('.user-menu');
  if (isLoggedIn()) {
    authBtns.forEach(el => el.classList.add('hidden'));
    userMenu.forEach(el => el.classList.remove('hidden'));
    const user = getCurrentUser();
    if (user) {
      userMenu.forEach(el => {
        const nameEl = el.querySelector('.user-name');
        if (nameEl) nameEl.textContent = user.name || user.email;
      });
    }
  } else {
    authBtns.forEach(el => el.classList.remove('hidden'));
    userMenu.forEach(el => el.classList.add('hidden'));
  }
}

async function checkSubscription() {
  try {
    const data = await apiRequest('/subscription/status');
    return data;
  } catch {
    return { is_active: true, trial_active: false, status: 'unknown' };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavForAuth();
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('stampsnap_token');
      localStorage.removeItem('stampsnap_user');
      window.location.href = '/';
    });
  }
});
