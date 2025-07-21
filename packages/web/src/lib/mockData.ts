export interface CareRecipient {
  id: string;
  name: string;
  age: number;
  relationship: string;
}

export interface MedicationDose {
  id: string;
  medicationName: string;
  careRecipientId: string;
  careRecipientName: string;
  time: string;
  date: string;
  recurrence?: 'daily' | 'weekly';
}

export const mockCareRecipients: CareRecipient[] = [
  {
    id: '1',
    name: 'Eleanor Smith',
    age: 78,
    relationship: 'Mother'
  },
  {
    id: '2',
    name: 'Robert Johnson',
    age: 85,
    relationship: 'Father-in-law'
  },
  {
    id: '3',
    name: 'Mary Williams',
    age: 72,
    relationship: 'Aunt'
  },
  {
    id: '4',
    name: 'James Brown',
    age: 69,
    relationship: 'Uncle'
  },
  {
    id: '5',
    name: 'Patricia Davis',
    age: 81,
    relationship: 'Grandmother'
  }
];

export const mockMedicationDoses: MedicationDose[] = [
  {
    id: '1',
    medicationName: 'Lisinopril 10mg',
    careRecipientId: '1',
    careRecipientName: 'Eleanor Smith',
    time: '08:00',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'daily'
  },
  {
    id: '2',
    medicationName: 'Metformin 500mg',
    careRecipientId: '1',
    careRecipientName: 'Eleanor Smith',
    time: '18:00',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'daily'
  },
  {
    id: '3',
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
    id: '4',
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
    id: '5',
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
          id: `${dose.id}-${i}`,
          date: nextDate.toISOString().split('T')[0]
        });
        
        idCounter++;
      }
    }
  });

  return allDoses;
}