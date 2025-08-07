let tickets = [];
let currentFilter = 'all';

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');

const ticketsList = document.getElementById('ticketsList');
const filterTabs = document.querySelectorAll('.filter-tab');
const openCount = document.getElementById('openCount');
const progressCount = document.getElementById('progressCount');
const resolvedCount = document.getElementById('resolvedCount');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      loginSection.style.display = 'none';
      adminSection.style.display = 'block';
      initAdmin();
    } else {
      alert('Invalid credentials');
    }
  } catch (err) {
    alert('Login failed');
  }
});

function initAdmin() {
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderTickets();
    });
  });
  loadTickets();
}

async function loadTickets() {
  const res = await fetch('/api/tickets');
  tickets = await res.json();
  renderTickets();
  updateStats();
}

function renderTickets() {
  const filtered = currentFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === currentFilter);

  if (filtered.length === 0) {
    const emptyMessage = currentFilter === 'all'
      ? 'No tickets found<br><small>There are no tickets to manage</small>'
      : `No ${currentFilter.replace('-', ' ')} tickets<br><small>All clear in this category</small>`;
    ticketsList.innerHTML = `
      <div class="no-tickets">
        <div class="no-tickets-icon">📋</div>
        <div>${emptyMessage}</div>
      </div>
    `;
    return;
  }

  ticketsList.innerHTML = filtered.map(ticket => `
    <div class="ticket ${ticket.status} priority-${ticket.priority}">
      <div class="ticket-header">
        <div class="ticket-info">
          <div class="ticket-title">Ticket #${ticket.id} - ${ticket.title}</div>
          <div class="ticket-meta">
            <span>👤 ${ticket.reporter}</span>
            <span>📂 ${getCategoryDisplay(ticket.category)}</span>
            <span>📅 ${new Date(ticket.createdAt).toLocaleString()}</span>
            <span>⚡ ${ticket.priority.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div class="ticket-description">${ticket.description}</div>
      ${ticket.notes && ticket.notes.length ? `
      <div class="ticket-notes">
        ${ticket.notes.map(n => `<div class="note">📝 ${n}</div>`).join('')}
      </div>` : ''}
      <div class="ticket-footer">
        <span class="status-badge ${ticket.status}">${ticket.status.replace('-', ' ')}</span>
        <div class="ticket-actions">
          ${getActionButtons(ticket)}
          <input type="text" class="note-input" data-note-input="${ticket.id}" placeholder="Note...">
          <button class="btn-small btn-add-note" data-id="${ticket.id}"><span>📝</span> Add Note</button>
        </div>
      </div>
    </div>
  `).join('');

  addActionListeners();
  addNoteListeners();
}

function getCategoryDisplay(category) {
  const categories = {
    'network': 'Network',
    'automation': 'Automation',
    'hardware': 'Hardware',
    'software': 'Software',
    'security': 'Security',
    'other': 'Other'
  };
  return categories[category] || category;
}

function getActionButtons(ticket) {
  switch(ticket.status) {
    case 'open':
      return `
        <button class="btn-small btn-progress" data-id="${ticket.id}" data-status="in-progress">
          <span>⚡</span> Start Work
        </button>
        <button class="btn-small btn-resolve" data-id="${ticket.id}" data-status="resolved">
          <span>✅</span> Resolve
        </button>`;
    case 'in-progress':
      return `
        <button class="btn-small btn-resolve" data-id="${ticket.id}" data-status="resolved">
          <span>✅</span> Resolve
        </button>
        <button class="btn-small btn-reopen" data-id="${ticket.id}" data-status="open">
          <span>⏸️</span> Pause
        </button>`;
    case 'resolved':
      return `
        <button class="btn-small btn-reopen" data-id="${ticket.id}" data-status="open">
          <span>🔄</span> Reopen
        </button>`;
    default:
      return '';
  }
}

function addActionListeners() {
  document.querySelectorAll('.ticket-actions button[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      const status = btn.getAttribute('data-status');
      updateTicketStatus(id, status);
    });
  });
}

function addNoteListeners() {
  document.querySelectorAll('.btn-add-note').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      const input = document.querySelector(`.note-input[data-note-input="${id}"]`);
      const note = input.value.trim();
      if (note) {
        addNote(id, note);
        input.value = '';
      }
    });
  });
}

async function updateTicketStatus(id, status) {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (res.ok) {
    const updated = await res.json();
    const index = tickets.findIndex(t => t.id === id);
    if (index !== -1) {
      tickets[index] = updated;
      renderTickets();
      updateStats();
    }
  }
}

async function addNote(id, note) {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note })
  });
  if (res.ok) {
    const updated = await res.json();
    const index = tickets.findIndex(t => t.id === id);
    if (index !== -1) {
      tickets[index] = updated;
      renderTickets();
    }
  }
}

function updateStats() {
  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in-progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;

  openCount.textContent = open;
  progressCount.textContent = inProgress;
  resolvedCount.textContent = resolved;
}

