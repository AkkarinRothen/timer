class TodoApp {
  constructor() {
    // Estado
    this.db = new LocalDB('todo');
    this.tasks = this.db.get('tasks') || [];
    this.lastCompletedTime = this.db.get('lastCompletedTime');

    // DOM
    this.listEl = document.getElementById('todo-list');
    this.completedListEl = document.getElementById('completed-list');
    this.form = document.getElementById('todo-form');
    this.inputEl = document.getElementById('todo-input');
    this.dateEl = document.getElementById('todo-date');
    this.priorityEl = document.getElementById('todo-priority');
    this.sortDateBtn = document.getElementById('sort-date');
    this.sortPriorityBtn = document.getElementById('sort-priority');
    this.searchEl = document.getElementById('todo-search');
    this.filterEl = document.getElementById('todo-filter');
    this.section = document.getElementById('todo-section');
    this.toggleBtn = document.getElementById('todo-toggle-btn');
    this.closeBtn = document.getElementById('todo-close-btn');

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
      this.listEl.addEventListener('drop', (e) => this.onDropPending(e));
    }
    if (this.completedListEl) {
      this.completedListEl.addEventListener('dragover', (e) => this.onDragOverCompleted(e));
      this.completedListEl.addEventListener('dragenter', () => this.completedListEl.classList.add('drag-over'));
      this.completedListEl.addEventListener('dragleave', () => this.completedListEl.classList.remove('drag-over'));
      this.completedListEl.addEventListener('drop', (e) => this.onDropCompleted(e));
    }

    if (this.toggleBtn && this.section) {
      this.toggleBtn.addEventListener('click', () => {
        this.section.classList.toggle('d-none');
      });
    }

    if (this.closeBtn && this.section) {
      this.closeBtn.addEventListener('click', () => {
        this.section.classList.add('d-none');
      });
    }

    if (this.searchEl) {
      this.searchEl.addEventListener('input', () => this.render());
    }
    if (this.filterEl) {
      this.filterEl.addEventListener('change', () => this.render());
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
    if (!this.listEl || !this.completedListEl) return;
    this.listEl.innerHTML = '';
    this.completedListEl.innerHTML = '';

    const search = (this.searchEl?.value || '').toLowerCase();
    const filter = this.filterEl?.value || 'all';

    this.tasks.forEach((task) => {
      if (!task.text.toLowerCase().includes(search)) return;
      if (filter !== 'all' && task.priority !== filter) return;
      const li = document.createElement('li');
      li.className = `todo-item priority-${task.priority} ${task.completed ? 'done' : ''}`;
      li.draggable = true;
      li.dataset.id = task.id;

      // Botón completar
      const completeBtn = document.createElement('button');
      completeBtn.type = 'button';
      completeBtn.className = 'btn btn-sm btn-outline-success ms-auto complete-btn';
      completeBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleComplete(task.id);
      });
      completeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      if (task.completed) {
        completeBtn.classList.remove('btn-outline-success');
        completeBtn.classList.add('btn-outline-secondary');
        completeBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
      }

      // Texto
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      textSpan.textContent = task.text;
      textSpan.addEventListener('dblclick', () => this.editTask(task.id, textSpan));

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

      li.append(textSpan, dateSpan, prioritySpan, infoSpan, completeBtn);

      // Drag handlers
      li.addEventListener('dragstart', () => li.classList.add('dragging'));
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        this.updateOrderFromDOM();
      });

      if (task.completed) {
        this.completedListEl.appendChild(li);
      } else {
        this.listEl.appendChild(li);
      }
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
    const dragging = document.querySelector('.todo-item.dragging');
    if (!dragging) return;
    if (afterElement == null) {
      this.listEl.appendChild(dragging);
    } else {
      this.listEl.insertBefore(dragging, afterElement);
    }
  }

  onDragOverCompleted(e) {
    e.preventDefault();
  }

  onDropCompleted(e) {
    e.preventDefault();
    this.completedListEl.classList.remove('drag-over');
    const dragging = document.querySelector('.todo-item.dragging');
    if (!dragging) return;
    const id = Number(dragging.dataset.id);
    const task = this.tasks.find(t => t.id === id);
    if (task && !task.completed) {
      this.toggleComplete(id);
    }
  }

  onDropPending(e) {
    e.preventDefault();
    this.completedListEl.classList.remove('drag-over');
    const dragging = document.querySelector('.todo-item.dragging');
    if (!dragging) return;
    const id = Number(dragging.dataset.id);
    const task = this.tasks.find(t => t.id === id);
    if (task && task.completed) {
      this.toggleComplete(id);
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
    const pending = this.tasks.filter(t => !t.completed);
    const completed = this.tasks.filter(t => t.completed);
    pending.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    this.tasks = [...pending, ...completed];
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

  editTask(id, span) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm';
    input.value = task.text;
    span.replaceWith(input);
    input.focus();

    const save = () => {
      const newText = input.value.trim();
      if (newText) {
        task.text = newText;
        this.save();
      }
      this.render();
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      }
    });
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
