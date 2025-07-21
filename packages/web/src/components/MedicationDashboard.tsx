'use client';

import { useState } from 'react';
import Calendar from './Calendar';
import AddMedicationModal from './AddMedicationModal';
import CareRecipientModal from './CareRecipientModal';
import { mockCareRecipients, mockMedicationDoses, generateRecurringDoses, MedicationDose, CareRecipient } from '../lib/mockData';

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
  const [doses, setDoses] = useState<MedicationDose[]>(generateRecurringDoses(mockMedicationDoses, 14));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCareRecipient, setSelectedCareRecipient] = useState<CareRecipient | null>(null);
  const [isCareRecipientModalOpen, setIsCareRecipientModalOpen] = useState(false);

  const handleAddMedication = (newMedication: {
    medicationName: string;
    careRecipientId: string;
    date: string;
    time: string;
    recurrence?: 'daily' | 'weekly';
  }) => {
    const careRecipient = mockCareRecipients.find(cr => cr.id === newMedication.careRecipientId);
    
    if (!careRecipient) return;

    const newDose: MedicationDose = {
      id: `user-${Date.now()}`,
      medicationName: newMedication.medicationName,
      careRecipientId: newMedication.careRecipientId,
      careRecipientName: careRecipient.name,
      time: newMedication.time,
      date: newMedication.date,
      recurrence: newMedication.recurrence
    };

    // Generate recurring doses if needed
    const newDoses = generateRecurringDoses([newDose], 14);
    setDoses(prev => [...prev, ...newDoses]);
  };

  const handleCareRecipientClick = (recipient: CareRecipient) => {
    setSelectedCareRecipient(recipient);
    setIsCareRecipientModalOpen(true);
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
                Welcome, {user?.profile?.name || user?.profile?.nickname || user?.profile?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Calendar doses={doses} />
          </div>

          {/* Care Recipients */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Care Recipients</h2>
              <div className="space-y-3">
                {mockCareRecipients.map((recipient) => {
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
                        {recipient.relationship}, age {recipient.age}
                      </div>
                      {todaysDoses.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {todaysDoses.length} dose{todaysDoses.length > 1 ? 's' : ''} today
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">Click to view upcoming doses</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddMedication}
        careRecipients={mockCareRecipients}
      />

      {/* Care Recipient Modal */}
      <CareRecipientModal
        isOpen={isCareRecipientModalOpen}
        onClose={() => setIsCareRecipientModalOpen(false)}
        careRecipient={selectedCareRecipient}
        doses={doses}
      />
    </div>
  );
}
