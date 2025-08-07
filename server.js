const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

let tickets = [];
let ticketCounter = 1;

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.get('/api/tickets', (req, res) => {
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const ticket = {
    id: ticketCounter++,
    title: req.body.title,
    category: req.body.category,
    priority: req.body.priority,
    reporter: req.body.reporter,
    description: req.body.description,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  tickets.push(ticket);
  res.status(201).json(ticket);
});

app.put('/api/tickets/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }
  Object.assign(ticket, req.body);
  ticket.updatedAt = new Date().toISOString();
  res.json(ticket);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
