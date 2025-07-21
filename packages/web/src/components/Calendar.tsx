'use client';

import { useState } from 'react';

interface MedicationDose {
  id: string;
  medicationName: string;
  careRecipientName: string;
  time: string;
  date: string;
}

interface CalendarProps {
  doses: MedicationDose[];
}

export default function Calendar({ doses }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Get next 7 days
  const getNextWeek = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
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
    return doses.filter(dose => dose.date === date);
  };

  const nextWeek = getNextWeek();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upcoming Medication Schedule</h2>
      
      {/* Week view */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {nextWeek.map((date) => {
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{dose.medicationName}</div>
                    <div className="text-sm text-gray-600">
                      for {dose.careRecipientName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">{dose.time}</div>
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
    </div>
  );
}