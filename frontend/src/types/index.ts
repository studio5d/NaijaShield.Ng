export type Role = 'CLIENT' | 'ADMIN';
export type User = { id: string; name: string; email: string; role: Role; teamRole?: string; clientCompanyId?: string };
export type Company = { id: string; name: string; industry: string; size?: string; contactEmail: string; accountManager?: string; postureSummary?: string; users?: User[] };
export type Ticket = { id: string; title: string; description: string; priority: string; status: string; updatedAt: string; comments?: { id: string; body: string; createdAt: string; user: User }[] };
export type Report = { id: string; title: string; type: string; severity: string; uploadedBy: string; filePath: string; createdAt: string };
export type ServiceRequest = { id: string; type: string; status: string; priority: string; assignedAnalyst?: string; description: string; updatedAt: string };
export type Notification = { id: string; title: string; message: string; type: string; readAt?: string; createdAt: string };
export type Dashboard = {
  company: Company;
  reports: Report[];
  tickets: Ticket[];
  requests: ServiceRequest[];
  subscription: any;
  scoreHistory: { id: string; score: number; calculatedAt: string }[];
  notifications: Notification[];
  summary: { securityScore: number; openTickets: number; activeRequests: number; latestReports: number; alerts: Notification[] };
};
