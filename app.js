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

class EssayTimer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentEssayName = null;
        this.saveTimeout = null;
        this.isEditMode = false;
        this.stagesBackup = null;

        // DOM Elements
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.themeSelect = document.getElementById('theme-select');
        this.backgroundInput = document.getElementById('background-input');
        this.clearBgBtn = document.getElementById('clear-bg-btn');
        this.sessionTimeEl = document.getElementById('session-time');
        this.totalTimeEl = document.getElementById('total-time');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.essayNameInput = document.getElementById('essay-name-input');
        this.newEssayBtn = document.getElementById('new-essay-btn');
        this.savedEssaysSelect = document.getElementById('saved-essays-select');
        this.deleteEssayBtn = document.getElementById('delete-essay-btn');
        this.templateSelect = document.getElementById('template-select');
        this.editTemplateBtn = document.getElementById('edit-template-btn');
        this.saveTemplateBtn = document.getElementById('save-template-btn');
        this.cancelEditBtn = document.getElementById('cancel-edit-btn');
        this.addStageBtn = document.getElementById('add-stage-btn');
        this.essayNotes = document.getElementById('essay-notes');
        this.notificationSound = document.getElementById('notification-sound');
        this.startSound = document.getElementById('start-sound');

        // State
        this.stages = [];
        this.stageElements = {};
        this.currentStageIndex = 0;
        this.isPaused = true;
        this.isRunning = false;
        this.intervalId = null;
        this.timeLeftInStage = 0;
        this.extraTime = 0;
        this.dailySessionSeconds = 0;

        this.init();
    }

    init() {
        this.loadTemplates();
        this.loadTemplate(this.templateSelect.value);
        this.attachEventListeners();
        this.populateSavedEssays();
        this.loadAndCheckDailySession();
        this.reset();
        this.loadTheme();
        this.loadBackgroundImage();
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

    startNewCycle() {
        this.currentStageIndex = 0;
        this.setCurrentStage();
        this.updateAllDisplays();
    }
    // --- FIN NUEVAS FUNCIONALIDADES ---

    tick() {
        if (this.isPaused) return;

        // Contador de sesión diaria
        this.dailySessionSeconds++;
        this.updateSessionDisplay();
        if (this.dailySessionSeconds % 5 === 0) this.saveDailySession();

        const stage = this.stages[this.currentStageIndex];
        if (!stage.isExtra) {
            this.timeLeftInStage--;
            if (this.timeLeftInStage < 0) {
                this.playNotification();
                this.currentStageIndex++;
                this.setCurrentStage();
            }
        } else {
            this.extraTime++;
        }

        this.updateAllDisplays();
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
        if (stage && !stage.isExtra) {
            this.timeLeftInStage = stage.duration * 60;
        }
        this.playStartSound();
    }

    // Resto del archivo (funciones CRUD, render, attach, save, load) permanece igual...
    // ...

    // Tema & Fondo
    loadTheme() {
        const theme = localStorage.getItem('essayTimer_theme') || 'light';
        this.setTheme(theme);
    }
    toggleTheme() {
        const current = localStorage.getItem('essayTimer_theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    }
    setTheme(theme) {
        document.body.className = '';
        if (theme !== 'light') document.body.classList.add(`${theme}-mode`);
        localStorage.setItem('essayTimer_theme', theme);
        this.themeToggleBtn.innerHTML = theme === 'dark'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        if (this.themeSelect) this.themeSelect.value = theme;
    }

    loadBackgroundImage() {
        const img = localStorage.getItem('essayTimer_bgImage');
        if (img) document.body.style.backgroundImage = `url(${img})`;
    }
    handleBackgroundUpload(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result;
            localStorage.setItem('essayTimer_bgImage', data);
            document.body.style.backgroundImage = `url(${data})`;
        };
        reader.readAsDataURL(file);
    }
    clearBackgroundImage() {
        localStorage.removeItem('essayTimer_bgImage');
        document.body.style.backgroundImage = 'none';
        this.backgroundInput.value = '';
    }

    playNotification() {
        this.notificationSound.currentTime = 0;
        this.notificationSound.play().catch(e => console.log("La reproducción automática fue bloqueada."));
    }
    playStartSound() {
        if (!this.startSound) return;
        this.startSound.currentTime = 0;
        this.startSound.play().catch(e => console.log('La reproducción automática fue bloqueada.'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EssayTimer('timers-container');
});
