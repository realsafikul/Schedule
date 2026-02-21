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

  useEffect(() => {
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
    });

    // Seed initial data if needed
    const seedData = async () => {
      if (!db) return;
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

      const templateSnap = await getDocs(collection(db, 'shiftTemplates'));
      if (templateSnap.empty) {
        const initialTemplates = [
          { name: 'Normal', morning: { startTime: '09:00', endTime: '18:00' }, evening: { startTime: '14:00', endTime: '22:00' }, night: { startTime: '22:00', endTime: '09:00' }, active: true },
          { name: 'Ramadan', morning: { startTime: '08:00', endTime: '15:00' }, evening: { startTime: '15:00', endTime: '21:00' }, night: { startTime: '21:00', endTime: '08:00' }, active: false },
        ];
        for (const t of initialTemplates) {
          await addDoc(collection(db, 'shiftTemplates'), t);
        }
      }
    };

    seedData();

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    });

    const unsubRosters = onSnapshot(query(collection(db, 'rosters'), orderBy('weekStartDate', 'desc'), limit(10)), (snap) => {
      setRosters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Roster)));
      setLoading(false);
    });

    const unsubTemplates = onSnapshot(collection(db, 'shiftTemplates'), (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShiftTemplate)));
    });

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snap) => {
      setLeaves(snap.docs.map(d => ({ id: d.id, ...d.data() } as Leave)));
    });

    const unsubNotices = onSnapshot(collection(db, 'notices'), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
    });

    return () => {
      unsubAuth();
      unsubEmployees();
      unsubRosters();
      unsubTemplates();
      unsubLeaves();
      unsubNotices();
    };
  }, []);

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
