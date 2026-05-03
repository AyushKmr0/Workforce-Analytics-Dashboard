export function ProfileChangeReview({ requests = [], onReview, title }) {
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
                <td className="px-4 py-3 font-semibold">{request.employee?.name}</td>
                <td className="px-4 py-3">
                  {Object.entries(request.requested_changes || {}).map(([key, value]) => (
                    <div key={key}><strong>{key}:</strong> {value || '-'}</div>
                  ))}
                </td>
                <td className="px-4 py-3">{request.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="btn-secondary px-3 py-2 text-emerald-700" onClick={() => onReview(request.id, 'APPROVED')}>Approve</button>
                    <button className="btn-secondary px-3 py-2 text-rose-700" onClick={() => onReview(request.id, 'REJECTED')}>Reject</button>
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
    </section>
  );
}
