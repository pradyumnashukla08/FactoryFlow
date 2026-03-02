const cron = require("node-cron");
const nodemailer = require("nodemailer");
const db = require("../config/db");
const { escapeHtml } = require("../middleware/sanitize");

let transporter = null;

function initializeMailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("📧 Email transporter initialized");
  } else {
    console.log("⚠️  Email not configured — reminders will be logged only");
  }
}

// ------ SEND EMAIL REMINDER ------
async function sendEmailReminder(to, subject, body) {
  if (!transporter) {
    console.log(`📧 [DRY RUN] Would send to ${to}: ${subject}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: body,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    return false;
  }
}

// ------ CHECK & SEND OVERDUE PAYMENT REMINDERS ------
async function processPaymentReminders() {
  console.log("\n🔔 Processing payment reminders...");

  try {
    // Find overdue invoices
    const overdueInvoices = await db.query(
      `SELECT i.id, i.invoice_number, i.grand_total, i.due_date, i.user_id,
              c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
              u.factory_name
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id
       JOIN users u ON i.user_id = u.id
       WHERE i.status IN ('unpaid', 'partial')
       AND i.due_date <= CURRENT_DATE
       AND i.due_date >= CURRENT_DATE - INTERVAL '30 days'`,
    );

    console.log(`  Found ${overdueInvoices.rows.length} overdue invoices`);

    for (const invoice of overdueInvoices.rows) {
      // Check if reminder already sent today
      const existingReminder = await db.query(
        `SELECT id FROM reminders
         WHERE invoice_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'sent'`,
        [invoice.id],
      );

      if (existingReminder.rows.length > 0) continue;

      const daysOverdue = Math.floor(
        (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24),
      );

      const subject = `Payment Reminder: Invoice ${escapeHtml(invoice.invoice_number)} — ₹${Number(invoice.grand_total).toLocaleString("en-IN")}`;
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0B1F3B; padding: 20px; text-align: center;">
            <h1 style="color: #F97316; margin: 0;">⚙ FactoryFlow</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>Dear <strong>${escapeHtml(invoice.customer_name)}</strong>,</p>
            <p>This is a friendly reminder that payment for the following invoice is ${daysOverdue > 0 ? `overdue by ${daysOverdue} day(s)` : "due today"}:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; color: #666;">Invoice Number</td>
                  <td style="padding: 8px; font-weight: bold;">${escapeHtml(invoice.invoice_number)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #666;">Amount</td>
                  <td style="padding: 8px; font-weight: bold; color: #F97316;">₹${Number(invoice.grand_total).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #666;">Due Date</td>
                  <td style="padding: 8px;">${new Date(invoice.due_date).toLocaleDateString("en-IN")}</td>
                </tr>
              </table>
            </div>
            <p>Please arrange the payment at your earliest convenience.</p>
            <p style="color: #666; font-size: 14px;">— ${escapeHtml(invoice.factory_name || "FactoryFlow")}</p>
          </div>
        </div>
      `;

      let status = "pending";
      if (invoice.customer_email) {
        const sent = await sendEmailReminder(invoice.customer_email, subject, body);
        status = sent ? "sent" : "failed";
      }

      // Log the reminder
      await db.query(
        `INSERT INTO reminders (user_id, customer_id, invoice_id, type, message, channel, scheduled_at, sent_at, status)
         VALUES ($1, (SELECT customer_id FROM invoices WHERE id = $2), $2, 'payment_due', $3, 'email', CURRENT_TIMESTAMP, ${status === "sent" ? "CURRENT_TIMESTAMP" : "NULL"}, $4)`,
        [invoice.user_id, invoice.id, subject, status],
      );
    }

    // Auto-mark unpaid invoices as overdue
    await db.query(
      `UPDATE invoices SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'unpaid' AND due_date < CURRENT_DATE`,
    );

    console.log("✅ Payment reminders processed\n");
  } catch (err) {
    console.error("❌ Reminder job failed:", err.message);
  }
}

// ------ START CRON SCHEDULER ------
function startReminderJobs() {
  initializeMailer();

  const schedule = process.env.REMINDER_CRON || "0 9 * * *"; // Default: 9 AM daily

  cron.schedule(schedule, () => {
    console.log(`⏰ Cron triggered at ${new Date().toLocaleString("en-IN")}`);
    processPaymentReminders();
  });

  console.log(`⏰ Reminder cron scheduled: ${schedule}`);
}

module.exports = { startReminderJobs, processPaymentReminders };
