(() => {
  'use strict';

  const STORAGE_KEY = 'daymark.tasks.v1';
  const CATEGORIES = ['Work', 'Personal', 'Study', 'Other'];
  let tasks = loadFromLocalStorage();
  let currentFilter = 'all';
  let searchQuery = '';
  let editingTaskId = null;
  let draggedTaskId = null;
  let toastTimer = null;

  const elements = {
    form: document.querySelector('#task-form'),
    title: document.querySelector('#task-title'),
    category: document.querySelector('#task-category'),
    dueDate: document.querySelector('#task-due-date'),
    submit: document.querySelector('#submit-task'),
    submitLabel: document.querySelector('#submit-label'),
    composerIcon: document.querySelector('#composer-icon'),
    cancelEdit: document.querySelector('#cancel-edit'),
    formHint: document.querySelector('#form-hint'),
    list: document.querySelector('#task-list'),
    search: document.querySelector('#search-input'),
    filters: [...document.querySelectorAll('[data-filter]')],
    total: document.querySelector('#total-count'),
    active: document.querySelector('#active-count'),
    completed: document.querySelector('#completed-count'),
    headingCount: document.querySelector('#heading-count'),
    allTabCount: document.querySelector('#all-tab-count'),
    activeTabCount: document.querySelector('#active-tab-count'),
    completedTabCount: document.querySelector('#completed-tab-count'),
    summary: document.querySelector('#list-summary'),
    clearCompleted: document.querySelector('#clear-completed'),
    toast: document.querySelector('#toast'),
    todayLabel: document.querySelector('#today-label')
  };

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string')
        .map((task) => ({
          id: task.id,
          title: task.title.slice(0, 120),
          category: CATEGORIES.includes(task.category) ? task.category : 'Other',
          dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
          completed: Boolean(task.completed),
          createdAt: Number(task.createdAt) || Date.now()
        }));
    } catch (error) {
      console.error('Could not read saved tasks:', error);
      return [];
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Could not save tasks:', error);
      showToast('Your browser could not save changes. Check available storage.');
      return false;
    }
  }

  function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDueDate(dateString) {
    const date = escapeDate(dateString);
    if (!date) return null;
    const today = localDateString();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = localDateString(tomorrowDate);
    let label = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
    let state = '';
    if (dateString === today) { label = 'Today'; state = 'today'; }
    else if (dateString === tomorrow) label = 'Tomorrow';
    else if (dateString < today) state = 'overdue';
    return { label, state };
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 2400);
  }

  function updateStats() {
    const completedCount = tasks.filter((task) => task.completed).length;
    const activeCount = tasks.length - completedCount;
    elements.total.textContent = tasks.length;
    elements.active.textContent = activeCount;
    elements.completed.textContent = completedCount;
    elements.headingCount.textContent = tasks.length;
    elements.allTabCount.textContent = tasks.length;
    elements.activeTabCount.textContent = activeCount;
    elements.completedTabCount.textContent = completedCount;
    elements.clearCompleted.hidden = completedCount === 0;

    if (tasks.length === 0) elements.summary.textContent = 'Your next small win is waiting.';
    else if (activeCount === 0) elements.summary.textContent = 'Everything is complete. Enjoy the clear space!';
    else elements.summary.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} left to go. You’ve got this.`;
  }

  function getVisibleTasks() {
    return tasks.filter((task) => {
      const matchesFilter = currentFilter === 'all'
        || (currentFilter === 'active' && !task.completed)
        || (currentFilter === 'completed' && task.completed);
      const query = searchQuery.trim().toLocaleLowerCase();
      const matchesSearch = !query || task.title.toLocaleLowerCase().includes(query)
        || task.category.toLocaleLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }

  function iconSvg(name) {
    const paths = {
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
      delete: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  }

  function createTaskElement(task, index) {
    const row = document.createElement('article');
    row.className = `task-row${task.completed ? ' is-completed' : ''}`;
    row.dataset.taskId = task.id;
    row.draggable = true;
    row.style.animationDelay = `${Math.min(index, 8) * 25}ms`;

    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.className = 'check-button';
    checkbox.setAttribute('aria-label', task.completed ? `Mark ${task.title} active` : `Mark ${task.title} complete`);
    checkbox.setAttribute('aria-pressed', String(task.completed));
    if (task.completed) checkbox.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.8"/></svg>';
    checkbox.addEventListener('click', () => toggleTask(task.id));

    const main = document.createElement('div');
    main.className = 'task-main';
    const title = document.createElement('p');
    title.className = 'task-title';
    title.textContent = task.title;
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const category = document.createElement('span');
    category.className = `category-tag ${task.category.toLowerCase()}`;
    category.textContent = task.category;
    meta.append(category);
    if (task.dueDate) {
      const due = formatDueDate(task.dueDate);
      if (due) {
        const dueEl = document.createElement('span');
        dueEl.className = `due-date ${!task.completed ? due.state : ''}`;
        dueEl.innerHTML = `${iconSvg('calendar')}<span></span>`;
        dueEl.querySelector('span').textContent = due.label;
        meta.append(dueEl);
      }
    }
    main.append(title, meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'icon-button'; edit.setAttribute('aria-label', `Edit ${task.title}`);
    edit.innerHTML = iconSvg('edit');
    edit.addEventListener('click', () => beginEdit(task.id));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'icon-button delete'; remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.innerHTML = iconSvg('delete');
    remove.addEventListener('click', () => deleteTask(task.id));
    actions.append(edit, remove);

    const handle = document.createElement('span');
    handle.className = 'drag-handle'; handle.textContent = '⠿'; handle.setAttribute('aria-hidden', 'true');
    row.append(checkbox, main, actions, handle);

    row.addEventListener('dragstart', (event) => {
      draggedTaskId = task.id;
      row.classList.add('dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', task.id);
      }
    });
    row.addEventListener('dragend', () => {
      draggedTaskId = null;
      row.classList.remove('dragging');
      elements.list.querySelectorAll('.drag-over').forEach((node) => node.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (draggedTaskId && draggedTaskId !== task.id) row.classList.add('drag-over');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      row.classList.remove('drag-over');
      const sourceId = draggedTaskId || (event.dataTransfer && event.dataTransfer.getData('text/plain'));
      if (sourceId && sourceId !== task.id) reorderTasks(sourceId, task.id);
    });
    return row;
  }

  function render() {
    updateStats();
    elements.list.replaceChildren();
    const visibleTasks = getVisibleTasks();
    if (visibleTasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const illustration = document.createElement('div'); illustration.className = 'empty-illustration';
      illustration.textContent = searchQuery ? '⌕' : currentFilter === 'completed' ? '✧' : '✳';
      const heading = document.createElement('h3');
      const copy = document.createElement('p');
      if (searchQuery) {
        heading.textContent = 'No matching tasks';
        copy.textContent = 'Try another search term or clear your search.';
      } else if (currentFilter === 'active' && tasks.length) {
        heading.textContent = 'All caught up';
        copy.textContent = 'You have no active tasks. Take a breath — you earned it.';
      } else if (currentFilter === 'completed') {
        heading.textContent = 'Nothing completed yet';
        copy.textContent = 'Check off a task when you finish it. Your wins will show up here.';
      } else {
        heading.textContent = 'A fresh start';
        copy.textContent = 'Add your first task above. Big things begin with small steps.';
      }
      empty.append(illustration, heading, copy);
      elements.list.append(empty);
    } else {
      visibleTasks.forEach((task, index) => elements.list.append(createTaskElement(task, index)));
    }
  }

  function resetComposer() {
    editingTaskId = null;
    elements.form.reset();
    elements.category.value = 'Work';
    elements.submitLabel.textContent = 'Add task';
    elements.composerIcon.textContent = '＋';
    elements.cancelEdit.hidden = true;
    elements.formHint.innerHTML = 'Press <kbd>Enter</kbd> to quickly add a task.';
  }

  function beginEdit(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    editingTaskId = id;
    elements.title.value = task.title;
    elements.category.value = task.category;
    elements.dueDate.value = task.dueDate;
    elements.submitLabel.textContent = 'Save changes';
    elements.composerIcon.textContent = '✎';
    elements.cancelEdit.hidden = false;
    elements.formHint.textContent = 'You’re editing a task. Save your changes or cancel.';
    elements.title.focus();
    elements.form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function addOrUpdateTask(event) {
    event.preventDefault();
    const title = elements.title.value.trim();
    if (!title) {
      elements.title.focus();
      showToast('Give your task a name first.');
      return;
    }
    const category = CATEGORIES.includes(elements.category.value) ? elements.category.value : 'Other';
    const dueDate = elements.dueDate.value;
    if (editingTaskId) {
      const task = tasks.find((item) => item.id === editingTaskId);
      if (task) {
        task.title = title;
        task.category = category;
        task.dueDate = dueDate;
        showToast('Task updated.');
      }
    } else {
      tasks.unshift({ id: makeId(), title, category, dueDate, completed: false, createdAt: Date.now() });
      showToast('Task added to your list.');
    }
    saveToLocalStorage();
    resetComposer();
    render();
    elements.title.focus();
  }

  function toggleTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveToLocalStorage();
    render();
    showToast(task.completed ? 'A little win. Task completed!' : 'Task moved back to active.');
  }

  function deleteTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    tasks = tasks.filter((item) => item.id !== id);
    if (editingTaskId === id) resetComposer();
    saveToLocalStorage();
    render();
    showToast('Task deleted.');
  }

  function reorderTasks(sourceId, targetId) {
    const fromIndex = tasks.findIndex((task) => task.id === sourceId);
    const toIndex = tasks.findIndex((task) => task.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, moved);
    saveToLocalStorage();
    render();
  }

  function clearCompletedTasks() {
    const completedCount = tasks.filter((task) => task.completed).length;
    if (!completedCount) return;
    tasks = tasks.filter((task) => !task.completed);
    saveToLocalStorage();
    render();
    showToast(`${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'} cleared.`);
  }

  function setFilter(filter) {
    currentFilter = filter;
    elements.filters.forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    render();
  }

  function updateTodayLabel() {
    const now = new Date();
    elements.todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: 'long', month: 'long', day: 'numeric'
    }).format(now).toUpperCase();
  }

  elements.form.addEventListener('submit', addOrUpdateTask);
  elements.cancelEdit.addEventListener('click', () => { resetComposer(); elements.title.focus(); });
  elements.filters.forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  elements.search.addEventListener('input', () => { searchQuery = elements.search.value; render(); });
  elements.clearCompleted.addEventListener('click', clearCompletedTasks);
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault(); elements.search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === elements.search) {
      elements.search.value = ''; searchQuery = ''; render(); elements.search.blur();
    }
  });

  updateTodayLabel();
  render();
})();
