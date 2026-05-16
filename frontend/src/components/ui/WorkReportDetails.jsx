export function WorkReportDetails({ report }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2">
      {report.employee && <Detail label="Employee" value={`${report.employee.name} (${report.employee.employee_code || report.user_id})`} />}
      <Detail label="Report Date" value={report.report_date} />
      <Detail label="Completion" value={`${report.completion_percent}%`} />
      <Detail label="Submitted At" value={report.created_at || '-'} />
      <Detail label="Last Updated" value={report.updated_at || '-'} />
      <div className="sm:col-span-2">
        <Detail label="Completed Work" value={report.completed_work || '-'} />
      </div>
      <div className="sm:col-span-2">
        <Detail label="Pending Work" value={report.pending_work || '-'} />
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 whitespace-pre-wrap break-words font-semibold text-slate-950">{value}</div>
    </div>
  );
}
