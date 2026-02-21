import React, { useState } from 'react';
import { X, UserMinus, ArrowLeftRight, ShieldAlert, UserPlus } from 'lucide-react';
import { Employee } from '../types';

interface ShiftActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  data: {
    date: string;
    shift: string;
    employeeName: string;
  } | null;
  onAction: (action: 'Sick' | 'Casual' | 'Swap' | 'Force', targetEmployeeId?: string) => void;
}

export const ShiftActionModal: React.FC<ShiftActionModalProps> = ({ isOpen, onClose, employees, data, onAction }) => {
  const [selectedEmpId, setSelectedEmpId] = useState('');

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{data.employeeName}</h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{data.shift} Shift • {data.date}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-2 space-y-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Manual Assignment</label>
            <div className="flex gap-2">
              <select 
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <button 
                onClick={() => selectedEmpId && onAction('Force', selectedEmpId)}
                disabled={!selectedEmpId}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                title="Assign Manually"
              >
                <UserPlus size={18} />
              </button>
            </div>
          </div>

          <ActionButton 
            icon={<UserMinus size={18} className="text-red-500" />} 
            label="Mark Sick Leave" 
            onClick={() => onAction('Sick')} 
          />
          <ActionButton 
            icon={<UserMinus size={18} className="text-amber-500" />} 
            label="Mark Casual Leave" 
            onClick={() => onAction('Casual')} 
          />
          <ActionButton 
            icon={<ArrowLeftRight size={18} className="text-blue-500" />} 
            label="Swap Shift" 
            onClick={() => onAction('Swap')} 
          />
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 w-full p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group"
  >
    <div className="p-2 bg-white dark:bg-slate-950 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{label}</span>
  </button>
);
