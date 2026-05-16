import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ClientLayout } from './layouts/ClientLayout';
import { Login } from './pages/auth/Login';
import { Analytics, AuditLogs, Billing, CompanyProfile, Dashboard, KnowledgeBase, Notifications, ReportDetail, Reports, Requests, Team, TicketDetail, Tickets } from './pages/client/ClientPages';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/company" element={<CompanyProfile />} />
        <Route path="/team" element={<Team />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
