import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, Roster, ShiftTemplate, Leave, Notice, UserProfile } from '../types';
import { collection, onSnapshot, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface ShiftContextType {
  employees: Employee[];
  rosters: Roster[];
  templates: ShiftTemplate[];
  leaves: Leave[];
  notices: Notice[];
  user: UserProfile | null;
  loading: boolean;
  isBillingMode: boolean;
  isRamadanMode: boolean;
  isEmergencyMode: boolean;
  setBillingMode: (val: boolean) => void;
  setRamadanMode: (val: boolean) => void;
  setEmergencyMode: (val: boolean) => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isBillingMode, setBillingMode] = useState(false);
  const [isRamadanMode, setRamadanMode] = useState(false);
  const [isEmergencyMode, setEmergencyMode] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isDemoMode] = useState(() => localStorage.getItem('SALTSYNC_DEMO_MODE') === 'true');

  useEffect(() => {
    if (isDemoMode) {
      const demoEmployees: Employee[] = [
        { id: '1', name: 'Demo John', role: 'TL', active: true, fridayOff: true, holidayOff: true, rotationPosition: 'Morning', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
        { id: '2', name: 'Demo Jane', role: 'Manager', active: true, fridayOff: true, holidayOff: true, rotationPosition: 'Morning', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
        { id: '3', name: 'Demo Alice', role: 'Senior', active: true, fridayOff: false, holidayOff: false, rotationPosition: 'Evening', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
        { id: '4', name: 'Demo Bob', role: 'Junior', active: true, fridayOff: false, holidayOff: false, rotationPosition: 'Night', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
      ];
      setEmployees(demoEmployees);
      setTemplates([
        { id: 't1', name: 'Normal', morning: { startTime: '09:00', endTime: '18:00' }, evening: { startTime: '14:00', endTime: '22:00' }, night: { startTime: '22:00', endTime: '09:00' }, active: true }
      ]);
      setUser({ uid: 'demo-user', email: 'demo@saltsync.com', role: 'admin' });
      setLoading(false);
      return;
    }

    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({ uid: u.uid, email: u.email || '', role: 'admin' });
      } else {
        setUser(null);
      }
    }, (err) => setError(err.message));

    // Seed initial data if needed
    const seedData = async () => {
      if (!db) return;
      try {
        const empSnap = await getDocs(collection(db, 'employees'));
        if (empSnap.empty) {
          const initialEmployees = [
            { name: 'John Doe', role: 'TL', active: true, fridayOff: true, holidayOff: true, rotationPosition: 'Morning', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
            { name: 'Jane Smith', role: 'Manager', active: true, fridayOff: true, holidayOff: true, rotationPosition: 'Morning', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
            { name: 'Alice Johnson', role: 'Senior', active: true, fridayOff: false, holidayOff: false, rotationPosition: 'Evening', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
            { name: 'Bob Wilson', role: 'Junior', active: true, fridayOff: false, holidayOff: false, rotationPosition: 'Night', totalNightCount: 0, totalShiftCount: 0, createdAt: new Date().toISOString() },
          ];
          for (const emp of initialEmployees) {
            await addDoc(collection(db, 'employees'), emp);
          }
        }
      } catch (err: any) {
        console.error("Seeding failed", err);
        if (err.code === 'permission-denied') {
          setError("Firebase Permission Denied. Please update your Firestore Rules to allow read/write.");
        }
      }
    };

    seedData();

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    }, (err) => setError(err.message));

    const unsubRosters = onSnapshot(query(collection(db, 'rosters'), orderBy('weekStartDate', 'desc'), limit(10)), (snap) => {
      setRosters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Roster)));
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    const unsubTemplates = onSnapshot(collection(db, 'shiftTemplates'), (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShiftTemplate)));
    }, (err) => setError(err.message));

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snap) => {
      setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as Leave)));
    }, (err) => setError(err.message));

    const unsubNotices = onSnapshot(collection(db, 'notices'), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
    }, (err) => setError(err.message));

    return () => {
      unsubAuth();
      unsubEmployees();
      unsubRosters();
      unsubTemplates();
      unsubLeaves();
      unsubNotices();
    };
  }, [isDemoMode]);

  return (
    <ShiftContext.Provider value={{
      employees, rosters, templates, leaves, notices, user, loading,
      isBillingMode, isRamadanMode, isEmergencyMode,
      setBillingMode, setRamadanMode, setEmergencyMode
    }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) throw new Error('useShift must be used within ShiftProvider');
  return context;
};
