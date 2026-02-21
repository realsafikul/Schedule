import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  setDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, isConfigured } from './firebase';
import { Employee, Holiday, Leave, Roster, INITIAL_EMPLOYEES, HOLIDAYS_2026 } from './types';
import { RosterTable } from './components/RosterTable';
import { LeaveModal } from './components/LeaveModal';
import { ShiftActionModal } from './components/ShiftActionModal';
import { generateWeeklyRoster, rotateShifts } from './utils/rosterEngine';
import { exportToPDF, exportToExcel } from './utils/exportUtils';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { Calendar, Download, Plus, Settings, BarChart3, Moon, Sun, LogIn, ShieldAlert } from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ date: string; shift: string; employeeName: string } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(format(startOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd'));

  useEffect(() => {
    if (!isConfigured || !db) {
      setLoading(false);
      return;
    }

    // Real-time listeners
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      if (snap.empty) {
        INITIAL_EMPLOYEES.forEach(emp => addDoc(collection(db, 'employees'), emp));
      } else {
        setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
      }
    }, (err) => {
      console.error("Firestore Error:", err);
      if (err.code === 'permission-denied') setPermissionError(true);
    });

    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snap) => {
      if (snap.empty) {
        HOLIDAYS_2026.forEach(hol => addDoc(collection(db, 'holidays'), hol));
      } else {
        setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() } as Holiday)));
      }
    }, (err) => {
      if (err.code === 'permission-denied') setPermissionError(true);
    });

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snap) => {
      setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as Leave)));
    }, (err) => {
      if (err.code === 'permission-denied') setPermissionError(true);
    });

    const unsubRosters = onSnapshot(query(collection(db, 'rosters'), orderBy('weekStartDate', 'desc'), limit(5)), (snap) => {
      setRosters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Roster)));
      setLoading(false);
    }, (err) => {
      if (err.code === 'permission-denied') setPermissionError(true);
      setLoading(false);
    });

    return () => {
      unsubEmployees();
      unsubHolidays();
      unsubLeaves();
      unsubRosters();
    };
  }, []);

  const handleGenerateRoster = async () => {
    if (!isConfigured || !db || employees.length === 0) return;
    
    const weekStart = parseISO(selectedWeek);
    const schedule = generateWeeklyRoster(weekStart, employees, holidays, leaves);
    
    const newRoster: Omit<Roster, 'id'> = {
      weekStartDate: selectedWeek,
      schedule
    };

    try {
      await addDoc(collection(db, 'rosters'), newRoster);
      
      // Also rotate shifts for the employees for the NEXT week generation
      // This is a simplified way to maintain the "continuous rotation"
      const rotatedEmployees = rotateShifts(employees);
      for (const emp of rotatedEmployees) {
        await setDoc(doc(db, 'employees', emp.id), { currentShift: emp.currentShift }, { merge: true });
      }
      
      alert("Roster generated and employee shifts rotated for next week!");
    } catch (err) {
      console.error("Error saving roster:", err);
    }
  };

  const handleAddLeave = async (data: any) => {
    if (!isConfigured || !db) return;
    const employee = employees.find(e => e.id === data.employeeId || e.name === data.employeeName);
    if (!employee) return;

    try {
      await addDoc(collection(db, 'leaves'), {
        employeeId: employee.id,
        employeeName: employee.name,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type
      });
      alert(`Leave added for ${employee.name}. Please re-generate the roster.`);
    } catch (err) {
      console.error("Error adding leave:", err);
    }
  };

  const handleShiftAction = (action: string) => {
    if (!selectedCell) return;
    
    if (action === 'Sick' || action === 'Casual') {
      handleAddLeave({
        employeeName: selectedCell.employeeName,
        startDate: selectedCell.date,
        endDate: selectedCell.date,
        type: action
      });
    } else {
      alert(`Manual ${action} feature is coming soon! For now, please use the "Generate Roster" button to apply logic changes.`);
    }
    setIsActionModalOpen(false);
  };

  const currentRoster = rosters.find(r => r.weekStartDate === selectedWeek) || rosters[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Syncing with SaltSync...</p>
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-950 p-8 rounded-3xl border border-red-200 dark:border-red-900/30 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-red-600">Permission Denied</h2>
            <p className="text-slate-500 dark:text-slate-400">Your Firebase database is blocking the app. You need to update your <b>Firestore Rules</b>.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">How to fix:</p>
            <ol className="text-sm space-y-2 text-slate-600 dark:text-slate-400 list-decimal pl-4">
              <li>Go to <b>Firebase Console</b></li>
              <li>Click <b>Firestore Database</b> &gt; <b>Rules</b> tab</li>
              <li>Delete everything and paste the "Public Rules" provided by the assistant</li>
              <li>Click <b>Publish</b></li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            I've updated the rules, Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
            <Settings size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">One Step to Start</h2>
            <p className="text-slate-500 dark:text-slate-400">Paste your Firebase configuration into the Secrets panel to enable the scheduler.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">How to fix:</p>
            <ol className="text-sm space-y-2 text-slate-600 dark:text-slate-400 list-decimal pl-4">
              <li>Go to Firebase Console &gt; Project Settings</li>
              <li>Copy the <b>firebaseConfig</b> object</li>
              <li>Add a Secret named: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">VITE_FIREBASE_CONFIG</code></li>
              <li>Paste the code you copied as the value</li>
            </ol>
          </div>
          <p className="text-xs text-center text-slate-400">After adding secrets, the application will automatically refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
        <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-[60]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">S</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">SaltSync</h1>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Support Duty Scheduler</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95">
              <LogIn size={18} />
              <span className="hidden sm:inline">Admin Login</span>
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Action Bar */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight">Dashboard</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Week starting Saturday, {format(parseISO(selectedWeek), 'MMMM d, yyyy')}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input 
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                />
              </div>

              <button 
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <Plus size={18} className="text-indigo-600" />
                <span>Add Leave</span>
              </button>

              <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => currentRoster && exportToPDF(currentRoster)}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all" 
                  title="Export PDF"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => currentRoster && exportToExcel(currentRoster)}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-all" 
                  title="Export Excel"
                >
                  <BarChart3 size={18} />
                </button>
              </div>

              <button 
                onClick={handleGenerateRoster}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
              >
                Generate Roster
              </button>
            </div>
          </section>

          {/* Main Roster View */}
          {currentRoster ? (
            <RosterTable 
              schedule={currentRoster.schedule} 
              onCellClick={(date, shift, employeeName) => {
                setSelectedCell({ date, shift, employeeName });
                setIsActionModalOpen(true);
              }}
            />
          ) : (
            <div className="bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Calendar size={40} />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-xl font-bold">No Roster Found</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">There is no roster generated for the selected week. Click the button above to create one.</p>
              </div>
              <button 
                onClick={handleGenerateRoster}
                className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                Generate Now
              </button>
            </div>
          )}

          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard 
              label="Active Employees" 
              value={employees.length.toString()} 
              icon={<Plus className="text-blue-500" />} 
              color="blue"
            />
            <SummaryCard 
              label="Upcoming Holidays" 
              value={holidays.length.toString()} 
              icon={<Settings className="text-orange-500" />} 
              color="orange"
            />
            <SummaryCard 
              label="Pending Leaves" 
              value={leaves.length.toString()} 
              icon={<Plus className="text-red-500" />} 
              color="red"
            />
            <SummaryCard 
              label="Night Shifts" 
              value={currentRoster ? currentRoster.schedule.reduce((acc, day) => acc + day.shifts.night.length, 0).toString() : "0"} 
              icon={<BarChart3 className="text-purple-500" />} 
              color="purple"
            />
          </section>
        </main>

        <LeaveModal 
          isOpen={isLeaveModalOpen} 
          onClose={() => setIsLeaveModalOpen(false)} 
          employees={employees}
          onSubmit={handleAddLeave}
        />

        <ShiftActionModal 
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          data={selectedCell}
          onAction={handleShiftAction}
        />
      </div>
    </div>
  );
}

const SummaryCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20",
    orange: "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20",
    red: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20"
  };

  return (
    <div className={cn("p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</h3>
        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">{icon}</div>
      </div>
      <p className="text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
