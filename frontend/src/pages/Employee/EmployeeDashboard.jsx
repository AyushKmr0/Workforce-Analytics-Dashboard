import { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function EmployeeDashboard() {
  const [refresh, setRefresh] = useState(0);
  const dashboard = useAsync(employeeService.dashboard, [refresh]);
  const data = dashboard.data;

  useEffect(() => {
    const reload = () => setRefresh((value) => value + 1);
    window.addEventListener('attendance-updated', reload);
    return () => window.removeEventListener('attendance-updated', reload);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Analysis</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">My Workspace Analysis</h2>
      </div>
      {dashboard.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{dashboard.error}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Employee Code" value={data?.user?.employee_code || '-'} />
        <StatCard label="Salary" value={`$${(data?.user?.salary || 0).toLocaleString()}`} />
        <StatCard label="Attendance" value={data?.attendance?.status || 'Not started'} />
      </div>
      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Today Attendance</h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Check In</span><strong className="block">{data?.attendance?.check_in || 'Pending'}</strong></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Check Out</span><strong className="block">{data?.attendance?.check_out || 'Pending'}</strong></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Hours</span><strong className="block">{data?.attendance?.total_hours || 0}</strong></div>
        </div>
      </section>
    </div>
  );
}
