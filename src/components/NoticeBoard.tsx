import React, { useState } from 'react';
import { Notice } from '../types';
import { Bell, Trash2, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface NoticeBoardProps {
  notices: Notice[];
  isAdmin: boolean;
  onAddNotice?: (content: string, priority: 'low' | 'medium' | 'high') => void;
  onDeleteNotice?: (id: string) => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ notices, isAdmin, onAddNotice, onDeleteNotice }) => {
  const [newNotice, setNewNotice] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAdding, setIsAdding] = useState(false);

  const priorityColors = {
    low: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    medium: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
    high: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Bell size={20} />
          </div>
          <h3 className="font-bold text-lg tracking-tight">Notice Board</h3>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <Plus size={20} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'} />
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {isAdmin && isAdding && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <textarea 
              value={newNotice}
              onChange={(e) => setNewNotice(e.target.value)}
              placeholder="Type your notice here..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                      priority === p ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-50'
                    } ${priorityColors[p]}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  if (newNotice.trim() && onAddNotice) {
                    onAddNotice(newNotice, priority);
                    setNewNotice('');
                    setIsAdding(false);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                Post Notice
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {notices.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <AlertCircle size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">No active notices at the moment.</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div 
                key={notice.id}
                className={`p-4 rounded-2xl border transition-all hover:shadow-md group relative ${priorityColors[notice.priority]}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {notice.priority} Priority • {format(new Date(notice.createdAt), 'MMM d, h:mm a')}
                  </span>
                  {isAdmin && onDeleteNotice && (
                    <button 
                      onClick={() => onDeleteNotice(notice.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{notice.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
