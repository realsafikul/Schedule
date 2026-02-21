import React from 'react';
import { Roster, Employee, DaySchedule } from '../types';
import { format, parseISO, addDays } from 'date-fns';
import ShiftCell from './ShiftCell';
import { Moon, Sun, Coffee, Users } from 'lucide-react';

interface RosterGridProps {
  roster?: Roster;
  employees: Employee[];
  isPublic: boolean;
}

export default function RosterGrid({ roster, employees, isPublic }: RosterGridProps) {
  if (!roster || !roster.days) {
    return (
      <div className="p-5 text-center bg-light border-top">
        <div className="py-5">
          <Users size={48} className="text-secondary mb-3 opacity-25" />
          <h5 className="text-secondary fw-bold">No Roster Data</h5>
          <p className="text-muted small">Select a date or generate a new roster for this week.</p>
        </div>
      </div>
    );
  }

  const days = Object.keys(roster.days).sort();

  return (
    <div className="table-responsive">
      <table className="table table-bordered mb-0 align-middle">
        <thead className="bg-light">
          <tr>
            <th className="px-4 py-3 border-0 bg-light sticky-left" style={{ minWidth: '150px' }}>Date</th>
            <th className="px-4 py-3 border-0 bg-light text-primary">
              <div className="d-flex align-items-center gap-2">
                <Sun size={18} /> MORNING (09-06)
              </div>
            </th>
            <th className="px-4 py-3 border-0 bg-light text-warning">
              <div className="d-flex align-items-center gap-2">
                <Coffee size={18} /> EVENING (02-10)
              </div>
            </th>
            <th className="px-4 py-3 border-0 bg-light text-info">
              <div className="d-flex align-items-center gap-2">
                <Moon size={18} /> NIGHT (10-09)
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map(date => (
            <tr key={date}>
              <td className="px-4 py-3 bg-white border-start-0">
                <div className="fw-black text-dark">{format(parseISO(date), 'EEEE')}</div>
                <div className="text-muted small fw-bold">{format(parseISO(date), 'MMM d, yyyy')}</div>
              </td>
              <td className="p-0 border-0">
                <ShiftCell 
                  date={date} 
                  shift="morning" 
                  employeeIds={roster.days[date].morning} 
                  employees={employees}
                  isPublic={isPublic}
                />
              </td>
              <td className="p-0 border-0">
                <ShiftCell 
                  date={date} 
                  shift="evening" 
                  employeeIds={roster.days[date].evening} 
                  employees={employees}
                  isPublic={isPublic}
                />
              </td>
              <td className="p-0 border-0">
                <ShiftCell 
                  date={date} 
                  shift="night" 
                  employeeIds={roster.days[date].night} 
                  employees={employees}
                  isPublic={isPublic}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
