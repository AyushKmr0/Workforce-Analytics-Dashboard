import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from './StatusBadge';

export function ProfilePanel() {
  const { user } = useAuth();

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={user} />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">My Profile</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
          </div>
        </div>
        <StatusBadge value={user?.status || 'ACTIVE'} />
      </div>
      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Employee Code</span><strong className="block">{user?.employee_code}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">User ID</span><strong className="block">{user?.employee_code || user?.id}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Role</span><strong className="block">{user?.role}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Department</span><strong className="block">{user?.department?.name || 'Unassigned'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Phone</span><strong className="block">{user?.phone_number || 'Not provided'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Joining Date</span><strong className="block">{user?.joining_date || 'Not provided'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Last Login</span><strong className="block">{user?.last_login || 'Not tracked'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Address Line</span><strong className="block">{user?.address || 'Not provided'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">City</span><strong className="block">{user?.city || 'Not provided'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">District</span><strong className="block">{user?.district || 'Not provided'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">State</span><strong className="block">{user?.state || 'Not provided'}</strong></div>
        <div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Pincode</span><strong className="block">{user?.pincode || 'Not provided'}</strong></div>
      </div>
    </section>
  );
}

function Avatar({ user }) {
  if (user?.profile_image) {
    return <img className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-200" src={user.profile_image} alt={user.name} />;
  }
  const initials = (user?.name || user?.email || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-blue-100 text-lg font-black text-blue-700 ring-1 ring-blue-200">
      {initials}
    </div>
  );
}
