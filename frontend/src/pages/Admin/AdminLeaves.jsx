import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { adminService } from '../../services/adminService';

export function AdminLeaves() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const leaves = useAsync(() => adminService.leaves(), [refresh]);

  const review = async (id, status) => {
    try {
      await adminService.reviewLeave(id, status);
      showToast(`Leave ${status.toLowerCase()} successfully.`);
      setRefresh((value) => value + 1);
    } catch (error) {
      showToast(error.response?.data?.message || 'Leave review failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Leaves</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Company Leave Requests</h2>
      </div>
      {leaves.error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{leaves.error}</div>}
      <section className="card p-5">
        <div className="divide-y divide-slate-100">
          {(leaves.data?.items || []).map((leave) => (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={leave.id}>
              <div>
                <div className="font-bold">{leave.employee?.name}</div>
                <div className="text-sm text-slate-500">{leave.leave_type} · {leave.start_date} to {leave.end_date}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={leave.status} />
                {leave.status === 'PENDING' && <button className="btn-secondary" onClick={() => review(leave.id, 'APPROVED')} type="button">Approve</button>}
                {leave.status === 'PENDING' && <button className="btn-secondary" onClick={() => review(leave.id, 'REJECTED')} type="button">Reject</button>}
              </div>
            </div>
          ))}
          {!(leaves.data?.items || []).length && <div className="py-6 text-center text-sm font-semibold text-slate-500">No leave requests found.</div>}
        </div>
      </section>
    </div>
  );
}
