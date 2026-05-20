import argon2 from 'argon2';
import { PrismaClient, Priority, ReportSeverity, Role, ServiceRequestType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await argon2.hash('admin123');
  const clientHash = await argon2.hash('client123');

  const company = await prisma.clientCompany.upsert({
    where: { id: 'demo-company' },
    update: {},
    create: {
      id: 'demo-company',
      name: 'Lagos FinTech Group',
      industry: 'Financial Services',
      size: '250-500',
      contactEmail: 'security@lagosfintech.example',
      accountManager: 'Amina Yusuf',
      postureSummary: 'Strong perimeter controls with active cloud hardening work.'
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@naijashield.ng' },
    update: {},
    create: { email: 'admin@naijashield.ng', passwordHash: adminHash, role: Role.ADMIN, name: 'NaijaShield Admin' }
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: clientHash,
      role: Role.CLIENT,
      teamRole: 'SECURITY_LEAD',
      name: 'Demo Client',
      clientCompanyId: company.id
    }
  });

  await prisma.ticket.createMany({
    skipDuplicates: true,
    data: [
      { id: 'ticket-1', clientCompanyId: company.id, createdByUserId: client.id, title: 'Suspicious login alerts', description: 'Multiple failed login attempts from unusual locations.', priority: Priority.HIGH },
      { id: 'ticket-2', clientCompanyId: company.id, createdByUserId: client.id, title: 'Firewall policy review', description: 'Need review before new branch launch.', priority: Priority.MEDIUM, status: 'IN_PROGRESS' }
    ]
  });

  await prisma.serviceRequest.create({
    data: {
      clientCompanyId: company.id,
      type: ServiceRequestType.PENETRATION_TESTING,
      description: 'Quarterly web application penetration test.',
      priority: Priority.HIGH,
      assignedAnalyst: 'Chinedu Okafor',
      timeline: [{ label: 'Scoping', status: 'complete' }, { label: 'Testing', status: 'active' }],
      deliverables: [{ name: 'Executive report', status: 'pending' }]
    }
  });

  await prisma.report.create({
    data: {
      clientCompanyId: company.id,
      title: 'Q2 Security Assessment',
      description: 'Executive risk summary and remediation plan.',
      type: 'Security Assessment',
      severity: ReportSeverity.MEDIUM,
      filePath: '/uploads/reports/demo-q2-assessment.pdf',
      uploadedBy: 'NaijaShield Admin'
    }
  });

  await prisma.securityScoreHistory.createMany({
    data: [61, 68, 73, 79, 84].map((score, index) => ({
      clientCompanyId: company.id,
      score,
      notes: `Monthly security posture checkpoint ${index + 1}`,
      calculatedAt: new Date(Date.now() - (5 - index) * 30 * 24 * 60 * 60 * 1000)
    }))
  });

  await prisma.subscription.create({
    data: {
      clientCompanyId: company.id,
      plan: 'ShieldEnterprise',
      renewalDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      paymentHistory: [{ date: '2026-01-15', amount: 2500000, status: 'paid' }],
      invoices: [{ number: 'INV-2026-001', filePath: '/uploads/reports/invoice-placeholder.pdf' }]
    }
  });

  await prisma.notification.createMany({
    data: [
      { clientCompanyId: company.id, userId: client.id, type: 'REPORT_UPLOAD', title: 'New report uploaded', message: 'Q2 Security Assessment is ready.' },
      { clientCompanyId: company.id, userId: client.id, type: 'TICKET_UPDATE', title: 'Ticket updated', message: 'Firewall policy review moved to in progress.' }
    ]
  });

  await prisma.knowledgeBaseArticle.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Phishing Response Checklist', slug: 'phishing-response-checklist', category: 'Incident Response', summary: 'Steps to contain suspected phishing.', body: 'Preserve evidence, reset affected passwords, block indicators, and notify NaijaShield SOC.', tags: ['phishing', 'incident'] },
      { title: 'Security Awareness Basics', slug: 'security-awareness-basics', category: 'Training', summary: 'Daily habits that reduce cyber risk.', body: 'Use MFA, verify links, report suspicious emails, and keep software updated.', tags: ['training', 'awareness'] }
    ]
  });
}

main().finally(async () => prisma.$disconnect());
