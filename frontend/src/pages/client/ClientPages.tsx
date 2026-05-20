import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { ScoreChart } from '../../components/ScoreChart';
import { StatCard } from '../../components/StatCard';
import { api } from '../../services/api';
import type { Dashboard as DashboardType } from '../../types';

function useDashboard() {
  const [data, setData] = useState<DashboardType | null>(null);
  useEffect(() => { api.get('/client/dashboard').then(({ data }) => setData(data)); }, []);
  return data;
}

export function Dashboard() {
  const data = useDashboard();
  if (!data) return <p>Loading dashboard...</p>;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-shield-glow">Client Dashboard</p>
        <h2 className="text-4xl font-extrabold">{data.company.name}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Security Score" value={`${data.summary.securityScore}/100`} />
        <StatCard label="Open Tickets" value={data.summary.openTickets} tone={data.summary.openTickets > 3 ? 'yellow' : 'green'} />
        <StatCard label="Active Requests" value={data.summary.activeRequests} />
        <StatCard label="Latest Reports" value={data.summary.latestReports} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ScoreChart data={data.scoreHistory} />
        <div className="glass rounded-2xl p-5">
          <h3 className="text-xl font-bold">Quick Actions</h3>
          <div className="mt-4 grid gap-3">
            <a href="/tickets" className="rounded-xl bg-white/10 p-4 hover:bg-white/15">Open support ticket</a>
            <a href="/requests" className="rounded-xl bg-white/10 p-4 hover:bg-white/15">Request a service</a>
            <a href="/reports" className="rounded-xl bg-white/10 p-4 hover:bg-white/15">View latest reports</a>
          </div>
        </div>
      </div>
      <DataTable rows={data.notifications} columns={[{ key: 'type', label: 'Type' }, { key: 'title', label: 'Title' }, { key: 'message', label: 'Message' }]} />
    </div>
  );
}

export function Reports() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get('/client/reports').then(({ data }) => setRows(data)); }, []);
  return <Page title="Document Center" subtitle="Filter, review, and download uploaded PDF reports."><div className="grid gap-4">{rows.map(report => <Link to={`/reports/${report.id}`} key={report.id} className="glass rounded-2xl p-5 hover:border-shield-glow"><h3 className="text-xl font-bold">{report.title}</h3><p className="mt-2 text-slate-300">{report.type} | {report.severity} | Uploaded by {report.uploadedBy}</p></Link>)}</div></Page>;
}

export function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  useEffect(() => { api.get(`/client/reports/${id}`).then(({ data }) => setReport(data)); }, [id]);
  return <Page title="Report Detail" subtitle="PDF metadata, severity, upload details, and secure download placeholder.">{report && <div className="glass rounded-2xl p-6"><h3 className="text-2xl font-bold">{report.title}</h3><p className="mt-3 text-slate-300">{report.description}</p><dl className="mt-6 grid gap-3 md:grid-cols-3"><div><dt className="text-slate-400">Type</dt><dd>{report.type}</dd></div><div><dt className="text-slate-400">Severity</dt><dd>{report.severity}</dd></div><div><dt className="text-slate-400">Uploaded By</dt><dd>{report.uploadedBy}</dd></div></dl><a href={report.filePath} className="mt-6 inline-flex rounded-full bg-shield-green px-5 py-3 font-bold">Download PDF</a></div>}</Page>;
}

export function Tickets() {
  const [rows, setRows] = useState<any[]>([]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.post('/client/tickets', Object.fromEntries(form.entries()));
    event.currentTarget.reset();
    api.get('/client/tickets').then(({ data }) => setRows(data));
  }
  useEffect(() => { api.get('/client/tickets').then(({ data }) => setRows(data)); }, []);
  return (
    <Page title="Ticketing System" subtitle="Create tickets and track status, priority, comments, and SLA work.">
      <FormCard onSubmit={create} button="Create ticket" fields={[['title', 'Title'], ['description', 'Description']]} selectName="priority" />
      <div className="grid gap-4">{rows.map(ticket => <Link to={`/tickets/${ticket.id}`} key={ticket.id} className="glass rounded-2xl p-5 hover:border-shield-glow"><h3 className="text-xl font-bold">{ticket.title}</h3><p className="mt-2 text-slate-300">{ticket.priority} | {ticket.status} | Updated {new Date(ticket.updatedAt).toLocaleString()}</p></Link>)}</div>
    </Page>
  );
}

export function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.post(`/client/tickets/${id}/comment`, { body: form.get('body') });
    event.currentTarget.reset();
    api.get(`/client/tickets/${id}`).then(({ data }) => setTicket(data));
  }
  useEffect(() => { api.get(`/client/tickets/${id}`).then(({ data }) => setTicket(data)); }, [id]);
  return <Page title="Ticket Detail" subtitle="Threaded comments, status tracking, priority, and ticket history.">{ticket && <div className="grid gap-5"><div className="glass rounded-2xl p-6"><h3 className="text-2xl font-bold">{ticket.title}</h3><p className="mt-3 text-slate-300">{ticket.description}</p><p className="mt-4 text-shield-glow">{ticket.priority} | {ticket.status}</p></div><div className="glass rounded-2xl p-6"><h3 className="font-bold">Comment Thread</h3><div className="mt-4 grid gap-3">{ticket.comments?.map((comment: any) => <div key={comment.id} className="rounded-xl bg-white/10 p-4"><p>{comment.body}</p><p className="mt-2 text-xs text-slate-400">{comment.user?.name} | {new Date(comment.createdAt).toLocaleString()}</p></div>)}</div><form onSubmit={addComment} className="mt-5 flex gap-3"><input name="body" className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3" placeholder="Add a comment" /><button className="rounded-full bg-shield-green px-5 py-3 font-bold">Send</button></form></div></div>}</Page>;
}

export function Requests() {
  const [rows, setRows] = useState<any[]>([]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.post('/client/requests', Object.fromEntries(form.entries()));
    event.currentTarget.reset();
    api.get('/client/requests').then(({ data }) => setRows(data));
  }
  useEffect(() => { api.get('/client/requests').then(({ data }) => setRows(data)); }, []);
  return (
    <Page title="Service Request Center" subtitle="Request penetration testing, response, assessment, forensics, and compliance work.">
      <form onSubmit={create} className="glass grid gap-4 rounded-2xl p-5 md:grid-cols-3">
        <select name="type" className="rounded-xl border border-white/10 bg-white/5 p-3"><option value="PENETRATION_TESTING">Penetration testing</option><option value="INCIDENT_RESPONSE">Incident response</option><option value="SECURITY_ASSESSMENT">Security assessment</option><option value="FORENSICS">Forensics</option><option value="COMPLIANCE_AUDIT">Compliance audit</option></select>
        <input name="description" placeholder="Request details" className="rounded-xl border border-white/10 bg-white/5 p-3" />
        <button className="rounded-full bg-shield-green px-5 py-3 font-bold">Submit request</button>
      </form>
      <DataTable rows={rows} columns={[{ key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'priority', label: 'Priority' }, { key: 'assignedAnalyst', label: 'Analyst' }]} />
    </Page>
  );
}

export function CompanyProfile() {
  const data = useDashboard();
  return <Page title="Company Profile" subtitle="Company information, assigned manager, plan, and security posture.">{data && <div className="glass rounded-2xl p-6"><h3 className="text-2xl font-bold">{data.company.name}</h3><p className="mt-2 text-slate-300">{data.company.industry} | {data.company.size}</p><p className="mt-4">{data.company.postureSummary}</p><p className="mt-4 text-shield-glow">Account Manager: {data.company.accountManager}</p></div>}</Page>;
}

export function Analytics() {
  const data = useDashboard();
  return <Page title="Reports & Analytics" subtitle="Security score history, vulnerability trends, incident timeline, risk heatmap, and compliance readiness.">{data && <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]"><ScoreChart data={data.scoreHistory} /><div className="grid gap-4"><StatCard label="Vulnerability Trend" value="Down 18%" /><StatCard label="Incident Timeline" value={`${data.tickets.length} events`} /><StatCard label="Compliance Readiness" value="82%" /></div><div className="glass rounded-2xl p-6 xl:col-span-2"><h3 className="text-xl font-bold">Risk Heatmap</h3><div className="mt-4 grid grid-cols-4 gap-3">{['Identity', 'Endpoint', 'Cloud', 'Network', 'Email', 'Data', 'Apps', 'People'].map((item, index) => <div key={item} className={`rounded-xl p-4 text-center ${index % 3 === 0 ? 'bg-red-500/25' : index % 2 === 0 ? 'bg-yellow-400/20' : 'bg-shield-green/25'}`}>{item}</div>)}</div></div></div>}</Page>;
}

export function Team() {
  const data = useDashboard();
  return <Page title="Team Management" subtitle="Add/remove members and control Viewer, Manager, Billing, and Security Lead access.">{data && <DataTable rows={data.company.users || []} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'teamRole', label: 'Team Role' }]} />}</Page>;
}

export function Billing() {
  const data = useDashboard();
  return <Page title="Billing & Subscription" subtitle="Current plan, renewal, payment history, invoices, and upgrade options.">{data && <div className="glass rounded-2xl p-6"><h3 className="text-2xl font-bold">{data.subscription?.plan}</h3><p className="mt-2 text-slate-300">Status: {data.subscription?.status}</p><p className="mt-2">Renewal: {new Date(data.subscription?.renewalDate).toLocaleDateString()}</p><button className="mt-5 rounded-full border border-white/15 px-5 py-3">Upgrade / Downgrade</button></div>}</Page>;
}

export function Notifications() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get('/client/notifications').then(({ data }) => setRows(data)); }, []);
  return <Page title="Notifications" subtitle="Ticket updates, report uploads, score changes, reminders, and messages."><DataTable rows={rows} columns={[{ key: 'type', label: 'Type' }, { key: 'title', label: 'Title' }, { key: 'message', label: 'Message' }, { key: 'createdAt', label: 'Date' }]} /></Page>;
}

export function AuditLogs() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get('/client/audit-logs').then(({ data }) => setRows(data)); }, []);
  return <Page title="Audit Logs" subtitle="Report views, downloads, ticket updates, team changes, and login history."><DataTable rows={rows} columns={[{ key: 'action', label: 'Action' }, { key: 'entityType', label: 'Entity' }, { key: 'ipAddress', label: 'IP' }, { key: 'createdAt', label: 'Date' }]} /></Page>;
}

export function KnowledgeBase() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get('/client/knowledge-base').then(({ data }) => setRows(data)); }, []);
  return <Page title="Knowledge Base" subtitle="Security guides, incident response playbooks, FAQs, and awareness materials."><div className="grid gap-4 md:grid-cols-3">{rows.map(article => <article key={article.id} className="glass rounded-2xl p-5"><p className="text-sm text-shield-glow">{article.category}</p><h3 className="mt-2 text-xl font-bold">{article.title}</h3><p className="mt-3 text-slate-300">{article.summary}</p></article>)}</div></Page>;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="space-y-6"><div><p className="text-shield-glow">NaijaShield Cyber Portal</p><h2 className="text-4xl font-extrabold">{title}</h2><p className="mt-2 text-slate-300">{subtitle}</p></div>{children}</div>;
}

function FormCard({ onSubmit, button, fields, selectName }: { onSubmit: any; button: string; fields: string[][]; selectName?: string }) {
  return <form onSubmit={onSubmit} className="glass grid gap-4 rounded-2xl p-5 md:grid-cols-4">{fields.map(([name, label]) => <input key={name} name={name} placeholder={label} className="rounded-xl border border-white/10 bg-white/5 p-3" />)}{selectName && <select name={selectName} className="rounded-xl border border-white/10 bg-white/5 p-3"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>}<button className="rounded-full bg-shield-green px-5 py-3 font-bold">{button}</button></form>;
}
