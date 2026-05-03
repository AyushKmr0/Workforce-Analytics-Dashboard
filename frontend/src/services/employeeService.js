import { api } from './api';

export const employeeService = {
  dashboard: async () => (await api.get('/employee/dashboard')).data,
  todayAttendance: async () => (await api.get('/employee/attendance/today')).data,
  attendance: async () => (await api.get('/employee/attendance')).data,
  checkIn: async (payload) => (await api.post('/employee/attendance/check-in', payload)).data,
  checkOut: async (payload) => (await api.post('/employee/attendance/check-out', payload)).data,
  applyLeave: async (payload) => (await api.post('/employee/leaves', payload)).data,
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return (await api.post('/employee/documents', formData)).data;
  },
  deleteDocument: async (id) => (await api.delete(`/employee/documents/${id}`)).data,
  submitWorkReport: async (payload) => (await api.post('/employee/work-reports', payload)).data,
  updateProfile: async (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    return (await api.patch('/employee/profile', formData)).data;
  },
  updatePassword: async (payload) => (await api.patch('/employee/password', payload)).data,
  profileChangeRequests: async () => (await api.get('/employee/profile-change-requests')).data,
  submitProfileChangeRequest: async (payload) => (await api.post('/employee/profile-change-requests', payload)).data,
};
