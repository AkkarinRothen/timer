// Lógica del Asistente de Estudio
const asistenteDialogos = {
    estudio: [
        "¡Tú puedes con esto! La concentración es la clave.",
        "Sigue así, cada minuto cuenta.",
        "Un pequeño esfuerzo ahora es un gran logro mañana. ¡Vamos!",
        "La constancia vence al talento. ¡No te rindas!"
    ],
    descanso: [
        "¡Buen trabajo! Es hora de un merecido descanso.",
        "Estira las piernas, mira por la ventana y relájate.",
        "Toma un poco de agua, tu cerebro te lo agradecerá.",
        "Has trabajado duro. ¡Disfruta tu pausa!"
    ]
};

const asistenteContainer = document.getElementById('asistente-container');
const asistenteBurbuja = document.getElementById('dialogo-burbuja');
const asistenteTextoDialogo = document.getElementById('texto-dialogo');
const asistenteBotonCerrar = document.getElementById('cerrar-asistente');
const asistenteToggleBtn = document.getElementById('assistant-toggle-btn');
const sizeUpBtn = document.getElementById('assist-size-up');
const sizeDownBtn = document.getElementById('assist-size-down');

let asistenteScale = 1;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

let asistenteFaseActual = 'estudio';
let asistenteDialogoActual = 0;
let asistenteIntervaloDialogo;

function asistenteMostrarSiguienteDialogo() {
    const listaDialogos = asistenteDialogos[asistenteFaseActual];
    asistenteDialogoActual = (asistenteDialogoActual + 1) % listaDialogos.length;

    asistenteBurbuja.style.opacity = '0';

    setTimeout(() => {
        asistenteTextoDialogo.innerText = listaDialogos[asistenteDialogoActual];
        asistenteBurbuja.style.opacity = '1';
    }, 400);
}

function asistenteCambiarFase(nuevaFase) {
    if (!asistenteContainer || asistenteContainer.style.display === 'none') return;

    asistenteFaseActual = nuevaFase;
    asistenteDialogoActual = -1;

    clearInterval(asistenteIntervaloDialogo);
    asistenteMostrarSiguienteDialogo();
    asistenteIntervaloDialogo = setInterval(asistenteMostrarSiguienteDialogo, 8000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (asistenteContainer) {
        setTimeout(() => {
            asistenteBurbuja.style.opacity = '1';
            asistenteBurbuja.style.transform = 'translateY(0)';
        }, 500);
        if (asistenteToggleBtn) {
            asistenteToggleBtn.style.display = 'none';
        }

        asistenteBotonCerrar.addEventListener('click', () => {
            asistenteContainer.style.display = 'none';
            asistenteToggleBtn.style.display = 'block';
            clearInterval(asistenteIntervaloDialogo);
        });

        // Arrastrar
        const startDrag = (clientX, clientY) => {
            isDragging = true;
            dragOffsetX = clientX - asistenteContainer.offsetLeft;
            dragOffsetY = clientY - asistenteContainer.offsetTop;
            asistenteContainer.style.right = 'auto';
            asistenteContainer.style.bottom = 'auto';
        };
        const moveDrag = (clientX, clientY) => {
            if (!isDragging) return;
            asistenteContainer.style.left = (clientX - dragOffsetX) + 'px';
            asistenteContainer.style.top = (clientY - dragOffsetY) + 'px';
        };
        asistenteContainer.addEventListener('mousedown', (e) => {
            if (e.target === sizeUpBtn || e.target === sizeDownBtn || e.target === asistenteBotonCerrar) return;
            startDrag(e.clientX, e.clientY);
        });
        document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', () => { isDragging = false; });
        asistenteContainer.addEventListener('touchstart', (e) => {
            if (e.target === sizeUpBtn || e.target === sizeDownBtn || e.target === asistenteBotonCerrar) return;
            const t = e.touches[0];
            startDrag(t.clientX, t.clientY);
        });
        document.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            moveDrag(t.clientX, t.clientY);
        });
        document.addEventListener('touchend', () => { isDragging = false; });
    }

    if (asistenteToggleBtn) {
        asistenteToggleBtn.addEventListener('click', () => {
            if (asistenteContainer.style.display === 'none') {
                asistenteContainer.style.display = 'flex';
                asistenteToggleBtn.style.display = 'none';
                asistenteCambiarFase(asistenteFaseActual);
            } else {
                asistenteContainer.style.display = 'none';
                asistenteToggleBtn.style.display = 'block';
                clearInterval(asistenteIntervaloDialogo);
            }
        });
    }

    if (sizeUpBtn && sizeDownBtn) {
        sizeUpBtn.addEventListener('click', () => {
            asistenteScale = Math.min(2, asistenteScale + 0.1);
            asistenteContainer.style.transform = `scale(${asistenteScale})`;
        });
        sizeDownBtn.addEventListener('click', () => {
            asistenteScale = Math.max(0.5, asistenteScale - 0.1);
            asistenteContainer.style.transform = `scale(${asistenteScale})`;
        });
    }

    if (typeof app !== 'undefined' && typeof app.switchMode === 'function') {
        const originalSwitchMode = app.switchMode;
        app.switchMode = function(mode) {
            originalSwitchMode.apply(this, arguments);
            if (mode === 'pomodoro') {
                asistenteCambiarFase('estudio');
            } else if (mode === 'shortBreak' || mode === 'longBreak') {
                asistenteCambiarFase('descanso');
            }
        };
        asistenteCambiarFase('estudio');
    } else {
        console.warn("Asistente: No se pudo encontrar la función 'app.switchMode'. El asistente no será interactivo.");
        asistenteCambiarFase('estudio');
    }
});
