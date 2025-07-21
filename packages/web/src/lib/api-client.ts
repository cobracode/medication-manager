import { User } from 'react-oidc-context';

// Types imported from backend
export interface CareRecipient {
  id: string;
  name: string;
  dateOfBirth?: string;
  relationship?: string;
  isActive: boolean;
  userId: string;
  age?: number; // computed field
}

export interface MedicationDose {
  id: string;
  medicationName: string;
  careRecipientId: string;
  careRecipientName?: string; // populated by join
  scheduledDate: string;
  scheduledTime: string;
  dosage: string;
  isCompleted: boolean;
  isActive: boolean;
  userId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCareRecipientRequest {
  name: string;
  dateOfBirth?: string;
  relationship?: string;
}

export interface CreateMedicationRequest {
  medicationName: string;
  careRecipientId: string;
  scheduledDate: string;
  scheduledTime: string;
  dosage: string;
  recurrenceType?: 'daily' | 'weekly' | 'none';
  recurrenceEndDate?: string;
  notes?: string;
}

export interface GetMedicationsQuery {
  careRecipientId?: string;
  dateFrom?: string;
  dateTo?: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private user: User | null = null;

  constructor() {
    // Get API URL from environment variable or default
    // Note: SST will inject the API URL into NEXT_PUBLIC_API_URL during deployment
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.NEXT_PUBLIC_MEDICATION_API_URL || 
                   'http://localhost:3001/api'; // Fallback for local development
    
    if (typeof window !== 'undefined') {
      console.log('API Client initialized with baseUrl:', this.baseUrl);
    }
  }

  setUser(user: User | null) {
    this.user = user;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.user?.access_token) {
      headers.Authorization = `Bearer ${this.user.access_token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('API URL not configured. Please deploy the backend or set NEXT_PUBLIC_API_URL.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log("response", response);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Handle empty responses (like DELETE)
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to API. Please check your connection and ensure the backend is deployed.');
      }
      throw error;
    }
  }

  // Care Recipients API
  async getCareRecipients(): Promise<CareRecipient[]> {
    const recipients = await this.request<CareRecipient[]>('/care-recipients');
    
    // Calculate age if dateOfBirth is provided
    return recipients.map(recipient => ({
      ...recipient,
      age: recipient.dateOfBirth ? this.calculateAge(recipient.dateOfBirth) : undefined
    }));
  }

  async createCareRecipient(data: CreateCareRecipientRequest): Promise<CareRecipient> {
    return this.request<CareRecipient>('/care-recipients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCareRecipient(id: string, data: Partial<CreateCareRecipientRequest>): Promise<CareRecipient> {
    return this.request<CareRecipient>(`/care-recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCareRecipient(id: string): Promise<void> {
    return this.request<void>(`/care-recipients/${id}`, {
      method: 'DELETE',
    });
  }

  // Medications API
  async getMedications(query: GetMedicationsQuery = {}): Promise<MedicationDose[]> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/medications${queryString ? `?${queryString}` : ''}`;
    
    return this.request<MedicationDose[]>(endpoint);
  }

  async createMedication(data: CreateMedicationRequest): Promise<MedicationDose[]> {
    return this.request<MedicationDose[]>('/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedication(id: string, data: Partial<MedicationDose>): Promise<MedicationDose> {
    return this.request<MedicationDose>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeMedication(id: string): Promise<{ id: string; isCompleted: boolean; updatedAt: string }> {
    return this.request(`/medications/${id}/complete`, {
      method: 'PATCH',
    });
  }

  async deleteMedication(id: string): Promise<void> {
    return this.request<void>(`/medications/${id}`, {
      method: 'DELETE',
    });
  }

  // User Profile API
  async getUserProfile(): Promise<any> {
    return this.request('/user/profile');
  }

  async updateUserProfile(data: any): Promise<any> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Helper methods
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get medications for a specific date range (used by Calendar)
  async getMedicationsForDateRange(startDate: string, endDate: string): Promise<MedicationDose[]> {
    return this.getMedications({
      dateFrom: startDate,
      dateTo: endDate,
      isActive: true,
    });
  }

  // Get upcoming medications for a care recipient (used by CareRecipientModal)
  async getUpcomingMedications(careRecipientId: string, _limit: number = 10): Promise<MedicationDose[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // Next 30 days
    
    return this.getMedications({
      careRecipientId,
      dateFrom: today,
      dateTo: futureDate.toISOString().split('T')[0],
      isActive: true,
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();