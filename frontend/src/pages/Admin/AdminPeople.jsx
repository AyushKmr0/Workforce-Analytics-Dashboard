import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { EmployeeTable } from '../../components/ui/EmployeeTable';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  department_id: '',
  salary: 0,
  phone_number: '',
  status: 'ACTIVE',
  date_of_birth: '',
  joining_date: '',
  address: '',
  profile_image: null,
  document: null,
};

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function toEmployeeFormData(payload, includePassword) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'password' && !includePassword && !value) return;
    if (key === 'profile_image' || key === 'document') {
      if (value) formData.append(key, value);
      return;
    }
    formData.append(key, value ?? '');
  });
  return formData;
}

export function AdminPeople() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const profileImageRef = useRef(null);
  const documentRef = useRef(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    if (profileImageRef.current) profileImageRef.current.value = '';
    if (documentRef.current) documentRef.current.value = '';
  };

  const notifyError = (error, fallback) => {
    showToast(error.response?.data?.message || fallback, 'error');
  };

  const load = async (params = {}) => {
    try {
      const [employeeData, departmentData] = await Promise.all([
        adminService.employees(params),
        adminService.departments(),
      ]);
      setEmployees(employeeData.items || []);
      setDepartments(departmentData.items || []);
    } catch (error) {
      notifyError(error, 'Unable to load people data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    load({ search });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const payload = { ...form, department_id: form.department_id || '' };
    const formData = toEmployeeFormData(payload, !editing);
    try {
      if (editing) {
        await adminService.updateEmployee(editing.id, formData);
        showToast('Employee updated successfully.');
      } else {
        await adminService.createEmployee(formData);
        showToast('Employee created successfully.');
      }
      resetForm();
      await load({ search });
    } catch (error) {
      notifyError(error, editing ? 'Employee update failed.' : 'Employee creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (employee) => {
    setEditing(employee);
    setForm({
      ...emptyForm,
      ...employee,
      department_id: employee.department_id || '',
      password: '',
      date_of_birth: employee.date_of_birth || '',
      joining_date: employee.joining_date || '',
      profile_image: null,
      document: null,
    });
  };

  const remove = async (employee) => {
    try {
      await adminService.deleteEmployee(employee.id);
      setDeleteTarget(null);
      showToast('Employee deleted successfully.');
      await load({ search });
    } catch (error) {
      notifyError(error, 'Employee delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">People</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Employee Directory</h2>
      </div>

      <section className="card p-5">
        <form className="flex flex-wrap gap-3" onSubmit={submitSearch}>
          <input className="field min-w-72 flex-1" placeholder="Search by name, email, or employee code" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-primary">Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); load(); }}>Clear</button>
        </form>
      </section>

      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">Departments</h3>
        <form
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!departmentName.trim()) return;
            try {
              await adminService.createDepartment(departmentName.trim());
              showToast('Department created successfully.');
              setDepartmentName('');
              await load({ search });
            } catch (error) {
              notifyError(error, 'Department creation failed.');
            }
          }}
        >
          <input className="field min-w-72 flex-1" placeholder="Add department" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} />
          <button className="btn-primary">Add Department</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {departments.map((department) => (
            <button key={department.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700" onClick={() => load({ department_id: department.id })}>
              {department.name}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submit}>
          <Field label="Full Name">
            <input className="field" placeholder="Employee full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Email Address">
            <input className="field" type="email" placeholder="employee@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Login Password">
            <input className="field" type="password" placeholder={editing ? 'Leave blank to keep unchanged' : 'Temporary password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          </Field>
          <Field label="Role">
            <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <Field label="Department">
            <select className="field" value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Unassigned department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </Field>
          <Field label="Salary">
            <input className="field" type="number" step="0.01" placeholder="Monthly or annual salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </Field>
          <Field label="Phone Number">
            <input className="field" type="tel" placeholder="+91 98765 43210" value={form.phone_number || ''} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          </Field>
          <Field label="Date of Birth">
            <input className="field" type="date" aria-label="Date of birth" value={form.date_of_birth || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          </Field>
          <Field label="Joining Date">
            <input className="field" type="date" aria-label="Joining date" value={form.joining_date || ''} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
          </Field>
          <Field label="Account Status">
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <Field label="Profile Image">
            <input ref={profileImageRef} className="field" type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setForm({ ...form, profile_image: e.target.files?.[0] || null })} />
          </Field>
          <Field label="Employee Document">
            <input ref={documentRef} className="field" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => setForm({ ...form, document: e.target.files?.[0] || null })} />
          </Field>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-3">
            <span>Address</span>
            <textarea className="field" rows="3" placeholder="House no., street, city, state, PIN" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <div className="flex gap-2 md:col-span-3">
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Employee'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>

      <EmployeeTable employees={employees} onView={setSelectedEmployee} onEdit={edit} onDelete={setDeleteTarget} />

      {selectedEmployee && (
        <Modal title={selectedEmployee.name} onClose={() => setSelectedEmployee(null)}>
          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            {selectedEmployee.profile_image && (
              <div className="sm:col-span-2">
                <img className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200" src={selectedEmployee.profile_image} alt={selectedEmployee.name} />
              </div>
            )}
            <Detail label="Employee Code" value={selectedEmployee.employee_code} />
            <Detail label="Email" value={selectedEmployee.email} />
            <Detail label="Role" value={selectedEmployee.role} />
            <Detail label="Department" value={selectedEmployee.department?.name || 'Unassigned'} />
            <Detail label="Salary" value={`$${Number(selectedEmployee.salary || 0).toLocaleString()}`} />
            <Detail label="Status" value={selectedEmployee.status} />
            <Detail label="Phone" value={selectedEmployee.phone_number || '-'} />
            <Detail label="Last Login" value={selectedEmployee.last_login || 'Not tracked'} />
            <Detail label="Date of Birth" value={selectedEmployee.date_of_birth || '-'} />
            <Detail label="Joining Date" value={selectedEmployee.joining_date || '-'} />
            <div className="sm:col-span-2">
              <Detail label="Address" value={selectedEmployee.address || '-'} />
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete Employee"
          onClose={() => setDeleteTarget(null)}
          footer={(
            <>
              <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={() => remove(deleteTarget)}>Delete</button>
            </>
          )}
        >
          <p className="text-sm text-slate-700">
            Delete <strong>{deleteTarget.name}</strong>? This will remove the employee and related records.
          </p>
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
