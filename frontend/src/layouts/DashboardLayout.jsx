import { BarChart3, Building2, CalendarCheck, ChevronLeft, ClipboardList, Ellipsis, FileText, FolderOpen, KeyRound, LogOut, ShieldCheck, UserCog, UserRound, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { employeeService } from '../services/employeeService';
import { adminService } from '../services/adminService';
import { hrService } from '../services/hrService';

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

function navLinks(role, counts = {}) {
  if (role === 'ADMIN') {
    return [
      { to: '/admin', label: 'Analysis', icon: BarChart3 },
      { to: '/admin/people', label: 'People', icon: Users },
      { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/admin/team-reports', label: 'Team Reports', icon: ClipboardList },
      { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
      { to: '/admin/leaves', label: 'Leaves', icon: ClipboardList },
      { to: '/admin/profile-requests', label: 'Approvals', icon: ShieldCheck, badge: counts.approvals },
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
      { to: '/hr/profile-requests', label: 'Approvals', icon: ShieldCheck, badge: counts.approvals },
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
  const [pendingCounts, setPendingCounts] = useState({});
  const links = navLinks(user?.role, pendingCounts);
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

  useEffect(() => {
    let active = true;
    const loadPendingCounts = async () => {
      try {
        if (user?.role === 'ADMIN') {
          const approvals = await adminService.profileChangeRequests();
          if (active) {
            const items = approvals.items || [];
            setPendingCounts({ approvals: unseenApprovalCount('ADMIN', items), approvalIds: approvalIds(items) });
          }
        } else if (user?.role === 'HR') {
          const approvals = await hrService.profileChangeRequests();
          if (active) {
            const items = approvals.items || [];
            setPendingCounts({ approvals: unseenApprovalCount('HR', items), approvalIds: approvalIds(items) });
          }
        } else if (active) {
          setPendingCounts({});
        }
      } catch {
        if (active) setPendingCounts({});
      }
    };
    loadPendingCounts();
    const timer = window.setInterval(loadPendingCounts, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.role]);

  useEffect(() => {
    if (location.pathname.endsWith('/profile-requests') && user?.role) {
      localStorage.setItem(`ems_seen_approvals_${user.role}`, JSON.stringify(pendingCounts.approvalIds || []));
      setPendingCounts((counts) => ({ ...counts, approvals: 0 }));
    }
  }, [location.pathname, pendingCounts.approvalIds, user?.role]);

  const hasCheckedIn = Boolean(attendance?.check_in);
  const hasCheckedOut = Boolean(attendance?.check_out);
  const isCheckedIn = hasCheckedIn && !hasCheckedOut;
  const hasCompletedToday = hasCheckedIn && hasCheckedOut;
  const attendanceStatus = isCheckedIn
    ? 'Checked in - Active'
    : hasCompletedToday
      ? 'Checked out - Inactive'
      : 'Automatic check-in pending';
  const canCheckOut = !attendanceBusy && isCheckedIn;

  const markCheckOut = async () => {
    setAttendanceBusy('check-out');
    try {
      const data = await employeeService.checkOut();
      setAttendance(data.attendance);
      showToast('Checked out successfully.');
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (error) {
      showToast(error.response?.data?.message || 'Check-out failed.', 'error');
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
              className="btn-secondary px-3 py-2"
              disabled={!canCheckOut}
              onClick={markCheckOut}
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
          <Outlet context={{ canWork: isCheckedIn, attendance }} />
        </div>
      </main>
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
      {expanded && <span className="min-w-0 flex-1">{item.label}</span>}
      {Boolean(item.badge) && (
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
      )}
    </Link>
  );
}

function unseenApprovalCount(role, items) {
  const seen = new Set(readSeenApprovals(role));
  return items.some((item) => !seen.has(item.id)) ? 1 : 0;
}

function approvalIds(items) {
  return items.map((item) => item.id);
}

function readSeenApprovals(role) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`ems_seen_approvals_${role}`) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
