import { request } from './api'
import type { Complaint, PoliceNotificationItem, PoliceStation, PoliceOfficerProfile } from '../types'

export const policeApi = {
  async listComplaints(token: string, params?: { status?: string; page?: number; limit?: number; fields?: 'summary' | '' }) {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.fields) qs.set('fields', params.fields)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ complaints: Complaint[] }>(`/police/complaints${suffix}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async assignComplaint(token: string, id: string) {
    return request<{ complaint: Complaint }>(`/police/complaints/${id}/assign`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  },
  async updateComplaintStatus(token: string, id: string, status: string) {
    return request<{ complaint: Complaint }>(`/police/complaints/${id}/status`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) })
  },
  async getComplaintById(token: string, id: string) {
    return request<{ complaint: Complaint }>(`/police/complaints/${id}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async listAlerts(token: string) {
    return request<{ alerts: Array<{ _id: string; title: string; priority: 'high'|'medium'|'low'; createdAt: string; handled: boolean }> }>(`/police/alerts`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async handleAlert(token: string, id: string) {
    return request<{ ok: boolean }>(`/police/alerts/${id}/handle`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
  },
  async listOfficers(token: string) {
    return request<{ officers: Array<{ _id: string; username: string; status?: 'Online'|'On Duty'|'Offline'; activeCases?: number; resolved?: number }> }>(`/police/officers`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async profile(token: string) {
    return request<PoliceOfficerProfile>(`/police/profile`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async updateProfile(token: string, data: Partial<PoliceOfficerProfile>) {
    return request<PoliceOfficerProfile>(`/police/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
  },
  async listChats(token: string) {
    return request<{ messages: Array<{ _id: string; text: string; from?: string; to?: string; createdAt: string }> }>(`/police/chat/messages`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async sendChat(token: string, payload: { text: string; toUserId?: string }) {
    return request<{ message: { _id: string; text: string; from?: string; to?: string; createdAt: string } }>(`/police/chat/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
  },
  async listNotifications(token: string) {
    return request<{ notifications: PoliceNotificationItem[] }>(`/police/notifications`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async markNotificationRead(token: string, id: string) {
    return request<{ notification: PoliceNotificationItem }>(`/police/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
  },
  async markAllNotificationsRead(token: string) {
    return request<{ notifications: PoliceNotificationItem[] }>(`/police/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
  },
  async listStations(token: string) {
    return request<{ stations: PoliceStation[] }>(`/police/stations`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async bulkStations(token: string, stations: PoliceStation[]) {
    return request<{ ok: boolean; upserts?: number; modified?: number }>(`/police/stations/bulk`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(stations) })
  },
  async changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<{ ok: boolean }>(`/police/auth/change-password`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword, newPassword }) })
  },
  async logoutAll(token: string) {
    return request<{ ok: boolean }>(`/police/logout-all`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  },
  async enable2FA(token: string, enable: boolean) {
    return request<{ ok: boolean; twoFactorEnabled: boolean }>(`/police/auth/2fa/enable`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ enable }) })
  },
  async requestStationUpdate(token: string, payload: { stationName: string; message?: string }) {
    return request<{ ok: boolean }>(`/police/stations/request-update`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
  },
  async stats(token: string) {
    return request<{ stats: { totalComplaints: number; pending: number; inProgress: number; solved: number; underReview: number } }>(`/police/stats`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
}
