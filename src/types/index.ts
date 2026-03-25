// User types
export type UserRole = 'DRIVER' | 'OWNER' | 'GARAGE' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: UserRole
  isActive: boolean
  emailVerified: Date | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

// Garage types
export interface Garage {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string | null
  description: string | null
  logo: string | null
  qrCode: string | null
  isActive: boolean
  isVerified: boolean
  subscriptionPlan: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
}

export type GarageApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

export interface GarageApplication {
  id: string
  businessName: string
  address: string
  city: string
  phone: string
  email: string
  description: string | null
  documents: string | null
  status: GarageApplicationStatus
  adminNotes: string | null
  submittedAt: Date
  reviewedAt: Date | null
  reviewedBy: string | null
  garageId: string | null
  userId: string | null
}

// Vehicle types
export type VehicleStatus = 'ACTIVE' | 'SOLD' | 'ARCHIVED'
export type FuelType = 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID'
export type TransmissionType = 'MANUAL' | 'AUTOMATIC'

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  vin: string | null
  color: string | null
  mileage: number | null
  fuelType: FuelType | null
  transmission: TransmissionType | null
  image: string | null
  passportImage: string | null
  status: VehicleStatus
  createdAt: Date
  updatedAt: Date
  ownerId: string
  garageId: string | null
}

// Document types
export type DocumentType = 'REGISTRATION' | 'INSURANCE' | 'INSPECTION' | 'PASSPORT' | 'OTHER'

export interface Document {
  id: string
  type: DocumentType
  name: string
  url: string
  size: number | null
  mimeType: string | null
  isVerified: boolean
  uploadedAt: Date
  verifiedAt: Date | null
  verifiedBy: string | null
  vehicleId: string | null
  userId: string | null
}

// Notification types
export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  actionUrl: string | null
  createdAt: Date
  readAt: Date | null
  userId: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string
  role: UserRole
}

export interface GarageApplicationFormData {
  businessName: string
  address: string
  city: string
  phone: string
  email: string
  description: string
}

export interface VehicleFormData {
  make: string
  model: string
  year: number
  licensePlate: string
  vin?: string
  color?: string
  mileage?: number
  fuelType?: FuelType
  transmission?: TransmissionType
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  image: string | null
}

export interface AuthSession {
  user: AuthUser
  expires: string
}
