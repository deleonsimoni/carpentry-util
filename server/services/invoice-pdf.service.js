const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const invoiceCalculator = require('./invoice-calculator.service');

class InvoicePDFService {
  constructor() {
    this.templatePath = 'template-invoice.pdf';
    this.fieldMapping = {
      'BASEBOARD(SQ FT)': 'BASEBOARD(SQ FT)',
      'SINGLE DOOR OR HANDLE': 'SINGLE DOOROR BIFOLD',
      'DOUBLE DOOR OR SLIDERS': 'DOUBLE DOOROR BIFOLD',
      'CANTINA DOOR': 'CANTINA DOOR',
      'STD ARCHWAYS': 'STDARCHWAYS',
      'FD ARCHWAYS': 'TALLARCHWAYS',
      'REGULAR WINDOWS': 'REGULARWINDOWS',
      'ROUND TOP WINDOWS': 'ROUND TOPWINDOWS',
      'OPEN TO ABOVE WIN': 'OPEN TOABOVE WIN',
      'BAY OR BOW WINDOWS': 'BAY OR BOWWINDOW',
      'ATTIC HATCH': 'ATTIC HATCH',
      'CAPPING #1 SIZES': 'CAPPING ALLSIZES',
      'SOLID COLUMNS': 'SOLIDCOLUMNS',
      'SPLIT COLUMNS': 'SPLITCOLUMNS',
      'WIRE SHELVING': 'WOODSHELVING',
      'STAIRS (STRAIGHT)': 'STAIRS(STRAIGHT)',
      'STAIRS (CIRC.-WIND.)': 'STAIRS(CIRC/WIND)',
      'STAIRS (½ FLIGHT)': 'STAIRS(1/2 FLIGHT)',
      'DOOR CLOSER': 'DOOR CLOSUREMECHANISM',
      'EXTERIOR LOCK': 'EXTERIORLOCKS',
      'HANDRAIL': 'HANDRAIL',
      '1/4 ROUND': '1/4 ROUND',
      'TALLER DOORS OVER 85': 'TALLER DOORSOVER 85',
      'WINDOW SEAT': 'PARAPETOPENINGS',
      'WET AREAS': 'WET AREAS'
    };
  }

  async generateMultiTakeoffPDF(takeoffs, user, invoiceNumber) {
    const calculations = await this.calculateAllTakeoffs(takeoffs);
    const pdfDoc = await this.loadTemplate();
    const grandTotals = this.calculateGrandTotals(calculations);
    const { lineItemArrays } = this.buildLineItemArrays(calculations);

    await this.fillPDFFields(pdfDoc, {
      takeoffs,
      calculations,
      user,
      invoiceNumber,
      grandTotals,
      lineItemArrays
    });

    return await pdfDoc.saveAsBase64({ dataUri: true });
  }

  async calculateAllTakeoffs(takeoffs) {
    const calculations = [];
    for (const takeoff of takeoffs) {
      const invoiceData = await invoiceCalculator.calculateInvoice(takeoff);
      calculations.push(invoiceData);
    }
    return calculations;
  }

  async loadTemplate() {
    const pdfBytes = await fs.promises.readFile(this.templatePath);
    return await PDFDocument.load(pdfBytes);
  }

  calculateGrandTotals(calculations) {
    return {
      subtotal: calculations.reduce((sum, calc) => sum + calc.subtotal, 0),
      hst: calculations.reduce((sum, calc) => sum + calc.hst, 0),
      total: calculations.reduce((sum, calc) => sum + calc.total, 0)
    };
  }

  buildLineItemArrays(calculations) {
    const lineItemArrays = {};

    for (const [ourName, pdfName] of Object.entries(this.fieldMapping)) {
      const arr = new Array(10).fill('');

      // PDF has 5 columns, each column has 2 fields (amount + quantity)
      // Array indices: [0,1]=Col1, [2,3]=Col2, [4,5]=Col3, [6,7]=Col4, [8,9]=Col5
      //
      // FILL FROM RIGHT TO LEFT (counting backwards)
      //
      // Example with 1 takeoff [A]:
      //   Column 5: Takeoff A → indices [8, 9]
      //   Columns 1-4: empty
      //
      // Example with 2 takeoffs [A, B]:
      //   Column 4: Takeoff A (first selected)  → indices [6, 7]
      //   Column 5: Takeoff B (last selected)   → indices [8, 9]
      //   Columns 1-3: empty
      //
      // Example with 3 takeoffs [A, B, C]:
      //   Column 3: Takeoff A (first)  → indices [4, 5]
      //   Column 4: Takeoff B (middle) → indices [6, 7]
      //   Column 5: Takeoff C (last)   → indices [8, 9]
      //   Columns 1-2: empty
      for (let i = 0; i < calculations.length && i < 5; i++) {
        const item = calculations[i].lineItems.find(li => li.description === ourName);
        if (item) {
          // Fill from right to left: first takeoff goes to rightmost available column
          // If we have 1 takeoff: i=0 goes to column 5 (index 4)
          // If we have 2 takeoffs: i=0 goes to column 4 (index 3), i=1 goes to column 5 (index 4)
          const columnIndex = 4 - (calculations.length - 1) + i;

          const amtIndex = columnIndex * 2;      // Even indices: 0, 2, 4, 6, 8
          const qtyIndex = columnIndex * 2 + 1;  // Odd indices: 1, 3, 5, 7, 9

          // Preencher amount
          if (amtIndex < 10) {
            arr[amtIndex] = item.amount > 0 ? item.amount.toFixed(2) : '';
          }

          // Preencher quantity
          if (qtyIndex < 10) {
            arr[qtyIndex] = item.quantity > 0 ? item.quantity.toString() : '';
          }
        }
      }

      lineItemArrays[pdfName] = arr;
    }

    return { lineItemArrays };
  }

  async fillPDFFields(pdfDoc, data) {
    const {
      takeoffs,
      calculations,
      user,
      invoiceNumber,
      grandTotals,
      lineItemArrays
    } = data;

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // Extract unique customer names for the invoice header
    const customers = [...new Set(takeoffs.map(t => t.custumerName))]
      .filter(Boolean)
      .join(', ');

    // Fill all PDF form fields with calculated data
    fields.forEach(field => {
      const fieldName = field.getName();

      try {
        // Fill header information (invoice number, user details, totals)
        this.fillHeaderFields(field, fieldName, {
          user,
          invoiceNumber,
          customers,
          totals: grandTotals
        });

        // Fill takeoff-specific data (builder, site, lot, trim)
        this.fillTakeoffFields(field, fieldName, takeoffs);

        // Fill line item values (quantities and amounts per field)
        this.fillLineItemFields(field, fieldName, lineItemArrays);

        // Fill individual takeoff totals (TOTAL1-TOTAL5)
        this.fillTakeoffTotals(field, fieldName, calculations);
      } catch (error) {
        // Silently skip fields that cannot be filled
      }
    });

    // Update field appearances to reflect filled values
    try {
      form.updateFieldAppearances();
    } catch (error) {
      // Continue if appearance update fails
    }

    // Configure field properties for final PDF
    fields.forEach(field => {
      try {
        field.setFontSize(11); // Consistent font size across all fields
        field.enableReadOnly(); // Prevent editing in the final PDF
      } catch (error) {
        // Skip fields that don't support these properties
      }
    });
  }

  fillHeaderFields(field, fieldName, data) {
    const { user, invoiceNumber, customers, totals } = data;

    const headerFields = {
      'invoice': invoiceNumber,
      "Crew Leader's Name": user.fullname || '',
      "Crew Leader's Company": user.companyName || user.fullname || '',
      "Company Name": user.companyName || '',
      "Contact Phone Number": user.mobilePhone || user.homePhone || '',
      "Invoice to": customers || '',
      'email': user.email || '',
      'holdback': '0.00',
      'subtotal': totals.subtotal.toFixed(2),
      'hst': user.hstRegistrationNumber,
      'hst2': totals.hst.toFixed(2),
      'total': totals.total.toFixed(2)
    };

    if (headerFields.hasOwnProperty(fieldName)) {
      const value = headerFields[fieldName];
      field.setText(value);
      return true;
    }

    return false;
  }

  fillTakeoffFields(field, fieldName, takeoffs) {
    const builderMatch = fieldName.match(/^builder(\d+)$/);
    if (builderMatch) {
      const takeoffIndex = parseInt(builderMatch[1]) - 1;
      if (takeoffIndex < takeoffs.length) {
        field.setText('Builder Name');
        return true;
      }
    }

    const siteMatch = fieldName.match(/^site(\d+)$/);
    if (siteMatch) {
      const takeoffIndex = parseInt(siteMatch[1]) - 1;
      if (takeoffIndex < takeoffs.length) {
        field.setText(takeoffs[takeoffIndex].shipTo || '');
        return true;
      }
    }

    const lotMatch = fieldName.match(/^lot(\d+)$/);
    if (lotMatch) {
      const takeoffIndex = parseInt(lotMatch[1]) - 1;
      if (takeoffIndex < takeoffs.length) {
        field.setText(takeoffs[takeoffIndex].lot || '');
        return true;
      }
    }

    const trimMatch = fieldName.match(/^trim(\d+)$/);
    if (trimMatch) {
      const takeoffIndex = parseInt(trimMatch[1]) - 1;
      if (takeoffIndex < takeoffs.length) {
        field.setText(takeoffs[takeoffIndex].trim?.[0]?.details || '');
        return true;
      }
    }

    return false;
  }

  fillTakeoffTotals(field, fieldName, calculations) {
    // TOTAL1, TOTAL2, TOTAL3, TOTAL4, TOTAL5 - Totais individuais de cada takeoff
    const totalMatch = fieldName.match(/^TOTAL(\d+)$/);
    if (totalMatch) {
      const takeoffIndex = parseInt(totalMatch[1]) - 1;
      if (takeoffIndex < calculations.length) {
        const total = calculations[takeoffIndex].total;
        field.setText(total.toFixed(2));
        return true;
      }
    }

    return false;
  }

  fillLineItemFields(field, fieldName, lineItemArrays) {
    switch (fieldName) {
      case 'BASEBOARD(SQ FT)_1':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[1]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][1]);
        return true;
      case 'BASEBOARD(SQ FT)_2':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[2]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][2]);
        return true;
      case 'BASEBOARD(SQ FT)_3':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[3]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][3]);
        return true;
      case 'BASEBOARD(SQ FT)_4':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[4]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][4]);
        return true;
      case 'BASEBOARD(SQ FT)_5':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[5]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][5]);
        return true;
      case 'BASEBOARD(SQ FT)_6':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[6]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][6]);
        return true;
      case 'BASEBOARD(SQ FT)_7':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[7]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][7]);
       // if (lineItemArrays['BASEBOARD(SQ FT)']?.[7]) field.setText("aaa");

        return true;
      case 'BASEBOARD(SQ FT)_8':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[8]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][8]);
        return true;
      case 'BASEBOARD(SQ FT)_9':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[9]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][9]);
        return true;
      case 'BASEBOARD(SQ FT)':
        if (lineItemArrays['BASEBOARD(SQ FT)']?.[0]) field.setText(lineItemArrays['BASEBOARD(SQ FT)'][0]);
        return true;

      case 'SINGLE DOOROR BIFOLD_1':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[1]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][1]);
        return true;
      case 'SINGLE DOOROR BIFOLD_2':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[2]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][2]);
        return true;
      case 'SINGLE DOOROR BIFOLD_3':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[3]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][3]);
        return true;
      case 'SINGLE DOOROR BIFOLD_4':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[4]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][4]);
        return true;
      case 'SINGLE DOOROR BIFOLD_5':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[5]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][5]);
        return true;
      case 'SINGLE DOOROR BIFOLD_6':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[6]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][6]);
        return true;
      case 'SINGLE DOOROR BIFOLD_7':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[7]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][7]);
        return true;
      case 'SINGLE DOOROR BIFOLD_8':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[8]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][8]);
        return true;
      case 'SINGLE DOOROR BIFOLD_9':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[9]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][9]);
        return true;
      case 'SINGLE DOOROR BIFOLD':
        if (lineItemArrays['SINGLE DOOROR BIFOLD']?.[0]) field.setText(lineItemArrays['SINGLE DOOROR BIFOLD'][0]);
        return true;

      case 'DOUBLE DOOROR BIFOLD_1':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[1]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][1]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_2':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[2]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][2]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_3':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[3]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][3]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_4':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[4]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][4]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_5':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[5]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][5]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_6':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[6]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][6]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_7':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[7]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][7]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_8':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[8]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][8]);
        return true;
      case 'DOUBLE DOOROR BIFOLD_9':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[9]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][9]);
        return true;
      case 'DOUBLE DOOROR BIFOLD':
        if (lineItemArrays['DOUBLE DOOROR BIFOLD']?.[0]) field.setText(lineItemArrays['DOUBLE DOOROR BIFOLD'][0]);
        return true;

      case 'CANTINA DOOR_1':
        if (lineItemArrays['CANTINA DOOR']?.[1]) field.setText(lineItemArrays['CANTINA DOOR'][1]);
        return true;
      case 'CANTINA DOOR_2':
        if (lineItemArrays['CANTINA DOOR']?.[2]) field.setText(lineItemArrays['CANTINA DOOR'][2]);
        return true;
      case 'CANTINA DOOR_3':
        if (lineItemArrays['CANTINA DOOR']?.[3]) field.setText(lineItemArrays['CANTINA DOOR'][3]);
        return true;
      case 'CANTINA DOOR_4':
        if (lineItemArrays['CANTINA DOOR']?.[4]) field.setText(lineItemArrays['CANTINA DOOR'][4]);
        return true;
      case 'CANTINA DOOR_5':
        if (lineItemArrays['CANTINA DOOR']?.[5]) field.setText(lineItemArrays['CANTINA DOOR'][5]);
        return true;
      case 'CANTINA DOOR_6':
        if (lineItemArrays['CANTINA DOOR']?.[6]) field.setText(lineItemArrays['CANTINA DOOR'][6]);
        return true;
      case 'CANTINA DOOR_7':
        if (lineItemArrays['CANTINA DOOR']?.[7]) field.setText(lineItemArrays['CANTINA DOOR'][7]);
        return true;
      case 'CANTINA DOOR_8':
        if (lineItemArrays['CANTINA DOOR']?.[8]) field.setText(lineItemArrays['CANTINA DOOR'][8]);
        return true;
      case 'CANTINA DOOR_9':
        if (lineItemArrays['CANTINA DOOR']?.[9]) field.setText(lineItemArrays['CANTINA DOOR'][9]);
        return true;
      case 'CANTINA DOOR':
        if (lineItemArrays['CANTINA DOOR']?.[0]) field.setText(lineItemArrays['CANTINA DOOR'][0]);
        return true;

      case 'STDARCHWAYS_1':
        if (lineItemArrays['STDARCHWAYS']?.[1]) field.setText(lineItemArrays['STDARCHWAYS'][1]);
        return true;
      case 'STDARCHWAYS_2':
        if (lineItemArrays['STDARCHWAYS']?.[2]) field.setText(lineItemArrays['STDARCHWAYS'][2]);
        return true;
      case 'STDARCHWAYS_3':
        if (lineItemArrays['STDARCHWAYS']?.[3]) field.setText(lineItemArrays['STDARCHWAYS'][3]);
        return true;
      case 'STDARCHWAYS_4':
        if (lineItemArrays['STDARCHWAYS']?.[4]) field.setText(lineItemArrays['STDARCHWAYS'][4]);
        return true;
      case 'STDARCHWAYS_5':
        if (lineItemArrays['STDARCHWAYS']?.[5]) field.setText(lineItemArrays['STDARCHWAYS'][5]);
        return true;
      case 'STDARCHWAYS_6':
        if (lineItemArrays['STDARCHWAYS']?.[6]) field.setText(lineItemArrays['STDARCHWAYS'][6]);
        return true;
      case 'STDARCHWAYS_7':
        if (lineItemArrays['STDARCHWAYS']?.[7]) field.setText(lineItemArrays['STDARCHWAYS'][7]);
        return true;
      case 'STDARCHWAYS_8':
        if (lineItemArrays['STDARCHWAYS']?.[8]) field.setText(lineItemArrays['STDARCHWAYS'][8]);
        return true;
      case 'STDARCHWAYS_9':
        if (lineItemArrays['STDARCHWAYS']?.[9]) field.setText(lineItemArrays['STDARCHWAYS'][9]);
        return true;
      case 'STDARCHWAYS':
        if (lineItemArrays['STDARCHWAYS']?.[0]) field.setText(lineItemArrays['STDARCHWAYS'][0]);
        return true;

      case 'TALLARCHWAYS_1':
        if (lineItemArrays['TALLARCHWAYS']?.[1]) field.setText(lineItemArrays['TALLARCHWAYS'][1]);
        return true;
      case 'TALLARCHWAYS_2':
        if (lineItemArrays['TALLARCHWAYS']?.[2]) field.setText(lineItemArrays['TALLARCHWAYS'][2]);
        return true;
      case 'TALLARCHWAYS_3':
        if (lineItemArrays['TALLARCHWAYS']?.[3]) field.setText(lineItemArrays['TALLARCHWAYS'][3]);
        return true;
      case 'TALLARCHWAYS_4':
        if (lineItemArrays['TALLARCHWAYS']?.[4]) field.setText(lineItemArrays['TALLARCHWAYS'][4]);
        return true;
      case 'TALLARCHWAYS_5':
        if (lineItemArrays['TALLARCHWAYS']?.[5]) field.setText(lineItemArrays['TALLARCHWAYS'][5]);
        return true;
      case 'TALLARCHWAYS_6':
        if (lineItemArrays['TALLARCHWAYS']?.[6]) field.setText(lineItemArrays['TALLARCHWAYS'][6]);
        return true;
      case 'TALLARCHWAYS_7':
        if (lineItemArrays['TALLARCHWAYS']?.[7]) field.setText(lineItemArrays['TALLARCHWAYS'][7]);
        return true;
      case 'TALLARCHWAYS_8':
        if (lineItemArrays['TALLARCHWAYS']?.[8]) field.setText(lineItemArrays['TALLARCHWAYS'][8]);
        return true;
      case 'TALLARCHWAYS_9':
        if (lineItemArrays['TALLARCHWAYS']?.[9]) field.setText(lineItemArrays['TALLARCHWAYS'][9]);
        return true;
      case 'TALLARCHWAYS':
        if (lineItemArrays['TALLARCHWAYS']?.[0]) field.setText(lineItemArrays['TALLARCHWAYS'][0]);
        return true;

      case 'REGULARWINDOWS_1':
        if (lineItemArrays['REGULARWINDOWS']?.[1]) field.setText(lineItemArrays['REGULARWINDOWS'][1]);
        return true;
      case 'REGULARWINDOWS_2':
        if (lineItemArrays['REGULARWINDOWS']?.[2]) field.setText(lineItemArrays['REGULARWINDOWS'][2]);
        return true;
      case 'REGULARWINDOWS_3':
        if (lineItemArrays['REGULARWINDOWS']?.[3]) field.setText(lineItemArrays['REGULARWINDOWS'][3]);
        return true;
      case 'REGULARWINDOWS_4':
        if (lineItemArrays['REGULARWINDOWS']?.[4]) field.setText(lineItemArrays['REGULARWINDOWS'][4]);
        return true;
      case 'REGULARWINDOWS_5':
        if (lineItemArrays['REGULARWINDOWS']?.[5]) field.setText(lineItemArrays['REGULARWINDOWS'][5]);
        return true;
      case 'REGULARWINDOWS_6':
        if (lineItemArrays['REGULARWINDOWS']?.[6]) field.setText(lineItemArrays['REGULARWINDOWS'][6]);
        return true;
      case 'REGULARWINDOWS_7':
        if (lineItemArrays['REGULARWINDOWS']?.[7]) field.setText(lineItemArrays['REGULARWINDOWS'][7]);
        return true;
      case 'REGULARWINDOWS_8':
        if (lineItemArrays['REGULARWINDOWS']?.[8]) field.setText(lineItemArrays['REGULARWINDOWS'][8]);
        return true;
      case 'REGULARWINDOWS_9':
        if (lineItemArrays['REGULARWINDOWS']?.[9]) field.setText(lineItemArrays['REGULARWINDOWS'][9]);
        return true;
      case 'REGULARWINDOWS':
        if (lineItemArrays['REGULARWINDOWS']?.[0]) field.setText(lineItemArrays['REGULARWINDOWS'][0]);
        return true;

      case 'ROUND TOPWINDOWS_1':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[1]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][1]);
        return true;
      case 'ROUND TOPWINDOWS_2':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[2]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][2]);
        return true;
      case 'ROUND TOPWINDOWS_3':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[3]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][3]);
        return true;
      case 'ROUND TOPWINDOWS_4':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[4]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][4]);
        return true;
      case 'ROUND TOPWINDOWS_5':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[5]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][5]);
        return true;
      case 'ROUND TOPWINDOWS_6':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[6]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][6]);
        return true;
      case 'ROUND TOPWINDOWS_7':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[7]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][7]);
        return true;
      case 'ROUND TOPWINDOWS_8':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[8]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][8]);
        return true;
      case 'ROUND TOPWINDOWS_9':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[9]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][9]);
        return true;
      case 'ROUND TOPWINDOWS':
        if (lineItemArrays['ROUND TOPWINDOWS']?.[0]) field.setText(lineItemArrays['ROUND TOPWINDOWS'][0]);
        return true;

      case 'OPEN TOABOVE WIN_1':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[1]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][1]);
        return true;
      case 'OPEN TOABOVE WIN_2':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[2]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][2]);
        return true;
      case 'OPEN TOABOVE WIN_3':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[3]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][3]);
        return true;
      case 'OPEN TOABOVE WIN_4':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[4]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][4]);
        return true;
      case 'OPEN TOABOVE WIN_5':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[5]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][5]);
        return true;
      case 'OPEN TOABOVE WIN_6':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[6]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][6]);
        return true;
      case 'OPEN TOABOVE WIN_7':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[7]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][7]);
        return true;
      case 'OPEN TOABOVE WIN_8':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[8]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][8]);
        return true;
      case 'OPEN TOABOVE WIN_9':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[9]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][9]);
        return true;
      case 'OPEN TOABOVE WIN':
        if (lineItemArrays['OPEN TOABOVE WIN']?.[0]) field.setText(lineItemArrays['OPEN TOABOVE WIN'][0]);
        return true;

      case 'BAY OR BOWWINDOW_1':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[1]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][1]);
        return true;
      case 'BAY OR BOWWINDOW_2':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[2]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][2]);
        return true;
      case 'BAY OR BOWWINDOW_3':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[3]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][3]);
        return true;
      case 'BAY OR BOWWINDOW_4':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[4]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][4]);
        return true;
      case 'BAY OR BOWWINDOW_5':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[5]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][5]);
        return true;
      case 'BAY OR BOWWINDOW_6':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[6]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][6]);
        return true;
      case 'BAY OR BOWWINDOW_7':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[7]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][7]);
        return true;
      case 'BAY OR BOWWINDOW_8':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[8]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][8]);
        return true;
      case 'BAY OR BOWWINDOW_9':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[9]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][9]);
        return true;
      case 'BAY OR BOWWINDOW':
        if (lineItemArrays['BAY OR BOWWINDOW']?.[0]) field.setText(lineItemArrays['BAY OR BOWWINDOW'][0]);
        return true;

      case 'ATTIC HATCH_1':
        if (lineItemArrays['ATTIC HATCH']?.[1]) field.setText(lineItemArrays['ATTIC HATCH'][1]);
        return true;
      case 'ATTIC HATCH_2':
        if (lineItemArrays['ATTIC HATCH']?.[2]) field.setText(lineItemArrays['ATTIC HATCH'][2]);
        return true;
      case 'ATTIC HATCH_3':
        if (lineItemArrays['ATTIC HATCH']?.[3]) field.setText(lineItemArrays['ATTIC HATCH'][3]);
        return true;
      case 'ATTIC HATCH_4':
        if (lineItemArrays['ATTIC HATCH']?.[4]) field.setText(lineItemArrays['ATTIC HATCH'][4]);
        return true;
      case 'ATTIC HATCH_5':
        if (lineItemArrays['ATTIC HATCH']?.[5]) field.setText(lineItemArrays['ATTIC HATCH'][5]);
        return true;
      case 'ATTIC HATCH_6':
        if (lineItemArrays['ATTIC HATCH']?.[6]) field.setText(lineItemArrays['ATTIC HATCH'][6]);
        return true;
      case 'ATTIC HATCH_7':
        if (lineItemArrays['ATTIC HATCH']?.[7]) field.setText(lineItemArrays['ATTIC HATCH'][7]);
        return true;
      case 'ATTIC HATCH_8':
        if (lineItemArrays['ATTIC HATCH']?.[8]) field.setText(lineItemArrays['ATTIC HATCH'][8]);
        return true;
      case 'ATTIC HATCH_9':
        if (lineItemArrays['ATTIC HATCH']?.[9]) field.setText(lineItemArrays['ATTIC HATCH'][9]);
        return true;
      case 'ATTIC HATCH':
        if (lineItemArrays['ATTIC HATCH']?.[0]) field.setText(lineItemArrays['ATTIC HATCH'][0]);
        return true;

      case 'CAPPING ALLSIZES_1':
        if (lineItemArrays['CAPPING ALLSIZES']?.[1]) field.setText(lineItemArrays['CAPPING ALLSIZES'][1]);
        return true;
      case 'CAPPING ALLSIZES_2':
        if (lineItemArrays['CAPPING ALLSIZES']?.[2]) field.setText(lineItemArrays['CAPPING ALLSIZES'][2]);
        return true;
      case 'CAPPING ALLSIZES_3':
        if (lineItemArrays['CAPPING ALLSIZES']?.[3]) field.setText(lineItemArrays['CAPPING ALLSIZES'][3]);
        return true;
      case 'CAPPING ALLSIZES_4':
        if (lineItemArrays['CAPPING ALLSIZES']?.[4]) field.setText(lineItemArrays['CAPPING ALLSIZES'][4]);
        return true;
      case 'CAPPING ALLSIZES_5':
        if (lineItemArrays['CAPPING ALLSIZES']?.[5]) field.setText(lineItemArrays['CAPPING ALLSIZES'][5]);
        return true;
      case 'CAPPING ALLSIZES_6':
        if (lineItemArrays['CAPPING ALLSIZES']?.[6]) field.setText(lineItemArrays['CAPPING ALLSIZES'][6]);
        return true;
      case 'CAPPING ALLSIZES_7':
        if (lineItemArrays['CAPPING ALLSIZES']?.[7]) field.setText(lineItemArrays['CAPPING ALLSIZES'][7]);
        return true;
      case 'CAPPING ALLSIZES_8':
        if (lineItemArrays['CAPPING ALLSIZES']?.[8]) field.setText(lineItemArrays['CAPPING ALLSIZES'][8]);
        return true;
      case 'CAPPING ALLSIZES_9':
        if (lineItemArrays['CAPPING ALLSIZES']?.[9]) field.setText(lineItemArrays['CAPPING ALLSIZES'][9]);
        return true;
      case 'CAPPING ALLSIZES':
        if (lineItemArrays['CAPPING ALLSIZES']?.[0]) field.setText(lineItemArrays['CAPPING ALLSIZES'][0]);
        return true;

      case 'SOLIDCOLUMNS_1':
        if (lineItemArrays['SOLIDCOLUMNS']?.[1]) field.setText(lineItemArrays['SOLIDCOLUMNS'][1]);
        return true;
      case 'SOLIDCOLUMNS_2':
        if (lineItemArrays['SOLIDCOLUMNS']?.[2]) field.setText(lineItemArrays['SOLIDCOLUMNS'][2]);
        return true;
      case 'SOLIDCOLUMNS_3':
        if (lineItemArrays['SOLIDCOLUMNS']?.[3]) field.setText(lineItemArrays['SOLIDCOLUMNS'][3]);
        return true;
      case 'SOLIDCOLUMNS_4':
        if (lineItemArrays['SOLIDCOLUMNS']?.[4]) field.setText(lineItemArrays['SOLIDCOLUMNS'][4]);
        return true;
      case 'SOLIDCOLUMNS_5':
        if (lineItemArrays['SOLIDCOLUMNS']?.[5]) field.setText(lineItemArrays['SOLIDCOLUMNS'][5]);
        return true;
      case 'SOLIDCOLUMNS_6':
        if (lineItemArrays['SOLIDCOLUMNS']?.[6]) field.setText(lineItemArrays['SOLIDCOLUMNS'][6]);
        return true;
      case 'SOLIDCOLUMNS_7':
        if (lineItemArrays['SOLIDCOLUMNS']?.[7]) field.setText(lineItemArrays['SOLIDCOLUMNS'][7]);
        return true;
      case 'SOLIDCOLUMNS_8':
        if (lineItemArrays['SOLIDCOLUMNS']?.[8]) field.setText(lineItemArrays['SOLIDCOLUMNS'][8]);
        return true;
      case 'SOLIDCOLUMNS_9':
        if (lineItemArrays['SOLIDCOLUMNS']?.[9]) field.setText(lineItemArrays['SOLIDCOLUMNS'][9]);
        return true;
      case 'SOLIDCOLUMNS':
        if (lineItemArrays['SOLIDCOLUMNS']?.[0]) field.setText(lineItemArrays['SOLIDCOLUMNS'][0]);
        return true;

      case 'SPLITCOLUMNS_1':
        if (lineItemArrays['SPLITCOLUMNS']?.[1]) field.setText(lineItemArrays['SPLITCOLUMNS'][1]);
        return true;
      case 'SPLITCOLUMNS_2':
        if (lineItemArrays['SPLITCOLUMNS']?.[2]) field.setText(lineItemArrays['SPLITCOLUMNS'][2]);
        return true;
      case 'SPLITCOLUMNS_3':
        if (lineItemArrays['SPLITCOLUMNS']?.[3]) field.setText(lineItemArrays['SPLITCOLUMNS'][3]);
        return true;
      case 'SPLITCOLUMNS_4':
        if (lineItemArrays['SPLITCOLUMNS']?.[4]) field.setText(lineItemArrays['SPLITCOLUMNS'][4]);
        return true;
      case 'SPLITCOLUMNS_5':
        if (lineItemArrays['SPLITCOLUMNS']?.[5]) field.setText(lineItemArrays['SPLITCOLUMNS'][5]);
        return true;
      case 'SPLITCOLUMNS_6':
        if (lineItemArrays['SPLITCOLUMNS']?.[6]) field.setText(lineItemArrays['SPLITCOLUMNS'][6]);
        return true;
      case 'SPLITCOLUMNS_7':
        if (lineItemArrays['SPLITCOLUMNS']?.[7]) field.setText(lineItemArrays['SPLITCOLUMNS'][7]);
        return true;
      case 'SPLITCOLUMNS_8':
        if (lineItemArrays['SPLITCOLUMNS']?.[8]) field.setText(lineItemArrays['SPLITCOLUMNS'][8]);
        return true;
      case 'SPLITCOLUMNS_9':
        if (lineItemArrays['SPLITCOLUMNS']?.[9]) field.setText(lineItemArrays['SPLITCOLUMNS'][9]);
        return true;
      case 'SPLITCOLUMNS':
        if (lineItemArrays['SPLITCOLUMNS']?.[0]) field.setText(lineItemArrays['SPLITCOLUMNS'][0]);
        return true;

      case 'WOODSHELVING_1':
        if (lineItemArrays['WOODSHELVING']?.[1]) field.setText(lineItemArrays['WOODSHELVING'][1]);
        return true;
      case 'WOODSHELVING_2':
        if (lineItemArrays['WOODSHELVING']?.[2]) field.setText(lineItemArrays['WOODSHELVING'][2]);
        return true;
      case 'WOODSHELVING_3':
        if (lineItemArrays['WOODSHELVING']?.[3]) field.setText(lineItemArrays['WOODSHELVING'][3]);
        return true;
      case 'WOODSHELVING_4':
        if (lineItemArrays['WOODSHELVING']?.[4]) field.setText(lineItemArrays['WOODSHELVING'][4]);
        return true;
      case 'WOODSHELVING_5':
        if (lineItemArrays['WOODSHELVING']?.[5]) field.setText(lineItemArrays['WOODSHELVING'][5]);
        return true;
      case 'WOODSHELVING_6':
        if (lineItemArrays['WOODSHELVING']?.[6]) field.setText(lineItemArrays['WOODSHELVING'][6]);
        return true;
      case 'WOODSHELVING_7':
        if (lineItemArrays['WOODSHELVING']?.[7]) field.setText(lineItemArrays['WOODSHELVING'][7]);
        return true;
      case 'WOODSHELVING_8':
        if (lineItemArrays['WOODSHELVING']?.[8]) field.setText(lineItemArrays['WOODSHELVING'][8]);
        return true;
      case 'WOODSHELVING_9':
        if (lineItemArrays['WOODSHELVING']?.[9]) field.setText(lineItemArrays['WOODSHELVING'][9]);
        return true;
      case 'WOODSHELVING':
        if (lineItemArrays['WOODSHELVING']?.[0]) field.setText(lineItemArrays['WOODSHELVING'][0]);
        return true;

      case 'STAIRS(STRAIGHT)_1':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[1]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][1]);
        return true;
      case 'STAIRS(STRAIGHT)_2':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[2]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][2]);
        return true;
      case 'STAIRS(STRAIGHT)_3':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[3]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][3]);
        return true;
      case 'STAIRS(STRAIGHT)_4':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[4]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][4]);
        return true;
      case 'STAIRS(STRAIGHT)_5':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[5]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][5]);
        return true;
      case 'STAIRS(STRAIGHT)_6':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[6]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][6]);
        return true;
      case 'STAIRS(STRAIGHT)_7':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[7]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][7]);
        return true;
      case 'STAIRS(STRAIGHT)_8':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[8]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][8]);
        return true;
      case 'STAIRS(STRAIGHT)_9':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[9]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][9]);
        return true;
      case 'STAIRS(STRAIGHT)':
        if (lineItemArrays['STAIRS(STRAIGHT)']?.[0]) field.setText(lineItemArrays['STAIRS(STRAIGHT)'][0]);
        return true;

      case 'STAIRS(CIRC/WIND)_1':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[1]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][1]);
        return true;
      case 'STAIRS(CIRC/WIND)_2':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[2]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][2]);
        return true;
      case 'STAIRS(CIRC/WIND)_3':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[3]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][3]);
        return true;
      case 'STAIRS(CIRC/WIND)_4':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[4]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][4]);
        return true;
      case 'STAIRS(CIRC/WIND)_5':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[5]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][5]);
        return true;
      case 'STAIRS(CIRC/WIND)_6':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[6]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][6]);
        return true;
      case 'STAIRS(CIRC/WIND)_7':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[7]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][7]);
        return true;
      case 'STAIRS(CIRC/WIND)_8':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[8]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][8]);
        return true;
      case 'STAIRS(CIRC/WIND)_9':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[9]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][9]);
        return true;
      case 'STAIRS(CIRC/WIND)':
        if (lineItemArrays['STAIRS(CIRC/WIND)']?.[0]) field.setText(lineItemArrays['STAIRS(CIRC/WIND)'][0]);
        return true;

      case 'STAIRS(1/2 FLIGHT)_1':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[1]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][1]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_2':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[2]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][2]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_3':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[3]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][3]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_4':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[4]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][4]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_5':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[5]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][5]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_6':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[6]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][6]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_7':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[7]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][7]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_8':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[8]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][8]);
        return true;
      case 'STAIRS(1/2 FLIGHT)_9':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[9]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][9]);
        return true;
      case 'STAIRS(1/2 FLIGHT)':
        if (lineItemArrays['STAIRS(1/2 FLIGHT)']?.[0]) field.setText(lineItemArrays['STAIRS(1/2 FLIGHT)'][0]);
        return true;

      case 'DOOR CLOSUREMECHANISM_1':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[1]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][1]);
        return true;
      case 'DOOR CLOSUREMECHANISM_2':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[2]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][2]);
        return true;
      case 'DOOR CLOSUREMECHANISM_3':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[3]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][3]);
        return true;
      case 'DOOR CLOSUREMECHANISM_4':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[4]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][4]);
        return true;
      case 'DOOR CLOSUREMECHANISM_5':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[5]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][5]);
        return true;
      case 'DOOR CLOSUREMECHANISM_6':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[6]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][6]);
        return true;
      case 'DOOR CLOSUREMECHANISM_7':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[7]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][7]);
        return true;
      case 'DOOR CLOSUREMECHANISM_8':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[8]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][8]);
        return true;
      case 'DOOR CLOSUREMECHANISM_9':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[9]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][9]);
        return true;
      case 'DOOR CLOSUREMECHANISM':
        if (lineItemArrays['DOOR CLOSUREMECHANISM']?.[0]) field.setText(lineItemArrays['DOOR CLOSUREMECHANISM'][0]);
        return true;

      case 'EXTERIORLOCKS_1':
        if (lineItemArrays['EXTERIORLOCKS']?.[1]) field.setText(lineItemArrays['EXTERIORLOCKS'][1]);
        return true;
      case 'EXTERIORLOCKS_2':
        if (lineItemArrays['EXTERIORLOCKS']?.[2]) field.setText(lineItemArrays['EXTERIORLOCKS'][2]);
        return true;
      case 'EXTERIORLOCKS_3':
        if (lineItemArrays['EXTERIORLOCKS']?.[3]) field.setText(lineItemArrays['EXTERIORLOCKS'][3]);
        return true;
      case 'EXTERIORLOCKS_4':
        if (lineItemArrays['EXTERIORLOCKS']?.[4]) field.setText(lineItemArrays['EXTERIORLOCKS'][4]);
        return true;
      case 'EXTERIORLOCKS_5':
        if (lineItemArrays['EXTERIORLOCKS']?.[5]) field.setText(lineItemArrays['EXTERIORLOCKS'][5]);
        return true;
      case 'EXTERIORLOCKS_6':
        if (lineItemArrays['EXTERIORLOCKS']?.[6]) field.setText(lineItemArrays['EXTERIORLOCKS'][6]);
        return true;
      case 'EXTERIORLOCKS_7':
        if (lineItemArrays['EXTERIORLOCKS']?.[7]) field.setText(lineItemArrays['EXTERIORLOCKS'][7]);
        return true;
      case 'EXTERIORLOCKS_8':
        if (lineItemArrays['EXTERIORLOCKS']?.[8]) field.setText(lineItemArrays['EXTERIORLOCKS'][8]);
        return true;
      case 'EXTERIORLOCKS_9':
        if (lineItemArrays['EXTERIORLOCKS']?.[9]) field.setText(lineItemArrays['EXTERIORLOCKS'][9]);
        return true;
      case 'EXTERIORLOCKS':
        if (lineItemArrays['EXTERIORLOCKS']?.[0]) field.setText(lineItemArrays['EXTERIORLOCKS'][0]);
        return true;

      case '1/4 ROUND_1':
        if (lineItemArrays['1/4 ROUND']?.[1]) field.setText(lineItemArrays['1/4 ROUND'][1]);
        return true;
      case '1/4 ROUND_2':
        if (lineItemArrays['1/4 ROUND']?.[2]) field.setText(lineItemArrays['1/4 ROUND'][2]);
        return true;
      case '1/4 ROUND_3':
        if (lineItemArrays['1/4 ROUND']?.[3]) field.setText(lineItemArrays['1/4 ROUND'][3]);
        return true;
      case '1/4 ROUND_4':
        if (lineItemArrays['1/4 ROUND']?.[4]) field.setText(lineItemArrays['1/4 ROUND'][4]);
        return true;
      case '1/4 ROUND_5':
        if (lineItemArrays['1/4 ROUND']?.[5]) field.setText(lineItemArrays['1/4 ROUND'][5]);
        return true;
      case '1/4 ROUND_6':
        if (lineItemArrays['1/4 ROUND']?.[6]) field.setText(lineItemArrays['1/4 ROUND'][6]);
        return true;
      case '1/4 ROUND_7':
        if (lineItemArrays['1/4 ROUND']?.[7]) field.setText(lineItemArrays['1/4 ROUND'][7]);
        return true;
      case '1/4 ROUND_8':
        if (lineItemArrays['1/4 ROUND']?.[8]) field.setText(lineItemArrays['1/4 ROUND'][8]);
        return true;
      case '1/4 ROUND_9':
        if (lineItemArrays['1/4 ROUND']?.[9]) field.setText(lineItemArrays['1/4 ROUND'][9]);
        return true;
      case '1/4 ROUND':
        if (lineItemArrays['1/4 ROUND']?.[0]) field.setText(lineItemArrays['1/4 ROUND'][0]);
        return true;

      case 'TALLER DOORSOVER 85_1':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[1]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][1]);
        return true;
      case 'TALLER DOORSOVER 85_2':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[2]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][2]);
        return true;
      case 'TALLER DOORSOVER 85_3':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[3]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][3]);
        return true;
      case 'TALLER DOORSOVER 85_4':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[4]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][4]);
        return true;
      case 'TALLER DOORSOVER 85_5':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[5]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][5]);
        return true;
      case 'TALLER DOORSOVER 85_6':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[6]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][6]);
        return true;
      case 'TALLER DOORSOVER 85_7':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[7]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][7]);
        return true;
      case 'TALLER DOORSOVER 85_8':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[8]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][8]);
        return true;
      case 'TALLER DOORSOVER 85_9':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[9]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][9]);
        return true;
      case 'TALLER DOORSOVER 85':
        if (lineItemArrays['TALLER DOORSOVER 85']?.[0]) field.setText(lineItemArrays['TALLER DOORSOVER 85'][0]);
        return true;

      case 'PARAPETOPENINGS_1':
        if (lineItemArrays['PARAPETOPENINGS']?.[1]) field.setText(lineItemArrays['PARAPETOPENINGS'][1]);
        return true;
      case 'PARAPETOPENINGS_2':
        if (lineItemArrays['PARAPETOPENINGS']?.[2]) field.setText(lineItemArrays['PARAPETOPENINGS'][2]);
        return true;
      case 'PARAPETOPENINGS_3':
        if (lineItemArrays['PARAPETOPENINGS']?.[3]) field.setText(lineItemArrays['PARAPETOPENINGS'][3]);
        return true;
      case 'PARAPETOPENINGS_4':
        if (lineItemArrays['PARAPETOPENINGS']?.[4]) field.setText(lineItemArrays['PARAPETOPENINGS'][4]);
        return true;
      case 'PARAPETOPENINGS_5':
        if (lineItemArrays['PARAPETOPENINGS']?.[5]) field.setText(lineItemArrays['PARAPETOPENINGS'][5]);
        return true;
      case 'PARAPETOPENINGS_6':
        if (lineItemArrays['PARAPETOPENINGS']?.[6]) field.setText(lineItemArrays['PARAPETOPENINGS'][6]);
        return true;
      case 'PARAPETOPENINGS_7':
        if (lineItemArrays['PARAPETOPENINGS']?.[7]) field.setText(lineItemArrays['PARAPETOPENINGS'][7]);
        return true;
      case 'PARAPETOPENINGS_8':
        if (lineItemArrays['PARAPETOPENINGS']?.[8]) field.setText(lineItemArrays['PARAPETOPENINGS'][8]);
        return true;
      case 'PARAPETOPENINGS_9':
        if (lineItemArrays['PARAPETOPENINGS']?.[9]) field.setText(lineItemArrays['PARAPETOPENINGS'][9]);
        return true;
      case 'PARAPETOPENINGS':
        if (lineItemArrays['PARAPETOPENINGS']?.[0]) field.setText(lineItemArrays['PARAPETOPENINGS'][0]);
        return true;

      case 'WET AREAS_1':
        if (lineItemArrays['WET AREAS']?.[1]) field.setText(lineItemArrays['WET AREAS'][1]);
        return true;
      case 'WET AREAS_2':
        if (lineItemArrays['WET AREAS']?.[2]) field.setText(lineItemArrays['WET AREAS'][2]);
        return true;
      case 'WET AREAS_3':
        if (lineItemArrays['WET AREAS']?.[3]) field.setText(lineItemArrays['WET AREAS'][3]);
        return true;
      case 'WET AREAS_4':
        if (lineItemArrays['WET AREAS']?.[4]) field.setText(lineItemArrays['WET AREAS'][4]);
        return true;
      case 'WET AREAS_5':
        if (lineItemArrays['WET AREAS']?.[5]) field.setText(lineItemArrays['WET AREAS'][5]);
        return true;
      case 'WET AREAS_6':
        if (lineItemArrays['WET AREAS']?.[6]) field.setText(lineItemArrays['WET AREAS'][6]);
        return true;
      case 'WET AREAS_7':
        if (lineItemArrays['WET AREAS']?.[7]) field.setText(lineItemArrays['WET AREAS'][7]);
        return true;
      case 'WET AREAS_8':
        if (lineItemArrays['WET AREAS']?.[8]) field.setText(lineItemArrays['WET AREAS'][8]);
        return true;
      case 'WET AREAS_9':
        if (lineItemArrays['WET AREAS']?.[9]) field.setText(lineItemArrays['WET AREAS'][9]);
        return true;
      case 'WET AREAS':
        if (lineItemArrays['WET AREAS']?.[0]) field.setText(lineItemArrays['WET AREAS'][0]);
        return true;


      // HANDRAIL - 10 campos (sem sufixo, _1 até _9)

      case 'HANDRAIL_14':
        if (lineItemArrays['HANDRAIL']?.[9]) field.setText(lineItemArrays['HANDRAIL'][9]);
        return true;
      case 'HANDRAIL_13':
        if (lineItemArrays['HANDRAIL']?.[8]) field.setText(lineItemArrays['HANDRAIL'][8]);
        return true;

      case 'HANDRAIL_12':
        if (lineItemArrays['HANDRAIL']?.[7]) field.setText(lineItemArrays['HANDRAIL'][7]);
        return true;
      case 'HANDRAIL_11':
        if (lineItemArrays['HANDRAIL']?.[6]) field.setText(lineItemArrays['HANDRAIL'][6]);
        return true;

      case 'HANDRAIL_10':
        if (lineItemArrays['HANDRAIL']?.[5]) field.setText(lineItemArrays['HANDRAIL'][5]);
        return true;
      case 'HANDRAIL_9':
        if (lineItemArrays['HANDRAIL']?.[4]) field.setText(lineItemArrays['HANDRAIL'][4]);
        return true;

      case 'HANDRAIL_8':
        if (lineItemArrays['HANDRAIL']?.[3]) field.setText(lineItemArrays['HANDRAIL'][3]);
        return true;
      case 'HANDRAIL_7':
        if (lineItemArrays['HANDRAIL']?.[2]) field.setText(lineItemArrays['HANDRAIL'][2]);
        return true;

      case 'HANDRAIL_6':
        if (lineItemArrays['HANDRAIL']?.[1]) field.setText(lineItemArrays['HANDRAIL'][1]);
        return true;
      case 'HANDRAIL_5':
        if (lineItemArrays['HANDRAIL']?.[0]) field.setText(lineItemArrays['HANDRAIL'][0]);
        return true;

      // Limpar campos extras do HANDRAIL (linha adicional não usada)
      // case 'HANDRAIL_-1':
      // case 'HANDRAIL_-2':
      // case 'HANDRAIL_-3':
      // case 'HANDRAIL_-4':
      // case 'HANDRAIL_-5':
      // case 'HANDRAIL_-6':
      // case 'HANDRAIL_10':
      // case 'HANDRAIL_11':
      // case 'HANDRAIL_12':
      // case 'HANDRAIL_13':
      // case 'HANDRAIL_14':
      //   field.setText('');
      //   return true;

      default:
        return false;
    }
  }
}

module.exports = new InvoicePDFService();
