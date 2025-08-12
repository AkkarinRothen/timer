class TodoApp {
  constructor() {
    this.db = new LocalDB('todo');
    this.tasks = this.db.get('tasks') || [];
    this.lastCompletedTime = this.db.get('lastCompletedTime');

    // DOM
    this.listEl = document.getElementById('todo-list');
    this.form = document.getElementById('todo-form');
    this.inputEl = document.getElementById('todo-input');
    this.dateEl = document.getElementById('todo-date');
    this.priorityEl = document.getElementById('todo-priority');
    this.sortDateBtn = document.getElementById('sort-date');
    this.sortPriorityBtn = document.getElementById('sort-priority');
    this.section = document.getElementById('todo-section');
    this.toggleBtn = document.getElementById('todo-toggle-btn');

    // Eventos
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

    if (this.toggleBtn && this.section) {
      this.toggleBtn.addEventListener('click', () => {
        this.section.classList.toggle('d-none');
      });
    }

    this.render();
  }

  addTask() {
    const text = (this.inputEl?.value || '').trim();
    const date = this.dateEl?.value || '';
    const priority = this.priorityEl?.value || 'low';
    if (!text) return;

    const task = {
      id: Date.now(),
      text,
      date,
      priority,
      completed: false
    };

    this.tasks.push(task);
    this.save();
    this.form?.reset();
    this.render();
  }

  render() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';

    this.tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = `todo-item priority-${task.priority} ${task.completed ? 'done' : ''}`;
      li.draggable = true;
      li.dataset.id = task.id;

      // Checkbox completar
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'form-check-input';
      checkbox.checked = !!task.completed;
      checkbox.setAttribute('aria-label', 'Marcar tarea como completada');
      checkbox.addEventListener('change', () => this.toggleComplete(task.id));

      // Texto
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      textSpan.textContent = task.text;

      // Fecha
      const dateSpan = document.createElement('span');
      dateSpan.className = 'todo-date';
      dateSpan.textContent = task.date || '';

      // Prioridad (etiqueta)
      const prioritySpan = document.createElement('span');
      prioritySpan.className = `todo-priority ${task.priority}`;
      prioritySpan.textContent = this.labelPriority(task.priority);

      // Info de completada
      const infoSpan = document.createElement('span');
      infoSpan.className = 'completed-info';
      if (task.completed && task.completedAt) {
        infoSpan.textContent = `Completada a las ${task.completedAt}`;
        if (task.timeSinceLast) {
          infoSpan.textContent += ` (+${task.timeSinceLast})`;
        }
      }

      li.append(checkbox, textSpan, dateSpan, prioritySpan, infoSpan);

      // Drag handlers
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
    this.tasks.sort((a, b) => (rank[a.priority] ?? 2) - (rank[b.priority] ?? 2));
    this.save();
    this.render();
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;

    if (task.completed) {
      const now = new Date();
      task.completedAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (this.lastCompletedTime) {
        const diff = now - new Date(this.lastCompletedTime);
        task.timeSinceLast = this.formatDuration(diff);
      }
      this.lastCompletedTime = now.toISOString();
    } else {
      delete task.completedAt;
      delete task.timeSinceLast;
    }

    this.save();
    this.render();
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  save() {
    this.db.set('tasks', this.tasks);
    this.db.set('lastCompletedTime', this.lastCompletedTime);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});
