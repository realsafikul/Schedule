import React from 'react';
import { format, parseISO } from 'date-fns';
import { DaySchedule } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RosterTableProps {
  schedule: DaySchedule[];
  onCellClick?: (date: string, shift: string, employeeName: string) => void;
}

export const RosterTable: React.FC<RosterTableProps> = ({ schedule, onCellClick }) => {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-500 w-40">Date</th>
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-blue-600">Morning (09-06)</th>
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-orange-600">Evening (02-10)</th>
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-purple-600">Night (10-09)</th>
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-slate-400">OFF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {schedule.map((day, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {format(parseISO(day.date), 'EEE, MMM d')}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {format(parseISO(day.date), 'yyyy')}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {day.shifts.morning.map(name => (
                      <ShiftBadge key={name} name={name} variant="morning" onClick={() => onCellClick?.(day.date, 'morning', name)} />
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {day.shifts.evening.map(name => (
                      <ShiftBadge key={name} name={name} variant="evening" onClick={() => onCellClick?.(day.date, 'evening', name)} />
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {day.shifts.night.map(name => (
                      <ShiftBadge key={name} name={name} variant="night" onClick={() => onCellClick?.(day.date, 'night', name)} />
                    ))}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {day.shifts.off.map(name => (
                      <ShiftBadge key={name} name={name} variant="off" onClick={() => onCellClick?.(day.date, 'off', name)} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ShiftBadge: React.FC<{ name: string; variant: 'morning' | 'evening' | 'night' | 'off'; onClick?: () => void }> = ({ name, variant, onClick }) => {
  const variants = {
    morning: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40",
    evening: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40",
    night: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40",
    off: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm active:scale-95",
        variants[variant]
      )}
    >
      {name}
    </button>
  );
};
