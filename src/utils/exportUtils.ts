import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Roster, Employee } from '../types';
import { format, parseISO } from 'date-fns';

export function exportToPDF(roster: Roster) {
  if (!roster || !roster.days) return;
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(18);
  doc.text('SaltSync Enterprise Duty Roster', 14, 15);
  
  doc.setFontSize(11);
  doc.text(`Week starting: ${format(parseISO(roster.weekStartDate), 'MMMM d, yyyy')}`, 14, 22);

  const days = Object.keys(roster.days).sort();
  const tableData = days.map(date => [
    format(parseISO(date), 'EEEE'),
    format(parseISO(date), 'MMM d'),
    roster.days[date].morning.length > 0 ? roster.days[date].morning.join(', ') : '-',
    roster.days[date].evening.length > 0 ? roster.days[date].evening.join(', ') : '-',
    roster.days[date].night.length > 0 ? roster.days[date].night.join(', ') : '-',
  ]);

  autoTable(doc, {
    head: [['Day', 'Date', 'Morning (09-06)', 'Evening (02-10)', 'Night (10-09)']],
    body: tableData,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [33, 37, 41] },
  });

  doc.save(`SaltSync_Roster_${roster.weekStartDate}.pdf`);
}

export function exportToExcel(roster: Roster) {
  if (!roster || !roster.days) return;
  const days = Object.keys(roster.days).sort();
  const data = days.map(date => ({
    Day: format(parseISO(date), 'EEEE'),
    Date: format(parseISO(date), 'yyyy-MM-dd'),
    Morning: roster.days[date].morning.join(', '),
    Evening: roster.days[date].evening.join(', '),
    Night: roster.days[date].night.join(', ')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Roster');
  XLSX.writeFile(wb, `SaltSync_Roster_${roster.weekStartDate}.xlsx`);
}
