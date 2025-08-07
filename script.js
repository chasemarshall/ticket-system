let tickets = [];
let currentFilter = 'all';

// DOM elements
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('ticketsList');
const filterTabs = document.querySelectorAll('.filter-tab');
const openCount = document.getElementById('openCount');
const progressCount = document.getElementById('progressCount');
const resolvedCount = document.getElementById('resolvedCount');

// Form submission
ticketForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const payload = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        reporter: document.getElementById('reporter').value,
        description: document.getElementById('description').value
    };

    try {
        const res = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Request failed');

        const ticket = await res.json();
        tickets.unshift(ticket);
        ticketForm.reset();
        renderTickets();
        updateStats();
    } catch (err) {
        alert('Unable to create ticket. Please try again.');
    }
});

// Filter tabs
filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        filterTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTickets();
    });
});

// Load tickets from backend
async function loadTickets() {
    const res = await fetch('/api/tickets');
    tickets = await res.json();
    renderTickets();
    updateStats();
}

// Render tickets
function renderTickets() {
    const filteredTickets = currentFilter === 'all'
        ? tickets
        : tickets.filter(ticket => ticket.status === currentFilter);

    if (filteredTickets.length === 0) {
        const emptyMessage = currentFilter === 'all'
            ? 'No tickets found<br><small>Create your first support ticket to get started</small>'
            : `No ${currentFilter.replace('-', ' ')} tickets<br><small>All clear in this category</small>`;

        ticketsList.innerHTML = `
            <div class="no-tickets">
                <div class="no-tickets-icon">📋</div>
                <div>${emptyMessage}</div>
            </div>
        `;
        return;
    }

    ticketsList.innerHTML = filteredTickets.map(ticket => `
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
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for action buttons
    addActionListeners();
}

// Get category display name
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

// Get action buttons based on status
function getActionButtons(ticket) {
    switch(ticket.status) {
        case 'open':
            return `
                <button class="btn-small btn-progress" data-id="${ticket.id}" data-status="in-progress">
                    <span>⚡</span> Start Work
                </button>
                <button class="btn-small btn-resolve" data-id="${ticket.id}" data-status="resolved">
                    <span>✅</span> Resolve
                </button>
            `;
        case 'in-progress':
            return `
                <button class="btn-small btn-resolve" data-id="${ticket.id}" data-status="resolved">
                    <span>✅</span> Resolve
                </button>
                <button class="btn-small btn-reopen" data-id="${ticket.id}" data-status="open">
                    <span>⏸️</span> Pause
                </button>
            `;
        case 'resolved':
            return `
                <button class="btn-small btn-reopen" data-id="${ticket.id}" data-status="open">
                    <span>🔄</span> Reopen
                </button>
            `;
        default:
            return '';
    }
}

// Update ticket status
async function updateTicketStatus(ticketId, newStatus) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
        const updated = await res.json();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
            tickets[index] = updated;
            renderTickets();
            updateStats();
        }
    }
}

// Add action listeners
function addActionListeners() {
    document.querySelectorAll('.ticket-actions button').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            const status = btn.getAttribute('data-status');
            updateTicketStatus(id, status);
        });
    });
}

// Update statistics
function updateStats() {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;

    openCount.textContent = open;
    progressCount.textContent = inProgress;
    resolvedCount.textContent = resolved;
}

// Initialize
loadTickets();
