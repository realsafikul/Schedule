import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Roster, DaySchedule } from '../types';
import { format, parseISO } from 'date-fns';

export function exportToPDF(roster: Roster) {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('SaltSync Support Duty Roster', 14, 15);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Week starting: ${format(parseISO(roster.weekStartDate), 'MMMM d, yyyy')}`, 14, 22);

  const tableData = roster.schedule.map(day => [
    format(parseISO(day.date), 'EEEE'),
    format(parseISO(day.date), 'MMM d'),
    day.shifts.morning.join('\n'),
    day.shifts.evening.join('\n'),
    day.shifts.night.join('\n'),
    day.shifts.off.join(', ')
  ]);

  autoTable(doc, {
    head: [['Day', 'Date', 'Morning (09-06)', 'Evening (02-10)', 'Night (10-09)', 'OFF / Remarks']],
    body: tableData,
    startY: 30,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      valign: 'middle',
      halign: 'center'
    },
    headStyles: { 
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
      4: { cellWidth: 45 },
      5: { halign: 'left' }
    },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Printed on ${format(new Date(), 'yyyy-MM-dd HH:mm')} | SaltSync Support System`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`SaltSync_Roster_${roster.weekStartDate}.pdf`);
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
