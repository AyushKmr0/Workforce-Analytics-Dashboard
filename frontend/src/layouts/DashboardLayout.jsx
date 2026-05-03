import { BarChart3, Building2, CalendarCheck, ChevronLeft, ClipboardList, Ellipsis, FileText, FolderOpen, KeyRound, LogOut, ShieldCheck, UserCog, UserRound, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { employeeService } from '../services/employeeService';
import { Modal } from '../components/ui/Modal';

function dashboardPath(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'HR') return '/hr';
  return '/employee';
}

function peoplePath(role) {
  if (role === 'ADMIN') return '/admin/people';
  if (role === 'HR') return '/hr/people';
  return '/employee';
}

function attendancePath(role) {
  if (role === 'ADMIN') return '/admin/attendance';
  if (role === 'HR') return '/hr/attendance';
  return '/employee/attendance';
}

function accountPath(role, section) {
  const base = dashboardPath(role);
  return `${base}/${section}`;
}

function navLinks(role) {
  if (role === 'ADMIN') {
    return [
      { to: '/admin', label: 'Analysis', icon: BarChart3 },
      { to: '/admin/people', label: 'People', icon: Users },
      { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
      { to: '/admin/leaves', label: 'Leaves', icon: ClipboardList },
      { to: '/admin/profile-requests', label: 'Approvals', icon: ShieldCheck },
    ];
  }
  if (role === 'HR') {
    return [
      { to: '/hr', label: 'Analysis', icon: BarChart3 },
      { to: '/hr/people', label: 'People', icon: Users },
      { to: '/hr/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/hr/team-reports', label: 'Team Reports', icon: ClipboardList },
      { to: '/hr/documents', label: 'Documents', icon: FolderOpen },
      { to: '/hr/leaves', label: 'Leaves', icon: FileText },
      { to: '/hr/profile-requests', label: 'Approvals', icon: ShieldCheck },
    ];
  }
  return [
    { to: '/employee', label: 'Analysis', icon: BarChart3 },
    { to: '/employee/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/employee/leaves', label: 'Leaves', icon: FileText },
    { to: '/employee/work-report', label: 'Work Report', icon: ClipboardList },
  ];
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [attendanceBusy, setAttendanceBusy] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [attendancePrompt, setAttendancePrompt] = useState(null);
  const [attendancePassword, setAttendancePassword] = useState('');
  const links = navLinks(user?.role);
  const accountLinks = [
    { to: accountPath(user?.role, 'profile'), label: 'Profile', icon: UserRound },
    { to: accountPath(user?.role, 'edit-profile'), label: 'Edit Profile', icon: UserCog },
    { to: accountPath(user?.role, 'my-documents'), label: 'My Documents', icon: FolderOpen },
    { to: accountPath(user?.role, 'security'), label: 'Security', icon: KeyRound },
    { to: accountPath(user?.role, 'activity'), label: 'Updates', icon: ShieldCheck },
  ];

  const loadTodayAttendance = async () => {
    try {
      const data = await employeeService.todayAttendance();
      setAttendance(data.attendance);
    } catch {
      setAttendance(null);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
    window.addEventListener('attendance-updated', loadTodayAttendance);
    return () => window.removeEventListener('attendance-updated', loadTodayAttendance);
  }, []);

  const hasCheckedIn = Boolean(attendance?.check_in);
  const hasCheckedOut = Boolean(attendance?.check_out);
  const isCheckedIn = hasCheckedIn && !hasCheckedOut;
  const hasCompletedToday = hasCheckedIn && hasCheckedOut;
  const attendanceStatus = isCheckedIn
    ? 'Checked in - Active'
    : hasCompletedToday
      ? 'Checked out - Inactive'
      : 'Not checked in - Locked';
  const canCheckIn = !attendanceBusy && !isCheckedIn;
  const canCheckOut = !attendanceBusy && isCheckedIn;

  const openAttendancePrompt = (action) => {
    setAttendancePassword('');
    setAttendancePrompt(action);
  };

  const closeAttendancePrompt = () => {
    if (!attendanceBusy) {
      setAttendancePrompt(null);
      setAttendancePassword('');
    }
  };

  const markAttendance = async (event) => {
    event.preventDefault();
    const action = attendancePrompt;
    if (!action) return;
    setAttendanceBusy(action);
    try {
      if (action === 'check-in') {
        const data = await employeeService.checkIn({ password: attendancePassword });
        setAttendance(data.attendance);
        showToast('Checked in successfully.');
      } else {
        const data = await employeeService.checkOut({ password: attendancePassword });
        setAttendance(data.attendance);
        showToast('Checked out successfully.');
      }
      setAttendancePrompt(null);
      setAttendancePassword('');
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (error) {
      showToast(error.response?.data?.message || 'Attendance action failed.', 'error');
    } finally {
      setAttendanceBusy('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-30 border-r border-slate-200 bg-slate-950 text-white transition-all duration-200 ${sidebarOpen ? 'block w-72' : 'hidden lg:block lg:w-20'}`}>
        <div className={`flex h-20 items-center ${sidebarOpen ? 'justify-between px-5' : 'justify-center px-3'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="group relative grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-500 font-black transition hover:bg-blue-400"
              onClick={() => !sidebarOpen && setSidebarOpen(true)}
              title={!sidebarOpen ? 'Open sidebar' : undefined}
              type="button"
            >
              <span className={`transition ${sidebarOpen ? 'opacity-100' : 'group-hover:opacity-0'}`}>EMS</span>
              {!sidebarOpen && <Ellipsis size={18} className="absolute opacity-0 transition group-hover:opacity-100" />}
            </button>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="truncate font-bold">Employee Analytics</div>
                <div className="text-xs text-slate-400">Platform</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={() => setSidebarOpen(false)} title="Close sidebar" type="button">
              <ChevronLeft size={20} />
            </button>
          )}
        </div>
        <nav className="space-y-1 px-4">
          {links.map((item) => (
            <SidebarLink
              key={item.label}
              item={item}
              active={location.pathname === item.to}
              expanded={sidebarOpen}
            />
          ))}
        </nav>
        {accountLinks.length > 0 && (
          <div className="mt-5 px-4">
            {sidebarOpen && <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">My account</div>}
            <nav className="space-y-1">
              {accountLinks.map((item) => (
                <SidebarLink
                  key={item.label}
                  item={item}
                  active={location.pathname === item.to}
                  expanded={sidebarOpen}
                />
              ))}
            </nav>
          </div>
        )}
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} type="button" aria-label="Close sidebar overlay" />}
      <main className={`transition-all duration-200 ${sidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}`}>
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Building2 className="text-blue-600" />
            <div>
              <p className="text-sm font-medium text-slate-500">{user?.role}</p>
              <h1 className="text-lg font-bold text-slate-950">{user?.name}</h1>
              <p className={isCheckedIn ? 'text-xs font-bold text-emerald-600' : 'text-xs font-bold text-rose-600'}>
                {attendanceStatus}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn-primary px-3 py-2"
              disabled={!canCheckIn}
              onClick={() => openAttendancePrompt('check-in')}
              title={hasCompletedToday ? 'Check in again to unlock your workspace.' : undefined}
              type="button"
            >
              {attendanceBusy === 'check-in' ? 'Checking...' : 'Check In'}
            </button>
            <button
              className="btn-secondary px-3 py-2"
              disabled={!canCheckOut}
              onClick={() => openAttendancePrompt('check-out')}
              type="button"
            >
              {attendanceBusy === 'check-out' ? 'Checking...' : 'Check Out'}
            </button>
            <button className="btn-secondary" onClick={logout} type="button">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>
        <div className="p-5 lg:p-8">
          {!isCheckedIn && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {hasCompletedToday
                ? 'You are checked out. Check in again to unlock your workspace.'
                : 'Check-in is required. Until today\'s check-in is complete, the workspace will remain blank and locked.'}
            </div>
          )}
          {isCheckedIn ? <Outlet context={{ canWork: isCheckedIn, attendance }} /> : <LockedWorkspace />}
        </div>
      </main>
      {attendancePrompt && (
        <Modal
          title={attendancePrompt === 'check-in' ? 'Confirm Check In' : 'Confirm Check Out'}
          onClose={closeAttendancePrompt}
          footer={(
            <>
              <button className="btn-secondary" onClick={closeAttendancePrompt} disabled={Boolean(attendanceBusy)} type="button">
                Cancel
              </button>
              <button className="btn-primary" form="attendance-password-form" disabled={Boolean(attendanceBusy) || !attendancePassword}>
                {attendanceBusy === attendancePrompt ? 'Confirming...' : 'Confirm'}
              </button>
            </>
          )}
        >
          <form className="grid gap-4" id="attendance-password-form" onSubmit={markAttendance}>
            <p className="text-sm font-semibold text-slate-600">
              Enter your password to {attendancePrompt === 'check-in' ? 'check in' : 'check out'}.
            </p>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              <span>Password</span>
              <input
                autoFocus
                className="field"
                type="password"
                value={attendancePassword}
                onChange={(event) => setAttendancePassword(event.target.value)}
                required
              />
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SidebarLink({ item, active, expanded }) {
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
        active ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'
      } ${expanded ? '' : 'justify-center px-0'}`}
      title={!expanded ? item.label : undefined}
    >
      <item.icon size={18} />
      {expanded && <span>{item.label}</span>}
    </Link>
  );
}

function LockedWorkspace() {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="h-7 w-56 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-80 max-w-full rounded-lg bg-slate-100" />
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <section className="card p-5" key={item}>
            <div className="h-4 w-24 rounded-lg bg-slate-200" />
            <div className="mt-4 h-8 w-20 rounded-lg bg-slate-100" />
          </section>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <section className="card p-5" key={item}>
            <div className="h-5 w-40 rounded-lg bg-slate-200" />
            <div className="mt-4 h-64 rounded-xl bg-slate-100" />
          </section>
        ))}
      </div>
      <section className="card p-5">
        <div className="h-5 w-48 rounded-lg bg-slate-200" />
        <div className="mt-4 h-72 rounded-xl bg-slate-100" />
      </section>
    </div>
  );
}
