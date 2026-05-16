import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../pages/Auth/LoginPage';
import { AdminDashboard } from '../pages/Admin/AdminDashboard';
import { AdminAttendance } from '../pages/Admin/AdminAttendance';
import { AdminDocuments } from '../pages/Admin/AdminDocuments';
import { AdminLeaves } from '../pages/Admin/AdminLeaves';
import { AdminPeople } from '../pages/Admin/AdminPeople';
import { AdminProfileRequests } from '../pages/Admin/AdminProfileRequests';
import { AdminTeamReports } from '../pages/Admin/AdminTeamReports';
import { AccountActivity } from '../pages/Account/AccountActivity';
import { AccountDocuments } from '../pages/Account/AccountDocuments';
import { AccountEditProfile } from '../pages/Account/AccountEditProfile';
import { AccountProfile } from '../pages/Account/AccountProfile';
import { AccountSecurity } from '../pages/Account/AccountSecurity';
import { HRDashboard } from '../pages/HR/HRDashboard';
import { HRAttendance } from '../pages/HR/HRAttendance';
import { HRDocuments } from '../pages/HR/HRDocuments';
import { HRLeaves } from '../pages/HR/HRLeaves';
import { HRPeople } from '../pages/HR/HRPeople';
import { HRProfileRequests } from '../pages/HR/HRProfileRequests';
import { HRTeamReports } from '../pages/HR/HRTeamReports';
import { EmployeeDashboard } from '../pages/Employee/EmployeeDashboard';
import { EmployeeAttendance } from '../pages/Employee/EmployeeAttendance';
import { EmployeeLeaves } from '../pages/Employee/EmployeeLeaves';
import { EmployeeWorkReport } from '../pages/Employee/EmployeeWorkReport';
import { ProtectedRoute } from './ProtectedRoute';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'HR') return <Navigate to="/hr" replace />;
  return <Navigate to="/employee" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/people" element={<AdminPeople />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/team-reports" element={<AdminTeamReports />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/leaves" element={<AdminLeaves />} />
            <Route path="/admin/profile-requests" element={<AdminProfileRequests />} />
            <Route path="/admin/profile" element={<AccountProfile />} />
            <Route path="/admin/edit-profile" element={<AccountEditProfile />} />
            <Route path="/admin/security" element={<AccountSecurity />} />
            <Route path="/admin/activity" element={<AccountActivity />} />
            <Route path="/admin/my-documents" element={<AccountDocuments />} />
          </Route>
          <Route element={<ProtectedRoute roles={['HR']} />}>
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/hr/people" element={<HRPeople />} />
            <Route path="/hr/attendance" element={<HRAttendance />} />
            <Route path="/hr/team-reports" element={<HRTeamReports />} />
            <Route path="/hr/documents" element={<HRDocuments />} />
            <Route path="/hr/leaves" element={<HRLeaves />} />
            <Route path="/hr/profile-requests" element={<HRProfileRequests />} />
            <Route path="/hr/profile" element={<AccountProfile />} />
            <Route path="/hr/edit-profile" element={<AccountEditProfile />} />
            <Route path="/hr/my-documents" element={<AccountDocuments />} />
            <Route path="/hr/security" element={<AccountSecurity />} />
            <Route path="/hr/activity" element={<AccountActivity />} />
          </Route>
          <Route element={<ProtectedRoute roles={['EMPLOYEE']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/employee/attendance" element={<EmployeeAttendance />} />
            <Route path="/employee/leaves" element={<EmployeeLeaves />} />
            <Route path="/employee/work-report" element={<EmployeeWorkReport />} />
            <Route path="/employee/profile" element={<AccountProfile />} />
            <Route path="/employee/edit-profile" element={<AccountEditProfile />} />
            <Route path="/employee/my-documents" element={<AccountDocuments />} />
            <Route path="/employee/security" element={<AccountSecurity />} />
            <Route path="/employee/activity" element={<AccountActivity />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
