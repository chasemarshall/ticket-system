const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const ticketList = document.getElementById('admin-ticket-list');

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
      loadTickets();
    } else {
      alert('Invalid credentials');
    }
  } catch (err) {
    alert('Login failed');
  }
});

async function loadTickets() {
  const res = await fetch('/api/tickets');
  const tickets = await res.json();
  ticketList.innerHTML = '';
  if (tickets.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No tickets';
    ticketList.appendChild(li);
    return;
  }
  tickets.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.id}: ${t.title} - ${t.status}`;
    ticketList.appendChild(li);
  });
}
