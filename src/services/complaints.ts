import { request } from './api'
import type { Complaint } from '../types'

export const complaintsApi = {
  async create(payload: Complaint, token: string) {
    return request<{ complaint: Complaint }>(('/complaints'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  },
  async listMine(token: string, params?: { page?: number; limit?: number; fields?: 'summary' | '' }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.fields) qs.set('fields', params.fields)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ complaints: Complaint[]; total?: number; totalPages?: number; currentPage?: number }>(`/complaints${suffix}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async getById(token: string, id: string) {
    return request<{ complaint: Complaint }>(`/complaints/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async update(token: string, id: string, payload: Partial<Complaint>) {
    return request<{ complaint: Complaint }>(`/complaints/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
  },
  async stats(token: string) {
    return request<{ stats: Record<string, number> }>(`/complaints/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}