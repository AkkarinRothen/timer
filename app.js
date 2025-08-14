import { EssayTimer } from './timer.js';
import { showLogin, updateUserNav } from './ui.js';

let appInstance;
let db;

function startApp(nickname) {
  db = new LocalDB('essayTimer_' + nickname);
  appInstance = new EssayTimer('timers-container', db);
  updateUserNav(nickname);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginLink = document.getElementById('login-menu-link');
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLogin(startApp);
    });
  }
  const stored = localStorage.getItem('currentNickname');
  if (stored) {
    startApp(stored);
  } else {
    updateUserNav(null);
    showLogin(startApp);
  }
});
