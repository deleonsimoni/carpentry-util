const Takeoff = require('../models/takeoff.model');
const User = require('../models/user.model');
const Invoice = require('../models/invoice.model');
const invoiceCalculator = require('../services/invoice-calculator.service');
const invoicePDFService = require('../services/invoice-pdf.service');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const UserRoles = require('../constants/user-roles');

// Invoice Controller - Updated with template PDF support and detailed logging

module.exports = {
  generateInvoicePDF,
  calculateInvoice,
  previewInvoiceCalculation,
  generateMultiTakeoffInvoicePDF,
  getInvoiceHistory,
  downloadInvoiceById
};

/**
 * Generate Invoice PDF for a takeoff
 * GET /api/invoice/:takeoffId/generate-pdf
 */
async function generateInvoicePDF(req, res, next) {
  try {
    const { takeoffId } = req.params;
    const user = req.user;

    // Build query with company filter for multi-tenancy
    const companyFilter = user.company ? { company: user.company } : {};

    const baseQuery = {
      $and: [{ _id: takeoffId }],
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
      ...companyFilter
    };

    // Managers and carpenters can generate invoices
    if (!UserRoles.isManager(user.roles) && !UserRoles.isCarpenter(user.roles)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers and carpenters can generate invoices'
      });
    }

    // Get takeoff with populated fields
    const takeoff = await Takeoff.findOne(baseQuery)
      .populate('carpentry', 'fullname email')
      .populate('trimCarpentry', 'fullname email')
      .populate('user', 'fullname email');

    if (!takeoff) {
      return res.status(404).json({
        message: 'Takeoff not found or access denied'
      });
    }

    // Takeoff must be in UNDER_REVIEW status or higher (status >= 3)
    if (takeoff.status < 3) {
      return res.status(400).json({
        message: 'Takeoff must be in UNDER_REVIEW status or higher to generate invoice'
      });
    }

    // Calculate invoice data
    const invoiceData = await invoiceCalculator.calculateInvoice(takeoff);

    // Generate PDF
    const pdfBase64 = await generateInvoicePDFDocument(takeoff, invoiceData, user);

    res.json({
      success: true,
      message: 'Invoice PDF generated successfully',
      data: {
        pdf: pdfBase64,
        calculation: invoiceData
      }
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    next(error);
  }
}

/**
 * Calculate invoice without generating PDF
 * GET /api/invoice/:takeoffId/calculate
 */
async function calculateInvoice(req, res, next) {
  try {
    const { takeoffId } = req.params;
    const user = req.user;

    const companyFilter = user.company ? { company: user.company } : {};

    const baseQuery = {
      $and: [{ _id: takeoffId }],
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
      ...companyFilter
    };

    const takeoff = await Takeoff.findOne(baseQuery);

    if (!takeoff) {
      return res.status(404).json({
        message: 'Takeoff not found or access denied'
      });
    }

    // Calculate invoice
    const invoiceData = await invoiceCalculator.calculateInvoice(takeoff);

    res.json({
      success: true,
      message: 'Invoice calculated successfully',
      data: invoiceData
    });

  } catch (error) {
    console.error('Error calculating invoice:', error);
    next(error);
  }
}

/**
 * Preview invoice calculation (returns detailed breakdown)
 * GET /api/invoice/:takeoffId/preview
 */
async function previewInvoiceCalculation(req, res, next) {
  try {
    const { takeoffId } = req.params;
    const user = req.user;

    const companyFilter = user.company ? { company: user.company } : {};

    const baseQuery = {
      $and: [{ _id: takeoffId }],
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
      ...companyFilter
    };

    const takeoff = await Takeoff.findOne(baseQuery)
      .populate('carpentry', 'fullname email hstRegistrationNumber companyName')
      .populate('user', 'fullname email hstRegistrationNumber companyName');

    if (!takeoff) {
      return res.status(404).json({
        message: 'Takeoff not found or access denied'
      });
    }

    // Calculate invoice
    const invoiceData = await invoiceCalculator.calculateInvoice(takeoff);

    // Add takeoff info to response
    res.json({
      success: true,
      message: 'Invoice preview generated successfully',
      data: {
        takeoffInfo: {
          id: takeoff._id,
          customerName: takeoff.custumerName,
          lot: takeoff.lot,
          shipTo: takeoff.shipTo,
          foremen: takeoff.foremen,
          carpInvoice: takeoff.carpInvoice,
          status: takeoff.status,
          carpenter: takeoff.carpentry?.fullname,
          manager: takeoff.user?.fullname,
          hstRegistrationNumber: takeoff.carpentry?.hstRegistrationNumber || takeoff.user?.hstRegistrationNumber,
          companyName: takeoff.carpentry?.companyName || takeoff.user?.companyName
        },
        calculation: invoiceData
      }
    });

  } catch (error) {
    console.error('Error previewing invoice calculation:', error);
    next(error);
  }
}

/**
 * Internal function to generate PDF document
 * Uses invoice template or creates from scratch
 */
async function generateInvoicePDFDocument(takeoff, invoiceData, user) {
  try {
    // Check if template exists
    const templatePath = 'invoice_template.pdf';
    let pdfDoc;

    if (fs.existsSync(templatePath)) {
      // Load existing template
      const templateBytes = await fs.promises.readFile(templatePath);
      pdfDoc = await PDFDocument.load(templateBytes);
    } else {
      // Create new PDF from scratch
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Header
      page.drawText('INVOICE', {
        x: 250,
        y: 750,
        size: 24,
        font: fontBold,
        color: rgb(0, 0, 0)
      });

      // Company info
      let yPosition = 720;
      page.drawText('Crew Leader\'s Company:', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText(user.fullname || '', { x: 180, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('Customer Name:', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText(takeoff.custumerName || '', { x: 180, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('Site Location:', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText(takeoff.shipTo || '', { x: 180, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('Lot #:', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText(takeoff.lot || '', { x: 180, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('Foremen:', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText(takeoff.foremen || '', { x: 180, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('Carp Invoice #:', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText(takeoff.carpInvoice || '', { x: 180, y: yPosition, size: 10, font });

      yPosition -= 40;

      // Table header
      page.drawText('Description', { x: 50, y: yPosition, size: 10, font: fontBold });
      page.drawText('Qty', { x: 300, y: yPosition, size: 10, font: fontBold });
      page.drawText('Unit Price', { x: 380, y: yPosition, size: 10, font: fontBold });
      page.drawText('Amount', { x: 480, y: yPosition, size: 10, font: fontBold });

      yPosition -= 5;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 550, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      yPosition -= 20;

      // Line items
      for (const item of invoiceData.lineItems) {
        if (item.quantity > 0 && item.amount > 0) {
          page.drawText(item.description, { x: 50, y: yPosition, size: 9, font });
          page.drawText(item.quantity.toString(), { x: 300, y: yPosition, size: 9, font });

          if (item.unitPrice) {
            page.drawText(`$${item.unitPrice.toFixed(2)}`, { x: 380, y: yPosition, size: 9, font });
          }

          page.drawText(`$${item.amount.toFixed(2)}`, { x: 480, y: yPosition, size: 9, font });

          yPosition -= 15;
        }
      }

      yPosition -= 10;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 550, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      yPosition -= 20;

      // Totals
      page.drawText('SUBTOTAL:', { x: 380, y: yPosition, size: 10, font: fontBold });
      page.drawText(`$${invoiceData.subtotal.toFixed(2)}`, { x: 480, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('HST (13%):', { x: 380, y: yPosition, size: 10, font: fontBold });
      page.drawText(`$${invoiceData.hst.toFixed(2)}`, { x: 480, y: yPosition, size: 10, font });

      yPosition -= 20;
      page.drawText('TOTAL TO BE PAID:', { x: 380, y: yPosition, size: 12, font: fontBold });
      page.drawText(`$${invoiceData.total.toFixed(2)}`, { x: 480, y: yPosition, size: 12, font: fontBold });
    }

    // If template exists, fill form fields
    if (fs.existsSync(templatePath)) {
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      // Fill header fields
      try {
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        form.getTextField('invoiceDate')?.setText(dateStr);
        form.getTextField('crewLeaderCompany')?.setText(user.fullname || '');
        form.getTextField('customerName')?.setText(takeoff.custumerName || '');
        form.getTextField('siteLocation')?.setText(takeoff.shipTo || '');
        form.getTextField('lot')?.setText(takeoff.lot || '');
        form.getTextField('foremen')?.setText(takeoff.foremen || '');
        form.getTextField('carpInvoice')?.setText(takeoff.carpInvoice || '');
        form.getTextField('trimSize')?.setText(takeoff.trim?.[0]?.details || '');

        // Fill line items (assuming fields are named by description)
        invoiceData.lineItems.forEach((item, index) => {
          if (item.quantity > 0 && item.amount > 0) {
            const fieldName = item.description.toLowerCase().replace(/\s+/g, '_');
            try {
              form.getTextField(`${fieldName}_qty`)?.setText(item.quantity.toString());
              form.getTextField(`${fieldName}_amount`)?.setText(item.amount.toFixed(2));
            } catch (e) {
              // Field doesn't exist in template
            }
          }
        });

        // Fill totals
        form.getTextField('subtotal')?.setText(invoiceData.subtotal.toFixed(2));
        form.getTextField('hst')?.setText(invoiceData.hst.toFixed(2));
        form.getTextField('total')?.setText(invoiceData.total.toFixed(2));

      } catch (error) {
        console.error('Error filling form fields:', error);
      }
    }

    // Save and return as base64
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    return `data:application/pdf;base64,${pdfBase64}`;

  } catch (error) {
    console.error('Error generating PDF document:', error);
    throw error;
  }
}

/**
 * Generate Invoice PDF for multiple takeoffs (up to 5)
 * POST /api/invoice/generate-multi-takeoff-pdf
 * Body: { takeoffIds: string[] }
 */
async function generateMultiTakeoffInvoicePDF(req, res, next) {
  try {
    const { takeoffIds } = req.body;
    const user = req.user;

    // Validation
    if (!takeoffIds || !Array.isArray(takeoffIds)) {
      return res.status(400).json({
        success: false,
        message: 'takeoffIds must be an array'
      });
    }

    if (takeoffIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one takeoff ID is required'
      });
    }

    if (takeoffIds.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 takeoffs can be included in one invoice'
      });
    }

    // Managers and carpenters can generate invoices
    if (!UserRoles.isManager(user.roles) && !UserRoles.isCarpenter(user.roles)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers and carpenters can generate invoices'
      });
    }

    // Build company filter
    const companyFilter = user.company ? { company: user.company } : {};

    // Fetch all takeoffs
    const takeoffs = [];
    const calculations = [];

    for (const takeoffId of takeoffIds) {
      const baseQuery = {
        $and: [{ _id: takeoffId }],
        $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
        ...companyFilter
      };

      const takeoff = await Takeoff.findOne(baseQuery)
        .populate('carpentry', 'fullname email')
        .populate('trimCarpentry', 'fullname email')
        .populate('user', 'fullname email');

      if (!takeoff) {
        return res.status(404).json({
          success: false,
          message: `Takeoff ${takeoffId} not found or access denied`
        });
      }

      // Takeoff must be in UNDER_REVIEW status or higher (status >= 3)
      if (takeoff.status < 3) {
        return res.status(400).json({
          success: false,
          message: `Takeoff ${takeoffId} must be in UNDER_REVIEW status or higher to generate invoice`
        });
      }

      takeoffs.push(takeoff);

      // Calculate invoice data for this takeoff
      const invoiceData = await invoiceCalculator.calculateInvoice(takeoff);
      calculations.push(invoiceData);
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber(user.company);

    // Calculate totals
    const subtotal = calculations.reduce((sum, calc) => sum + calc.subtotal, 0);
    const hst = calculations.reduce((sum, calc) => sum + calc.hst, 0);
    const totalAmount = calculations.reduce((sum, calc) => sum + calc.total, 0);

    // Get full user data with hstRegistrationNumber and companyName
    const fullUser = await User.findById(user._id).select('fullname email mobilePhone homePhone hstRegistrationNumber companyName');

    // Generate multi-takeoff PDF using service
    const pdfBase64 = await invoicePDFService.generateMultiTakeoffPDF(takeoffs, fullUser || user, invoiceNumber);

    // Save invoice to database
    const invoiceData = {
      invoiceNumber,
      company: user.company,
      generatedBy: user._id,
      takeoffs: takeoffs.map((takeoff, index) => ({
        takeoffId: takeoff._id,
        takeoffNumber: takeoff._id,
        customerName: takeoff.custumerName,
        lot: takeoff.lot,
        shipTo: takeoff.shipTo,
        role: takeoff.trimCarpentry ? 'trim' : 'measure',
        subtotal: calculations[index].subtotal,
        hst: calculations[index].hst,
        total: calculations[index].total
      })),
      subtotal,
      hst,
      totalAmount,
      status: 'issued',
      generatedDate: new Date()
    };

    const savedInvoice = await new Invoice(invoiceData).save();

    res.json({
      success: true,
      message: 'Multi-takeoff invoice PDF generated successfully',
      data: {
        invoiceId: savedInvoice._id,
        invoiceNumber: savedInvoice.invoiceNumber,
        pdf: pdfBase64,
        takeoffCount: takeoffs.length,
        totalAmount: savedInvoice.totalAmount
      }
    });

  } catch (error) {
    console.error('Error generating multi-takeoff invoice PDF:', error);
    next(error);
  }
}

/**
 * Get invoice history
 * GET /api/invoice/history
 */
async function getInvoiceHistory(req, res, next) {
  try {
    const user = req.user;
    const companyFilter = user.company ? { company: user.company } : {};

    // Build query based on user role
    let query = { ...companyFilter };

    // If not manager or delivery, only show invoices generated by the user
    if (!UserRoles.isManager(user.roles) && !UserRoles.isDelivery(user.roles)) {
      query.generatedBy = user._id;
    }

    const invoices = await Invoice.find(query)
      .populate('generatedBy', 'fullname email')
      .populate('takeoffs.takeoffId', 'custumerName lot shipTo')
      .sort({ generatedDate: -1 })
      .limit(100); // Limit to last 100 invoices

    // Format response to match frontend expectations
    const formattedInvoices = invoices.map(invoice => ({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      takeoffs: invoice.takeoffs.map(t => ({
        takeoffId: t.takeoffId?._id || t.takeoffId,
        takeoffNumber: t.takeoffNumber,
        customerName: t.customerName,
        lot: t.lot || t.takeoffId?.lot,
        role: t.role
      })),
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      generatedDate: invoice.generatedDate,
      createdAt: invoice.createdAt
    }));

    res.json({
      success: true,
      data: formattedInvoices
    });

  } catch (error) {
    console.error('Error fetching invoice history:', error);
    next(error);
  }
}

/**
 * Download invoice PDF by invoice ID
 * GET /api/invoice/:invoiceId/download
 * Regenerates PDF from stored invoice data
 */
async function downloadInvoiceById(req, res, next) {
  try {
    const { invoiceId } = req.params;
    const user = req.user;

    // Build query with company filter
    const companyFilter = user.company ? { company: user.company } : {};

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      ...companyFilter
    }).populate('takeoffs.takeoffId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or access denied'
      });
    }

    // Permission check: managers, delivery, and the user who generated can download
    if (!UserRoles.isManager(user.roles) &&
        !UserRoles.isDelivery(user.roles) &&
        invoice.generatedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this invoice'
      });
    }

    // Rebuild takeoffs and calculations arrays from invoice data
    const takeoffs = [];
    const calculations = [];

    for (const invoiceTakeoff of invoice.takeoffs) {
      // Get full takeoff data
      const takeoff = await Takeoff.findById(invoiceTakeoff.takeoffId);

      if (takeoff) {
        takeoffs.push(takeoff);

        // Recreate calculation from stored invoice data
        const calc = {
          subtotal: invoiceTakeoff.subtotal,
          hst: invoiceTakeoff.hst,
          total: invoiceTakeoff.total,
          lineItems: [] // Note: We don't store line items, so PDF will show totals only
        };

        // If we need line items, recalculate
        const fullCalc = await invoiceCalculator.calculateInvoice(takeoff);
        calc.lineItems = fullCalc.lineItems;

        calculations.push(calc);
      }
    }

    if (takeoffs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No takeoffs found for this invoice'
      });
    }

    // Get user who generated the invoice for PDF (with all fields)
    const generatedByUser = await User.findById(invoice.generatedBy).select('fullname email mobilePhone homePhone hstRegistrationNumber companyName');

    // Regenerate PDF using service
    const pdfBase64 = await invoicePDFService.generateMultiTakeoffPDF(
      takeoffs,
      generatedByUser || user,
      invoice.invoiceNumber
    );

    res.json({
      success: true,
      message: 'Invoice PDF downloaded successfully',
      data: {
        pdf: pdfBase64,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount
      }
    });

  } catch (error) {
    console.error('Error downloading invoice:', error);
    next(error);
  }
}
