const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5050;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'data', 'db.json');
const sessions = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function getAuthUser(req, db) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = sessions.get(token);
  if (!userId) return null;
  return db.users.find(user => user.id === userId) || null;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId
  };
}

function companyScope(db, user) {
  if (user.role === 'admin') return db.companies;
  return db.companies.filter(company => company.id === user.companyId);
}

function scopedItems(db, collection, user) {
  if (user.role === 'admin') return db[collection];
  return db[collection].filter(item => item.companyId === user.companyId);
}

function buildDashboard(db, user) {
  const companies = companyScope(db, user);
  const companyIds = new Set(companies.map(company => company.id));
  const requests = scopedItems(db, 'requests', user);
  const tickets = scopedItems(db, 'tickets', user);
  const reports = scopedItems(db, 'reports', user);
  const activity = scopedItems(db, 'activity', user).slice(-8).reverse();
  const averageScore = companies.length
    ? Math.round(companies.reduce((sum, company) => sum + company.securityScore, 0) / companies.length)
    : 0;

  return {
    user: publicUser(user),
    companies,
    requests,
    tickets,
    reports,
    activity,
    metrics: {
      companies: companies.length,
      protectedClients: companies.length,
      securityScore: averageScore,
      openTickets: tickets.filter(ticket => ticket.status !== 'Closed').length,
      activeRequests: requests.filter(request => request.status !== 'Completed').length,
      readyReports: reports.filter(report => report.status === 'Ready').length,
      monitoredPlans: companies.filter(company => companyIds.has(company.id)).length
    }
  };
}

function requireAuth(req, res, db) {
  const user = getAuthUser(req, db);
  if (!user) {
    sendJson(res, 401, { error: 'Authentication required' });
    return null;
  }
  return user;
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

async function handleApi(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const body = await parseBody(req);
      const user = db.users.find(item =>
        item.email.toLowerCase() === String(body.email || '').toLowerCase() &&
        item.password === String(body.password || '')
      );
      if (!user) return sendJson(res, 401, { error: 'Invalid email or password' });
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, user.id);
      return sendJson(res, 200, { token, user: publicUser(user) });
    }

    if (req.method === 'POST' && url.pathname === '/api/register') {
      const body = await parseBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const companyName = String(body.companyName || '').trim();
      const industry = String(body.industry || 'General').trim();

      if (!name || !email || !password || !companyName) {
        return sendJson(res, 400, { error: 'Name, email, password, and company are required' });
      }
      if (password.length < 6) {
        return sendJson(res, 400, { error: 'Password must be at least 6 characters' });
      }
      if (db.users.some(user => user.email.toLowerCase() === email)) {
        return sendJson(res, 409, { error: 'Email is already registered' });
      }

      const company = {
        id: makeId('c'),
        name: companyName,
        industry,
        plan: 'ShieldStart',
        securityScore: 50,
        compliance: 'Onboarding',
        nextReview: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      };
      const user = {
        id: makeId('u'),
        name,
        email,
        password,
        role: 'client',
        companyId: company.id
      };
      db.companies.push(company);
      db.users.push(user);
      db.activity.push({
        id: makeId('a'),
        companyId: company.id,
        message: 'Client onboarding account created.',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });
      writeDb(db);

      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, user.id);
      return sendJson(res, 201, { token, user: publicUser(user) });
    }

    if (req.method === 'POST' && url.pathname === '/api/logout') {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      sessions.delete(token);
      return sendJson(res, 200, { ok: true });
    }

    const user = requireAuth(req, res, db);
    if (!user) return;

    if (req.method === 'GET' && url.pathname === '/api/dashboard') {
      return sendJson(res, 200, buildDashboard(db, user));
    }

    if (req.method === 'POST' && url.pathname === '/api/requests') {
      const body = await parseBody(req);
      const companyId = user.role === 'admin' ? body.companyId : user.companyId;
      if (!companyId || !body.service || !body.summary) {
        return sendJson(res, 400, { error: 'Company, service, and summary are required' });
      }
      const request = {
        id: makeId('r'),
        companyId,
        service: String(body.service),
        priority: String(body.priority || 'Medium'),
        status: 'New',
        summary: String(body.summary),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      db.requests.push(request);
      db.activity.push({
        id: makeId('a'),
        companyId,
        message: `New ${request.service} request submitted.`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });
      writeDb(db);
      return sendJson(res, 201, request);
    }

    if (req.method === 'POST' && url.pathname === '/api/tickets') {
      const body = await parseBody(req);
      const companyId = user.role === 'admin' ? body.companyId : user.companyId;
      if (!companyId || !body.subject || !body.message) {
        return sendJson(res, 400, { error: 'Company, subject, and message are required' });
      }
      const ticket = {
        id: makeId('t'),
        companyId,
        subject: String(body.subject),
        status: 'Open',
        severity: String(body.severity || 'Low'),
        message: String(body.message),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      db.tickets.push(ticket);
      db.activity.push({
        id: makeId('a'),
        companyId,
        message: `Support ticket opened: ${ticket.subject}.`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });
      writeDb(db);
      return sendJson(res, 201, ticket);
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/tickets/')) {
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin access required' });
      const id = url.pathname.split('/').pop();
      const body = await parseBody(req);
      const ticket = db.tickets.find(item => item.id === id);
      if (!ticket) return sendJson(res, 404, { error: 'Ticket not found' });
      ticket.status = String(body.status || ticket.status);
      writeDb(db);
      return sendJson(res, 200, ticket);
    }

    sendJson(res, 404, { error: 'API route not found' });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (fallbackError, fallbackBuffer) => {
        if (fallbackError) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
        res.end(fallbackBuffer);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(buffer);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`NaijaShield Portal running at http://127.0.0.1:${PORT}`);
});
