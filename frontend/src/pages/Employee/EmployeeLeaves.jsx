import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function EmployeeLeaves() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [leave, setLeave] = useState({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });
  const dashboard = useAsync(employeeService.dashboard, [refresh]);

  const submitLeave = async (event) => {
    event.preventDefault();
    setBusyAction('leave');
    setMessage('');
    try {
      await employeeService.applyLeave(leave);
      setMessage('Leave request submitted. HR/Admin can review it.');
      showToast('Leave request submitted.');
      setLeave({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });
      setRefresh((value) => value + 1);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Leave request failed.';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Leaves</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">My Leave Requests</h2>
      </div>
      {message && <div className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-blue-700">{message}</div>}
      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Apply Leave</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submitLeave}>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>Leave Type</span>
            <select className="field" value={leave.leave_type} onChange={(e) => setLeave({ ...leave, leave_type: e.target.value })}>
              <option>Casual</option>
              <option>Sick</option>
              <option>Earned</option>
              <option>Unpaid</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>Start Date</span>
            <input className="field" type="date" value={leave.start_date} onChange={(e) => setLeave({ ...leave, start_date: e.target.value })} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>End Date</span>
            <input className="field" type="date" value={leave.end_date} onChange={(e) => setLeave({ ...leave, end_date: e.target.value })} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>Reason</span>
            <input className="field" placeholder="Reason for leave" value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} />
          </label>
          <button className="btn-primary md:col-span-2" disabled={Boolean(busyAction)}>{busyAction === 'leave' ? 'Submitting...' : 'Submit Leave'}</button>
        </form>
      </section>
      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Leave History</h3>
        <div className="mt-4 divide-y divide-slate-100">
          {(dashboard.data?.leaves || []).map((item) => (
            <div className="flex items-center justify-between py-3" key={item.id}>
              <div>
                <div className="font-bold">{item.leave_type}</div>
                <div className="text-sm text-slate-500">{item.start_date} to {item.end_date}</div>
              </div>
              <StatusBadge value={item.status} />
            </div>
          ))}
          {!(dashboard.data?.leaves || []).length && <div className="py-6 text-center text-sm font-semibold text-slate-500">No leave history found.</div>}
        </div>
      </section>
    </div>
  );
}
