import { StatusBadge } from './StatusBadge';
import { formatMoney } from '../../utils/format';

export function EmployeeTable({ employees = [], onView, onEdit, onDelete }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Salary</th>
            <th className="px-4 py-3">Status</th>
            {(onView || onEdit || onDelete) && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {employees.map((employee) => (
            <tr key={employee.id} className={onView ? 'transition hover:bg-blue-50/50' : ''}>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar user={employee} />
                  <div>
                    <div className="font-semibold text-slate-950">{employee.name}</div>
                    <div className="text-slate-500">{employee.email}</div>
                    <div className="text-xs font-bold text-slate-400">ID: {employee.employee_code || employee.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">{employee.department?.name || 'Unassigned'}</td>
              <td className="px-4 py-4">{employee.role}</td>
              <td className="px-4 py-4">{formatMoney(employee.salary)}</td>
              <td className="px-4 py-4"><StatusBadge value={employee.status} /></td>
              {(onView || onEdit || onDelete) && (
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {onView && <button className="btn-secondary px-3 py-2 text-blue-700" onClick={() => onView(employee)}>View</button>}
                    {onEdit && <button className="btn-secondary px-3 py-2" onClick={() => onEdit(employee)}>Edit</button>}
                    {onDelete && <button className="btn-secondary px-3 py-2 text-rose-700" onClick={() => onDelete(employee)}>Delete</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Avatar({ user }) {
  if (user.profile_image) {
    return <img className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200" src={user.profile_image} alt={user.name} />;
  }
  const initials = (user.name || user.email || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-700 ring-1 ring-blue-200">
      {initials}
    </div>
  );
}
