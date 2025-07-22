// Database entity types that match the MySQL schema

export interface User {
  id: string; // Cognito user ID (sub claim)
  email: string;
  name?: string;
  phone?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareRecipient {
  id: string;
  userId: string;
  name: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationDose {
  id: number;
  userId: string;
  careRecipientId: string;
  medicationName: string;
  dosage: string;
  scheduledDate: Date;
  scheduledTime: string; // HH:MM format
  isCompleted: boolean;
  completedAt?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationTemplate {
  id: string;
  userId: string;
  careRecipientId: string;
  medicationName: string;
  dosage: string;
  timeOfDay: string; // HH:MM format
  recurrenceType: 'daily' | 'weekly' | 'monthly';
  recurrenceDays?: string; // For weekly: "1,3,5", for monthly: day of month
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationHistory {
  id: string;
  medicationDoseId: string;
  userId: string;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: Date;
}

// API request/response types
export interface CreateCareRecipientRequest {
  name: string;
  dateOfBirth?: string;
  relationship?: string;
}

export interface UpdateCareRecipientRequest {
  name?: string;
  dateOfBirth?: string;
  relationship?: string;
  isActive?: boolean;
}

export interface CreateMedicationRequest {
  medicationName: string;
  careRecipientId: string;
  scheduledDate: string; // ISO date string
  scheduledTime: string; // HH:MM format
  dosage: string;
  recurrenceType?: 'daily' | 'weekly' | 'none';
  recurrenceEndDate?: string; // ISO date string
  notes?: string;
}

export interface UpdateMedicationRequest {
  medicationName?: string;
  dosage?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface GetMedicationsQuery {
  careRecipientId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  isCompleted?: boolean;
  isActive?: boolean;
}

export interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
  timezone?: string;
}

// Frontend display types (with computed fields)
export interface MedicationDoseWithRecipient extends MedicationDose {
  careRecipient: CareRecipient;
}

export interface CareRecipientWithUpcomingMeds extends CareRecipient {
  upcomingMedications: MedicationDose[];
  todaysMedications: MedicationDose[];
  age: number; // Computed from dateOfBirth
}