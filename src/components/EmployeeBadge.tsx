import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Employee } from '../types';
import { Shield, User, Star, Award } from 'lucide-react';

interface EmployeeBadgeProps {
  employee: Employee;
  date?: string;
  shift?: string;
  isDragging?: boolean;
  isPublic?: boolean;
}

export function EmployeeBadge({ employee, date, shift, isDragging, isPublic }: EmployeeBadgeProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${employee.id}-${date}-${shift}`,
    data: { employeeId: employee.id, date, shift },
    disabled: isPublic
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  const roleIcons = {
    TL: <Shield size={12} className="text-danger" />,
    Manager: <Award size={12} className="text-warning" />,
    Senior: <Star size={12} className="text-primary" />,
    Junior: <User size={12} className="text-secondary" />
  };

  const roleColors = {
    TL: 'border-danger text-danger bg-danger bg-opacity-10',
    Manager: 'border-warning text-warning bg-warning bg-opacity-10',
    Senior: 'border-primary text-primary bg-primary bg-opacity-10',
    Junior: 'border-secondary text-secondary bg-secondary bg-opacity-10'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`
        px-3 py-2 rounded-3 border shadow-sm d-flex align-items-center gap-2 cursor-grab active:cursor-grabbing transition-all
        ${roleColors[employee.role]}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isPublic ? 'cursor-default' : ''}
      `}
    >
      {roleIcons[employee.role]}
      <span className="small fw-black text-uppercase tracking-tighter">{employee.name}</span>
    </div>
  );
}
