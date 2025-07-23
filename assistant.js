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

// Elementos del DOM
const asistenteContainer      = document.getElementById('asistente-container');
const asistenteBurbuja        = document.getElementById('dialogo-burbuja');
const asistenteTextoDialogo   = document.getElementById('texto-dialogo');
const asistenteBotonCerrar    = document.getElementById('cerrar-asistente');
// Controles opcionales (pueden no existir en el DOM)
const asistenteToggleBtn      = document.getElementById('assistant-toggle-btn');
const sizeUpBtn               = document.getElementById('assist-size-up');
const sizeDownBtn             = document.getElementById('assist-size-down');

let asistenteScale = 1;
let isDragging     = false;
let dragOffsetX    = 0;
let dragOffsetY    = 0;

let asistenteFaseActual     = 'estudio';
let asistenteDialogoActual  = 0;
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

// Drag helpers
const startDrag = (clientX, clientY) => {
  isDragging = true;
  dragOffsetX = clientX - asistenteContainer.offsetLeft;
  dragOffsetY = clientY - asistenteContainer.offsetTop;
  // Liberamos right/bottom para poder posicionar libremente
  asistenteContainer.style.right = 'auto';
  asistenteContainer.style.bottom = 'auto';
};
const moveDrag = (clientX, clientY) => {
  if (!isDragging) return;
  asistenteContainer.style.left = (clientX - dragOffsetX) + 'px';
  asistenteContainer.style.top  = (clientY - dragOffsetY) + 'px';
};

// INIT

document.addEventListener('DOMContentLoaded', () => {
  if (asistenteContainer) {
    // Animación inicial
    setTimeout(() => {
      asistenteBurbuja.style.opacity = '1';
      asistenteBurbuja.style.transform = 'translateY(0)';
    }, 500);

    // Si existe el botón toggle, lo ocultamos al inicio
    if (asistenteToggleBtn) {
      asistenteToggleBtn.style.display = 'none';
    }

    // Cerrar asistente
    asistenteBotonCerrar?.addEventListener('click', () => {
      asistenteContainer.style.display = 'none';
      clearInterval(asistenteIntervaloDialogo);
      if (asistenteToggleBtn) asistenteToggleBtn.style.display = 'block';
    });

    // Drag (desktop)
    asistenteContainer.addEventListener('mousedown', (e) => {
      if ([sizeUpBtn, sizeDownBtn, asistenteBotonCerrar].includes(e.target)) return;
      startDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup',   () => { isDragging = false; });

    // Drag (touch)
    asistenteContainer.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      if ([sizeUpBtn, sizeDownBtn, asistenteBotonCerrar].includes(e.target)) return;
      startDrag(t.clientX, t.clientY);
    });
    document.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    });
    document.addEventListener('touchend',  () => { isDragging = false; });
  }

  // Toggle visible/oculto
  if (asistenteToggleBtn) {
    asistenteToggleBtn.addEventListener('click', () => {
      const hidden = asistenteContainer.style.display === 'none';
      asistenteContainer.style.display = hidden ? 'flex' : 'none';
      asistenteToggleBtn.style.display  = hidden ? 'none' : 'block';
      if (hidden) {
        asistenteCambiarFase(asistenteFaseActual);
      } else {
        clearInterval(asistenteIntervaloDialogo);
      }
    });
  }

  // Tamaño +/-
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

  // Hookearse al modo del app (si existe app.switchMode)
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
    // Fase inicial
    asistenteCambiarFase('estudio');
  } else {
    console.warn("Asistente: No se pudo encontrar la función 'app.switchMode'. El asistente no será interactivo.");
    asistenteCambiarFase('estudio');
  }
});
