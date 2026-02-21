import { DaySchedule, Employee, Leave } from '../types';

export const rebalanceDay = (
  daySchedule: DaySchedule,
  employeeId: string,
  employees: Employee[]
): DaySchedule => {
  // Remove employee from all shifts on that day
  const updatedDay: DaySchedule = {
    ...daySchedule,
    morning: daySchedule.morning.filter(id => id !== employeeId),
    evening: daySchedule.evening.filter(id => id !== employeeId),
    night: daySchedule.night.filter(id => id !== employeeId),
  };

  // Logic to fill the gap if necessary could go here
  // But the requirement says "Only affected day re-balance"
  // For now, we just remove them. The admin can drag someone else in.
  
  return updatedDay;
};
