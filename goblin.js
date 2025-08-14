export class Goblin {
  constructor(healthEl) {
    this.healthEl = healthEl;
    this.health = 100;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.healthEl) {
      this.healthEl.style.width = `${this.health}%`;
    }
  }

  damage(amount = 10) {
    this.health = Math.max(0, this.health - amount);
    this.updateDisplay();
    if (this.health === 0 && window.asistenteDecir) {
      window.asistenteDecir('¡Has derrotado al goblin!');
    }
  }

  reset() {
    this.health = 100;
    this.updateDisplay();
  }
}
