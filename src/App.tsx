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
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { db, auth, isConfigured } from './firebase';
import { Employee, Holiday, Leave, Roster, Notice, INITIAL_EMPLOYEES, HOLIDAYS_2026 } from './types';
import { RosterTable } from './components/RosterTable';
import { LeaveModal } from './components/LeaveModal';
import { ShiftActionModal } from './components/ShiftActionModal';
import { NoticeBoard } from './components/NoticeBoard';
import { generateWeeklyRoster, rotateShifts } from './utils/rosterEngine';
import { exportToPDF, exportToExcel } from './utils/exportUtils';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { Calendar, Download, Plus, Settings, BarChart3, Moon, Sun, LogIn, ShieldAlert, LogOut, User, Lock, Mail, Bell, LayoutDashboard, Globe } from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'public' | 'admin' | 'login'>('public');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('SALTSYNC_DARK_MODE');
    return saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('SALTSYNC_DARK_MODE', darkMode.toString());
  }, [darkMode]);
  const [permissionError, setPermissionError] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [manualConfig, setManualConfig] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
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

    const unsubNotices = onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(10)), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
    });

    const unsubAuth = auth ? onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setView('admin');
    }) : () => {};

    return () => {
      unsubEmployees();
      unsubHolidays();
      unsubLeaves();
      unsubRosters();
      unsubNotices();
      unsubAuth();
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

  const handleShiftAction = async (action: string, targetEmployeeId?: string) => {
    if (!selectedCell || !currentRoster || !db || !user) return;
    
    if (action === 'Sick' || action === 'Casual') {
      handleAddLeave({
        employeeName: selectedCell.employeeName,
        startDate: selectedCell.date,
        endDate: selectedCell.date,
        type: action
      });
    } else if (action === 'Force' && targetEmployeeId) {
      const targetEmp = employees.find(e => e.id === targetEmployeeId);
      if (!targetEmp) return;

      const updatedSchedule = currentRoster.schedule.map(day => {
        if (day.date === selectedCell.date) {
          const shiftKey = selectedCell.shift.toLowerCase() as keyof typeof day.shifts;
          const currentShifts = [...(day.shifts[shiftKey] as string[])];
          
          // Remove the old employee and add the new one
          const filteredShifts = currentShifts.filter(name => name !== selectedCell.employeeName);
          if (!filteredShifts.includes(targetEmp.name)) {
            filteredShifts.push(targetEmp.name);
          }
          
          return {
            ...day,
            shifts: {
              ...day.shifts,
              [shiftKey]: filteredShifts
            }
          };
        }
        return day;
      });

      try {
        await setDoc(doc(db, 'rosters', currentRoster.id), {
          schedule: updatedSchedule
        }, { merge: true });
        alert(`Successfully assigned ${targetEmp.name} to ${selectedCell.shift} shift on ${selectedCell.date}`);
      } catch (err) {
        console.error("Error updating roster:", err);
        alert("Failed to update roster. Please try again.");
      }
    } else {
      alert(`Manual ${action} feature is coming soon!`);
    }
    setIsActionModalOpen(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setView('admin');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setView('public');
  };

  const handleAddNotice = async (content: string, priority: 'low' | 'medium' | 'high') => {
    if (!db || !user) return;
    await addDoc(collection(db, 'notices'), {
      content,
      priority,
      createdAt: new Date().toISOString(),
      author: user.email
    });
  };

  const handleDeleteNotice = async (id: string) => {
    if (!db || !user) return;
    await deleteDoc(doc(db, 'notices', id));
  };

  const currentRoster = rosters.find(r => r.weekStartDate === selectedWeek) || rosters[0];

  const handleSaveManualConfig = () => {
    if (!manualConfig.trim()) return;
    localStorage.setItem('SALTSYNC_FIREBASE_CONFIG', manualConfig);
    window.location.reload();
  };

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
            {showManualInput ? (
              <div className="space-y-3">
                <textarea 
                  value={manualConfig}
                  onChange={(e) => setManualConfig(e.target.value)}
                  placeholder="Paste your firebaseConfig code here..."
                  className="w-full h-32 p-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveManualConfig}
                    className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    Save & Start
                  </button>
                  <button 
                    onClick={() => setShowManualInput(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-500"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ol className="text-sm space-y-2 text-slate-600 dark:text-slate-400 list-decimal pl-4">
                  <li>Go to Firebase Console &gt; Project Settings</li>
                  <li>Copy the <b>firebaseConfig</b> object</li>
                  <li>Click the button below to paste it directly</li>
                </ol>
                <button 
                  onClick={() => setShowManualInput(true)}
                  className="w-full py-2.5 bg-indigo-600/10 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-600/20 transition-all"
                >
                  Paste Config Manually
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-center text-slate-400">This will save the configuration to your browser's local storage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans", darkMode && "dark")}>
        <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-[60]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('public')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">S</div>
            <div className="hidden md:block">
              <h1 className="text-xl font-black tracking-tighter leading-none">SALTSYNC</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Scheduler</span>
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
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView(view === 'admin' ? 'public' : 'admin')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {view === 'admin' ? <Globe size={18} /> : <LayoutDashboard size={18} />}
                  <span className="hidden sm:inline">{view === 'admin' ? 'Public View' : 'Admin Panel'}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 px-4 py-2.5 rounded-xl font-bold transition-all hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('login')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
          {view === 'login' ? (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-500/20">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{authMode === 'login' ? 'Welcome Back' : 'Create Admin Account'}</h2>
                <p className="text-slate-500 text-sm">Access the management dashboard</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="admin@saltsync.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-sm font-bold text-indigo-600 hover:underline"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          ) : view === 'admin' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-8">
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
                      <h3 className="text-xl font-bold">No Roster Found</h3>
                      <p className="text-slate-500 max-w-xs mx-auto">Click "Generate Roster" to create a new schedule for this week.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard 
                      label="Total Shifts" 
                      value={(currentRoster?.schedule.length || 0 * 3).toString()} 
                      icon={<BarChart3 className="text-blue-600" size={20} />}
                      color="blue"
                    />
                    <SummaryCard 
                      label="Active Leaves" 
                      value={leaves.length.toString()} 
                      icon={<Plus className="text-orange-600" size={20} />}
                      color="orange"
                    />
                    <SummaryCard 
                      label="Holidays" 
                      value={holidays.length.toString()} 
                      icon={<Calendar className="text-red-600" size={20} />}
                      color="red"
                    />
                    <SummaryCard 
                      label="Employees" 
                      value={employees.length.toString()} 
                      icon={<Settings className="text-purple-600" size={20} />}
                      color="purple"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <NoticeBoard 
                    notices={notices} 
                    isAdmin={true} 
                    onAddNotice={handleAddNotice}
                    onDeleteNotice={handleDeleteNotice}
                  />
                  
                  <div className="bg-indigo-600 rounded-3xl p-6 text-white space-y-4 shadow-xl shadow-indigo-500/20">
                    <div className="flex items-center gap-3">
                      <Download size={24} />
                      <h3 className="font-bold text-lg">Export Options</h3>
                    </div>
                    <p className="text-indigo-100 text-sm">Download the current week's schedule for printing or sharing.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => currentRoster && exportToPDF(currentRoster)}
                        className="bg-white/10 hover:bg-white/20 py-2.5 rounded-xl font-bold text-sm transition-all"
                      >
                        PDF (A4)
                      </button>
                      <button 
                        onClick={() => currentRoster && exportToExcel(currentRoster)}
                        className="bg-white/10 hover:bg-white/20 py-2.5 rounded-xl font-bold text-sm transition-all"
                      >
                        Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Public View Header */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 mb-1">
                    <Globe size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Public View</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tight leading-none">Weekly Duty</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                    {format(parseISO(selectedWeek), 'MMMM d')} — {format(addDays(parseISO(selectedWeek), 6), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input 
                      type="date"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
                    />
                  </div>
                  <button 
                    onClick={() => currentRoster && exportToPDF(currentRoster)}
                    className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                    title="Download PDF"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {currentRoster ? (
                    <RosterTable 
                      schedule={currentRoster.schedule} 
                      onCellClick={() => {}} // No actions for public
                    />
                  ) : (
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-20 text-center">
                      <p className="text-slate-400 font-bold">No schedule published for this week.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <NoticeBoard notices={notices} isAdmin={false} />
                  
                  <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <ShieldAlert size={24} />
                      </div>
                      <h3 className="text-2xl font-black leading-tight">Need to change your duty?</h3>
                      <p className="text-indigo-100 text-sm leading-relaxed">Only administrators can modify the schedule. Please contact your manager if you need to swap shifts or request leave.</p>
                      <button 
                        onClick={() => setView('login')}
                        className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all"
                      >
                        Admin Login
                      </button>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          employees={employees}
          data={selectedCell}
          onAction={handleShiftAction}
        />
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
