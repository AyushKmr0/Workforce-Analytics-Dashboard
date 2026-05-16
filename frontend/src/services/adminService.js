import { api } from './api';

export const adminService = {
  analytics: async (params = {}) => (await api.get('/admin/analytics', { params })).data,
  employees: async (params = {}) => (await api.get('/admin/employees', { params })).data,
  createEmployee: async (payload) => (await api.post('/admin/employees', payload)).data,
  updateEmployee: async (id, payload) => (await api.put(`/admin/employees/${id}`, payload)).data,
  deleteEmployee: async (id) => (await api.delete(`/admin/employees/${id}`)).data,
  departments: async () => (await api.get('/admin/departments')).data,
  createDepartment: async (name) => (await api.post('/admin/departments', { name })).data,
  updateDepartment: async (id, name) => (await api.put(`/admin/departments/${id}`, { name })).data,
  deleteDepartment: async (id) => (await api.delete(`/admin/departments/${id}`)).data,
  leaves: async () => (await api.get('/admin/leaves')).data,
  documents: async () => (await api.get('/admin/documents')).data,
  deleteDocument: async (id) => (await api.delete(`/admin/documents/${id}`)).data,
  attendance: async (params = {}) => (await api.get('/admin/attendance', { params })).data,
  workReports: async (params = {}) => (await api.get('/admin/work-reports', { params })).data,
  reviewLeave: async (id, status) => (await api.patch(`/admin/leaves/${id}`, { status })).data,
  profileChangeRequests: async () => (await api.get('/admin/profile-change-requests')).data,
  reviewProfileChangeRequest: async (id, status) => (await api.patch(`/admin/profile-change-requests/${id}`, { status })).data,
};
