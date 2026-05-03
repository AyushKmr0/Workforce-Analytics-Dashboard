import { useState } from 'react';
import { ProfileChangePanel } from '../../components/ui/ProfileChangePanel';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function AccountEditProfile() {
  const [refresh, setRefresh] = useState(0);
  const dashboard = useAsync(employeeService.dashboard, [refresh]);

  return (
    <div className="space-y-6">
      <ProfileChangePanel activeTab="profile" data={dashboard.data} onRefresh={() => setRefresh((value) => value + 1)} />
    </div>
  );
}
