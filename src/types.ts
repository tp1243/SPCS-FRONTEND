export type ComplaintStatus = 'Pending' | 'In Progress' | 'Solved' | 'Under Review'

export interface LocationInfo {
  lat?: number
  lng?: number
  address?: string
}

export interface Complaint {
  _id?: string
  userId?: string
  title: string
  type: string
  description: string
  category?: string
  contact?: string
  photoUrl?: string
  location?: LocationInfo
  status?: ComplaintStatus
  assignedOfficerName?: string
  station?: string
  stationId?: string
  nearestDistanceKm?: number
  createdAt?: string
  updatedAt?: string
}

export interface NotificationItem {
  _id: string
  complaintId?: string
  type?: string
  message: string
  read: boolean
  createdAt?: string
}

export type UserProfile = {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  gender?: string;
  dob?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export interface PoliceStation {
  _id?: string
  name: string
  code?: string
  address?: string
  zone?: string
  division?: string
  lat: number
  lng: number
  createdAt?: string
  updatedAt?: string
}

export interface PoliceNotificationItem {
  _id: string
  station: string
  complaintId?: string
  message: string
  read: boolean
  createdAt?: string
}

export interface PoliceOfficerProfile {
  id?: string
  _id?: string
  username: string
  name?: string
  email: string
  station: string
  phone?: string
  rank?: string
  city?: string
  status?: 'Active' | 'Offline' | 'On Duty'
  avatarUrl?: string
  lastLoginAt?: string
  lastLoginIp?: string
  lastLoginAgent?: string
  twoFactorEnabled?: boolean
  loginHistory?: Array<{ at: string; ip?: string; userAgent?: string }>
}