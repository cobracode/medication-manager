'use client';

import { useState } from 'react';
import { MedicationDose, CareRecipient } from '../lib/mockData';
import MedicationInactiveModal from './MedicationInactiveModal';
import MedicationTakenModal from './MedicationTakenModal';

interface CareRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  careRecipient: CareRecipient | null;
  doses: MedicationDose[];
  onMedicationInactivated?: () => void;
  onMedicationCompleted?: () => void;
}

export default function CareRecipientModal({
  isOpen,
  onClose,
  careRecipient,
  doses,
  onMedicationInactivated,
  onMedicationCompleted
}: CareRecipientModalProps) {
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [takenModalOpen, setTakenModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationDose | null>(null);

  if (!isOpen || !careRecipient) return null;

  console.log("!!!   careRecipient", careRecipient);

  const handleInactiveClick = (dose: MedicationDose, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedMedication(dose);
    setInactiveModalOpen(true);
  };

  const handleTakenClick = (dose: MedicationDose, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedMedication(dose);
    setTakenModalOpen(true);
  };

  const handleMedicationInactivated = () => {
    setInactiveModalOpen(false);
    setSelectedMedication(null);
    onMedicationInactivated?.();
  };

  const handleMedicationCompleted = () => {
    setTakenModalOpen(false);
    setSelectedMedication(null);
    onMedicationCompleted?.();
  };

  // Filter and sort upcoming doses for this care recipient
  const today = new Date().toISOString().split('T')[0];
  const upcomingDoses = doses
    .filter(dose => 
      dose.careRecipientId === careRecipient.id && 
      dose.date >= today &&
      !dose.isCompleted
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
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    dose.isCompleted 
                      ? 'bg-gray-100 opacity-75' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-1">
                    <div className={`font-medium ${
                      dose.isCompleted 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {dose.medicationName}
                      {!!dose.isCompleted && (
                        <span className="ml-2 text-xs text-green-600 font-normal">
                          ✓ Taken
                        </span>
                      )}
                    </div>
                    {dose.recurrence && (
                      <div className={`text-xs mt-1 ${
                        dose.isCompleted 
                          ? 'text-gray-400' 
                          : 'text-blue-600'
                      }`}>
                        {dose.recurrence === 'daily' ? 'Daily' : 'Weekly'}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`font-medium ${
                        dose.isCompleted 
                          ? 'text-gray-400' 
                          : 'text-gray-900'
                      }`}>
                        {formatDate(dose.date)}
                      </div>
                      <div className={`text-sm ${
                        dose.isCompleted 
                          ? 'text-gray-400' 
                          : 'text-gray-600'
                      }`}>
                        {formatTime(dose.time)}
                      </div>
                    </div>
                    {!dose.isCompleted && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleTakenClick(dose, e)}
                          className="p-1 text-gray-400 hover:text-green-600 focus:outline-none focus:text-green-600"
                          title="Mark as taken"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleInactiveClick(dose, e)}
                          className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600"
                          title="Mark medication as inactive"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        </button>
                      </div>
                    )}
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
          <>
            <MedicationInactiveModal
              isOpen={inactiveModalOpen}
              onClose={() => {
                setInactiveModalOpen(false);
                setSelectedMedication(null);
              }}
              medicationId={selectedMedication.id.toString()}
              medicationName={selectedMedication.medicationName}
              careRecipientName={careRecipient.name}
              onInactivated={handleMedicationInactivated}
            />
            <MedicationTakenModal
              isOpen={takenModalOpen}
              onClose={() => {
                setTakenModalOpen(false);
                setSelectedMedication(null);
              }}
              medicationId={selectedMedication.id}
              medicationName={selectedMedication.medicationName}
              careRecipientName={careRecipient.name}
              scheduledDate={selectedMedication.date}
              scheduledTime={selectedMedication.time}
              onCompleted={handleMedicationCompleted}
            />
          </>
        )}
      </div>
    </div>
  );
}