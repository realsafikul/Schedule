import { 
  format, 
  addDays, 
  isFriday, 
  getDate, 
  isSameDay, 
  parseISO 
} from 'date-fns';
import { Employee, Holiday, DaySchedule, ShiftType, Leave } from '../types';

/**
 * Smart Roster Engine
 * Handles rotation, Friday logic, holidays, and shift constraints.
 */

export function rotateShifts(employees: Employee[]): Employee[] {
  return employees.map(emp => {
    if (emp.role === 'TL' || emp.role === 'Manager') return emp;
    
    let nextShift: ShiftType = emp.currentShift;
    if (emp.currentShift === 'Morning') nextShift = 'Evening';
    else if (emp.currentShift === 'Evening') nextShift = 'Night';
    else if (emp.currentShift === 'Night') nextShift = 'Morning';
    
    return { ...emp, currentShift: nextShift };
  });
}

export function generateWeeklyRoster(
  startDate: Date,
  employees: Employee[],
  holidays: Holiday[],
  leaves: Leave[]
): DaySchedule[] {
  const schedule: DaySchedule[] = [];
  
  // For a 7-day roster, we use the current shifts of employees.
  // The rotation happens WEEKLY, so for these 7 days, the base shifts are fixed.
  
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startDate, i);
    const daySchedule = generateDaySchedule(
      currentDate,
      employees,
      holidays,
      leaves
    );
    schedule.push(daySchedule);
  }

  return schedule;
}

function generateDaySchedule(
  date: Date,
  employees: Employee[],
  holidays: Holiday[],
  leaves: Leave[]
): DaySchedule {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isFri = isFriday(date);
  const dayOfMonth = getDate(date);
  const isBillingFriday = isFri && dayOfMonth >= 1 && dayOfMonth <= 12;
  const isHoliday = holidays.some(h => isSameDay(parseISO(h.date), date));

  const shifts: DaySchedule['shifts'] = {
    morning: [],
    evening: [],
    night: [],
    off: []
  };

  // 1. Identify who is on leave
  const onLeaveIds = leaves
    .filter(l => {
      const start = parseISO(l.startDate);
      const end = parseISO(l.endDate);
      return date >= start && date <= end;
    })
    .map(l => l.employeeId);

  // 2. Determine who MUST be OFF
  const workingEmployees = employees.filter(emp => {
    const isOnLeave = onLeaveIds.includes(emp.id);
    if (isOnLeave) {
      shifts.off.push(emp.name);
      return false;
    }

    // TL and Manager are OFF on Fridays and Holidays
    const isTLorManager = emp.role === 'TL' || emp.role === 'Manager';
    if ((isFri || isHoliday) && isTLorManager) {
      shifts.off.push(emp.name);
      return false;
    }

    return true;
  });

  // 3. Assign Shifts based on constraints
  let remaining = [...workingEmployees];

  // Special Friday Logic
  if (isFri) {
    const targetMorning = isBillingFriday ? 2 : 1;
    const targetEvening = 1;
    const targetNight = 1;

    // Night (1)
    const nightEmp = remaining.find(e => e.currentShift === 'Night') || remaining[0];
    if (nightEmp) {
      shifts.night.push(nightEmp.name);
      remaining = remaining.filter(e => e.id !== nightEmp.id);
    }

    // Evening (1)
    const eveningEmp = remaining.find(e => e.currentShift === 'Evening') || remaining[0];
    if (eveningEmp) {
      shifts.evening.push(eveningEmp.name);
      remaining = remaining.filter(e => e.id !== eveningEmp.id);
    }

    // Morning (targetMorning)
    for (let i = 0; i < targetMorning && remaining.length > 0; i++) {
      const morningEmp = remaining.find(e => e.currentShift === 'Morning') || remaining[0];
      if (morningEmp) {
        shifts.morning.push(morningEmp.name);
        remaining = remaining.filter(e => e.id !== morningEmp.id);
      }
    }

    // Rest are OFF on Friday
    remaining.forEach(e => shifts.off.push(e.name));
    
    return { date: dateStr, shifts };
  }

  // Normal Day Logic (including Holidays for non-TL/Manager)
  // Night (Exactly 1)
  const nightEmp = remaining.find(e => e.currentShift === 'Night') || remaining.find(e => e.role !== 'TL' && e.role !== 'Manager');
  if (nightEmp) {
    shifts.night.push(nightEmp.name);
    remaining = remaining.filter(e => e.id !== nightEmp.id);
  }

  // Evening (Exactly 2)
  for (let i = 0; i < 2 && remaining.length > 0; i++) {
    const eveningEmp = remaining.find(e => e.currentShift === 'Evening') || remaining.find(e => e.role !== 'TL' && e.role !== 'Manager');
    if (eveningEmp) {
      shifts.evening.push(eveningEmp.name);
      remaining = remaining.filter(e => e.id !== eveningEmp.id);
    }
  }

  // Morning (Rest - should be 4-5)
  remaining.forEach(e => shifts.morning.push(e.name));

  return {
    date: dateStr,
    shifts
  };
}
