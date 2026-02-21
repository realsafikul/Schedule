import { useCallback } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Employee } from '../types';
import { useShift } from '../context/ShiftContext';
import { logAction } from '../services/auditService';

export const useEmployees = () => {
  const { user } = useShift();

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, 'employees'), employee);
    await logAction('ADD_EMPLOYEE', user.uid, { employeeId: docRef.id, newValue: employee });
    return docRef.id;
  }, [user]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    if (!user) return;
    await updateDoc(doc(db, 'employees', id), updates);
    await logAction('UPDATE_EMPLOYEE', user.uid, { employeeId: id, newValue: updates });
  }, [user]);

  return { addEmployee, updateEmployee };
};
