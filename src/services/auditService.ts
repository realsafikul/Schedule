import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLog } from '../types';

export const logAction = async (
  action: string,
  adminId: string,
  details: {
    employeeId?: string;
    date?: string;
    previousValue?: any;
    newValue?: any;
  }
) => {
  try {
    const auditLog: Omit<AuditLog, 'id'> = {
      action,
      adminId,
      timestamp: new Date().toISOString(),
      ...details
    };
    await addDoc(collection(db, 'auditLogs'), auditLog);
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
