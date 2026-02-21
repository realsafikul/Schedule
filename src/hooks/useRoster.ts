import { useState, useCallback } from 'react';
import { useShift } from '../context/ShiftContext';
import { generateWeekSchedule } from '../services/rotationEngine';
import { validateShiftMove } from '../services/validationEngine';
import { logAction } from '../services/auditService';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Roster, DaySchedule } from '../types';
import { format, startOfWeek } from 'date-fns';

export const useRoster = () => {
  const { employees, rosters, leaves, isBillingMode, isEmergencyMode, user } = useShift();
  const [updating, setUpdating] = useState(false);

  const generateRoster = useCallback(async (selectedDate: Date) => {
    if (!user) return;
    setUpdating(true);
    try {
      const weekStartStr = format(startOfWeek(selectedDate, { weekStartsOn: 6 }), 'yyyy-MM-dd');
      const days = generateWeekSchedule(startOfWeek(selectedDate, { weekStartsOn: 6 }), employees, leaves, isBillingMode);
      
      const newRoster: Roster = {
        id: weekStartStr,
        weekStartDate: weekStartStr,
        templateId: 'normal',
        days
      };

      await setDoc(doc(db, 'rosters', weekStartStr), newRoster);
      await logAction('GENERATE_ROSTER', user.uid, { date: weekStartStr });
    } catch (error) {
      console.error('Failed to generate roster:', error);
    } finally {
      setUpdating(false);
    }
  }, [employees, leaves, isBillingMode, user]);

  const updateShift = useCallback(async (
    rosterId: string,
    date: string,
    employeeId: string,
    fromShift: string,
    toShift: 'morning' | 'evening' | 'night',
    currentRoster: Roster
  ) => {
    if (!user || !currentRoster || !currentRoster.days) return;

    const validation = validateShiftMove(
      employeeId,
      date,
      toShift,
      currentRoster.days,
      employees,
      isEmergencyMode
    );

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    setUpdating(true);
    try {
      const updatedDays = { ...currentRoster.days };
      const daySchedule = { ...updatedDays[date] };

      // Remove from old shift
      if (fromShift === 'morning') daySchedule.morning = daySchedule.morning.filter(id => id !== employeeId);
      if (fromShift === 'evening') daySchedule.evening = daySchedule.evening.filter(id => id !== employeeId);
      if (fromShift === 'night') daySchedule.night = daySchedule.night.filter(id => id !== employeeId);

      // Add to new shift
      daySchedule[toShift] = [...daySchedule[toShift], employeeId];

      updatedDays[date] = daySchedule;

      await setDoc(doc(db, 'rosters', rosterId), { days: updatedDays }, { merge: true });
      await logAction('UPDATE_SHIFT', user.uid, {
        employeeId,
        date,
        previousValue: fromShift,
        newValue: toShift
      });
    } catch (error) {
      console.error('Failed to update shift:', error);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, [employees, isEmergencyMode, user]);

  return { generateRoster, updateShift, updating };
};
