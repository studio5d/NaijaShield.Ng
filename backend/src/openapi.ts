export const openApiSpec = {
  openapi: '3.0.0',
  info: { title: 'NaijaShield Cyber Portal API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:5051' }],
  paths: {
    '/auth/login': { post: { summary: 'Login and receive access token' } },
    '/auth/refresh': { post: { summary: 'Refresh access token from HTTP-only cookie' } },
    '/auth/logout': { post: { summary: 'Clear refresh cookie' } },
    '/auth/me': { get: { summary: 'Current user profile' } },
    '/client/dashboard': { get: { summary: 'Client dashboard summary' } },
    '/client/reports': { get: { summary: 'List client PDF reports' } },
    '/client/reports/{id}': { get: { summary: 'Report detail' } },
    '/client/tickets': { get: { summary: 'List tickets' }, post: { summary: 'Create ticket' } },
    '/client/tickets/{id}': { get: { summary: 'Ticket detail' } },
    '/client/tickets/{id}/comment': { post: { summary: 'Add ticket comment' } },
    '/client/requests': { get: { summary: 'List service requests' }, post: { summary: 'Create service request' } },
    '/client/security-score/history': { get: { summary: 'Security score history' } },
    '/client/subscription': { get: { summary: 'Subscription and billing data' } },
    '/client/notifications': { get: { summary: 'Notifications' } },
    '/client/audit-logs': { get: { summary: 'Client audit logs' } },
    '/client/knowledge-base': { get: { summary: 'Knowledge base articles' } },
    '/admin/clients': { get: { summary: 'Admin client list' } },
    '/admin/clients/{id}/reports': { post: { summary: 'Upload PDF report for client' } }
  }
};
