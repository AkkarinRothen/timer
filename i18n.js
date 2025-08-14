const translations = {
  es: {
    start: "Empezar",
    pause: "Pausar",
    reset: "Reiniciar",
    sessionTimeToday: "Tiempo de Foco Hoy:",
    pomodorosCompleted: "Pomodoros completados:",
    startNew: "Empezar Nuevo",
    loadSavedEssay: "Cargar Ensayo Guardado",
    delete: "Borrar",
    defaultTemplate: "Plantilla por Defecto",
    editTemplate: "Editar Plantilla",
    saveChanges: "Guardar Cambios",
    cancel: "Cancelar",
    essayNamePlaceholder: "Nombre del Ensayo",
    totalTime: "Tiempo Total:",
    login: "Ingresar"
  },
  en: {
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    sessionTimeToday: "Focus Time Today:",
    pomodorosCompleted: "Pomodoros completed:",
    startNew: "Start New",
    loadSavedEssay: "Load Saved Essay",
    delete: "Delete",
    defaultTemplate: "Default Template",
    editTemplate: "Edit Template",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    essayNamePlaceholder: "Essay Name",
    totalTime: "Total Time:",
    login: "Login"
  }
};

let currentLang = 'es';

function t(key) {
  return translations[currentLang][key] || translations['es'][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    applyTranslations();
  }
}

window.setLanguage = setLanguage;

// initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('language-select');
  if (selector) {
    selector.addEventListener('change', (e) => setLanguage(e.target.value));
  }
  applyTranslations();
});
