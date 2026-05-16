import { useState } from 'react';
import { Modal } from './Modal';

export function ProfileChangeReview({ requests = [], onReview, title }) {
  const [confirmReview, setConfirmReview] = useState(null);

  return (
    <section className="card p-5">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Changes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3 font-semibold">
                  <div>{request.employee?.name}</div>
                  <div className="text-xs font-bold text-slate-500">ID: {request.employee?.employee_code || request.user_id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="grid gap-2">
                    {changedEntries(request).map(([key, value]) => (
                      <ChangeItem key={key} fieldKey={key} previous={request.employee?.[key]} requested={value} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{request.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary px-3 py-2 text-emerald-700" onClick={() => setConfirmReview({ request, status: 'APPROVED' })}>Approve</button>
                    <button className="btn-secondary px-3 py-2 text-rose-700" onClick={() => setConfirmReview({ request, status: 'REJECTED' })}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr><td className="px-4 py-6 text-center text-slate-500" colSpan="4">No profile change requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {confirmReview && (
        <Modal
          title={`${confirmReview.status === 'APPROVED' ? 'Approve' : 'Reject'} Profile Change`}
          onClose={() => setConfirmReview(null)}
          footer={(
            <>
              <button className="btn-secondary" onClick={() => setConfirmReview(null)} type="button">Cancel</button>
              <button
                className="btn-primary"
                onClick={() => {
                  onReview(confirmReview.request.id, confirmReview.status);
                  setConfirmReview(null);
                }}
                type="button"
              >
                Confirm
              </button>
            </>
          )}
        >
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-slate-600">
              Review changes for <strong>{confirmReview.request.employee?.name}</strong>.
            </p>
            {changedEntries(confirmReview.request).map(([key, value]) => (
              <ChangeItem key={key} fieldKey={key} previous={confirmReview.request.employee?.[key]} requested={value} />
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

function changedEntries(request) {
  return Object.entries(request.requested_changes || {}).filter(([key, value]) => {
    const previous = request.employee?.[key] || '';
    const requested = value || '';
    return String(previous) !== String(requested);
  });
}

function ChangeItem({ fieldKey, previous, requested }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
      <div className="text-xs font-black uppercase tracking-wide text-amber-700">{labelFor(fieldKey)}</div>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md bg-white/80 p-2">
          <span className="block text-xs font-bold text-slate-500">Previous</span>
          <strong className="break-words text-slate-800">{displayValue(previous)}</strong>
        </div>
        <div className="rounded-md bg-emerald-50 p-2 ring-1 ring-emerald-200">
          <span className="block text-xs font-bold text-emerald-700">Requested</span>
          <strong className="break-words text-emerald-900">{displayValue(requested)}</strong>
        </div>
      </div>
    </div>
  );
}

function labelFor(key) {
  return key.replaceAll('_', ' ');
}

function displayValue(value) {
  if (!value) return '-';
  if (String(value).startsWith('http')) return 'Uploaded file';
  return value;
}
