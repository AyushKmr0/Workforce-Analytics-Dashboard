import { useEffect, useState } from 'react';
import { AttendanceTable } from '../../components/ui/AttendanceTable';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

const ranges = [
  { label: '1D', days: 1 },
  { label: '2D', days: 2 },
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
];

export function HRAttendance() {
  const [attendanceRefresh, setAttendanceRefresh] = useState(0);
  const [days, setDays] = useState(1);
  const attendance = useAsync(() => hrService.attendance({ days }), [days, attendanceRefresh]);
  const summary = attendance.data?.summary;

  useEffect(() => {
    const reloadAttendance = () => setAttendanceRefresh((value) => value + 1);
    window.addEventListener('attendance-updated', reloadAttendance);
    return () => window.removeEventListener('attendance-updated', reloadAttendance);
  }, []);

  return (
    <div className="space-y-6">
      {attendance.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{attendance.error}</div>}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Department Attendance Analysis</h3>
            <p className="text-sm text-slate-500">{summary?.start_date || '-'} to {summary?.end_date || '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
      <AttendanceTable records={attendance.data?.items || []} title="Department Attendance" />
    </div>
  );
}
