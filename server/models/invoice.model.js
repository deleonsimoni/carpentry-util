const mongoose = require('mongoose');

/**
 * Invoice Model
 * Stores generated invoices with their associated takeoffs
 */
const InvoiceSchema = new mongoose.Schema({
  // Visual invoice number (e.g., INV-2024-001)
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Company reference (multi-tenancy)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // User who generated the invoice
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Takeoffs included in this invoice
  takeoffs: [{
    takeoffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Takeoff',
      required: true
    },
    takeoffNumber: String,
    customerName: String,
    lot: String,
    shipTo: String,
    role: {
      type: String,
      enum: ['measure', 'trim']
    },
    subtotal: Number,
    hst: Number,
    total: Number
  }],

  // Financial totals
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },

  hst: {
    type: Number,
    required: true,
    default: 0
  },

  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled'],
    default: 'issued'
  },

  // PDF reference (if stored)
  pdfUrl: String,

  // Dates
  generatedDate: {
    type: Date,
    default: Date.now
  },

  paidDate: Date,

  // Notes
  notes: String

}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for searching
InvoiceSchema.index({ invoiceNumber: 1, company: 1 });
InvoiceSchema.index({ generatedBy: 1, company: 1 });
InvoiceSchema.index({ status: 1, company: 1 });
InvoiceSchema.index({ generatedDate: -1 });

/**
 * Static method to generate next invoice number
 * Format: INV-YYYY-NNN (e.g., INV-2024-001)
 */
InvoiceSchema.statics.generateInvoiceNumber = async function(companyId) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the last invoice number for this year and company
  const lastInvoice = await this.findOne({
    company: companyId,
    invoiceNumber: { $regex: `^${prefix}` }
  })
  .sort({ invoiceNumber: -1 })
  .select('invoiceNumber');

  let nextNumber = 1;

  if (lastInvoice) {
    // Extract the number part (e.g., "001" from "INV-2024-001")
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros (e.g., 1 -> "001")
  const paddedNumber = String(nextNumber).padStart(3, '0');

  return `${prefix}${paddedNumber}`;
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
