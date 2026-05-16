import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { WorkReportDetails } from '../../components/ui/WorkReportDetails';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function EmployeeWorkReport() {
  const { showToast } = useToast();
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [workReport, setWorkReport] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    completed_work: '',
    pending_work: '',
    completion_percent: 0,
  });
  const reports = useAsync(employeeService.workReports, [refresh]);

  const submitWorkReport = async (event) => {
    event.preventDefault();
    setBusyAction('work-report');
    setMessage('');
    try {
      await employeeService.submitWorkReport(workReport);
      setMessage('Daily work report submitted successfully.');
      showToast('Daily work report submitted.');
      setWorkReport({
        report_date: new Date().toISOString().slice(0, 10),
        completed_work: '',
        pending_work: '',
        completion_percent: 0,
      });
      setRefresh((value) => value + 1);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Daily work report failed.';
      setMessage(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Work Report</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Daily Work Report</h2>
      </div>
      {message && <div className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-blue-700">{message}</div>}
      <section className="card p-5">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submitWorkReport}>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>Report Date</span>
            <input className="field" type="date" value={workReport.report_date} onChange={(event) => setWorkReport({ ...workReport, report_date: event.target.value })} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            <span>Completion %</span>
            <input className="field" type="number" min="0" max="100" value={workReport.completion_percent} onChange={(event) => setWorkReport({ ...workReport, completion_percent: event.target.value })} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
            <span>Completed Work</span>
            <textarea className="field" rows="3" value={workReport.completed_work} onChange={(event) => setWorkReport({ ...workReport, completed_work: event.target.value })} required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-2">
            <span>Pending Work</span>
            <textarea className="field" rows="3" value={workReport.pending_work} onChange={(event) => setWorkReport({ ...workReport, pending_work: event.target.value })} />
          </label>
          <button className="btn-primary md:col-span-2" disabled={Boolean(busyAction)}>{busyAction === 'work-report' ? 'Submitting...' : 'Submit Work Report'}</button>
        </form>
      </section>
      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Work Report History</h3>
        {reports.error && <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{reports.error}</div>}
        <div className="mt-4 divide-y divide-slate-100">
          {(reports.data?.items || []).map((item) => (
            <button className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-blue-50/50" key={item.id} onClick={() => setSelectedReport(item)} type="button">
              <div>
                <div className="font-bold text-slate-950">{item.report_date}</div>
                <div className="line-clamp-1 text-sm text-slate-500">{item.completed_work}</div>
              </div>
              <div className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                {item.completion_percent}%
              </div>
            </button>
          ))}
          {!(reports.data?.items || []).length && <div className="py-6 text-center text-sm font-semibold text-slate-500">No work report history found.</div>}
        </div>
      </section>
      {selectedReport && (
        <Modal title="Work Report Details" onClose={() => setSelectedReport(null)}>
          <WorkReportDetails report={selectedReport} />
        </Modal>
      )}
    </div>
  );
}
