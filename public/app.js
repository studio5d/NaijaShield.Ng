const state = {
  token: localStorage.getItem('ns-token'),
  user: null,
  dashboard: null
};

const els = {
  loginCard: document.getElementById('loginCard'),
  loginForm: document.getElementById('loginForm'),
  loginStatus: document.getElementById('loginStatus'),
  portalTitle: document.getElementById('portalTitle'),
  portalSubtitle: document.getElementById('portalSubtitle'),
  loginTitle: document.getElementById('loginTitle'),
  loginHelp: document.getElementById('loginHelp'),
  marketingPage: document.getElementById('marketingPage'),
  portalApp: document.getElementById('portalApp'),
  workspaceName: document.getElementById('workspaceName'),
  dashboard: document.getElementById('dashboard'),
  activeUser: document.getElementById('activeUser'),
  logoutBtn: document.getElementById('logoutBtn'),
  openLogin: document.getElementById('openLogin'),
  useClientDemo: document.getElementById('useClientDemo'),
  useAdminDemo: document.getElementById('useAdminDemo'),
  registerCard: document.getElementById('registerCard'),
  registerForm: document.getElementById('registerForm'),
  registerStatus: document.getElementById('registerStatus'),
  metrics: document.getElementById('metrics'),
  requestList: document.getElementById('requestList'),
  ticketList: document.getElementById('ticketList'),
  reportList: document.getElementById('reportList'),
  activityList: document.getElementById('activityList'),
  requestCount: document.getElementById('requestCount'),
  ticketCount: document.getElementById('ticketCount'),
  reportCount: document.getElementById('reportCount'),
  requestForm: document.getElementById('requestForm'),
  ticketForm: document.getElementById('ticketForm'),
  requestStatus: document.getElementById('requestStatus'),
  ticketStatus: document.getElementById('ticketStatus'),
  requestCompany: document.getElementById('requestCompany'),
  ticketCompany: document.getElementById('ticketCompany'),
  adminPanel: document.getElementById('adminPanel'),
  companyTable: document.getElementById('companyTable')
};

function currentWorkspace() {
  if (window.location.pathname.startsWith('/admin')) return 'admin';
  if (window.location.pathname.startsWith('/client')) return 'client';
  if (window.location.pathname.startsWith('/register')) return 'register';
  return 'public';
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(path, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function scrollToPortal() {
  document.getElementById('portal').scrollIntoView({ behavior: 'smooth' });
}

function setDemoCredentials(role) {
  els.loginForm.email.value = role === 'admin' ? 'admin@naijashield.ng' : 'client@example.com';
  els.loginForm.password.value = role === 'admin' ? 'admin123' : 'client123';
}

function configureRoute() {
  const route = currentWorkspace();
  document.body.classList.toggle('portal-page', route !== 'public');
  document.body.classList.toggle('client-page', route === 'client');
  document.body.classList.toggle('admin-page', route === 'admin');
  document.body.classList.toggle('register-page', route === 'register');
  els.marketingPage.hidden = route !== 'public';
  els.portalApp.hidden = route === 'public';
  els.loginCard.hidden = route === 'public' || route === 'register' || Boolean(state.user);
  els.registerCard.hidden = route !== 'register' || Boolean(state.user);
  els.dashboard.hidden = !state.user;

  if (route === 'client') {
    els.portalTitle.textContent = 'Client Portal';
    els.portalSubtitle.textContent = 'A simple workspace for reports, tickets, service requests, and security posture.';
    els.loginTitle.textContent = 'Client sign in';
    els.loginHelp.textContent = 'Access your organization dashboard and NaijaShield service history.';
    setDemoCredentials('client');
  } else if (route === 'admin') {
    els.portalTitle.textContent = 'Admin Portal';
    els.portalSubtitle.textContent = 'A command center for NaijaShield staff to manage clients, tickets, and requests.';
    els.loginTitle.textContent = 'Admin sign in';
    els.loginHelp.textContent = 'Manage client companies, open tickets, reports, and service operations.';
    setDemoCredentials('admin');
  } else if (route === 'register') {
    els.portalTitle.textContent = 'Register as Client';
    els.portalSubtitle.textContent = 'Create a new client workspace for your company and start NaijaShield onboarding.';
  } else {
    els.portalTitle.textContent = 'NaijaShield Cyber Portal';
    els.portalSubtitle.textContent = 'Secure access for clients and NaijaShield administrators.';
  }
}

function itemHtml(title, body, chips = []) {
  return `
    <article class="list-item">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
      <div class="chips">${chips.map(chip => `<span class="chip ${chip.tone || ''}">${escapeHtml(chip.label)}</span>`).join('')}</div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function chipTone(value) {
  if (['Critical', 'High', 'Open'].includes(value)) return 'danger';
  if (['Medium', 'Scheduled', 'In Progress', 'New'].includes(value)) return 'warn';
  return '';
}

function populateCompanySelect(select) {
  select.innerHTML = state.dashboard.companies
    .map(company => `<option value="${company.id}">${escapeHtml(company.name)}</option>`)
    .join('');
}

function renderMetrics() {
  const metrics = state.dashboard.metrics;
  const items = state.user.role === 'admin'
    ? [
        ['Clients', metrics.protectedClients],
        ['Avg security score', `${metrics.securityScore}%`],
        ['Open tickets', metrics.openTickets],
        ['Active requests', metrics.activeRequests]
      ]
    : [
        ['Security score', `${metrics.securityScore}%`],
        ['Open tickets', metrics.openTickets],
        ['Active requests', metrics.activeRequests],
        ['Ready reports', metrics.readyReports]
      ];

  els.metrics.innerHTML = items
    .map(([label, value]) => `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join('');
}

function renderLists() {
  const { requests, tickets, reports, activity } = state.dashboard;
  els.requestCount.textContent = requests.length;
  els.ticketCount.textContent = tickets.length;
  els.reportCount.textContent = reports.length;

  els.requestList.innerHTML = requests.length
    ? requests.map(request => itemHtml(request.service, request.summary, [
        { label: request.priority, tone: chipTone(request.priority) },
        { label: request.status, tone: chipTone(request.status) },
        { label: request.createdAt }
      ])).join('')
    : '<p>No service requests yet.</p>';

  els.ticketList.innerHTML = tickets.length
    ? tickets.map(ticket => itemHtml(ticket.subject, ticket.message, [
        { label: ticket.severity, tone: chipTone(ticket.severity) },
        { label: ticket.status, tone: chipTone(ticket.status) },
        { label: ticket.createdAt }
      ])).join('')
    : '<p>No support tickets yet.</p>';

  els.reportList.innerHTML = reports.length
    ? reports.map(report => itemHtml(report.title, report.summary, [
        { label: report.type },
        { label: report.status },
        { label: report.publishedAt }
      ])).join('')
    : '<p>No reports published yet.</p>';

  els.activityList.innerHTML = activity.length
    ? activity.map(item => itemHtml(item.createdAt, item.message)).join('')
    : '<p>No activity yet.</p>';
}

function renderAdmin() {
  const isAdmin = state.user.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(element => {
    element.hidden = !isAdmin;
  });
  els.adminPanel.hidden = !isAdmin;

  if (!isAdmin) return;

  populateCompanySelect(els.requestCompany);
  populateCompanySelect(els.ticketCompany);
  els.companyTable.innerHTML = state.dashboard.companies.map(company => `
    <tr>
      <td>${escapeHtml(company.name)}</td>
      <td>${escapeHtml(company.industry)}</td>
      <td>${escapeHtml(company.plan)}</td>
      <td>${company.securityScore}%</td>
      <td>${escapeHtml(company.compliance)}</td>
      <td>${escapeHtml(company.nextReview)}</td>
    </tr>
  `).join('');
}

function renderDashboard() {
  els.loginCard.hidden = true;
  els.registerCard.hidden = true;
  els.portalApp.hidden = false;
  els.dashboard.hidden = false;
  els.logoutBtn.hidden = false;
  els.activeUser.textContent = `${state.user.name} (${state.user.role})`;
  els.workspaceName.textContent = state.user.role === 'admin' ? 'Admin Workspace' : 'Client Workspace';
  renderMetrics();
  renderLists();
  renderAdmin();
}

async function loadDashboard() {
  const dashboard = await api('/api/dashboard');
  state.dashboard = dashboard;
  state.user = dashboard.user;
  const route = currentWorkspace();
  if (route === 'client' && state.user.role === 'admin') {
    history.replaceState(null, '', '/admin');
    configureRoute();
  }
  if (route === 'admin' && state.user.role !== 'admin') {
    history.replaceState(null, '', '/client');
    configureRoute();
  }
  renderDashboard();
}

async function login(email, password) {
  const data = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('ns-token', data.token);
  history.replaceState(null, '', data.user.role === 'admin' ? '/admin' : '/client');
  configureRoute();
  await loadDashboard();
}

async function register(payload) {
  const data = await api('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('ns-token', data.token);
  history.replaceState(null, '', '/client');
  configureRoute();
  await loadDashboard();
}

async function logout() {
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {
    // Local sign-out should still clear the browser session.
  }
  state.token = null;
  state.user = null;
  state.dashboard = null;
  localStorage.removeItem('ns-token');
  els.dashboard.hidden = true;
  els.logoutBtn.hidden = true;
  configureRoute();
  els.activeUser.textContent = 'Not signed in';
}

els.openLogin.addEventListener('click', () => {
  window.location.href = '/client';
});
els.useClientDemo.addEventListener('click', () => setDemoCredentials('client'));
els.useAdminDemo.addEventListener('click', () => setDemoCredentials('admin'));

els.loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  els.loginStatus.textContent = 'Signing in...';
  const form = new FormData(els.loginForm);
  try {
    await login(form.get('email'), form.get('password'));
    els.loginStatus.textContent = '';
  } catch (error) {
    els.loginStatus.textContent = error.message;
  }
});

els.registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  els.registerStatus.textContent = 'Creating client account...';
  const form = new FormData(els.registerForm);
  try {
    await register(Object.fromEntries(form.entries()));
    els.registerStatus.textContent = '';
  } catch (error) {
    els.registerStatus.textContent = error.message;
  }
});

els.logoutBtn.addEventListener('click', logout);

els.requestForm.addEventListener('submit', async event => {
  event.preventDefault();
  els.requestStatus.textContent = 'Submitting request...';
  const form = new FormData(els.requestForm);
  const payload = Object.fromEntries(form.entries());
  try {
    await api('/api/requests', { method: 'POST', body: JSON.stringify(payload) });
    els.requestForm.reset();
    els.requestStatus.textContent = 'Request submitted.';
    await loadDashboard();
  } catch (error) {
    els.requestStatus.textContent = error.message;
  }
});

els.ticketForm.addEventListener('submit', async event => {
  event.preventDefault();
  els.ticketStatus.textContent = 'Opening ticket...';
  const form = new FormData(els.ticketForm);
  const payload = Object.fromEntries(form.entries());
  try {
    await api('/api/tickets', { method: 'POST', body: JSON.stringify(payload) });
    els.ticketForm.reset();
    els.ticketStatus.textContent = 'Ticket opened.';
    await loadDashboard();
  } catch (error) {
    els.ticketStatus.textContent = error.message;
  }
});

configureRoute();

if (state.token && currentWorkspace() !== 'public') {
  loadDashboard().catch(() => logout());
}

const themeToggles = document.querySelectorAll('[data-theme-toggle]');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');
const chatWidget = document.querySelector('.chat-widget');
const chatModal = document.getElementById('chatModal');
const chatClose = document.querySelector('.chat-close');

const setThemeLabel = () => {
  const isLight = document.body.classList.contains('light-mode');
  themeToggles.forEach(toggle => {
    toggle.textContent = isLight ? 'Dark Mode' : 'Light Mode';
  });
};

if (localStorage.getItem('naijashield-theme') === 'light') {
  document.body.classList.add('light-mode');
}
setThemeLabel();

themeToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('naijashield-theme', isLight ? 'light' : 'dark');
    setThemeLabel();
  });
});

const closeMobileMenu = () => {
  if (!mobileMenu) return;
  mobileMenu.classList.remove('active');
  mobileMenu.setAttribute('aria-hidden', 'true');
};

menuToggle?.addEventListener('click', () => {
  mobileMenu?.classList.add('active');
  mobileMenu?.setAttribute('aria-hidden', 'false');
});

closeMenu?.addEventListener('click', closeMobileMenu);
mobileMenu?.addEventListener('click', event => {
  if (event.target === mobileMenu) closeMobileMenu();
});
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));

const showFormStatus = (form, message) => {
  const status = form.querySelector('.form-status');
  if (status) status.textContent = message;
};

document.querySelectorAll('.contact-form, .newsletter-form, .chat-form').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const message = form.classList.contains('newsletter-form')
      ? 'You are subscribed to NaijaShield updates.'
      : form.classList.contains('chat-form')
        ? 'NaijaShield AI received your request. A security specialist will follow up.'
        : 'Thank you. NaijaShield will contact you shortly.';
    showFormStatus(form, message);
    form.reset();
    if (form.classList.contains('chat-form')) {
      setTimeout(() => chatModal?.classList.remove('active'), 1600);
    }
  });
});

chatWidget?.addEventListener('click', () => {
  chatModal?.classList.add('active');
  chatModal?.setAttribute('aria-hidden', 'false');
  chatModal?.querySelector('input')?.focus();
});

chatClose?.addEventListener('click', () => {
  chatModal?.classList.remove('active');
  chatModal?.setAttribute('aria-hidden', 'true');
});

chatModal?.addEventListener('click', event => {
  if (event.target === chatModal) {
    chatModal.classList.remove('active');
    chatModal.setAttribute('aria-hidden', 'true');
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMobileMenu();
    chatModal?.classList.remove('active');
    chatModal?.setAttribute('aria-hidden', 'true');
  }
});

const animateCounters = () => {
  document.querySelectorAll('.stat-number').forEach(counter => {
    const target = Number(counter.dataset.target || 0);
    if (!target) return;
    const startedAt = performance.now();
    const duration = 1600;
    const step = timestamp => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      counter.textContent = Math.round(target * progress).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
};

window.addEventListener('load', animateCounters);
