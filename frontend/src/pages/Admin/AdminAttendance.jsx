import { useEffect, useState } from 'react';
import { AttendanceTable } from '../../components/ui/AttendanceTable';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/adminService';

const ranges = [
  { label: '1D', days: 1 },
  { label: '2D', days: 2 },
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
];

export function AdminAttendance() {
  const [attendanceRefresh, setAttendanceRefresh] = useState(0);
  const [days, setDays] = useState(1);
  const [departmentId, setDepartmentId] = useState('');
  const attendance = useAsync(
    () => adminService.attendance({ days, ...(departmentId ? { department_id: departmentId } : {}) }),
    [days, departmentId, attendanceRefresh],
  );
  const departments = useAsync(adminService.departments, []);
  const summary = attendance.data?.summary;

  useEffect(() => {
    const reloadAttendance = () => setAttendanceRefresh((value) => value + 1);
    window.addEventListener('attendance-updated', reloadAttendance);
    return () => window.removeEventListener('attendance-updated', reloadAttendance);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Operations</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Attendance Analysis</h2>
      </div>
      {attendance.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{attendance.error}</div>}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Attendance Analysis</h3>
            <p className="text-sm text-slate-500">{summary?.start_date || '-'} to {summary?.end_date || '-'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="field w-auto min-w-52" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">All departments</option>
              {(departments.data?.items || []).map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            {ranges.map((range) => (
              <button key={range.days} type="button" className={days === range.days ? 'btn-primary px-3 py-2' : 'btn-secondary px-3 py-2'} onClick={() => setDays(range.days)}>
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <StatCard label="Average Attendance" value={`${summary?.average_attendance ?? 0}%`} />
          <StatCard label="Average Hours" value={summary?.average_hours ?? 0} />
          <StatCard label="People Tracked" value={summary?.people ?? 0} />
          <StatCard label="Records" value={`${summary?.records ?? 0}/${summary?.expected_records ?? 0}`} />
        </div>
      </section>
      <AttendanceTable records={attendance.data?.items || []} title="Company Attendance" />
    </div>
  );
}
