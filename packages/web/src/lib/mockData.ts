// Legacy types - use api-client types for new code
export interface CareRecipient {
  id: string;
  name: string;
  age: number;
}

export interface MedicationDose {
  id: number;
  medicationName: string;
  careRecipientId: string;
  careRecipientName: string;
  time: string;
  date: string;
  recurrence?: 'daily' | 'weekly';
  isCompleted?: boolean;
}

// Type conversion utilities for backward compatibility
export function convertBackendCareRecipient(recipient: import('./api-client').CareRecipient): CareRecipient {
  return {
    id: recipient.id,
    name: recipient.name || '',
    age: recipient.age || 0
  };
}

export function convertBackendMedicationDose(dose: import('./api-client').MedicationDose, careRecipientName: string): MedicationDose {
  return {
    id: dose.id,
    medicationName: dose.medicationName,
    careRecipientId: dose.careRecipientId,
    careRecipientName: careRecipientName || dose.careRecipientName,
    time: dose.scheduledTime,
    date: dose.scheduledDate,
    isCompleted: dose.isCompleted,
  };
}

export const mockCareRecipients: CareRecipient[] = [
  {
    id: '1',
    name: 'Eleanor Smith',
    age: 78,
  },
  {
    id: '2',
    name: 'Robert Johnson',
    age: 85,
  },
  {
    id: '3',
    name: 'Mary Williams',
    age: 72,
  },
  {
    id: '4',
    name: 'James Brown',
    age: 69,
  },
  {
    id: '5',
    name: 'Patricia Davis',
    age: 81,
  }
];

export const mockMedicationDoses: MedicationDose[] = [
  {
    id: 1,
    medicationName: 'Lisinopril 10mg',
    careRecipientId: '1',
    careRecipientName: 'Eleanor Smith',
    time: '08:00',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'daily'
  },
  {
    id: 2,
    medicationName: 'Metformin 500mg',
    careRecipientId: '1',
    careRecipientName: 'Eleanor Smith',
    time: '18:00',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'daily'
  },
  {
    id: 3,
    medicationName: 'Vitamin D',
    careRecipientId: '2',
    careRecipientName: 'Robert Johnson',
    time: '09:00',
    date: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })(),
    recurrence: 'weekly'
  },
  {
    id: 4,
    medicationName: 'Advil 200mg',
    careRecipientId: '3',
    careRecipientName: 'Mary Williams',
    time: '12:00',
    date: (() => {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      return dayAfter.toISOString().split('T')[0];
    })()
  },
  {
    id: 5,
    medicationName: 'Calcium',
    careRecipientId: '4',
    careRecipientName: 'James Brown',
    time: '20:00',
    date: (() => {
      const threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      return threeDays.toISOString().split('T')[0];
    })(),
    recurrence: 'daily'
  }
];

export function generateRecurringDoses(baseDoses: MedicationDose[], daysAhead: number = 7): MedicationDose[] {
  const allDoses = [...baseDoses];
  let idCounter = baseDoses.length + 1;

  baseDoses.forEach(dose => {
    if (dose.recurrence) {
      const baseDate = new Date(dose.date);
      
      for (let i = 1; i <= daysAhead; i++) {
        const nextDate = new Date(baseDate);
        
        if (dose.recurrence === 'daily') {
          nextDate.setDate(baseDate.getDate() + i);
        } else if (dose.recurrence === 'weekly' && i % 7 === 0) {
          nextDate.setDate(baseDate.getDate() + i);
        } else if (dose.recurrence === 'weekly') {
          continue;
        }

        allDoses.push({
          ...dose,
          id: dose.id + i,
          date: nextDate.toISOString().split('T')[0]
        });
        
        idCounter++;
      }
    }
  });

  return allDoses;
}