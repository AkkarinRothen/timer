const defaultTemplate = {
name: "Default",
stages: [
{ id: 'brainstorming', label: 'Brainstorming', duration: 10 },
{ id: 'outlining', label: 'Outlining', duration: 15 },
{ id: 'writing-intro', label: 'Writing Introduction', duration: 10 },
{ id: 'writing-body', label: 'Writing Body Paragraphs', duration: 45 },
{ id: 'writing-conclusion', label: 'Writing Conclusion', duration: 10 },
{ id: 'proofreading', label: 'Proofreading', duration: 15 },
{ id: 'extra', label: 'Extra Time', duration: 0, isExtra: true },
]
};

const pomodoro30Template = {
name: 'Pomodoro 30/5',
stages: [
{ id: 'pomodoro-1', label: 'Pomodoro 1', duration: 30, isPomodoro: true },
{ id: 'break-1', label: 'Descanso', duration: 5 },
{ id: 'pomodoro-2', label: 'Pomodoro 2', duration: 30, isPomodoro: true },
{ id: 'break-2', label: 'Descanso', duration: 5 },
{ id: 'pomodoro-3', label: 'Pomodoro 3', duration: 30, isPomodoro: true },
{ id: 'break-3', label: 'Descanso', duration: 5 },
{ id: 'pomodoro-4', label: 'Pomodoro 4', duration: 30, isPomodoro: true },
{ id: 'long-break', label: 'Descanso Largo', duration: 15 },
{ id: 'extra', label: 'Extra Time', duration: 0, isExtra: true }
]
};

class EssayTimer {
constructor(containerId) {
this.container = document.getElementById(containerId);
this.currentEssayName = null;
this.saveTimeout = null;
this.isEditMode = false;
this.stagesBackup = null;

    // DOM Elements
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.settingsToggleBtn = document.getElementById('settings-toggle-btn');
    this.themeSettings = document.getElementById('theme-settings');
    this.themeSelect = document.getElementById('theme-select');
    this.backgroundInput = document.getElementById('background-input');
    this.clearBgBtn = document.getElementById('clear-bg-btn');
    this.sessionTimeEl = document.getElementById('session-time'); // NUEVO
    this.totalTimeEl = document.getElementById('total-time');
    this.pomodoroCountEl = document.getElementById('pomodoro-count');
    // ... (otros elementos DOM)

    // State
    this.stages = [];
    this.stageElements = {};
    this.currentStageIndex = 0;
    this.isPaused = true;
    this.isRunning = false;
    this.intervalId = null;
    this.timeLeftInStage = 0;
    this.extraTime = 0;
    this.dailySessionSeconds = 0; // NUEVO
    this.pomodorosCompleted = 0;

    this.init();
}

init() {
    this.loadTemplates();
    this.loadTemplate(this.templateSelect.value);
    this.attachEventListeners();
    this.populateSavedEssays();
    this.loadAndCheckDailySession(); // NUEVO
    this.reset();
    this.updatePomodoroDisplay();
    this.loadTheme();
    this.loadBackgroundImage();
    this.setupVisibilityHandler();
}

// --- NUEVAS FUNCIONALIDADES ---
loadAndCheckDailySession() {
    const today = new Date().toISOString().slice(0, 10);
    const sessionData = JSON.parse(localStorage.getItem('essayTimer_dailySession'));

    if (sessionData && sessionData.date === today) {
        this.dailySessionSeconds = sessionData.totalSeconds;
    } else {
        this.dailySessionSeconds = 0;
        this.saveDailySession();
    }
    this.updateSessionDisplay();
}

saveDailySession() {
    const today = new Date().toISOString().slice(0, 10);
    const sessionData = { date: today, totalSeconds: this.dailySessionSeconds };
    localStorage.setItem('essayTimer_dailySession', JSON.stringify(sessionData));
}

updateSessionDisplay() {
    const hours = Math.floor(this.dailySessionSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((this.dailySessionSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (this.dailySessionSeconds % 60).toString().padStart(2, '0');
    this.sessionTimeEl.textContent = `${hours}:${minutes}:${seconds}`;
}

updatePomodoroDisplay() {
    if (this.pomodoroCountEl) {
        this.pomodoroCountEl.textContent = this.pomodorosCompleted;
    }
}

updatePageTitle() {
    if (!this.isRunning) return document.title = 'Advanced Essay Timer';
    const stage = this.stages[this.currentStageIndex];
    if (!stage) return;
    document.title = `${this.formatTime(this.timeLeftInStage)} - ${stage.label}`;
}

startNewCycle() {
    this.currentStageIndex = 0;
    this.setCurrentStage();
    this.updateAllDisplays();
    this.updatePageTitle();
}
// --- FIN NUEVAS FUNCIONALIDADES ---

tick() {
    if (this.isPaused) return;
    this.dailySessionSeconds++;
    this.updateSessionDisplay();
    if (this.dailySessionSeconds % 5 === 0) this.saveDailySession();

    const stage = this.stages[this.currentStageIndex];
    if (!stage.isExtra) {
        this.timeLeftInStage--;
        if (this.timeLeftInStage < 0) {
            if (stage.isPomodoro) this.pomodorosCompleted++;
            this.updatePomodoroDisplay();
            this.playNotification();
            this.currentStageIndex++;
            this.setCurrentStage();
        }
    } else {
        this.extraTime++;
    }

    this.updateAllDisplays();
    this.updatePageTitle();
    this.debouncedSave();
}

setCurrentStage() {
    const nextStageIndex = this.stages.findIndex(s => s.isExtra);
    if (this.currentStageIndex === nextStageIndex) {
        if (confirm("¡Has completado un ciclo! ¿Deseas empezar de nuevo?")) {
            this.startNewCycle();
            return;
        }
    }
    if (this.currentStageIndex >= this.stages.length) {
        this.currentStageIndex = nextStageIndex;
    }
    const stage = this.stages[this.currentStageIndex];
    if (stage && !stage.isExtra) this.timeLeftInStage = stage.duration * 60;
    this.playStartSound();
    this.updatePageTitle();
}

toggleEditMode(forceOff = false) {
    this.isEditMode = forceOff ? false : !this.isEditMode;
    document.body.classList.toggle('edit-mode-active', this.isEditMode);
    const mainControls = [
        this.startBtn, this.pauseBtn, this.resetBtn,
        this.newEssayBtn, this.essayNameInput,
        this.savedEssaysSelect, this.deleteEssayBtn,
        this.templateSelect
    ];
    mainControls.forEach(control => control.disabled = this.isEditMode);
    if (this.isEditMode) {
        this.stagesBackup = JSON.parse(JSON.stringify(this.stages));
    }
}

addStage() {
    const label = prompt("Nombre de la nueva etapa:", "Nueva Etapa");
    if (!label) return;
    const duration = parseInt(prompt(`Duración para "${label}" en minutos:`, "10"), 10) || 10;
    const id = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    this.stages.splice(-1, 0, { id, label, duration });
    this.renderStages();
}

deleteStage(stageIdToDelete) {
    this.stages = this.stages.filter(stage => stage.id !== stageIdToDelete);
    this.renderStages();
}

saveTemplate() {
    const templateName = prompt("Guardar plantilla como:", "Mi Plantilla Personalizada");
    if (templateName) {
        const templates = JSON.parse(localStorage.getItem('essayTimer_templates'));
        const templateKey = templateName.toLowerCase().replace(/\s+/g, '-');
        templates[templateKey] = { name: templateName, stages: this.stages };
        localStorage.setItem('essayTimer_templates', JSON.stringify(templates));
        this.loadTemplates();
        this.templateSelect.value = templateKey;
    }
    this.toggleEditMode(true);
}

cancelEdit() {
    this.stages = this.stagesBackup;
    this.stagesBackup = null;
    this.renderStages();
    this.toggleEditMode(true);
}

renderStages() {
    this.container.innerHTML = '';
    this.stages.forEach(stage => {
        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.innerHTML = `
            <button class="delete-stage-btn" data-id="${stage.id}">×</button>
            <h2>${stage.label}</h2>
            ${!stage.isExtra ? `<input type="number" data-id="${stage.id}" value="${stage.duration}" min="0"> minutos` : ''}
            <div class="timer-display green" data-id="${stage.id}-display">00:00</div>
            ${!stage.isExtra ? `<div class="progress-bar"><div class="progress" data-id="${stage.id}-progress"></div></div>` : ''}
        `;
        this.container.appendChild(timerContainer);
        this.stageElements[stage.id] = {
            input: timerContainer.querySelector(`input[data-id="${stage.id}"]`),
            display: timerContainer.querySelector(`div[data-id="${stage.id}-display"]`),
            progress: timerContainer.querySelector(`div[data-id="${stage.id}-progress"]`),
            deleteBtn: timerContainer.querySelector(`button[data-id="${stage.id}"]`),
        };
    });
    this.stages.forEach(stage => {
        if (this.stageElements[stage.id]?.input) {
            this.stageElements[stage.id].input.addEventListener('input', () => {
                const stageToUpdate = this.stages.find(s => s.id === stage.id);
                if (stageToUpdate) stageToUpdate.duration = parseInt(this.stageElements[stage.id].input.value, 10) || 0;
                this.updateAllDisplays();
            });
        }
        if (this.stageElements[stage.id]?.deleteBtn) {
            this.stageElements[stage.id].deleteBtn.addEventListener('click', () => this.deleteStage(stage.id));
        }
    });
    this.updateAllDisplays();
}

attachEventListeners() {
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    if (this.settingsToggleBtn) {
        this.settingsToggleBtn.addEventListener('click', () => this.themeSettings.classList.toggle('visible'));
    }
    this.themeSelect.addEventListener('change', e => this.setTheme(e.target.value));
    this.backgroundInput.addEventListener('change', e => this.handleBackgroundUpload(e));
    this.clearBgBtn.addEventListener('click', () => this.clearBackgroundImage());
    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset(true));
    this.newEssayBtn.addEventListener('click', () => this.startNewEssay());
    this.savedEssaysSelect.addEventListener('change', () => this.loadSelectedEssay());
    this.deleteEssayBtn.addEventListener('click', () => this.deleteSelectedEssay());
    this.templateSelect.addEventListener('change', e => this.loadTemplate(e.target.value));
    this.editTemplateBtn.addEventListener('click', () => this.toggleEditMode());
    this.saveTemplateBtn.addEventListener('click', () => this.saveTemplate());
    this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
    this.addStageBtn.addEventListener('click', () => this.addStage());
    this.essayNotes.addEventListener('input', () => this.debouncedSave());
    window.addEventListener('beforeunload', () => this.saveDailySession());
}

debouncedSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveState(), 1500);
}

