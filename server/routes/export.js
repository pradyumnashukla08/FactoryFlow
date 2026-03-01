const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const ExcelJS = require("exceljs");

router.use(authMiddleware);

// ------ EXPORT CUSTOMERS ------
router.get("/customers", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT name, company_name, email, phone, gstin, address, city, state, pincode, outstanding_balance, created_at
       FROM customers WHERE user_id = $1 ORDER BY name`,
      [req.user.id],
    );

    const format = req.query.format || "csv";
    const rows = result.rows;

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Customers");
      sheet.columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "Company", key: "company_name", width: 25 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "GSTIN", key: "gstin", width: 18 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 15 },
        { header: "State", key: "state", width: 15 },
        { header: "Pincode", key: "pincode", width: 10 },
        { header: "Outstanding", key: "outstanding_balance", width: 15 },
        { header: "Created", key: "created_at", width: 15 },
      ];
      // Style header row
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3B" } };
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      rows.forEach((row) => sheet.addRow(row));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // CSV
      const headers =
        "Name,Company,Email,Phone,GSTIN,Address,City,State,Pincode,Outstanding,Created\n";
      const csv = rows
        .map((r) =>
          [
            r.name,
            r.company_name,
            r.email,
            r.phone,
            r.gstin,
            r.address,
            r.city,
            r.state,
            r.pincode,
            r.outstanding_balance,
            r.created_at,
          ]
            .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
      res.send(headers + csv);
    }
  } catch (err) {
    next(err);
  }
});

// ------ EXPORT ORDERS ------
router.get("/orders", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = `SELECT o.order_number, c.name as customer, o.order_date, o.delivery_date, o.status, o.priority, o.total_quantity, o.total_amount, o.tax_amount, o.grand_total
       FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.user_id = $1`;
    const params = [req.user.id];

    if (from) {
      params.push(from);
      query += ` AND o.order_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND o.order_date <= $${params.length}`;
    }
    query += " ORDER BY o.order_date DESC";

    const result = await db.query(query, params);
    const format = req.query.format || "csv";
    const rows = result.rows;

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Orders");
      sheet.columns = [
        { header: "Order #", key: "order_number", width: 15 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Order Date", key: "order_date", width: 15 },
        { header: "Delivery Date", key: "delivery_date", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Priority", key: "priority", width: 12 },
        { header: "Qty", key: "total_quantity", width: 10 },
        { header: "Amount", key: "total_amount", width: 15 },
        { header: "Tax", key: "tax_amount", width: 12 },
        { header: "Grand Total", key: "grand_total", width: 15 },
      ];
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3B" } };
      rows.forEach((row) => sheet.addRow(row));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const headers =
        "Order #,Customer,Order Date,Delivery Date,Status,Priority,Qty,Amount,Tax,Grand Total\n";
      const csv = rows
        .map((r) =>
          [
            r.order_number,
            r.customer,
            r.order_date,
            r.delivery_date,
            r.status,
            r.priority,
            r.total_quantity,
            r.total_amount,
            r.tax_amount,
            r.grand_total,
          ]
            .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
      res.send(headers + csv);
    }
  } catch (err) {
    next(err);
  }
});

// ------ EXPORT INVOICES ------
router.get("/invoices", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = `SELECT i.invoice_number, c.name as customer, i.invoice_date, i.due_date, i.status, i.subtotal, i.total_tax, i.grand_total
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.user_id = $1`;
    const params = [req.user.id];

    if (from) {
      params.push(from);
      query += ` AND i.invoice_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND i.invoice_date <= $${params.length}`;
    }
    query += " ORDER BY i.invoice_date DESC";

    const result = await db.query(query, params);
    const format = req.query.format || "csv";
    const rows = result.rows;

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Invoices");
      sheet.columns = [
        { header: "Invoice #", key: "invoice_number", width: 15 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Date", key: "invoice_date", width: 15 },
        { header: "Due Date", key: "due_date", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Subtotal", key: "subtotal", width: 15 },
        { header: "Tax", key: "total_tax", width: 12 },
        { header: "Grand Total", key: "grand_total", width: 15 },
      ];
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3B" } };
      rows.forEach((row) => sheet.addRow(row));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=invoices.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const headers = "Invoice #,Customer,Date,Due Date,Status,Subtotal,Tax,Grand Total\n";
      const csv = rows
        .map((r) =>
          [
            r.invoice_number,
            r.customer,
            r.invoice_date,
            r.due_date,
            r.status,
            r.subtotal,
            r.total_tax,
            r.grand_total,
          ]
            .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=invoices.csv");
      res.send(headers + csv);
    }
  } catch (err) {
    next(err);
  }
});

// ------ EXPORT PAYMENTS ------
router.get("/payments", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    let query = `SELECT p.payment_date, c.name as customer, i.invoice_number, p.amount, p.payment_mode, p.reference_number, p.notes
       FROM payments p LEFT JOIN customers c ON p.customer_id = c.id LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE p.user_id = $1`;
    const params = [req.user.id];

    if (from) {
      params.push(from);
      query += ` AND p.payment_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND p.payment_date <= $${params.length}`;
    }
    query += " ORDER BY p.payment_date DESC";

    const result = await db.query(query, params);
    const format = req.query.format || "csv";
    const rows = result.rows;

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Payments");
      sheet.columns = [
        { header: "Date", key: "payment_date", width: 15 },
        { header: "Customer", key: "customer", width: 25 },
        { header: "Invoice #", key: "invoice_number", width: 15 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Mode", key: "payment_mode", width: 15 },
        { header: "Reference", key: "reference_number", width: 20 },
        { header: "Notes", key: "notes", width: 30 },
      ];
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3B" } };
      rows.forEach((row) => sheet.addRow(row));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=payments.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const headers = "Date,Customer,Invoice #,Amount,Mode,Reference,Notes\n";
      const csv = rows
        .map((r) =>
          [
            r.payment_date,
            r.customer,
            r.invoice_number,
            r.amount,
            r.payment_mode,
            r.reference_number,
            r.notes,
          ]
            .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
      res.send(headers + csv);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
