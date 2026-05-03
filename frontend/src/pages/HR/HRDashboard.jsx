import { BarChartCard } from '../../components/charts/AnalyticsCharts';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

export function HRDashboard() {
  const analytics = useAsync(hrService.analytics, []);
  const employees = useAsync(() => hrService.employees(), []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">HR Dashboard</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Analytics Overview</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Team Members" value={employees.data?.total ?? 0} />
        <StatCard label="Present Records" value={analytics.data?.attendance?.PRESENT ?? 0} />
        <StatCard label="Age Groups" value={Object.keys(analytics.data?.age_groups || {}).length} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <BarChartCard title="Age Group Analysis" values={analytics.data?.age_groups} />
        <BarChartCard title="Attendance Stats" values={analytics.data?.attendance} />
      </div>
    </div>
  );
}
