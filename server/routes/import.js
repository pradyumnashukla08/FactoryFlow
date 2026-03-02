const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// Multer: store in memory (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls) and CSV files are allowed"));
    }
  },
});

// ─── DOWNLOAD TEMPLATE ───
router.get("/template", async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "FactoryFlow";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Customers", {
      properties: { tabColor: { argb: "FF0B1F3B" } },
    });

    // Define columns
    sheet.columns = [
      { header: "Name *", key: "name", width: 25 },
      { header: "Company Name *", key: "company_name", width: 28 },
      { header: "Email", key: "email", width: 28 },
      { header: "Phone *", key: "phone", width: 18 },
      { header: "GSTIN", key: "gstin", width: 20 },
      { header: "Address", key: "address", width: 35 },
      { header: "City", key: "city", width: 18 },
      { header: "State", key: "state", width: 18 },
      { header: "Pincode", key: "pincode", width: 12 },
      { header: "Outstanding Balance", key: "outstanding_balance", width: 20 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B1F3B" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    // Add sample rows
    sheet.addRow({
      name: "Rajesh Kumar",
      company_name: "Kumar Textiles Pvt Ltd",
      email: "rajesh@kumartextiles.com",
      phone: "9876543210",
      gstin: "27AABCK1234F1Z5",
      address: "Plot 45, MIDC Industrial Area",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      outstanding_balance: 50000,
      notes: "Regular customer since 2020",
    });
    sheet.addRow({
      name: "Priya Sharma",
      company_name: "Sharma Industries",
      email: "priya@sharmaindustries.in",
      phone: "9123456789",
      gstin: "24BBBCS5678G2Z3",
      address: "Survey No 12, Industrial Estate",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      outstanding_balance: 125000,
      notes: "Bulk orders, 30-day payment terms",
    });
    sheet.addRow({
      name: "Mohammed Ali",
      company_name: "Ali Manufacturing Co",
      email: "ali@alimfg.com",
      phone: "8765432100",
      gstin: "",
      address: "B-23, Sector 5",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      outstanding_balance: 0,
      notes: "",
    });

    // Style sample rows with light background
    [2, 3, 4].forEach((rowNum) => {
      const row = sheet.getRow(rowNum);
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      row.font = { color: { argb: "FF94A3B8" }, italic: true };
    });

    // Add instructions sheet
    const instrSheet = workbook.addWorksheet("Instructions", {
      properties: { tabColor: { argb: "FFF97316" } },
    });
    instrSheet.columns = [
      { header: "Field", key: "field", width: 22 },
      { header: "Required", key: "required", width: 12 },
      { header: "Description", key: "description", width: 55 },
      { header: "Example", key: "example", width: 30 },
    ];

    const instrHeader = instrSheet.getRow(1);
    instrHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    instrHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF97316" } };

    const instructions = [
      {
        field: "Name",
        required: "Yes",
        description: "Customer's full name (contact person)",
        example: "Rajesh Kumar",
      },
      {
        field: "Company Name",
        required: "Yes",
        description: "Business/company name",
        example: "Kumar Textiles Pvt Ltd",
      },
      {
        field: "Email",
        required: "No",
        description: "Email address for communication",
        example: "rajesh@company.com",
      },
      {
        field: "Phone",
        required: "Yes",
        description: "10-digit Indian mobile number",
        example: "9876543210",
      },
      {
        field: "GSTIN",
        required: "No",
        description: "15-character GST Identification Number",
        example: "27AABCK1234F1Z5",
      },
      {
        field: "Address",
        required: "No",
        description: "Full street/office address",
        example: "Plot 45, Industrial Area",
      },
      { field: "City", required: "No", description: "City name", example: "Mumbai" },
      { field: "State", required: "No", description: "State name", example: "Maharashtra" },
      { field: "Pincode", required: "No", description: "6-digit postal code", example: "400001" },
      {
        field: "Outstanding Balance",
        required: "No",
        description: "Pending amount in ₹ (number only, default 0)",
        example: "50000",
      },
      {
        field: "Notes",
        required: "No",
        description: "Any additional notes about the customer",
        example: "Regular buyer",
      },
    ];
    instructions.forEach((row) => instrSheet.addRow(row));

    // Notes at bottom
    instrSheet.addRow({});
    const noteRow = instrSheet.addRow({ field: "IMPORTANT NOTES:" });
    noteRow.font = { bold: true, color: { argb: "FFEF4444" } };
    instrSheet.addRow({
      field: "1.",
      required: "",
      description: "Delete the sample data rows before importing. Only add your real data.",
    });
    instrSheet.addRow({
      field: "2.",
      required: "",
      description:
        "Fields marked with * are required. Import will skip rows missing required fields.",
    });
    instrSheet.addRow({
      field: "3.",
      required: "",
      description: "Duplicate phone numbers will be skipped (matched against existing customers).",
    });
    instrSheet.addRow({
      field: "4.",
      required: "",
      description: "Maximum 500 customers per import.",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=FactoryFlow_Customer_Import_Template.xlsx",
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// ─── IMPORT CUSTOMERS FROM EXCEL ───
router.post("/customers", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an Excel or CSV file" });
    }

    const workbook = new ExcelJS.Workbook();

    if (req.file.originalname.match(/\.csv$/i)) {
      await workbook.csv.read(req.file.buffer);
    } else {
      await workbook.xlsx.load(req.file.buffer);
    }

    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) {
      return res.status(400).json({ error: "File is empty or has no data rows" });
    }

    // Read header row to map columns
    const headerRow = sheet.getRow(1);
    const colMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const val = (cell.value || "").toString().toLowerCase().replace(/[*\s]/g, "");
      if (val.includes("name") && !val.includes("company")) colMap.name = colNumber;
      else if (val.includes("company")) colMap.company_name = colNumber;
      else if (val.includes("email")) colMap.email = colNumber;
      else if (val.includes("phone") || val.includes("mobile")) colMap.phone = colNumber;
      else if (val.includes("gst")) colMap.gstin = colNumber;
      else if (val.includes("address")) colMap.address = colNumber;
      else if (val.includes("city")) colMap.city = colNumber;
      else if (val.includes("state")) colMap.state = colNumber;
      else if (val.includes("pin")) colMap.pincode = colNumber;
      else if (val.includes("outstanding") || val.includes("balance") || val.includes("due"))
        colMap.outstanding_balance = colNumber;
      else if (val.includes("note") || val.includes("remark")) colMap.notes = colNumber;
    });

    // Validate required columns
    if (!colMap.name) {
      return res.status(400).json({
        error: "Missing required column: Name. Make sure your header row includes 'Name'",
      });
    }
    if (!colMap.phone && !colMap.company_name) {
      return res
        .status(400)
        .json({ error: "Missing required columns: need at least Phone or Company Name" });
    }

    // Get existing phones for duplicate check
    const existing = await db.query(
      "SELECT phone FROM customers WHERE user_id = $1 AND is_active = true",
      [req.user.id],
    );
    const existingPhones = new Set(existing.rows.map((r) => r.phone).filter(Boolean));

    const results = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    const getCellValue = (row, col) => {
      if (!col) return "";
      const cell = row.getCell(col);
      if (!cell || !cell.value) return "";
      // Handle rich text, formulas etc
      if (typeof cell.value === "object") {
        return cell.value.result || cell.value.text || cell.text || String(cell.value);
      }
      return String(cell.value).trim();
    };

    const rows = [];
    const maxRows = 500;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      if (rows.length >= maxRows) return;

      results.total++;
      const name = getCellValue(row, colMap.name);
      const company_name = getCellValue(row, colMap.company_name);
      const email = getCellValue(row, colMap.email);
      const phone = getCellValue(row, colMap.phone).replace(/[^\d]/g, "").slice(-10);
      const gstin = getCellValue(row, colMap.gstin).toUpperCase();
      const address = getCellValue(row, colMap.address);
      const city = getCellValue(row, colMap.city);
      const state = getCellValue(row, colMap.state);
      const pincode = getCellValue(row, colMap.pincode).replace(/[^\d]/g, "");
      const outstanding_str = getCellValue(row, colMap.outstanding_balance).replace(/[^\d.]/g, "");
      const outstanding_balance = parseFloat(outstanding_str) || 0;
      const notes = getCellValue(row, colMap.notes);

      // Validate required
      if (!name) {
        results.skipped++;
        results.errors.push({ row: rowNumber, reason: "Missing name" });
        return;
      }

      // Check duplicate phone
      if (phone && existingPhones.has(phone)) {
        results.skipped++;
        results.errors.push({ row: rowNumber, reason: `Duplicate phone: ${phone}` });
        return;
      }

      // GSTIN validation (if provided)
      if (gstin && gstin.length !== 15) {
        results.errors.push({ row: rowNumber, reason: `Invalid GSTIN length: ${gstin}` });
        // Don't skip, just warn — import with empty GSTIN
      }

      rows.push({
        name,
        company_name: company_name || name,
        email,
        phone,
        gstin: gstin.length === 15 ? gstin : "",
        address,
        city,
        state,
        pincode,
        outstanding_balance,
        notes,
      });

      if (phone) existingPhones.add(phone); // prevent dupes within same file
    });

    if (rows.length === 0) {
      return res.status(400).json({
        error: "No valid rows to import",
        details: results,
      });
    }

    // Batch insert using transaction
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      for (const row of rows) {
        await client.query(
          `INSERT INTO customers (user_id, name, company_name, email, phone, gstin, address, city, state, pincode, outstanding_balance, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            req.user.id,
            row.name,
            row.company_name,
            row.email,
            row.phone,
            row.gstin,
            row.address,
            row.city,
            row.state,
            row.pincode,
            0, // Force outstanding_balance to 0 on import (prevent arbitrary balance injection)
            row.notes,
          ],
        );
        results.imported++;
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    res.json({
      message: `Successfully imported ${results.imported} customers`,
      results,
    });
  } catch (err) {
    if (err.message?.includes("Only Excel")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
