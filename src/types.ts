export type Role = 'TL' | 'Manager' | 'Senior' | 'Junior';
export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'OFF';
export type Priority = 'low' | 'medium' | 'high';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  fridayOff: boolean;
  holidayOff: boolean;
  rotationPosition: ShiftType;
  totalNightCount: number;
  totalShiftCount: number;
  createdAt: string;
}

export interface ShiftTiming {
  startTime: string;
  endTime: string;
}

export interface ShiftTemplate {
  id: string;
  name: string; // Normal / Ramadan / Billing / Custom
  morning: ShiftTiming;
  evening: ShiftTiming;
  night: ShiftTiming;
  active: boolean;
}

export interface DayOverride {
  customStartTime?: string;
  customEndTime?: string;
}

export interface DaySchedule {
  morning: string[]; // employeeIds
  evening: string[]; // employeeIds
  night: string[];   // employeeIds
  overrides: Record<string, DayOverride>; // employeeId -> override
}

export interface Roster {
  id: string; // weekStartDate (ISO format)
  weekStartDate: string;
  templateId: string;
  days: Record<string, DaySchedule>; // YYYY-MM-DD -> DaySchedule
}

export interface Leave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: 'Sick' | 'Casual';
  approved: boolean;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  visibility: 'dashboard' | 'login' | 'mobile';
  active: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  employeeId?: string;
  date?: string;
  previousValue?: any;
  newValue?: any;
  adminId: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'public';
}
