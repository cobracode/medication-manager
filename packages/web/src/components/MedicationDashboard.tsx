'use client';

import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import Calendar from './Calendar';
import AddMedicationModal from './AddMedicationModal';
import CareRecipientModal from './CareRecipientModal';
import { apiClient } from '../lib/api-client';
import { MedicationDose, CareRecipient, convertBackendCareRecipient, convertBackendMedicationDose } from '../lib/mockData';

interface User {
  profile?: {
    name?: string;
    email?: string;
    nickname?: string;
  };
}

interface MedicationDashboardProps {
  user: User | null;
  onSignOut: () => void;
}

export default function MedicationDashboard({ user, onSignOut }: MedicationDashboardProps) {
  const auth = useAuth();
  const [doses, setDoses] = useState<MedicationDose[]>([]);
  const [careRecipients, setCareRecipients] = useState<CareRecipient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCareRecipient, setSelectedCareRecipient] = useState<CareRecipient | null>(null);
  const [isCareRecipientModalOpen, setIsCareRecipientModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize API client with user
  useEffect(() => {
    if (auth.user) {
      console.log("!!!   setting user", auth.user);
      apiClient.setUser(auth.user);
    }
  }, [auth.user]);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      if (!auth.user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Ensure user profile exists (creates user if needed), then load care recipients and medications
        const [userProfile, backendRecipients, backendMedications] = await Promise.all([
          apiClient.getUserProfile(),
          apiClient.getCareRecipients(),
          apiClient.getMedications({ isActive: true })
        ]);

        // Convert backend data to frontend format
        const convertedRecipients = backendRecipients.map(convertBackendCareRecipient);
        setCareRecipients(convertedRecipients);

        // Convert medications with recipient names
        const recipientMap = new Map(backendRecipients.map(r => [r.id, r.name]));
        const convertedDoses = backendMedications.map(dose => 
          convertBackendMedicationDose(dose, recipientMap.get(dose.careRecipientId) || 'Unknown')
        );
        setDoses(convertedDoses);

      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [auth.user]);

  const handleAddMedication = async (newMedication: {
    medicationName: string;
    careRecipientId: string;
    date: string;
    time: string;
    recurrence?: 'daily' | 'weekly';
  }) => {
    try {
      setError(null);
      
      // Calculate recurrence end date (30 days for daily, 8 weeks for weekly)
      const recurrenceEndDate = newMedication.recurrence ? (() => {
        const endDate = new Date(newMedication.date);
        if (newMedication.recurrence === 'daily') {
          endDate.setDate(endDate.getDate() + 30);
        } else if (newMedication.recurrence === 'weekly') {
          endDate.setDate(endDate.getDate() + 56); // 8 weeks
        }
        return endDate.toISOString().split('T')[0];
      })() : undefined;

      // Create medication via API
      const createdDoses = await apiClient.createMedication({
        medicationName: newMedication.medicationName,
        careRecipientId: newMedication.careRecipientId,
        scheduledDate: newMedication.date,
        scheduledTime: newMedication.time,
        dosage: '1 dose', // Default dosage
        recurrenceType: newMedication.recurrence || 'none',
        recurrenceEndDate,
      });
      // Convert to frontend format and add to state
      const careRecipient = careRecipients.find(cr => Number(cr.id) === Number(newMedication.careRecipientId));
      
      const convertedDoses = createdDoses?.doses?.map(dose => 
        convertBackendMedicationDose(dose, careRecipient?.name || 'Unknown')
      );
      
      setDoses(prev => [...prev, ...(convertedDoses || [])]);
      
    } catch (err) {
      console.error('Failed to add medication:', err);
      setError(err instanceof Error ? err.message : 'Failed to add medication');
    }
  };

  const handleCareRecipientClick = (recipient: CareRecipient) => {
    setSelectedCareRecipient(recipient);
    setIsCareRecipientModalOpen(true);
  };

  const handleMedicationInactivated = async () => {
    try {
      setError(null);
      
      // Reload medications to reflect the inactive status
      const backendMedications = await apiClient.getMedications({ isActive: true });
      
      // Convert medications with recipient names
      const recipientMap = new Map(careRecipients.map(r => [r.id, r.name]));
      const convertedDoses = backendMedications.map(dose => 
        convertBackendMedicationDose(dose, recipientMap.get(dose.careRecipientId) || 'Unknown')
      );
      setDoses(convertedDoses);
      
    } catch (err) {
      console.error('Failed to reload medications after inactivation:', err);
      setError(err instanceof Error ? err.message : 'Failed to reload medications');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Medication Manager</h1>
              <p className="text-gray-600">
                Welcome, {user?.profile?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Medication
              </button>
              <button
                onClick={onSignOut}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm underline ml-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading medication data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-3">
              <Calendar doses={doses} onMedicationInactivated={handleMedicationInactivated} />
            </div>

            {/* Care Recipients */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Care Recipients</h2>
                <div className="space-y-3">
                  {careRecipients.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">
                      No care recipients found.
                    </div>
                  ) : (
                    careRecipients.map((recipient) => {
                      const recipientDoses = doses.filter(dose => dose.careRecipientId === recipient.id);
                      const todaysDoses = recipientDoses.filter(dose => 
                        dose.date === new Date().toISOString().split('T')[0]
                      );
                      
                      return (
                        <div 
                          key={recipient.id} 
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleCareRecipientClick(recipient)}
                        >
                          <div className="font-medium">{recipient.name}</div>
                          <div className="text-sm text-gray-600">
                            Age {recipient.age}
                          </div>
                          {todaysDoses.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {todaysDoses.length} dose{todaysDoses.length > 1 ? 's' : ''} today
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">Click to view upcoming doses</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddMedication}
        careRecipients={careRecipients}
      />

      {/* Care Recipient Modal */}
      <CareRecipientModal
        isOpen={isCareRecipientModalOpen}
        onClose={() => setIsCareRecipientModalOpen(false)}
        careRecipient={selectedCareRecipient}
        doses={doses}
        onMedicationInactivated={handleMedicationInactivated}
      />
    </div>
  );
}
