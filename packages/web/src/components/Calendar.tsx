'use client';

import { useState } from 'react';

interface MedicationDose {
  id: number;
  medicationName: string;
  careRecipientName: string;
  time: string;
  date: string;
}

interface CalendarProps {
  doses: MedicationDose[];
}

export default function Calendar({ doses }: CalendarProps) {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  // console.log("today", today, todayIso);

  console.log("!!!   doses", doses);

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  // console.log("selectedDate", selectedDate);

  // Get week starting from a specific offset
  const getWeek = (offset: number) => {
    const days = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (offset * 7));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    // console.log("week days", days);
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
    console.log("!!!   getDosesForDate, date", date);
    return doses.filter(dose => dose.date === date);
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