import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Roster, DaySchedule } from '../types';
import { format, parseISO } from 'date-fns';

export function exportToPDF(roster: Roster) {
  const doc = new jsPDF('l', 'mm', 'a4');
  doc.text(`SaltSync Support Duty Roster - Week of ${roster.weekStartDate}`, 14, 15);

  const tableData = roster.schedule.map(day => [
    format(parseISO(day.date), 'EEE, MMM d'),
    day.shifts.morning.join(', '),
    day.shifts.evening.join(', '),
    day.shifts.night.join(', '),
    day.shifts.off.join(', ')
  ]);

  (doc as any).autoTable({
    head: [['Date', 'Morning (09-06)', 'Evening (02-10)', 'Night (10-09)', 'OFF']],
    body: tableData,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`Roster_${roster.weekStartDate}.pdf`);
}

export function exportToExcel(roster: Roster) {
  const data = roster.schedule.map(day => ({
    Date: format(parseISO(day.date), 'yyyy-MM-dd'),
    Day: format(parseISO(day.date), 'EEEE'),
    Morning: day.shifts.morning.join(', '),
    Evening: day.shifts.evening.join(', '),
    Night: day.shifts.night.join(', '),
    OFF: day.shifts.off.join(', ')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Roster');
  XLSX.writeFile(wb, `Roster_${roster.weekStartDate}.xlsx`);
}
