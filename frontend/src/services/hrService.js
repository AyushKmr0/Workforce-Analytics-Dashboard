import { api } from './api';

export const hrService = {
  analytics: async () => (await api.get('/hr/analytics')).data,
  employees: async (params = {}) => (await api.get('/hr/employees', { params })).data,
  leaves: async () => (await api.get('/hr/leaves')).data,
  documents: async () => (await api.get('/hr/documents')).data,
  deleteDocument: async (id) => (await api.delete(`/hr/documents/${id}`)).data,
  attendance: async (params = {}) => (await api.get('/hr/attendance', { params })).data,
  workReports: async (params = {}) => (await api.get('/hr/work-reports', { params })).data,
  reviewLeave: async (id, status) => (await api.patch(`/hr/leaves/${id}`, { status })).data,
  profileChangeRequests: async () => (await api.get('/hr/profile-change-requests')).data,
  reviewProfileChangeRequest: async (id, status) => (await api.patch(`/hr/profile-change-requests/${id}`, { status })).data,
};
