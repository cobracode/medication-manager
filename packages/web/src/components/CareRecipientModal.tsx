'use client';

import { useState } from 'react';
import { MedicationDose, CareRecipient } from '../lib/mockData';
import MedicationInactiveModal from './MedicationInactiveModal';

interface CareRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  careRecipient: CareRecipient | null;
  doses: MedicationDose[];
  onMedicationInactivated?: () => void;
}

export default function CareRecipientModal({
  isOpen,
  onClose,
  careRecipient,
  doses,
  onMedicationInactivated
}: CareRecipientModalProps) {
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!isOpen || !careRecipient) return null;

  console.log("!!!   careRecipient", careRecipient);

  const handleMedicationClick = (dose: MedicationDose) => {
    setSelectedMedication({
      id: String(dose.id), // Using dose.id as medication ID for now
      name: dose.medicationName
    });
    setInactiveModalOpen(true);
  };

  const handleMedicationInactivated = () => {
    setInactiveModalOpen(false);
    setSelectedMedication(null);
    onMedicationInactivated?.();
  };

  // Filter and sort upcoming doses for this care recipient
  const today = new Date().toISOString().split('T')[0];
  const upcomingDoses = doses
    .filter(dose => 
      dose.careRecipientId === careRecipient.id && 
      dose.date >= today
    )
    .sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare === 0 ? a.time.localeCompare(b.time) : dateCompare;
    })
    .slice(0, 10); // Cap at 10 doses

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === today) {
      return 'Today';
    } else if (dateStr === tomorrowStr) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{careRecipient.name}</h2>
            <p className="text-gray-600">Age {careRecipient.age}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <h3 className="font-medium mb-3 text-gray-900">
            Upcoming Medications ({upcomingDoses.length}/10)
          </h3>
          
          {upcomingDoses.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingDoses.map((dose) => (
                <div
                  key={dose.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleMedicationClick(dose)}
                  title="Click to mark as inactive"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {dose.medicationName}
                    </div>
                    {dose.recurrence && (
                      <div className="text-xs text-blue-600 mt-1">
                        {dose.recurrence === 'daily' ? 'Daily' : 'Weekly'}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium text-gray-900">
                      {formatDate(dose.date)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(dose.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No upcoming medications scheduled
            </div>
          )}
        </div>

        <div className="pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>

        {selectedMedication && (
          <MedicationInactiveModal
            isOpen={inactiveModalOpen}
            onClose={() => {
              setInactiveModalOpen(false);
              setSelectedMedication(null);
            }}
            medicationId={selectedMedication.id}
            medicationName={selectedMedication.name}
            careRecipientName={careRecipient.name}
            onInactivated={handleMedicationInactivated}
          />
        )}
      </div>
    </div>
  );
}