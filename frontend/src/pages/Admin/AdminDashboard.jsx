import { useState } from 'react';
import { BarChartCard, PieChartCard } from '../../components/charts/AnalyticsCharts';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/adminService';

export function AdminDashboard() {
  const [departmentId, setDepartmentId] = useState('');
  const analytics = useAsync(() => adminService.analytics(departmentId ? { department_id: departmentId } : {}), [departmentId]);
  const employees = useAsync(() => adminService.employees(departmentId ? { department_id: departmentId } : {}), [departmentId]);
  const departments = useAsync(adminService.departments, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Admin Dashboard</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Company Insights</h2>
      </div>
      <section className="card p-5">
        <label className="grid max-w-md gap-1.5 text-sm font-semibold text-slate-700">
          <span>Department Analysis</span>
          <select className="field" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            <option value="">All departments</option>
            {(departments.data?.items || []).map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </label>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Employees" value={employees.data?.total ?? 0} />
        <StatCard label="Departments" value={Object.keys(analytics.data?.departments || {}).length} />
        <StatCard label="Attendance Records" value={analytics.data?.attendance?.PRESENT ?? 0} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <PieChartCard title="Department Distribution" values={analytics.data?.departments} />
        <BarChartCard title="Salary Distribution" values={analytics.data?.salary_distribution} />
        <BarChartCard title="Age Group Analysis" values={analytics.data?.age_groups} />
        <PieChartCard title="Attendance Stats" values={analytics.data?.attendance} />
      </div>
    </div>
  );
}
