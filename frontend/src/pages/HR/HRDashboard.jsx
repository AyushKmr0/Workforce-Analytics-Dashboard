import { useState } from 'react';
import { BarChartCard, PieChartCard } from '../../components/charts/AnalyticsCharts';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

export function HRDashboard() {
  const [days, setDays] = useState('1');
  const analytics = useAsync(() => hrService.analytics({ days }), [days]);
  const employees = useAsync(() => hrService.employees(), []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">HR Dashboard</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Analytics Overview</h2>
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Team Members" value={employees.data?.total ?? 0} />
        <StatCard label="Present Records" value={analytics.data?.attendance?.PRESENT ?? 0} />
        <StatCard label="Absent Records" value={analytics.data?.attendance?.ABSENT ?? 0} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <BarChartCard title="Age Group Analysis" values={analytics.data?.age_groups} />
        <PieChartCard title="Attendance Stats" values={analytics.data?.attendance} />
      </div>
    </div>
  );
}
