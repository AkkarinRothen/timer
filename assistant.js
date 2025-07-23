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

        asistenteBotonCerrar.addEventListener('click', () => {
            asistenteContainer.style.display = 'none';
            clearInterval(asistenteIntervaloDialogo);
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
