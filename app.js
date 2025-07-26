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
        // ... (resto de elementos DOM sin cambios)
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
        this.previousStageId = null;
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
        const today = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
        const sessionData = JSON.parse(localStorage.getItem('essayTimer_dailySession'));

        if (sessionData && sessionData.date === today) {
            this.dailySessionSeconds = sessionData.totalSeconds;
        } else {
            // Es un nuevo día, reiniciar contador
            this.dailySessionSeconds = 0;
            this.saveDailySession();
        }
        this.updateSessionDisplay();
    }

    saveDailySession() {
        const today = new Date().toISOString().slice(0, 10);
        const sessionData = {
            date: today,
            totalSeconds: this.dailySessionSeconds
        };
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
        if (!this.isRunning) {
            document.title = 'Advanced Essay Timer';
            return;
        }
        const stage = this.stages[this.currentStageIndex];
        if (!stage) return;
        if (stage.label.toLowerCase().includes('descanso')) {
            document.title = `${this.formatTime(this.timeLeftInStage)} - ${stage.label}`;
        } else {
            document.title = `${this.formatTime(this.timeLeftInStage)} - ${stage.label}`;
        }
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

        // Lógica del contador de sesión diaria
        this.dailySessionSeconds++;
        this.updateSessionDisplay();
        if (this.dailySessionSeconds % 5 === 0) { // Guarda cada 5 segundos
             this.saveDailySession();
        }

        const stage = this.stages[this.currentStageIndex];
        if (!stage.isExtra) {
            this.timeLeftInStage--;
            if (this.timeLeftInStage < 0) {
                if (stage.isPomodoro) {
                    this.pomodorosCompleted++;
                    this.updatePomodoroDisplay();
                }
                this.playNotification();
                this.currentStageIndex++;
                this.setCurrentStage(); // setCurrentStage ahora contiene la lógica cíclica
            }
        } else {
            this.extraTime++;
        }

        this.updateAllDisplays();
        this.updatePageTitle();
        this.debouncedSave();
    }

    setCurrentStage() {
        const nextStageIndex = this.stages.findIndex(stage => stage.isExtra);

        // MODIFICADO: Lógica para el ciclo
        if (this.currentStageIndex === nextStageIndex) {
            if (confirm("¡Has completado un ciclo! ¿Deseas empezar de nuevo?")) {
                this.startNewCycle();
                return; // Evita que se inicie el tiempo extra
            }
        }

        if (this.currentStageIndex >= this.stages.length) {
            this.currentStageIndex = nextStageIndex;
        }
        
        const stage = this.stages[this.currentStageIndex];
        if (stage && !stage.isExtra) {
            this.timeLeftInStage = stage.duration * 60;
        }
        this.highlightCurrentStage();
        this.playStartSound();
        this.updatePageTitle();
    }

    // El resto del archivo app.js permanece igual...
    // Se incluyen las funciones sin cambios por completitud.

    toggleEditMode(forceOff = false) {
        this.isEditMode = forceOff ? false : !this.isEditMode;
        document.body.classList.toggle('edit-mode-active', this.isEditMode);
        const mainControls = [this.startBtn, this.pauseBtn, this.resetBtn, this.newEssayBtn, this.essayNameInput, this.savedEssaysSelect, this.deleteEssayBtn, this.templateSelect];
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
                container: timerContainer,
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
        this.highlightCurrentStage();
    }
    attachEventListeners() {
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        if (this.settingsToggleBtn) {
            this.settingsToggleBtn.addEventListener('click', () => {
                this.themeSettings.classList.toggle('visible');
            });
        }
        this.themeSelect.addEventListener('change', () => this.setTheme(this.themeSelect.value));
        this.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        this.clearBgBtn.addEventListener('click', () => this.clearBackgroundImage());
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset(true));
        this.newEssayBtn.addEventListener('click', () => this.startNewEssay());
        this.savedEssaysSelect.addEventListener('change', () => this.loadSelectedEssay());
        this.deleteEssayBtn.addEventListener('click', () => this.deleteSelectedEssay());
        this.templateSelect.addEventListener('change', (e) => this.loadTemplate(e.target.value));
        this.editTemplateBtn.addEventListener('click', () => this.toggleEditMode());
        this.saveTemplateBtn.addEventListener('click', () => this.saveTemplate());
        this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        this.addStageBtn.addEventListener('click', () => this.addStage());
        this.essayNotes.addEventListener('input', () => this.debouncedSave());
        // MODIFICADO: Guardar sesión al cerrar la página
        window.addEventListener('beforeunload', () => this.saveDailySession());
    }
    debouncedSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveState(), 1500);
    }
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
        this.themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        if (this.themeSelect) this.themeSelect.value = theme;
    }
    loadBackgroundImage() {
        const img = localStorage.getItem('essayTimer_bgImage');
        if (img) {
            document.body.style.backgroundImage = `url(${img})`;
        }
    }
    handleBackgroundUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
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

    setupVisibilityHandler() {
        const overlay = document.getElementById('floating-stage');
        if (!overlay) return;

        const asistenteContainer = document.getElementById('asistente-container');
        const assistantToggleBtn = document.getElementById('assistant-toggle-btn');
        let interval;
        let assistantWasHidden = false;

        const updateOverlay = () => {
            const stage = this.stages[this.currentStageIndex];
            if (!stage) return;
            const time = stage.isExtra ? this.extraTime : this.timeLeftInStage;
            overlay.textContent = `${stage.label}: ${this.formatTime(time)}`;
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                updateOverlay();
                overlay.style.display = 'block';
                clearInterval(interval);
                interval = setInterval(updateOverlay, 1000);

                if (asistenteContainer && asistenteContainer.style.display === 'none') {
                    assistantWasHidden = true;
                    asistenteContainer.style.display = 'flex';
                    if (assistantToggleBtn) assistantToggleBtn.style.display = 'none';
                } else {
                    assistantWasHidden = false;
                }

                const stage = this.stages[this.currentStageIndex];
                if (window.asistenteDecir && stage) {
                    window.asistenteDecir(`Etapa actual: ${stage.label}`);
                }
            } else {
                overlay.style.display = 'none';
                clearInterval(interval);
                if (assistantWasHidden && asistenteContainer) {
                    asistenteContainer.style.display = 'none';
                    if (assistantToggleBtn) assistantToggleBtn.style.display = 'block';
                }
                assistantWasHidden = false;
            }
        });
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
    loadTemplates() {
        let templates = JSON.parse(localStorage.getItem('essayTimer_templates')) || {};
        if (Object.keys(templates).length === 0) {
            templates = { default: defaultTemplate, pomodoro30: pomodoro30Template };
            localStorage.setItem('essayTimer_templates', JSON.stringify(templates));
        } else if (!templates.pomodoro30) {
            templates.pomodoro30 = pomodoro30Template;
            localStorage.setItem('essayTimer_templates', JSON.stringify(templates));
        }
        this.templateSelect.innerHTML = '';
        for (const key in templates) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = templates[key].name;
            this.templateSelect.appendChild(option);
        }
    }
    loadTemplate(templateKey) {
        if (this.isEditMode) return;
        const templates = JSON.parse(localStorage.getItem('essayTimer_templates'));
        this.stages = JSON.parse(JSON.stringify(templates[templateKey].stages));
        this.renderStages();
        this.reset();
    }
    populateSavedEssays() {
        const essayIndex = JSON.parse(localStorage.getItem('essayTimer_index')) || [];
        this.savedEssaysSelect.innerHTML = '<option value="">Cargar Ensayo Guardado</option>';
        essayIndex.forEach(essayKey => {
            const essayData = JSON.parse(localStorage.getItem(`essayTimer_${essayKey}`));
            const option = document.createElement('option');
            option.value = essayKey;
            const modifiedDate = essayData?.lastModified ? new Date(essayData.lastModified).toLocaleString('es-AR') : 'N/A';
            option.textContent = `${essayKey} (Guardado: ${modifiedDate})`;
            this.savedEssaysSelect.appendChild(option);
        });
    }
    saveState() {
        if (!this.currentEssayName) return;
        const state = {
            lastModified: new Date().toISOString(),
            templateKey: this.templateSelect.value,
            stages: this.stages,
            currentStageIndex: this.currentStageIndex,
            timeLeftInStage: this.timeLeftInStage,
            extraTime: this.extraTime,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            notes: this.essayNotes.value
        };
        localStorage.setItem(`essayTimer_${this.currentEssayName}`, JSON.stringify(state));
    }
    loadState(essayName) {
        const state = JSON.parse(localStorage.getItem(`essayTimer_${essayName}`));
        if (!state) return;
        this.currentEssayName = essayName;
        this.templateSelect.value = state.templateKey;
        this.stages = state.stages;
        this.currentStageIndex = state.currentStageIndex;
        this.timeLeftInStage = state.timeLeftInStage;
        this.extraTime = state.extraTime;
        this.isRunning = state.isRunning;
        this.isPaused = state.isPaused;
        this.essayNotes.value = state.notes || '';
        this.renderStages();
        this.updateAllDisplays();
        this.pauseBtn.disabled = this.isPaused;
        this.startBtn.disabled = !this.isPaused;
        this.resetBtn.disabled = false;
        if (this.isRunning && !this.isPaused) {
            this.startBtn.textContent = 'Reanudar';
            this.start();
        } else {
            this.pause();
        }
    }
    startNewEssay() {
        const name = this.essayNameInput.value.trim();
        if (!name) {
            alert('Por favor, introduce un nombre para tu ensayo.');
            return;
        }
        let essays = JSON.parse(localStorage.getItem('essayTimer_index') || '[]');
        if (!essays.includes(name)) {
            essays.push(name);
            localStorage.setItem('essayTimer_index', JSON.stringify(essays));
        }
        this.currentEssayName = name;
        this.essayNameInput.value = '';
        this.loadTemplate(this.templateSelect.value);
        this.reset(true);
        this.saveState();
        this.populateSavedEssays();
        this.savedEssaysSelect.value = name;
        this.deleteEssayBtn.disabled = false;
        this.start();
    }
    loadSelectedEssay() {
        if (this.isEditMode) return;
        const name = this.savedEssaysSelect.value;
        this.deleteEssayBtn.disabled = !name;
        if (name) {
            clearInterval(this.intervalId);
            this.loadState(name);
        } else {
            this.currentEssayName = null;
            this.reset();
        }
    }
    deleteSelectedEssay() {
        const name = this.savedEssaysSelect.value;
        if (!name || !confirm(`¿Seguro que quieres borrar "${name}"? Esta acción no se puede deshacer.`)) return;
        localStorage.removeItem(`essayTimer_${name}`);
        let essays = JSON.parse(localStorage.getItem('essayTimer_index') || '[]');
        essays = essays.filter(e => e !== name);
        localStorage.setItem('essayTimer_index', JSON.stringify(essays));
        this.populateSavedEssays();
        this.currentEssayName = null;
        this.reset();
    }
    formatTime(seconds) {
        const mins = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
        const secs = (Math.abs(seconds) % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }
    calculateAndDisplayTotalTime() {
        const activeStages = this.stages.filter(stage => !stage.isExtra);
        let totalSeconds = activeStages.reduce((acc, stage) => acc + (stage.duration * 60), 0);
        this.totalTimeEl.textContent = `Tiempo Total: ${this.formatTime(totalSeconds)}`;
    }

    highlightCurrentStage() {
        if (this.previousStageId && this.stageElements[this.previousStageId]?.container) {
            this.stageElements[this.previousStageId].container.classList.remove('active-stage');
        }
        const current = this.stages[this.currentStageIndex];
        if (current && this.stageElements[current.id]?.container) {
            this.stageElements[current.id].container.classList.add('active-stage');
            this.previousStageId = current.id;
        }
    }
    updateAllDisplays() {
        this.stages.forEach((stage, index) => {
            const elements = this.stageElements[stage.id];
            if (!elements) return;
            let displayTime;
            if (this.isRunning && index === this.currentStageIndex) {
                displayTime = stage.isExtra ? this.extraTime : this.timeLeftInStage;
            } else if (this.isRunning && index < this.currentStageIndex) {
                displayTime = 0;
            } else {
                displayTime = stage.isExtra ? this.extraTime : stage.duration * 60;
            }
            this.updateDisplay(stage, displayTime);
        });
        this.calculateAndDisplayTotalTime();
    }
    updateDisplay(stage, timeLeft) {
        const elements = this.stageElements[stage.id];
        elements.display.textContent = this.formatTime(timeLeft);
        if (!stage.isExtra) {
            const duration = stage.duration * 60 || 1;
            const progressPercent = Math.max(0, (timeLeft / duration) * 100);
            elements.progress.style.width = `${progressPercent}%`;
            const percentage = timeLeft / duration;
            elements.display.className = 'timer-display';
            if (percentage <= 0.2) elements.display.classList.add('red');
            else if (percentage <= 0.5) elements.display.classList.add('orange');
            else elements.display.classList.add('green');
            elements.progress.style.backgroundColor = getComputedStyle(elements.display).color;
        }
    }
    start() {
        if (!this.currentEssayName) {
            alert("Por favor, empieza un nuevo ensayo o selecciona uno guardado.");
            return;
        }
        if (!this.isRunning) {
            this.setCurrentStage();
        }
        this.isRunning = true;
        this.isPaused = false;
        clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.tick(), 1000);
        this.startBtn.textContent = 'Reanudar';
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.updatePageTitle();
    }
    pause() {
        this.isPaused = true;
        this.startBtn.disabled = !this.currentEssayName;
        this.pauseBtn.disabled = true;
        this.saveState();
        this.saveDailySession(); // Guardar sesión al pausar
        this.updatePageTitle();
    }
    reset(fullReset = false) {
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.isPaused = true;
        this.currentStageIndex = 0;
        this.extraTime = 0;
        this.intervalId = null;
        if(fullReset) {
            this.essayNotes.value = '';
            this.pomodorosCompleted = 0;
            this.updatePomodoroDisplay();
        }
        if (fullReset) {
            this.loadTemplate(this.templateSelect.value);
        }
        this.updateAllDisplays();
        this.highlightCurrentStage();
        this.updatePageTitle();
        this.startBtn.textContent = 'Empezar';
        this.startBtn.disabled = !this.currentEssayName;
        this.pauseBtn.disabled = true;
        this.resetBtn.disabled = !this.currentEssayName;
        this.stages.forEach(s => { if(this.stageElements[s.id]?.input) this.stageElements[s.id].input.disabled = false; });
        if (this.currentEssayName) this.saveState();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new EssayTimer('timers-container');
    });
} else {
    new EssayTimer('timers-container');
}
