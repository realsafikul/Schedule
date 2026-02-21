import React from 'react';
import { X, UserMinus, ArrowLeftRight, ShieldAlert } from 'lucide-react';

interface ShiftActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    date: string;
    shift: string;
    employeeName: string;
  } | null;
  onAction: (action: 'Sick' | 'Casual' | 'Swap' | 'Force') => void;
}

export const ShiftActionModal: React.FC<ShiftActionModalProps> = ({ isOpen, onClose, data, onAction }) => {
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
        
        <div className="p-2 grid grid-cols-1 gap-1">
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
          <ActionButton 
            icon={<ShieldAlert size={18} className="text-purple-500" />} 
            label="Force Assign" 
            onClick={() => onAction('Force')} 
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
