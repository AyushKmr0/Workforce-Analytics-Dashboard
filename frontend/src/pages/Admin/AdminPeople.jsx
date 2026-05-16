import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { EmployeeTable } from '../../components/ui/EmployeeTable';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { formatMoney } from '../../utils/format';

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
  city: '',
  district: '',
  state: '',
  pincode: '',
  profile_image: null,
  document: null,
};

function Field({ label, children, required = false }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}{required && <span className="text-rose-600"> *</span>}</span>
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
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [departmentDeleteTarget, setDepartmentDeleteTarget] = useState(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentDraft, setDepartmentDraft] = useState('');
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

  const currentFilters = () => ({
    ...(search ? { search } : {}),
    ...(departmentFilter ? { department_id: departmentFilter } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  });

  const submitSearch = (event) => {
    event.preventDefault();
    load(currentFilters());
  };

  const submit = async (event) => {
    event.preventDefault();
    if (editing) {
      setConfirmUpdate(true);
      return;
    }
    await saveEmployee();
  };

  const saveEmployee = async () => {
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
      await load(currentFilters());
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
      await load(currentFilters());
    } catch (error) {
      notifyError(error, 'Employee delete failed.');
    }
  };

  const startEditDepartment = (department) => {
    setEditingDepartment(department);
    setDepartmentDraft(department.name);
  };

  const cancelEditDepartment = () => {
    setEditingDepartment(null);
    setDepartmentDraft('');
  };

  const saveDepartment = async (event) => {
    event.preventDefault();
    if (!editingDepartment || !departmentDraft.trim()) return;
    try {
      await adminService.updateDepartment(editingDepartment.id, departmentDraft.trim());
      showToast('Department updated successfully.');
      cancelEditDepartment();
      await load(currentFilters());
    } catch (error) {
      notifyError(error, 'Department update failed.');
    }
  };

  const removeDepartment = async (department) => {
    try {
      await adminService.deleteDepartment(department.id);
      setDepartmentDeleteTarget(null);
      const wasActiveFilter = departmentFilter === String(department.id);
      if (wasActiveFilter) setDepartmentFilter('');
      showToast('Department deleted successfully.');
      await load({
        ...(search ? { search } : {}),
        ...(wasActiveFilter ? {} : departmentFilter ? { department_id: departmentFilter } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      });
    } catch (error) {
      notifyError(error, 'Department delete failed.');
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
          <select className="field min-w-60" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="">All departments</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <select className="field min-w-48" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All roles</option>
            <option value="HR">HR only</option>
            <option value="EMPLOYEE">Employees only</option>
            <option value="ADMIN">Admins only</option>
          </select>
          <button className="btn-primary">Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setDepartmentFilter(''); setRoleFilter(''); load(); }}>Clear</button>
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
              await load(currentFilters());
            } catch (error) {
              notifyError(error, 'Department creation failed.');
            }
          }}
        >
          <input className="field min-w-72 flex-1" placeholder="Add department" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} />
          <button className="btn-primary">Add Department</button>
        </form>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <div key={department.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <button
                type="button"
                className="text-sm font-bold text-slate-800"
                onClick={() => { setDepartmentFilter(String(department.id)); load({ department_id: department.id, ...(roleFilter ? { role: roleFilter } : {}) }); }}
              >
                {department.name}
              </button>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => startEditDepartment(department)}>Edit</button>
                <button type="button" className="btn-secondary px-3 py-1.5 text-rose-700" onClick={() => setDepartmentDeleteTarget(department)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-lg font-bold text-slate-950">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submit}>
          <Field label="Full Name" required>
            <input className="field" placeholder="Employee full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Email Address" required>
            <input className="field" type="email" placeholder="employee@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Login Password" required={!editing}>
            <input className="field" type="password" placeholder={editing ? 'Leave blank to keep unchanged' : 'Temporary password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          </Field>
          <Field label="Role" required>
            <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <Field label="Department" required>
            <select className="field" value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: e.target.value })} required>
              <option value="">Select department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </Field>
          <Field label="Salary" required>
            <input className="field" type="number" step="0.01" placeholder="Monthly or annual salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} required />
          </Field>
          <Field label="Phone Number" required>
            <input className="field" type="tel" placeholder="+91 98765 43210" value={form.phone_number || ''} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} required />
          </Field>
          <Field label="Date of Birth" required>
            <input className="field" type="date" aria-label="Date of birth" value={form.date_of_birth || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
          </Field>
          <Field label="Joining Date" required>
            <input className="field" type="date" aria-label="Joining date" value={form.joining_date || ''} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} required />
          </Field>
          <Field label="Account Status" required>
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
          <Field label="Profile Image" required={!editing}>
            <input ref={profileImageRef} className="field" type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setForm({ ...form, profile_image: e.target.files?.[0] || null })} required={!editing} />
          </Field>
          <Field label="Employee Document" required={!editing}>
            <input ref={documentRef} className="field" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => setForm({ ...form, document: e.target.files?.[0] || null })} required={!editing} />
          </Field>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700 md:col-span-3">
            <span>Address Line<span className="text-rose-600"> *</span></span>
            <textarea className="field" rows="3" placeholder="House no., street, area" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </label>
          <Field label="City" required>
            <input className="field" placeholder="City" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </Field>
          <Field label="District" required>
            <input className="field" placeholder="District" value={form.district || ''} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
          </Field>
          <Field label="State" required>
            <input className="field" placeholder="State" value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </Field>
          <Field label="Pincode" required>
            <input className="field" inputMode="numeric" maxLength="12" placeholder="Pincode" value={form.pincode || ''} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
          </Field>
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
      {confirmUpdate && (
        <Modal
          title="Save Employee Changes"
          onClose={() => setConfirmUpdate(false)}
          footer={(
            <>
              <button type="button" className="btn-secondary" onClick={() => setConfirmUpdate(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={() => { setConfirmUpdate(false); saveEmployee(); }}>Confirm</button>
            </>
          )}
        >
          <p className="text-sm text-slate-700">
            Save changes for <strong>{editing?.name}</strong>?
          </p>
        </Modal>
      )}
      {editingDepartment && (
        <Modal
          title="Edit Department"
          onClose={cancelEditDepartment}
          footer={(
            <>
              <button type="button" className="btn-secondary" onClick={cancelEditDepartment}>Cancel</button>
              <button type="submit" form="department-edit-form" className="btn-primary">Save</button>
            </>
          )}
        >
          <form id="department-edit-form" className="grid gap-3" onSubmit={saveDepartment}>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              <span>Department Name</span>
              <input className="field" value={departmentDraft} onChange={(event) => setDepartmentDraft(event.target.value)} autoFocus required />
            </label>
          </form>
        </Modal>
      )}
      {departmentDeleteTarget && (
        <Modal
          title="Delete Department"
          onClose={() => setDepartmentDeleteTarget(null)}
          footer={(
            <>
              <button type="button" className="btn-secondary" onClick={() => setDepartmentDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={() => removeDepartment(departmentDeleteTarget)}>Delete</button>
            </>
          )}
        >
          <p className="text-sm text-slate-700">
            Delete <strong>{departmentDeleteTarget.name}</strong>? Employees in this department will become unassigned.
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
