import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services/employeeService';

export function EmployeeWorkReport() {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [workReport, setWorkReport] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    completed_work: '',
    pending_work: '',
    completion_percent: 0,
  });

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
    </div>
  );
}
