import { api } from './api'

// Lightweight wrappers around the central api client for backward compatibility
export const getProfile = async (token: string) => {
  return api.profile(token)
}

export const updateProfile = async (token: string, data: { username?: string; email?: string }) => {
  return api.updateProfile(token, data)
}