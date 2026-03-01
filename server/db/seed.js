const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function seed() {
  console.log("🌱 Seeding FactoryFlow with mock data...\n");

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    // ──────── 1. DEMO USER ────────
    const passwordHash = await bcrypt.hash("password123", 12);
    const userRes = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, factory_name, city, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET name = $1, factory_name = $5, city = $6
       RETURNING id`,
      [
        "Vikram Patel",
        "demo@factoryflow.com",
        "9876543210",
        passwordHash,
        "Shree Krishna Industries",
        "Pune",
        "owner",
      ],
    );
    const userId = userRes.rows[0].id;
    console.log(`  ✅ User: demo@factoryflow.com / password123 (id: ${userId})`);

    // ──────── 2. CUSTOMERS ────────
    const customersData = [
      {
        name: "Rajesh Sharma",
        company: "Sharma Textiles Pvt Ltd",
        email: "rajesh@sharmatextiles.com",
        phone: "9823456789",
        gstin: "27AABCS1234F1Z5",
        address: "Plot 42, MIDC Bhosari",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411026",
        notes: "Bulk buyer, 30-day credit",
      },
      {
        name: "Priya Mehta",
        company: "Mehta Auto Components",
        email: "priya@mehtaauto.in",
        phone: "9712345678",
        gstin: "24BBBCM5678G2Z3",
        address: "Survey No 15, Naroda GIDC",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "382330",
        notes: "Auto parts specialist",
      },
      {
        name: "Suresh Reddy",
        company: "Reddy Packaging Solutions",
        email: "suresh@reddypack.com",
        phone: "9845678901",
        gstin: "36CCCDR9012H3Z1",
        address: "D-Block, IDA Jeedimetla",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500055",
        notes: "Packaging & corrugated boxes",
      },
      {
        name: "Anita Gupta",
        company: "Gupta Steel Industries",
        email: "anita@guptasteel.in",
        phone: "9667890123",
        gstin: "09DDDEG3456I4Z9",
        address: "A-23, Site IV, Industrial Area",
        city: "Noida",
        state: "Uttar Pradesh",
        pincode: "201301",
        notes: "Steel fabrication, regular orders",
      },
      {
        name: "Mohammed Irfan",
        company: "Crescent Manufacturing",
        email: "irfan@crescentmfg.com",
        phone: "9534567890",
        gstin: "29EEECM7890J5Z7",
        address: "No 78, Peenya Industrial Area",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560058",
        notes: "Precision engineering parts",
      },
      {
        name: "Deepak Joshi",
        company: "Joshi Paper Mills",
        email: "deepak@joshipaper.in",
        phone: "9456789012",
        gstin: "27FFFEJ2345K6Z5",
        address: "Gat No 234, Chakan MIDC",
        city: "Pune",
        state: "Maharashtra",
        pincode: "410501",
        notes: "Paper & cardboard products",
      },
      {
        name: "Kavita Singh",
        company: "Singh Plastics Ltd",
        email: "kavita@singhplastics.com",
        phone: "9378901234",
        gstin: "23GGGKS6789L7Z3",
        address: "Plot 18, Mandideep Industrial Area",
        city: "Bhopal",
        state: "Madhya Pradesh",
        pincode: "462046",
        notes: "Injection molding, HDPE products",
      },
      {
        name: "Ramesh Nair",
        company: "Kerala Spice Extracts",
        email: "ramesh@keralaspice.in",
        phone: "9289012345",
        gstin: "32HHHKN1234M8Z1",
        address: "TC 21/567, Industrial Estate",
        city: "Kochi",
        state: "Kerala",
        pincode: "682024",
        notes: "Export quality, seasonal demand",
      },
    ];

    const customerIds = [];
    for (const c of customersData) {
      const res = await client.query(
        `INSERT INTO customers (user_id, name, company_name, email, phone, gstin, address, city, state, pincode, outstanding_balance, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          userId,
          c.name,
          c.company,
          c.email,
          c.phone,
          c.gstin,
          c.address,
          c.city,
          c.state,
          c.pincode,
          0,
          c.notes,
        ],
      );
      customerIds.push(res.rows[0].id);
    }
    console.log(`  ✅ ${customerIds.length} customers created`);

    // ──────── 3. ORDERS ────────
    // Various statuses and dates spread over last 6 months
    const today = new Date();
    const daysAgo = (d) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      return dt.toISOString().split("T")[0];
    };
    const daysFromNow = (d) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().split("T")[0];
    };

    const ordersData = [
      {
        custIdx: 0,
        number: "ORD-2026-001",
        date: daysAgo(150),
        delivery: daysAgo(120),
        status: "delivered",
        priority: "normal",
        items: [
          { name: "Cotton Fabric Roll - 40s Count", quantity: 200, rate: 850, amount: 170000 },
          { name: "Polyester Blend Fabric", quantity: 100, rate: 650, amount: 65000 },
        ],
        total_qty: 300,
        total: 235000,
        tax: 42300,
        grand: 277300,
      },
      {
        custIdx: 0,
        number: "ORD-2026-002",
        date: daysAgo(90),
        delivery: daysAgo(60),
        status: "delivered",
        priority: "high",
        items: [{ name: "Silk Fabric Premium", quantity: 50, rate: 2200, amount: 110000 }],
        total_qty: 50,
        total: 110000,
        tax: 19800,
        grand: 129800,
      },
      {
        custIdx: 1,
        number: "ORD-2026-003",
        date: daysAgo(120),
        delivery: daysAgo(90),
        status: "delivered",
        priority: "normal",
        items: [
          { name: "Gear Assembly - Model A", quantity: 500, rate: 320, amount: 160000 },
          { name: "Bearing Housing Unit", quantity: 300, rate: 450, amount: 135000 },
        ],
        total_qty: 800,
        total: 295000,
        tax: 53100,
        grand: 348100,
      },
      {
        custIdx: 1,
        number: "ORD-2026-004",
        date: daysAgo(45),
        delivery: daysAgo(10),
        status: "dispatched",
        priority: "urgent",
        items: [{ name: "Brake Disc Assembly", quantity: 1000, rate: 280, amount: 280000 }],
        total_qty: 1000,
        total: 280000,
        tax: 50400,
        grand: 330400,
      },
      {
        custIdx: 2,
        number: "ORD-2026-005",
        date: daysAgo(100),
        delivery: daysAgo(70),
        status: "delivered",
        priority: "normal",
        items: [{ name: "Corrugated Box - 12x10x8", quantity: 5000, rate: 18, amount: 90000 }],
        total_qty: 5000,
        total: 90000,
        tax: 16200,
        grand: 106200,
      },
      {
        custIdx: 3,
        number: "ORD-2026-006",
        date: daysAgo(60),
        delivery: daysAgo(30),
        status: "delivered",
        priority: "high",
        items: [
          { name: "MS Angle 50x50x5mm", quantity: 200, rate: 1100, amount: 220000 },
          { name: "MS Flat Bar 40x5mm", quantity: 150, rate: 780, amount: 117000 },
        ],
        total_qty: 350,
        total: 337000,
        tax: 60660,
        grand: 397660,
      },
      {
        custIdx: 3,
        number: "ORD-2026-007",
        date: daysAgo(20),
        delivery: daysFromNow(10),
        status: "in_production",
        priority: "high",
        items: [{ name: "SS Sheet 304 Grade", quantity: 100, rate: 3500, amount: 350000 }],
        total_qty: 100,
        total: 350000,
        tax: 63000,
        grand: 413000,
      },
      {
        custIdx: 4,
        number: "ORD-2026-008",
        date: daysAgo(80),
        delivery: daysAgo(50),
        status: "delivered",
        priority: "normal",
        items: [
          { name: "CNC Machined Shaft", quantity: 400, rate: 550, amount: 220000 },
          { name: "Precision Bushings", quantity: 600, rate: 180, amount: 108000 },
        ],
        total_qty: 1000,
        total: 328000,
        tax: 59040,
        grand: 387040,
      },
      {
        custIdx: 4,
        number: "ORD-2026-009",
        date: daysAgo(15),
        delivery: daysFromNow(15),
        status: "confirmed",
        priority: "normal",
        items: [{ name: "Aluminum Die Cast Housing", quantity: 250, rate: 420, amount: 105000 }],
        total_qty: 250,
        total: 105000,
        tax: 18900,
        grand: 123900,
      },
      {
        custIdx: 5,
        number: "ORD-2026-010",
        date: daysAgo(110),
        delivery: daysAgo(80),
        status: "delivered",
        priority: "low",
        items: [{ name: "Kraft Paper 80 GSM", quantity: 2000, rate: 42, amount: 84000 }],
        total_qty: 2000,
        total: 84000,
        tax: 15120,
        grand: 99120,
      },
      {
        custIdx: 5,
        number: "ORD-2026-011",
        date: daysAgo(30),
        delivery: daysFromNow(5),
        status: "quality_check",
        priority: "normal",
        items: [
          { name: "Duplex Board 300 GSM", quantity: 1500, rate: 65, amount: 97500 },
          { name: "Art Paper 130 GSM", quantity: 1000, rate: 38, amount: 38000 },
        ],
        total_qty: 2500,
        total: 135500,
        tax: 24390,
        grand: 159890,
      },
      {
        custIdx: 6,
        number: "ORD-2026-012",
        date: daysAgo(70),
        delivery: daysAgo(40),
        status: "delivered",
        priority: "normal",
        items: [{ name: "HDPE Granules Natural", quantity: 3000, rate: 95, amount: 285000 }],
        total_qty: 3000,
        total: 285000,
        tax: 51300,
        grand: 336300,
      },
      {
        custIdx: 6,
        number: "ORD-2026-013",
        date: daysAgo(10),
        delivery: daysFromNow(20),
        status: "pending",
        priority: "low",
        items: [
          { name: "PP Granules - Injection Grade", quantity: 2000, rate: 88, amount: 176000 },
        ],
        total_qty: 2000,
        total: 176000,
        tax: 31680,
        grand: 207680,
      },
      {
        custIdx: 7,
        number: "ORD-2026-014",
        date: daysAgo(40),
        delivery: daysAgo(10),
        status: "ready",
        priority: "high",
        items: [
          { name: "Turmeric Oleoresin", quantity: 100, rate: 4200, amount: 420000 },
          { name: "Black Pepper Extract", quantity: 50, rate: 5600, amount: 280000 },
        ],
        total_qty: 150,
        total: 700000,
        tax: 126000,
        grand: 826000,
      },
      {
        custIdx: 7,
        number: "ORD-2026-015",
        date: daysAgo(5),
        delivery: daysFromNow(25),
        status: "pending",
        priority: "urgent",
        items: [{ name: "Cardamom Essential Oil", quantity: 30, rate: 8500, amount: 255000 }],
        total_qty: 30,
        total: 255000,
        tax: 45900,
        grand: 300900,
      },
      {
        custIdx: 0,
        number: "ORD-2026-016",
        date: daysAgo(25),
        delivery: daysFromNow(5),
        status: "in_production",
        priority: "normal",
        items: [
          { name: "Cotton Fabric Roll - 60s Count", quantity: 150, rate: 1100, amount: 165000 },
        ],
        total_qty: 150,
        total: 165000,
        tax: 29700,
        grand: 194700,
      },
      {
        custIdx: 2,
        number: "ORD-2026-017",
        date: daysAgo(8),
        delivery: daysFromNow(22),
        status: "confirmed",
        priority: "normal",
        items: [
          { name: "Cardboard Carton - Custom Print", quantity: 3000, rate: 25, amount: 75000 },
        ],
        total_qty: 3000,
        total: 75000,
        tax: 13500,
        grand: 88500,
      },
    ];

    const orderIds = [];
    for (const o of ordersData) {
      const res = await client.query(
        `INSERT INTO orders (user_id, customer_id, order_number, order_date, delivery_date, status, priority, items, total_quantity, total_amount, tax_amount, discount_amount, grand_total, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, $13)
         RETURNING id`,
        [
          userId,
          customerIds[o.custIdx],
          o.number,
          o.date,
          o.delivery,
          o.status,
          o.priority,
          JSON.stringify(o.items),
          o.total_qty,
          o.total,
          o.tax,
          o.grand,
          "",
        ],
      );
      orderIds.push(res.rows[0].id);
    }
    console.log(`  ✅ ${orderIds.length} orders created`);

    // ──────── 4. PRODUCTION LOGS ────────
    const workers = [
      "Raju Kamble",
      "Amit Yadav",
      "Santosh Patil",
      "Manoj Kumar",
      "Sunil Jadhav",
      "Ganesh Bhosale",
    ];
    const prodLogs = [];

    // Delivered orders: full production logs
    const deliveredOrderIndices = [0, 1, 2, 4, 5, 7, 9, 11];
    for (const idx of deliveredOrderIndices) {
      const o = ordersData[idx];
      const totalUnits = o.total_qty;
      const batches = Math.ceil(totalUnits / (totalUnits > 500 ? 3 : 2));
      const unitsPerBatch = Math.ceil(totalUnits / batches);

      for (let b = 0; b < batches; b++) {
        const logDate = new Date(o.date);
        logDate.setDate(logDate.getDate() + (b + 1) * 5);
        const produced =
          b === batches - 1 ? totalUnits - unitsPerBatch * (batches - 1) : unitsPerBatch;
        const defective = Math.floor(produced * (Math.random() * 0.03)); // 0-3% defect rate

        prodLogs.push({
          orderId: orderIds[idx],
          logDate: logDate.toISOString().split("T")[0],
          produced,
          defective,
          worker: workers[Math.floor(Math.random() * workers.length)],
          shift: b % 2 === 0 ? "day" : "night",
        });
      }
    }

    // In-production orders: partial logs
    const inProdIndices = [6, 15]; // ORD-007 (in_production), ORD-016 (in_production)
    for (const idx of inProdIndices) {
      const o = ordersData[idx];
      const done = Math.floor(o.total_qty * 0.6);
      prodLogs.push({
        orderId: orderIds[idx],
        logDate: daysAgo(5),
        produced: Math.floor(done * 0.6),
        defective: Math.floor(done * 0.6 * 0.02),
        worker: workers[Math.floor(Math.random() * workers.length)],
        shift: "day",
      });
      prodLogs.push({
        orderId: orderIds[idx],
        logDate: daysAgo(2),
        produced: done - Math.floor(done * 0.6),
        defective: Math.floor((done - Math.floor(done * 0.6)) * 0.01),
        worker: workers[Math.floor(Math.random() * workers.length)],
        shift: "night",
      });
    }

    // Quality check order: nearly complete
    prodLogs.push({
      orderId: orderIds[10], // ORD-011 quality_check
      logDate: daysAgo(7),
      produced: 1500,
      defective: 23,
      worker: workers[2],
      shift: "day",
    });
    prodLogs.push({
      orderId: orderIds[10],
      logDate: daysAgo(4),
      produced: 1000,
      defective: 12,
      worker: workers[3],
      shift: "night",
    });

    // Today's production log
    prodLogs.push({
      orderId: orderIds[6], // ORD-007 in_production
      logDate: daysAgo(0),
      produced: 15,
      defective: 1,
      worker: workers[0],
      shift: "day",
    });

    for (const log of prodLogs) {
      await client.query(
        `INSERT INTO production_logs (user_id, order_id, log_date, units_produced, units_defective, worker_name, shift)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, log.orderId, log.logDate, log.produced, log.defective, log.worker, log.shift],
      );
    }
    console.log(`  ✅ ${prodLogs.length} production logs created`);

    // ──────── 5. INVOICES ────────
    const invoicesData = [
      {
        custIdx: 0,
        orderIdx: 0,
        number: "INV-2026-001",
        date: daysAgo(120),
        due: daysAgo(90),
        subtotal: 235000,
        cgst: 21150,
        sgst: 21150,
        igst: 0,
        tax: 42300,
        grand: 277300,
        status: "paid",
      },
      {
        custIdx: 0,
        orderIdx: 1,
        number: "INV-2026-002",
        date: daysAgo(60),
        due: daysAgo(30),
        subtotal: 110000,
        cgst: 9900,
        sgst: 9900,
        igst: 0,
        tax: 19800,
        grand: 129800,
        status: "paid",
      },
      {
        custIdx: 1,
        orderIdx: 2,
        number: "INV-2026-003",
        date: daysAgo(90),
        due: daysAgo(60),
        subtotal: 295000,
        cgst: 0,
        sgst: 0,
        igst: 53100,
        tax: 53100,
        grand: 348100,
        status: "paid",
      },
      {
        custIdx: 1,
        orderIdx: 3,
        number: "INV-2026-004",
        date: daysAgo(10),
        due: daysFromNow(20),
        subtotal: 280000,
        cgst: 0,
        sgst: 0,
        igst: 50400,
        tax: 50400,
        grand: 330400,
        status: "unpaid",
      },
      {
        custIdx: 2,
        orderIdx: 4,
        number: "INV-2026-005",
        date: daysAgo(70),
        due: daysAgo(40),
        subtotal: 90000,
        cgst: 0,
        sgst: 0,
        igst: 16200,
        tax: 16200,
        grand: 106200,
        status: "paid",
      },
      {
        custIdx: 3,
        orderIdx: 5,
        number: "INV-2026-006",
        date: daysAgo(30),
        due: daysAgo(0),
        subtotal: 337000,
        cgst: 0,
        sgst: 0,
        igst: 60660,
        tax: 60660,
        grand: 397660,
        status: "partial",
      },
      {
        custIdx: 4,
        orderIdx: 7,
        number: "INV-2026-007",
        date: daysAgo(50),
        due: daysAgo(20),
        subtotal: 328000,
        cgst: 0,
        sgst: 0,
        igst: 59040,
        tax: 59040,
        grand: 387040,
        status: "overdue",
      },
      {
        custIdx: 5,
        orderIdx: 9,
        number: "INV-2026-008",
        date: daysAgo(80),
        due: daysAgo(50),
        subtotal: 84000,
        cgst: 7560,
        sgst: 7560,
        igst: 0,
        tax: 15120,
        grand: 99120,
        status: "paid",
      },
      {
        custIdx: 6,
        orderIdx: 11,
        number: "INV-2026-009",
        date: daysAgo(40),
        due: daysAgo(10),
        subtotal: 285000,
        cgst: 0,
        sgst: 0,
        igst: 51300,
        tax: 51300,
        grand: 336300,
        status: "partial",
      },
      {
        custIdx: 7,
        orderIdx: 13,
        number: "INV-2026-010",
        date: daysAgo(10),
        due: daysFromNow(20),
        subtotal: 700000,
        cgst: 0,
        sgst: 0,
        igst: 126000,
        tax: 126000,
        grand: 826000,
        status: "unpaid",
      },
    ];

    const invoiceIds = [];
    for (const inv of invoicesData) {
      const o = ordersData[inv.orderIdx];
      const cgstRate = inv.cgst > 0 ? 9 : 0;
      const sgstRate = inv.sgst > 0 ? 9 : 0;
      const igstRate = inv.igst > 0 ? 18 : 0;

      const res = await client.query(
        `INSERT INTO invoices (user_id, order_id, customer_id, invoice_number, invoice_date, due_date, subtotal, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount, total_tax, grand_total, status, items)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING id`,
        [
          userId,
          orderIds[inv.orderIdx],
          customerIds[inv.custIdx],
          inv.number,
          inv.date,
          inv.due,
          inv.subtotal,
          cgstRate,
          sgstRate,
          igstRate,
          inv.cgst,
          inv.sgst,
          inv.igst,
          inv.tax,
          inv.grand,
          inv.status,
          JSON.stringify(o.items),
        ],
      );
      invoiceIds.push(res.rows[0].id);
    }
    console.log(`  ✅ ${invoiceIds.length} invoices created`);

    // ──────── 6. PAYMENTS ────────
    const paymentsData = [
      // Paid invoices - full payments
      {
        custIdx: 0,
        invIdx: 0,
        amount: 277300,
        date: daysAgo(95),
        mode: "bank_transfer",
        ref: "NEFT/2026/001234",
      },
      {
        custIdx: 0,
        invIdx: 1,
        amount: 129800,
        date: daysAgo(28),
        mode: "upi",
        ref: "UPI/9876543210@ybl/0452",
      },
      {
        custIdx: 1,
        invIdx: 2,
        amount: 200000,
        date: daysAgo(65),
        mode: "neft",
        ref: "NEFT/2026/005678",
      },
      {
        custIdx: 1,
        invIdx: 2,
        amount: 148100,
        date: daysAgo(55),
        mode: "cheque",
        ref: "CHQ-445566-HDFC",
      },
      {
        custIdx: 2,
        invIdx: 4,
        amount: 106200,
        date: daysAgo(42),
        mode: "bank_transfer",
        ref: "RTGS/2026/007890",
      },
      {
        custIdx: 5,
        invIdx: 7,
        amount: 99120,
        date: daysAgo(52),
        mode: "cash",
        ref: "RCPT-2026-089",
      },

      // Partial payments
      {
        custIdx: 3,
        invIdx: 5,
        amount: 200000,
        date: daysAgo(5),
        mode: "neft",
        ref: "NEFT/2026/012345",
      },
      {
        custIdx: 6,
        invIdx: 8,
        amount: 150000,
        date: daysAgo(12),
        mode: "upi",
        ref: "UPI/9378901234@paytm/1122",
      },

      // Some extra payments for revenue spread
      {
        custIdx: 0,
        invIdx: 0,
        amount: 50000,
        date: daysAgo(140),
        mode: "cash",
        ref: "RCPT-2026-001",
      }, // advance
      {
        custIdx: 4,
        invIdx: 6,
        amount: 100000,
        date: daysAgo(25),
        mode: "bank_transfer",
        ref: "IMPS/2026/334455",
      },
      {
        custIdx: 7,
        invIdx: 9,
        amount: 300000,
        date: daysAgo(3),
        mode: "rtgs",
        ref: "RTGS/2026/998877",
      }, // partial on Kerala Spice

      // Recent payments for today's dashboard
      {
        custIdx: 3,
        invIdx: 5,
        amount: 50000,
        date: daysAgo(0),
        mode: "upi",
        ref: "UPI/9667890123@ybl/9988",
      },
      {
        custIdx: 0,
        invIdx: 1,
        amount: 25000,
        date: daysAgo(0),
        mode: "cash",
        ref: "RCPT-2026-112",
      },
    ];

    for (const p of paymentsData) {
      await client.query(
        `INSERT INTO payments (user_id, customer_id, invoice_id, amount, payment_date, payment_mode, reference_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, customerIds[p.custIdx], invoiceIds[p.invIdx], p.amount, p.date, p.mode, p.ref],
      );
    }
    console.log(`  ✅ ${paymentsData.length} payments created`);

    // ──────── 7. UPDATE OUTSTANDING BALANCES ────────
    // Outstanding = unpaid/partial invoice grand_total - sum of payments on those invoices
    const outstandingBalances = {
      // Customer 1 (Mehta Auto): INV-004 unpaid 330400
      1: 330400,
      // Customer 3 (Gupta Steel): INV-006 partial 397660 - 200000 - 50000 = 147660
      3: 147660,
      // Customer 4 (Crescent): INV-007 overdue 387040 - 100000 = 287040
      4: 287040,
      // Customer 6 (Singh Plastics): INV-009 partial 336300 - 150000 = 186300
      6: 186300,
      // Customer 7 (Kerala Spice): INV-010 unpaid 826000 - 300000 = 526000
      7: 526000,
    };

    for (const [idx, balance] of Object.entries(outstandingBalances)) {
      await client.query(`UPDATE customers SET outstanding_balance = $1 WHERE id = $2`, [
        balance,
        customerIds[parseInt(idx)],
      ]);
    }
    console.log(`  ✅ Customer outstanding balances updated`);

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete! Login with demo@factoryflow.com / password123\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
