import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file without extension
 */
export const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exports data to a PDF file (.pdf)
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of objects with { header: string, dataKey: string }
 * @param {string} fileName - Name of the file without extension
 * @param {string} title - Title to display on the PDF
 * @param {Object} summary - Optional summary data { label: string, value: string }
 */
export const exportToPDF = (data, columns, fileName, title, summary = null) => {
    const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(240, 62, 62); // Duke Red
    doc.text("DUKE BURGERS", 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(title.toUpperCase(), 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-AR')}`, 14, 38);

    let currentY = 46;
    if (summary) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const summaryItems = Array.isArray(summary) ? summary : [summary];
        summaryItems.forEach(item => {
            doc.text(`${item.label}: ${item.value}`, 14, currentY);
            currentY += 7;
        });
        currentY += 3; // Space before table
    }

    // Table
    autoTable(doc, {
        startY: currentY,
        head: [columns.map(col => col.header)],
        body: data.map(item => columns.map(col => {
            const val = item[col.dataKey];
            return val !== undefined ? val : '-';
        })),
        theme: 'grid',
        headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 249, 250] }
    });

    const footerY = doc.internal.pageSize.height - 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`© ${new Date().getFullYear()} Duke Burger San Juan - www.dukeburger-sj.com | Sistema Oficial`, 14, footerY);

    doc.save(`${fileName}.pdf`);
};
