'use client';

import { useState } from 'react';
import { apiClient } from '../lib/api-client';

interface MedicationTakenModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationId: number;
  medicationName: string;
  careRecipientName: string;
  scheduledDate: string;
  scheduledTime: string;
  onCompleted: () => void;
}

export default function MedicationTakenModal({
  isOpen,
  onClose,
  medicationId,
  medicationName,
  careRecipientName,
  scheduledDate,
  scheduledTime,
  onCompleted,
}: MedicationTakenModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!medicationId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await apiClient.completeMedication(String(medicationId));
      
      onCompleted();
      onClose();
      
    } catch (err) {
      console.error('Failed to mark medication as taken:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark medication as taken');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Mark as Taken</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="font-medium text-gray-900 mb-2">{medicationName}</div>
            <div className="text-sm text-gray-600">
              <div>For: <span className="font-medium">{careRecipientName}</span></div>
              <div>Scheduled: <span className="font-medium">{formatDate(scheduledDate)} at {formatTime(scheduledTime)}</span></div>
            </div>
          </div>
          
          <p className="text-gray-700">
            Confirm that this medication dose has been taken. This action cannot be undone.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Marking as Taken...</span>
              </div>
            ) : (
              'Mark as Taken'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}