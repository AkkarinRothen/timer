class TodoApp {
  constructor() {
    this.db = new LocalDB('todo');
    this.tasks = this.db.get('tasks') || [];
    this.listEl = document.getElementById('todo-list');
    this.form = document.getElementById('todo-form');
    this.inputEl = document.getElementById('todo-input');
    this.dateEl = document.getElementById('todo-date');
    this.priorityEl = document.getElementById('todo-priority');
    this.sortDateBtn = document.getElementById('sort-date');
    this.sortPriorityBtn = document.getElementById('sort-priority');

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTask();
      });
    }

    if (this.sortDateBtn) {
      this.sortDateBtn.addEventListener('click', () => this.sortByDate());
    }
    if (this.sortPriorityBtn) {
      this.sortPriorityBtn.addEventListener('click', () => this.sortByPriority());
    }

    if (this.listEl) {
      this.listEl.addEventListener('dragover', (e) => this.onDragOver(e));
    }

    this.render();
  }

  addTask() {
    const text = this.inputEl.value.trim();
    const date = this.dateEl.value;
    const priority = this.priorityEl.value;
    if (!text) return;
    const task = { id: Date.now(), text, date, priority };
    this.tasks.push(task);
    this.save();
    this.form.reset();
    this.render();
  }

  render() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    this.tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.draggable = true;
      li.dataset.id = task.id;
      li.innerHTML = `
        <span class="todo-text">${task.text}</span>
        <span class="todo-date">${task.date}</span>
        <span class="todo-priority ${task.priority}">${this.labelPriority(task.priority)}</span>
      `;
      li.addEventListener('dragstart', () => li.classList.add('dragging'));
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        this.updateOrderFromDOM();
      });
      this.listEl.appendChild(li);
    });
  }

  labelPriority(p) {
    switch (p) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      default: return 'Baja';
    }
  }

  onDragOver(e) {
    e.preventDefault();
    const afterElement = this.getDragAfterElement(e.clientY);
    const dragging = this.listEl.querySelector('.dragging');
    if (!dragging) return;
    if (afterElement == null) {
      this.listEl.appendChild(dragging);
    } else {
      this.listEl.insertBefore(dragging, afterElement);
    }
  }

  getDragAfterElement(y) {
    const elements = [...this.listEl.querySelectorAll('.todo-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  updateOrderFromDOM() {
    const order = [...this.listEl.children].map(li => Number(li.dataset.id));
    this.tasks.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    this.save();
  }

  sortByDate() {
    this.tasks.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    this.save();
    this.render();
  }

  sortByPriority() {
    const rank = { high: 0, medium: 1, low: 2 };
    this.tasks.sort((a, b) => rank[a.priority] - rank[b.priority]);
    this.save();
    this.render();
  }

  save() {
    this.db.set('tasks', this.tasks);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});
