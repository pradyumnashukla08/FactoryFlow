/**
 * @fileoverview Server-side type definitions for FactoryFlow.
 *
 * These JSDoc typedefs provide IntelliSense and type checking
 * for server code without requiring a TypeScript build step.
 *
 * Usage in any server file:
 *   const Types = require('../types/models');
 *   // Or use JSDoc: @type {import('../types/models').User}
 */

/**
 * @typedef {'owner' | 'admin' | 'staff'} UserRole
 *
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} password_hash
 * @property {string} [factory_name]
 * @property {string} [city]
 * @property {UserRole} role
 * @property {boolean} is_active
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {Object} Customer
 * @property {number} id
 * @property {number} user_id
 * @property {string} name
 * @property {string} [company_name]
 * @property {string} [email]
 * @property {string} phone
 * @property {string} [gstin]
 * @property {string} [address]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [pincode]
 * @property {number} outstanding_balance
 * @property {string} [notes]
 * @property {boolean} is_active
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {'pending' | 'confirmed' | 'in_production' | 'quality_check' | 'ready' | 'dispatched' | 'delivered' | 'cancelled'} OrderStatus
 * @typedef {'low' | 'normal' | 'high' | 'urgent'} Priority
 *
 * @typedef {Object} OrderItem
 * @property {string} name
 * @property {number} quantity
 * @property {number} rate
 * @property {number} [amount]
 * @property {string} [description]
 *
 * @typedef {Object} Order
 * @property {number} id
 * @property {number} user_id
 * @property {number|null} customer_id
 * @property {string} order_number
 * @property {Date} order_date
 * @property {Date} [delivery_date]
 * @property {OrderStatus} status
 * @property {Priority} priority
 * @property {OrderItem[]} items
 * @property {number} total_quantity
 * @property {number} total_amount
 * @property {number} tax_amount
 * @property {number} discount_amount
 * @property {number} grand_total
 * @property {string} [notes]
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'} InvoiceStatus
 *
 * @typedef {Object} InvoiceItem
 * @property {string} name
 * @property {number} quantity
 * @property {number} rate
 * @property {number} amount
 * @property {string} [description]
 *
 * @typedef {Object} Invoice
 * @property {number} id
 * @property {number} user_id
 * @property {number|null} [order_id]
 * @property {number|null} customer_id
 * @property {string} invoice_number
 * @property {Date} invoice_date
 * @property {Date} [due_date]
 * @property {number} subtotal
 * @property {number} cgst_rate
 * @property {number} sgst_rate
 * @property {number} igst_rate
 * @property {number} cgst_amount
 * @property {number} sgst_amount
 * @property {number} igst_amount
 * @property {number} total_tax
 * @property {number} grand_total
 * @property {InvoiceStatus} status
 * @property {InvoiceItem[]} items
 * @property {string} [notes]
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'neft' | 'rtgs' | 'other'} PaymentMode
 *
 * @typedef {Object} Payment
 * @property {number} id
 * @property {number} user_id
 * @property {number|null} [invoice_id]
 * @property {number|null} customer_id
 * @property {number} amount
 * @property {Date} payment_date
 * @property {PaymentMode} payment_mode
 * @property {string} [reference_number]
 * @property {string} [notes]
 * @property {Date} created_at
 */

/**
 * @typedef {'day' | 'night' | 'general'} Shift
 *
 * @typedef {Object} ProductionLog
 * @property {number} id
 * @property {number} order_id
 * @property {number} user_id
 * @property {Date} log_date
 * @property {number} units_produced
 * @property {number} units_defective
 * @property {string} [worker_name]
 * @property {Shift} shift
 * @property {string} [notes]
 * @property {Date} created_at
 */

/**
 * @typedef {'payment_due' | 'order_status' | 'delivery_reminder' | 'custom'} ReminderType
 * @typedef {'email' | 'whatsapp' | 'sms'} ReminderChannel
 * @typedef {'pending' | 'sent' | 'failed' | 'cancelled'} ReminderStatus
 *
 * @typedef {Object} Reminder
 * @property {number} id
 * @property {number} user_id
 * @property {number} customer_id
 * @property {number|null} [invoice_id]
 * @property {ReminderType} type
 * @property {string} [message]
 * @property {ReminderChannel} channel
 * @property {Date} [scheduled_at]
 * @property {Date} [sent_at]
 * @property {ReminderStatus} status
 * @property {Date} created_at
 */

/**
 * @typedef {Object} DemoRequest
 * @property {number} id
 * @property {string} name
 * @property {string} [factory_name]
 * @property {string} phone
 * @property {string} email
 * @property {string} [city]
 * @property {string} [billing_range]
 * @property {string} [message]
 * @property {'new' | 'contacted' | 'demo_scheduled' | 'converted' | 'closed'} status
 * @property {Date} created_at
 */

/**
 * @typedef {Object} AuthPayload
 * @property {number} id
 * @property {string} email
 * @property {UserRole} role
 */

/**
 * @typedef {Object} PaginatedResult
 * @property {any[]} rows
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 */

// Export empty object so this can be required
module.exports = {};
