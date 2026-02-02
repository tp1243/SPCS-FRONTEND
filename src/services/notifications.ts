import { request } from './api'
import type { NotificationItem } from '../types'

export const notificationsApi = {
  async list(token: string) {
    return request<{ notifications: NotificationItem[] }>(`/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async markRead(token: string, id: string) {
    return request<{ notification: NotificationItem }>(`/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async markAllRead(token: string) {
    return request<{ notifications: NotificationItem[] }>(`/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}