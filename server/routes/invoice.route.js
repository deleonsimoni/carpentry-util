const express = require('express');
const invoiceCtrl = require('../controllers/invoice.controller');
const passport = require('passport');

const router = express.Router();

// Protect all routes with JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

/**
 * GET /api/invoice/:takeoffId/generate-pdf
 * Generate invoice PDF for a takeoff
 * Managers and carpenters can generate invoices
 */
router.get('/:takeoffId/generate-pdf', invoiceCtrl.generateInvoicePDF);

/**
 * GET /api/invoice/:takeoffId/calculate
 * Calculate invoice without generating PDF
 * Returns calculation breakdown
 */
router.get('/:takeoffId/calculate', invoiceCtrl.calculateInvoice);

/**
 * GET /api/invoice/:takeoffId/preview
 * Preview invoice calculation with takeoff details
 * Returns detailed breakdown with takeoff info
 */
router.get('/:takeoffId/preview', invoiceCtrl.previewInvoiceCalculation);

/**
 * POST /api/invoice/generate-multi-takeoff-pdf
 * Generate invoice PDF for multiple takeoffs (up to 5)
 * Body: { takeoffIds: string[] }
 * Managers and carpenters can generate invoices
 */
router.post('/generate-multi-takeoff-pdf', invoiceCtrl.generateMultiTakeoffInvoicePDF);

/**
 * GET /api/invoice/history
 * Get invoice history
 * Returns list of generated invoices
 */
router.get('/history', invoiceCtrl.getInvoiceHistory);

/**
 * GET /api/invoice/:invoiceId/download
 * Download invoice PDF by invoice ID
 * Regenerates PDF from stored invoice data
 */
router.get('/:invoiceId/download', invoiceCtrl.downloadInvoiceById);

module.exports = router;
