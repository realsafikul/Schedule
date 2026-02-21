import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Employee } from '../types';
import { EmployeeBadge } from './EmployeeBadge';

interface ShiftCellProps {
  date: string;
  shift: 'morning' | 'evening' | 'night';
  employeeIds: string[];
  employees: Employee[];
  isPublic: boolean;
}

export default function ShiftCell({ date, shift, employeeIds, employees, isPublic }: ShiftCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${date}-${shift}`,
    data: { date, shift },
    disabled: isPublic
  });

  const cellEmployees = employeeIds
    .map(id => employees.find(e => e.id === id))
    .filter((e): e is Employee => !!e);

  return (
    <div 
      ref={setNodeRef}
      className={`p-3 min-vh-10 transition-all ${isOver ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
      style={{ minHeight: '120px' }}
    >
      <div className="d-flex flex-wrap gap-2">
        {cellEmployees.map(emp => (
          <EmployeeBadge 
            key={`${date}-${shift}-${emp.id}`} 
            {...{
              employee: emp,
              date: date,
              shift: shift,
              isPublic: isPublic
            } as any}
          />
        ))}
        {cellEmployees.length === 0 && !isOver && (
          <div className="text-muted small opacity-25 fst-italic py-2">No assignments</div>
        )}
      </div>
    </div>
  );
}
