'use client';

import { useState } from 'react';
import MedicationInactiveModal from './MedicationInactiveModal';
import MedicationTakenModal from './MedicationTakenModal';

interface MedicationDose {
  id: number;
  medicationName: string;
  careRecipientName: string;
  time: string;
  date: string;
  isCompleted?: boolean;
}

interface CalendarProps {
  doses: MedicationDose[];
  onMedicationInactivated?: () => void;
  onMedicationCompleted?: () => void;
}

export default function Calendar({ doses, onMedicationInactivated, onMedicationCompleted }: CalendarProps) {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [inactiveModalOpen, setInactiveModalOpen] = useState(false);
  const [takenModalOpen, setTakenModalOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationDose | null>(null);

  // Get week starting from a specific offset
  const getWeek = (offset: number) => {
    const days = [];
    const today = new Date();
    
    // Find Monday of current week
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, otherwise go back to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (offset * 7));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }

    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'prev' ? weekOffset - 1 : weekOffset + 1;
    setWeekOffset(newOffset);
    
    // Update selected date to first day of new week if current selection is not in visible week
    const newWeek = getWeek(newOffset);
    if (!newWeek.includes(selectedDate)) {
      setSelectedDate(newWeek[0]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    };
  };

  const getDosesForDate = (date: string) => {
    // Filter out taken/completed doses
    return doses.filter(dose => dose.date === date && !dose.isCompleted);
  };

  const currentWeek = getWeek(weekOffset);

  const getWeekTitle = () => {
    const firstDay = new Date(currentWeek[0]);
    const lastDay = new Date(currentWeek[6]);
    const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
    const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
    
    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay.getDate()}-${lastDay.getDate()}`;
    } else {
      return `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}`;
    }
  };

  const handleInactiveClick = (dose: MedicationDose) => {
    setSelectedMedication(dose);
    setInactiveModalOpen(true);
  };

  const handleTakenClick = (dose: MedicationDose) => {
    setSelectedMedication(dose);
    setTakenModalOpen(true);
  };

  const handleMedicationInactivated = () => {
    setSelectedMedication(null);
    if (onMedicationInactivated) {
      onMedicationInactivated();
    }
  };

  const handleMedicationCompleted = () => {
    setSelectedMedication(null);
    if (onMedicationCompleted) {
      onMedicationCompleted();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Medication Schedule</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{getWeekTitle()}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous week"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next week"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Week view */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {currentWeek.map((date) => {
          const { day, date: dayNum, month } = formatDate(date);
          const dayDoses = getDosesForDate(date);
          const isToday = date === new Date().toISOString().split('T')[0];
          
          return (
            <div
              key={date}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedDate === date
                  ? 'bg-blue-50 border-blue-300'
                  : isToday
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-center">
                <div className="text-xs text-gray-500">{day}</div>
                <div className="text-lg font-medium">{dayNum}</div>
                <div className="text-xs text-gray-500">{month}</div>
                {dayDoses.length > 0 && (
                  <div className="mt-1 text-xs bg-blue-600 text-white rounded-full px-2 py-1">
                    {dayDoses.length}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Doses for selected date */}
      <div>
        <h3 className="font-medium mb-3">
          {selectedDate === new Date().toISOString().split('T')[0]
            ? 'Today\'s Medications'
            : `Medications for ${formatDate(selectedDate).day}, ${formatDate(selectedDate).month} ${formatDate(selectedDate).date}`
          }
        </h3>
        
        <div className="space-y-3">
          {getDosesForDate(selectedDate).length > 0 ? (
            getDosesForDate(selectedDate)
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((dose) => (
                <div
                  key={dose.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    dose.isCompleted 
                      ? 'bg-gray-100 opacity-75' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div>
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
                    <div className={`text-sm ${
                      dose.isCompleted 
                        ? 'text-gray-400' 
                        : 'text-gray-600'
                    }`}>
                      for {dose.careRecipientName}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className={`font-medium ${
                        dose.isCompleted 
                          ? 'text-gray-400' 
                          : 'text-blue-600'
                      }`}>
                        {dose.time}
                      </div>
                    </div>
                    {!dose.isCompleted && (
                      <>
                        <button
                          onClick={() => handleTakenClick(dose)}
                          className="p-1 text-gray-400 hover:text-green-600 focus:outline-none focus:text-green-600"
                          title="Mark as taken"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleInactiveClick(dose)}
                          className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600"
                          title="Mark medication as inactive"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No medications scheduled for this date
            </p>
          )}
        </div>
      </div>

      {/* Inactive Modal */}
      {selectedMedication && (
        <MedicationInactiveModal
          isOpen={inactiveModalOpen}
          onClose={() => setInactiveModalOpen(false)}
          medicationId={selectedMedication.id.toString()}
          medicationName={selectedMedication.medicationName}
          careRecipientName={selectedMedication.careRecipientName}
          onInactivated={handleMedicationInactivated}
        />
      )}

      {/* Taken Modal */}
      {selectedMedication && (
        <MedicationTakenModal
          isOpen={takenModalOpen}
          onClose={() => setTakenModalOpen(false)}
          medicationId={selectedMedication.id}
          medicationName={selectedMedication.medicationName}
          careRecipientName={selectedMedication.careRecipientName}
          scheduledDate={selectedMedication.date}
          scheduledTime={selectedMedication.time}
          onCompleted={handleMedicationCompleted}
        />
      )}
    </div>
  );
}