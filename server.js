const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const DATA_FILE = path.join(__dirname, 'tickets.json');

// Load tickets from file
let tickets = [];
try {
  tickets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (err) {
  tickets = [];
}

function saveTickets() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2));
}

const app = express();
app.use(express.json());

const adminAuth = basicAuth({
  users: { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASSWORD || 'password' },
  challenge: true
});

// User submits ticket
app.post('/api/tickets', (req, res) => {
  const { title, category, priority, reporter, description } = req.body;
  if (!title || !category || !priority || !reporter || !description) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const id = tickets.length ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
  const now = new Date().toISOString();
  const ticket = { id, title, category, priority, reporter, description, status: 'open', createdAt: now, updatedAt: now };
  tickets.unshift(ticket);
  saveTickets();
  res.status(201).json(ticket);
});

// Admin: list tickets
app.get('/api/tickets', adminAuth, (req, res) => {
  res.json(tickets);
});

// Admin: update ticket
app.patch('/api/tickets/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  const { status } = req.body;
  if (status) {
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    saveTickets();
  }
  res.json(ticket);
});

app.get('/admin.html', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
