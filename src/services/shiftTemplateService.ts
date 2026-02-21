import { ShiftTemplate } from '../types';

export const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'normal',
    name: 'Normal',
    morning: { startTime: '09:00', endTime: '18:00' },
    evening: { startTime: '14:00', endTime: '22:00' },
    night: { startTime: '22:00', endTime: '09:00' },
    active: true
  },
  {
    id: 'ramadan',
    name: 'Ramadan',
    morning: { startTime: '08:00', endTime: '15:00' },
    evening: { startTime: '15:00', endTime: '21:00' },
    night: { startTime: '21:00', endTime: '08:00' },
    active: false
  }
];

export const getActiveTemplate = (templates: ShiftTemplate[]): ShiftTemplate => {
  return templates.find(t => t.active) || DEFAULT_TEMPLATES[0];
};
