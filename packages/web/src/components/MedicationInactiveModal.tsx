'use client';

import { useState } from 'react';
import { apiClient } from '../lib/api-client';

interface MedicationInactiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicationId: string;
  medicationName: string;
  careRecipientName: string;
  onInactivated: () => void;
}

export default function MedicationInactiveModal({
  isOpen,
  onClose,
  medicationId,
  medicationName,
  careRecipientName,
  onInactivated,
}: MedicationInactiveModalProps) {
  const [scope, setScope] = useState<'single' | 'all'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!medicationId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await apiClient.markMedicationInactive(medicationId, scope);
      
      onInactivated();
      onClose();
      
    } catch (err) {
      console.error('Failed to mark medication inactive:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark medication inactive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setScope('single');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Make Medication Inactive</h2>
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
          <p className="text-gray-700 mb-4">
            You are about to mark "<strong>{medicationName}</strong>" as inactive. This action cannot be undone.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="single"
                  checked={scope === 'single'}
                  onChange={(e) => setScope(e.target.value as 'single')}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium">For {careRecipientName} only</div>
                  <div className="text-sm text-gray-500">
                    Mark this medication inactive only for {careRecipientName}
                  </div>
                </div>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={(e) => setScope(e.target.value as 'all')}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium">For all care recipients</div>
                  <div className="text-sm text-gray-500">
                    Mark this medication inactive for everyone
                  </div>
                </div>
              </label>
            </div>
          </div>
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
            className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Making Inactive...</span>
              </div>
            ) : (
              'Make Inactive'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}