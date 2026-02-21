import { format, addDays, startOfWeek, isFriday, getDate, isSameDay, parseISO } from 'date-fns';

export type Role = 'TL' | 'Manager' | 'Senior' | 'Junior';
export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'OFF';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  fridayOff: boolean;
  holidayOff: boolean;
  currentShift: ShiftType;
}

export interface Holiday {
  id?: string;
  date: string; // ISO format
  name: string;
}

export interface Leave {
  id?: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'Sick' | 'Casual';
}

export interface DaySchedule {
  date: string;
  shifts: {
    morning: string[];
    evening: string[];
    night: string[];
    off: string[];
  };
}

export interface Roster {
  id: string;
  weekStartDate: string;
  schedule: DaySchedule[];
}

export interface Notice {
  id: string;
  content: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'public';
}

export const HOLIDAYS_2026: Holiday[] = [
  { date: '2026-02-04', name: 'Government Holiday' },
  { date: '2026-02-21', name: 'International Mother Language Day' },
  { date: '2026-03-18', name: 'Government Holiday' },
  { date: '2026-03-21', name: 'Government Holiday' },
  { date: '2026-03-26', name: 'Independence Day' },
  { date: '2026-04-14', name: 'Pahela Baishakh' },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-05-25', name: 'Government Holiday' },
  { date: '2026-06-26', name: 'Government Holiday' },
  { date: '2026-08-05', name: 'Government Holiday' },
  { date: '2026-10-21', name: 'Government Holiday' },
  { date: '2026-12-16', name: 'Victory Day' },
];

export const INITIAL_EMPLOYEES: Omit<Employee, 'id'>[] = [
  { name: 'Safikul', role: 'TL', fridayOff: true, holidayOff: true, currentShift: 'Morning' },
  { name: 'Faisal', role: 'Manager', fridayOff: true, holidayOff: true, currentShift: 'Morning' },
  { name: 'Shamsur', role: 'Senior', fridayOff: false, holidayOff: false, currentShift: 'Morning' },
  { name: 'Sujan', role: 'Senior', fridayOff: false, holidayOff: false, currentShift: 'Evening' },
  { name: 'Rony', role: 'Junior', fridayOff: false, holidayOff: false, currentShift: 'Night' },
  { name: 'Sakib', role: 'Junior', fridayOff: false, holidayOff: false, currentShift: 'Morning' },
  { name: 'GM Sakib', role: 'Junior', fridayOff: false, holidayOff: false, currentShift: 'Evening' },
  { name: 'Sajid', role: 'Junior', fridayOff: false, holidayOff: false, currentShift: 'Morning' },
];
