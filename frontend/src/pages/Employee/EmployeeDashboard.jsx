import { useEffect, useState } from 'react';
import { PieChartCard } from '../../components/charts/AnalyticsCharts';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';
import { formatMoney } from '../../utils/format';

export function EmployeeDashboard() {
  const [refresh, setRefresh] = useState(0);
  const [days, setDays] = useState('1');
  const dashboard = useAsync(() => employeeService.dashboard({ days }), [refresh, days]);
  const data = dashboard.data;
  const analysisStats = data?.analysis?.stats || {};
  const chartStats = Object.fromEntries(
    Object.entries(analysisStats).filter(([label]) => label !== 'Working Hours'),
  );

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
      <section className="card p-5">
        <label className="grid max-w-md gap-1.5 text-sm font-semibold text-slate-700">
          <span>Analysis Range</span>
          <select className="field" value={days} onChange={(event) => setDays(event.target.value)}>
            <option value="1">Current day</option>
            <option value="7">Current week</option>
            <option value="30">Current month</option>
          </select>
        </label>
      </section>
      {dashboard.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{dashboard.error}</div>}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Employee Code" value={data?.user?.employee_code || '-'} />
        <StatCard label="Salary" value={formatMoney(data?.user?.salary)} />
        <StatCard label="Working Hours" value={analysisStats['Working Hours'] ?? 0} />
      </div>
      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Today Attendance</h3>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Check In</span><strong className="block">{data?.attendance?.check_in || 'Pending'}</strong></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Check Out</span><strong className="block">{data?.attendance?.check_out || 'Pending'}</strong></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Hours</span><strong className="block">{data?.attendance?.total_hours || 0}</strong></div>
        </div>
      </section>
      <PieChartCard title="My Analysis" values={chartStats} />
    </div>
  );
}
