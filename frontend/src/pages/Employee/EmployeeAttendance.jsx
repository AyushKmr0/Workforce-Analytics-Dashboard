import { AttendanceTable } from '../../components/ui/AttendanceTable';
import { useAsync } from '../../hooks/useAsync';
import { employeeService } from '../../services/employeeService';

export function EmployeeAttendance() {
  const attendance = useAsync(employeeService.attendance, []);

  return (
    <div className="space-y-6">
      <AttendanceTable records={attendance.data?.items || []} title="My Attendance History" />
    </div>
  );
}
