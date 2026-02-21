import { Employee, DaySchedule, ShiftType, Role, Leave } from '../types';
import { isFriday, format, addDays, parseISO } from 'date-fns';

export const getNextShift = (current: ShiftType): ShiftType => {
  switch (current) {
    case 'Morning': return 'Evening';
    case 'Evening': return 'Night';
    case 'Night': return 'Morning';
    default: return 'Morning';
  }
};

export const generateWeekSchedule = (
  weekStartDate: Date,
  employees: Employee[],
  leaves: Leave[],
  isBillingMode: boolean
): Record<string, DaySchedule> => {
  const schedule: Record<string, DaySchedule> = {};
  
  // Sort employees to maintain consistent rotation order
  const sortedEmployees = [...employees].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(weekStartDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const isFri = isFriday(currentDate);

    const daySchedule: DaySchedule = {
      morning: [],
      evening: [],
      night: [],
      overrides: {}
    };

    // Filter employees available today (not on leave)
    const availableEmployees = sortedEmployees.filter(emp => {
      const onLeave = leaves.some(leave => 
        leave.employeeId === emp.id && 
        parseISO(leave.startDate) <= currentDate && 
        parseISO(leave.endDate) >= currentDate
      );
      return !onLeave && emp.active;
    });

    if (isFri) {
      // Friday Logic
      // TL & Manager OFF
      const nonAdminEmployees = availableEmployees.filter(emp => emp.role !== 'TL' && emp.role !== 'Manager');
      
      const nightCount = 1;
      const eveningCount = 1;
      const morningCount = isBillingMode && currentDate.getDate() <= 12 ? 2 : 1;

      // Simple assignment for Friday (can be improved with rotation logic)
      let pointer = 0;
      for (let j = 0; j < nightCount && pointer < nonAdminEmployees.length; j++) {
        daySchedule.night.push(nonAdminEmployees[pointer++].id);
      }
      for (let j = 0; j < eveningCount && pointer < nonAdminEmployees.length; j++) {
        daySchedule.evening.push(nonAdminEmployees[pointer++].id);
      }
      for (let j = 0; j < morningCount && pointer < nonAdminEmployees.length; j++) {
        daySchedule.morning.push(nonAdminEmployees[pointer++].id);
      }
    } else {
      // Normal Day Logic
      // Morning -> 4-5, Evening -> 2, Night -> 1
      
      // Assign based on their current rotationPosition
      availableEmployees.forEach(emp => {
        if (emp.rotationPosition === 'Night' && daySchedule.night.length < 1) {
          daySchedule.night.push(emp.id);
        } else if (emp.rotationPosition === 'Evening' && daySchedule.evening.length < 2) {
          daySchedule.evening.push(emp.id);
        } else if (emp.rotationPosition === 'Morning' && daySchedule.morning.length < 5) {
          daySchedule.morning.push(emp.id);
        }
      });

      // Fill gaps if needed (e.g. if someone is on leave)
      const assignedIds = [...daySchedule.morning, ...daySchedule.evening, ...daySchedule.night];
      const remaining = availableEmployees.filter(emp => !assignedIds.includes(emp.id));

      remaining.forEach(emp => {
        if (daySchedule.night.length < 1) daySchedule.night.push(emp.id);
        else if (daySchedule.evening.length < 2) daySchedule.evening.push(emp.id);
        else if (daySchedule.morning.length < 5) daySchedule.morning.push(emp.id);
      });
    }

    schedule[dateStr] = daySchedule;
  }

  return schedule;
};
