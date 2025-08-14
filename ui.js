export function updateUserNav(nickname) {
  const link = document.getElementById('login-menu-link');
  if (!link) return;
  link.textContent = nickname ? `Usuario: ${nickname}` : 'Ingresar';
}

export function showLogin(startCallback) {
  const overlay = document.getElementById('login-overlay');
  const input = document.getElementById('nickname-input');
  const btn = document.getElementById('login-btn');
  const tryStart = () => {
    const nick = input.value.trim();
    if (!nick) return;
    localStorage.setItem('currentNickname', nick);
    overlay.classList.add('hidden');
    startCallback(nick);
  };
  input.value = '';
  overlay.classList.remove('hidden');
  btn.addEventListener('click', tryStart);
  input.addEventListener('keyup', (e) => { if (e.key === 'Enter') tryStart(); });
}
