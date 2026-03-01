import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate, numberToWords } from "./formatters";

export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 15;

  // Colors
  const primaryColor = [11, 31, 59]; // #0b1f3b
  const accentColor = [249, 115, 22]; // #f97316
  const grayColor = [100, 116, 139]; // #64748b
  const lightGray = [241, 245, 249]; // #f1f5f9

  // Factory info from localStorage (configurable) or defaults
  const factoryInfo = JSON.parse(localStorage.getItem("factoryflow_factory_info") || "{}");
  const factoryName = factoryInfo.name || "FactoryFlow Industries";
  const factoryAddress = factoryInfo.address || "";
  const factoryGSTIN = factoryInfo.gstin || "";
  const factoryPhone = factoryInfo.phone || "";
  const bankDetails = factoryInfo.bank_details || "";

  // ---- HEADER ----
  // Accent bar at top
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Factory Name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text(factoryName, margin, y + 8);
  y += 12;

  if (factoryAddress) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(factoryAddress, margin, y + 3);
    y += 4;
  }
  if (factoryGSTIN) {
    doc.setFontSize(8);
    doc.text(`GSTIN: ${factoryGSTIN}`, margin, y + 3);
    y += 4;
  }
  if (factoryPhone) {
    doc.setFontSize(8);
    doc.text(`Phone: ${factoryPhone}`, margin, y + 3);
    y += 4;
  }

  // TAX INVOICE label (right side)
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...accentColor);
  doc.text("TAX INVOICE", pageWidth - margin, 20, { align: "right" });

  // Invoice details (right side)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  const rightX = pageWidth - margin;
  doc.text(`Invoice #: ${invoice.invoice_number}`, rightX, 28, { align: "right" });
  doc.text(`Date: ${formatDate(invoice.invoice_date)}`, rightX, 34, { align: "right" });
  doc.text(`Due: ${formatDate(invoice.due_date)}`, rightX, 40, { align: "right" });

  y = Math.max(y + 6, 48);

  // Divider
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ---- BILL TO ----
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...accentColor);
  doc.text("BILL TO", margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text(invoice.customer_name || "Customer", margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);

  if (invoice.company_name) {
    doc.text(invoice.company_name, margin, y);
    y += 4;
  }
  if (invoice.customer_address) {
    doc.text(invoice.customer_address, margin, y);
    y += 4;
  }
  const cityState = [invoice.customer_city, invoice.customer_state].filter(Boolean).join(", ");
  if (cityState) {
    doc.text(cityState, margin, y);
    y += 4;
  }
  if (invoice.customer_gstin) {
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${invoice.customer_gstin}`, margin, y);
    doc.setFont("helvetica", "normal");
    y += 4;
  }

  y += 6;

  // ---- ITEMS TABLE ----
  const items = invoice.items || [];
  const tableData = items.map((item, index) => [
    index + 1,
    item.description || item.name || "",
    item.hsn || "—",
    item.quantity,
    formatCurrency(item.rate),
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "HSN/SAC", "Qty", "Rate", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 25 },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "right", cellWidth: 30 },
      5: { halign: "right", cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: function (data) {
      // Footer on each page
      doc.setFontSize(7);
      doc.setTextColor(...grayColor);
      doc.text(
        "Computer Generated Invoice - FactoryFlow",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" },
      );
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ---- TAX BREAKDOWN ----
  const taxTableX = pageWidth - margin - 85;
  const taxLabelX = taxTableX;
  const taxValueX = pageWidth - margin;

  const drawTaxLine = (label, value, bold = false) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(
      bold ? primaryColor[0] : grayColor[0],
      bold ? primaryColor[1] : grayColor[1],
      bold ? primaryColor[2] : grayColor[2],
    );
    doc.text(label, taxLabelX, y);
    doc.setTextColor(...primaryColor);
    doc.text(value, taxValueX, y, { align: "right" });
    y += 5;
  };

  drawTaxLine("Subtotal", formatCurrency(invoice.subtotal));

  if (Number(invoice.cgst_amount) > 0) {
    drawTaxLine(`CGST @${invoice.cgst_rate}%`, formatCurrency(invoice.cgst_amount));
  }
  if (Number(invoice.sgst_amount) > 0) {
    drawTaxLine(`SGST @${invoice.sgst_rate}%`, formatCurrency(invoice.sgst_amount));
  }
  if (Number(invoice.igst_amount) > 0) {
    drawTaxLine(`IGST @${invoice.igst_rate}%`, formatCurrency(invoice.igst_amount));
  }

  drawTaxLine("Total Tax", formatCurrency(invoice.total_tax));

  // Divider before grand total
  doc.setDrawColor(...lightGray);
  doc.line(taxLabelX, y - 1, taxValueX, y - 1);
  y += 3;

  // Grand Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("Grand Total", taxLabelX, y);
  doc.text(formatCurrency(invoice.grand_total), taxValueX, y, { align: "right" });
  y += 7;

  // Amount in words
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...grayColor);
  const amountWords = numberToWords(invoice.grand_total);
  const wordsLines = doc.splitTextToSize(amountWords, 85);
  doc.text(wordsLines, taxLabelX, y);
  y += wordsLines.length * 4 + 6;

  // ---- NOTES ----
  if (invoice.notes) {
    y = Math.max(y, doc.lastAutoTable.finalY + 8);
    // Place notes on left side
    const notesY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Notes:", margin, notesY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    const noteLines = doc.splitTextToSize(invoice.notes, 90);
    doc.text(noteLines, margin, notesY + 4);
  }

  // ---- BANK DETAILS ----
  if (bankDetails) {
    const bankY = y + 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Bank Details:", margin, bankY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    const bankLines = doc.splitTextToSize(bankDetails, 90);
    doc.text(bankLines, margin, bankY + 4);
  }

  // ---- FOOTER ----
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(...lightGray);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" },
  );

  // Bottom accent bar
  doc.setFillColor(...accentColor);
  doc.rect(0, doc.internal.pageSize.getHeight() - 4, pageWidth, 4, "F");

  // Save
  doc.save(`${invoice.invoice_number || "Invoice"}.pdf`);
};

export default generateInvoicePDF;
