import { DaySchedule, Employee, Role } from '../types';
import { isFriday, parseISO } from 'date-fns';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateShiftMove = (
  employeeId: string,
  targetDate: string,
  targetShift: 'morning' | 'evening' | 'night',
  currentSchedule: Record<string, DaySchedule>,
  employees: Employee[],
  isEmergencyMode: boolean
): ValidationResult => {
  if (isEmergencyMode) return { isValid: true };

  const employee = employees.find(e => e.id === employeeId);
  if (!employee) return { isValid: false, error: 'Employee not found' };

  const daySchedule = currentSchedule[targetDate];
  if (!daySchedule) return { isValid: false, error: 'Invalid date' };

  const isFri = isFriday(parseISO(targetDate));

  // 1. Duplicate shift same day
  const isAlreadyAssigned = 
    daySchedule.morning.includes(employeeId) || 
    daySchedule.evening.includes(employeeId) || 
    daySchedule.night.includes(employeeId);
  
  // Note: If we are moving within the same day, we handle that in the drag engine
  // This validation is for "Can this employee be in this shift?"

  // 2. TL assigned to Evening/Night
  if (employee.role === 'TL' && (targetShift === 'evening' || targetShift === 'night')) {
    return { isValid: false, error: 'Team Leads cannot be assigned to Evening or Night shifts' };
  }

  // 3. TL/Manager assigned on Friday
  if (isFri && (employee.role === 'TL' || employee.role === 'Manager')) {
    return { isValid: false, error: 'TLs and Managers are OFF on Fridays' };
  }

  // 4. Capacity checks
  if (targetShift === 'evening' && daySchedule.evening.length >= 2) {
    return { isValid: false, error: 'Evening shift is full (max 2)' };
  }

  if (targetShift === 'night' && daySchedule.night.length >= 1) {
    return { isValid: false, error: 'Night shift is full (max 1)' };
  }

  if (targetShift === 'morning' && daySchedule.morning.length >= 5) {
    return { isValid: false, error: 'Morning shift is full (max 5)' };
  }

  return { isValid: true };
};
