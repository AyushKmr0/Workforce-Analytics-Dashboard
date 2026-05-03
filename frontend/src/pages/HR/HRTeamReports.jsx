import { useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

const reportRanges = [
  { label: '1D', days: 1 },
  { label: '2D', days: 2 },
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
];

export function HRTeamReports() {
  const [workDays, setWorkDays] = useState(1);
  const workReports = useAsync(() => hrService.workReports({ days: workDays }), [workDays]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Team Reports</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Department Work Reports</h2>
      </div>
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{workReports.data?.summary?.start_date || '-'} to {workReports.data?.summary?.end_date || '-'}</p>
          <div className="flex flex-wrap gap-2">
            {reportRanges.map((range) => (
              <button key={range.days} type="button" className={workDays === range.days ? 'btn-primary px-3 py-2' : 'btn-secondary px-3 py-2'} onClick={() => setWorkDays(range.days)}>
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <StatCard label="Average Completion" value={`${workReports.data?.summary?.average_completion ?? 0}%`} />
          <StatCard label="Reports Submitted" value={`${workReports.data?.summary?.records ?? 0}/${workReports.data?.summary?.expected_records ?? 0}`} />
          <StatCard label="Pending Items" value={workReports.data?.summary?.pending_records ?? 0} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Complete</th>
                <th className="px-4 py-3">Completed Work</th>
                <th className="px-4 py-3">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(workReports.data?.items || []).map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3 font-semibold">{report.employee?.name}</td>
                  <td className="px-4 py-3">{report.report_date}</td>
                  <td className="px-4 py-3">{report.completion_percent}%</td>
                  <td className="max-w-md px-4 py-3">{report.completed_work}</td>
                  <td className="max-w-md px-4 py-3">{report.pending_work || '-'}</td>
                </tr>
              ))}
              {!(workReports.data?.items || []).length && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan="5">No work reports found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
