import { Bell, BookOpen, Building2, ChartNoAxesCombined, ClipboardList, CreditCard, FileText, LayoutDashboard, LogOut, ShieldAlert, Ticket, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const items = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Reports', '/reports', FileText],
  ['Tickets', '/tickets', Ticket],
  ['Service Requests', '/requests', ShieldAlert],
  ['Analytics', '/analytics', ChartNoAxesCombined],
  ['Company Profile', '/company', Building2],
  ['Team', '/team', Users],
  ['Billing', '/billing', CreditCard],
  ['Notifications', '/notifications', Bell],
  ['Audit Logs', '/audit-logs', ClipboardList],
  ['Knowledge Base', '/knowledge-base', BookOpen]
] as const;

export function ClientLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-white/10 bg-shield-deep/80 p-6">
        <a href="/" className="text-2xl font-extrabold text-shield-glow">NaijaShield</a>
        <p className="mt-2 text-sm text-slate-400">Cyber Portal</p>
        <nav className="mt-8 grid gap-2">
          {items.map(([label, href, Icon]) => (
            <NavLink key={href} to={href} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${isActive ? 'bg-shield-green text-white' : 'text-slate-300 hover:bg-white/10'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-shield-navy/85 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-sm text-slate-400">Signed in as</p>
            <h1 className="font-semibold">{user?.name}</h1>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10"><LogOut size={16} /> Sign out</button>
        </header>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
