import { useRef, useState } from 'react';
import { EmployeeTable } from '../../components/ui/EmployeeTable';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';
import { formatMoney } from '../../utils/format';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  salary: '',
  phone_number: '',
  date_of_birth: '',
  joining_date: '',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  profile_image: null,
  document: null,
};

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}<span className="text-rose-600"> *</span></span>
      {children}
    </label>
  );
}

function toEmployeeFormData(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  return formData;
}

export function HRPeople() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [params, setParams] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const profileImageRef = useRef(null);
  const documentRef = useRef(null);
  const employees = useAsync(() => hrService.employees(params), [params]);

  const resetForm = () => {
    setForm(emptyForm);
    if (profileImageRef.current) profileImageRef.current.value = '';
    if (documentRef.current) documentRef.current.value = '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setConfirmCreate(true);
  };

  const createEmployee = async () => {
    setSubmitting(true);
    try {
      await hrService.createEmployee(toEmployeeFormData(form));
      showToast('Employee created successfully.');
      resetForm();
      setParams({ ...params });
    } catch (error) {
      showToast(error.response?.data?.message || 'Employee creation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">People</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Department Employees</h2>
      </div>
      <section className="card p-5">
        <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); setParams({ search }); }}>
          <input className="field min-w-72 flex-1" placeholder="Search department employees" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-primary">Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setParams({}); }}>Clear</button>
        </form>
      </section>
      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Add Department Employee</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">Department: {user?.department?.name || 'Assigned department'}</p>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submit}>
          <Field label="Full Name">
            <input className="field" placeholder="Employee full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Email Address">
            <input className="field" type="email" placeholder="employee@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Login Password">
            <input className="field" type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </Field>
          <Field label="Salary">
            <input className="field" type="number" step="0.01" placeholder="Monthly or annual salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} required />
          </Field>
          <Field label="Phone Number">
            <input className="field" type="tel" placeholder="+91 98765 43210" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} required />
          </Field>
          <Field label="Date of Birth">
            <input className="field" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
          </Field>
          <Field label="Joining Date">
            <input className="field" type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} required />
          </Field>
          <Field label="Profile Image">
            <input ref={profileImageRef} className="field" type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setForm({ ...form, profile_image: e.target.files?.[0] || null })} required />
          </Field>
          <Field label="Employee Document">
            <input ref={documentRef} className="field" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => setForm({ ...form, document: e.target.files?.[0] || null })} required />
          </Field>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-3">
            <span>Address Line<span className="text-rose-600"> *</span></span>
            <textarea className="field" rows="3" placeholder="House no., street, area" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </label>
          <Field label="City">
            <input className="field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </Field>
          <Field label="District">
            <input className="field" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
          </Field>
          <Field label="State">
            <input className="field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </Field>
          <Field label="Pincode">
            <input className="field" inputMode="numeric" maxLength="12" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
          </Field>
          <div className="md:col-span-3">
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Add Employee'}</button>
          </div>
        </form>
      </section>
      <EmployeeTable employees={employees.data?.items || []} onView={setSelectedEmployee} />
      {selectedEmployee && (
        <Modal title={selectedEmployee.name} onClose={() => setSelectedEmployee(null)}>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            {selectedEmployee.profile_image && (
              <div className="sm:col-span-2">
                <img className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200" src={selectedEmployee.profile_image} alt={selectedEmployee.name} />
              </div>
            )}
            <Detail label="Employee Code" value={selectedEmployee.employee_code} />
            <Detail label="User ID" value={selectedEmployee.employee_code || selectedEmployee.id} />
            <Detail label="Email" value={selectedEmployee.email} />
            <Detail label="Role" value={selectedEmployee.role} />
            <Detail label="Department" value={selectedEmployee.department?.name || 'Unassigned'} />
            <Detail label="Salary" value={formatMoney(selectedEmployee.salary)} />
            <Detail label="Status" value={selectedEmployee.status} />
            <Detail label="Phone" value={selectedEmployee.phone_number || '-'} />
            <Detail label="Last Login" value={selectedEmployee.last_login || 'Not tracked'} />
            <Detail label="Date of Birth" value={selectedEmployee.date_of_birth || '-'} />
            <Detail label="Joining Date" value={selectedEmployee.joining_date || '-'} />
            <Detail label="Address Line" value={selectedEmployee.address || '-'} />
            <Detail label="City" value={selectedEmployee.city || '-'} />
            <Detail label="District" value={selectedEmployee.district || '-'} />
            <Detail label="State" value={selectedEmployee.state || '-'} />
            <Detail label="Pincode" value={selectedEmployee.pincode || '-'} />
          </div>
        </Modal>
      )}
      {confirmCreate && (
        <Modal
          title="Create Employee"
          onClose={() => setConfirmCreate(false)}
          footer={(
            <>
              <button className="btn-secondary" onClick={() => setConfirmCreate(false)} type="button">Cancel</button>
              <button className="btn-primary" onClick={() => { setConfirmCreate(false); createEmployee(); }} type="button">Confirm</button>
            </>
          )}
        >
          <p className="text-sm font-semibold text-slate-600">Create {form.name || 'this employee'} in your department?</p>
        </Modal>
      )}
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
