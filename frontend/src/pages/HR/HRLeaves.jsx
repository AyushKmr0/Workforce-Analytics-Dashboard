import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

export function HRLeaves() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [confirmReview, setConfirmReview] = useState(null);
  const leaves = useAsync(() => hrService.leaves(), [refresh]);

  const review = async (id, status) => {
    try {
      await hrService.reviewLeave(id, status);
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
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Department Leave Requests</h2>
      </div>
      <section className="card p-5">
        <div className="divide-y divide-slate-100">
          {(leaves.data?.items || []).map((leave) => (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={leave.id}>
              <button className="text-left" onClick={() => setSelectedLeave(leave)} type="button">
                <div className="font-bold">{leave.employee?.name}</div>
                <div className="text-xs font-bold text-slate-400">ID: {leave.employee?.employee_code || leave.user_id}</div>
                <div className="text-sm text-slate-500">{leave.leave_type} · {leave.start_date} to {leave.end_date}</div>
              </button>
              <div className="flex items-center gap-2">
                <StatusBadge value={leave.status} />
                {leave.status === 'PENDING' && <button className="btn-secondary" onClick={() => setConfirmReview({ leave, status: 'APPROVED' })} type="button">Approve</button>}
                {leave.status === 'PENDING' && <button className="btn-secondary" onClick={() => setConfirmReview({ leave, status: 'REJECTED' })} type="button">Reject</button>}
              </div>
            </div>
          ))}
          {!(leaves.data?.items || []).length && <div className="py-6 text-center text-sm font-semibold text-slate-500">No leave requests found.</div>}
        </div>
      </section>
      {selectedLeave && (
        <Modal title="Leave Request Details" onClose={() => setSelectedLeave(null)}>
          <LeaveDetails leave={selectedLeave} />
        </Modal>
      )}
      {confirmReview && (
        <Modal
          title={`${confirmReview.status === 'APPROVED' ? 'Approve' : 'Reject'} Leave`}
          onClose={() => setConfirmReview(null)}
          footer={(
            <>
              <button className="btn-secondary" onClick={() => setConfirmReview(null)} type="button">Cancel</button>
              <button className="btn-primary" onClick={() => { review(confirmReview.leave.id, confirmReview.status); setConfirmReview(null); }} type="button">Confirm</button>
            </>
          )}
        >
          <LeaveDetails leave={confirmReview.leave} />
        </Modal>
      )}
    </div>
  );
}

function LeaveDetails({ leave }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      <Detail label="Employee" value={leave.employee?.name || '-'} />
      <Detail label="Employee ID" value={leave.employee?.employee_code || leave.user_id || '-'} />
      <Detail label="Type" value={leave.leave_type} />
      <Detail label="Start Date" value={leave.start_date} />
      <Detail label="End Date" value={leave.end_date} />
      <Detail label="Status" value={leave.status} />
      <div className="sm:col-span-2">
        <Detail label="Reason" value={leave.reason || '-'} />
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 break-words font-semibold text-slate-950">{value}</div>
    </div>
  );
}
