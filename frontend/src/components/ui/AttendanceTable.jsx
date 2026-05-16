import { StatusBadge } from './StatusBadge';

export function AttendanceTable({ records = [], title = 'Attendance Records' }) {
  return (
    <section className="card p-5">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold">{record.employee?.name || 'Me'}</div>
                  {record.employee && <div className="text-xs font-bold text-slate-500">ID: {record.employee.employee_code || record.user_id}</div>}
                </td>
                <td className="px-4 py-3">{record.date}</td>
                <td className="px-4 py-3">{record.check_in || 'Pending'}</td>
                <td className="px-4 py-3">{record.check_out || 'Pending'}</td>
                <td className="px-4 py-3">{record.total_hours || 0}</td>
                <td className="px-4 py-3"><StatusBadge value={record.status} /></td>
              </tr>
            ))}
            {!records.length && (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan="6">No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
