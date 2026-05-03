import { DocumentsTable } from '../../components/ui/DocumentsTable';
import { ProfilePanel } from '../../components/ui/ProfilePanel';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function AccountProfile() {
  const dashboard = useAsync(employeeService.dashboard, []);

  return (
    <div className="space-y-6">
      <ProfilePanel />
      {dashboard.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{dashboard.error}</div>}
      <DocumentsTable documents={dashboard.data?.documents || []} title="My Submitted Documents" description="Documents submitted by this account." />
    </div>
  );
}
