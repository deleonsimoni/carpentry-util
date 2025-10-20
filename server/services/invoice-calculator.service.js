const InstallCost = require('../models/install-cost.model');

/**
 * Invoice Calculator Service
 * Calculates installation costs based on takeoff data and InstallCost pricing
 */
class InvoiceCalculatorService {

  /**
   * Main calculation method
   * @param {Object} takeoff - Takeoff document from database
   * @returns {Object} Calculated invoice data with line items and totals
   */
  async calculateInvoice(takeoff) {
    const lineItems = [];
    let subtotal = 0;

    // 1. BASEBOARD(SQ. FT.)
    const baseboardCost = await this.calculateBaseboard(takeoff);
    lineItems.push(baseboardCost);
    subtotal += baseboardCost.amount;

    // 2. SINGLE DOOR OR BIFOLD
    const singleDoorsCost = await this.calculateSingleDoors(takeoff);
    lineItems.push(singleDoorsCost);
    subtotal += singleDoorsCost.amount;

    // 3. DOUBLE DOOR OR BIFOLD
    const doubleDoorsCost = await this.calculateDoubleDoors(takeoff);
    lineItems.push(doubleDoorsCost);
    subtotal += doubleDoorsCost.amount;

    // 4. CANTINA DOOR
    const cantinaDoorsCost = await this.calculateCantinaDoors(takeoff);
    lineItems.push(cantinaDoorsCost);
    subtotal += cantinaDoorsCost.amount;

    // 5. STD. ARCHWAYS
    const archwaysCost = await this.calculateArchways(takeoff);
    lineItems.push(archwaysCost);
    subtotal += archwaysCost.amount;

    // 6. TALL ARCHWAYS
    const fdArchwaysCost = await this.calculateFrenchDoors(takeoff);
    lineItems.push(fdArchwaysCost);
    subtotal += fdArchwaysCost.amount;

    // 7. REGULAR WINDOWS
    const regularWindowsCost = await this.calculateRegularWindows(takeoff);
    lineItems.push(regularWindowsCost);
    subtotal += regularWindowsCost.amount;

    // 8. ROUND TOP WINDOWS
    const roundWindowsCost = await this.calculateRoundWindows(takeoff);
    lineItems.push(roundWindowsCost);
    subtotal += roundWindowsCost.amount;

    // 9. OPEN TO ABOVE WIN.
    const openAboveCost = await this.calculateOpenAboveWindows(takeoff);
    lineItems.push(openAboveCost);
    subtotal += openAboveCost.amount;

    // 10. BAY OR BOW WINDOW
    const bayBowCost = await this.calculateBayBowWindows(takeoff);
    lineItems.push(bayBowCost);
    subtotal += bayBowCost.amount;

    // 11. ATTIC HATCH
    const atticHatchCost = await this.calculateAtticHatch(takeoff);
    lineItems.push(atticHatchCost);
    subtotal += atticHatchCost.amount;

    // 12. PARAPET OPENINGS (Window Seat)
    const windowSeatCost = await this.calculateWindowSeat(takeoff);
    lineItems.push(windowSeatCost);
    subtotal += windowSeatCost.amount;

    // 13. CAPPING ALL SIZES
    const cappingCost = await this.calculateCapping(takeoff);
    lineItems.push(cappingCost);
    subtotal += cappingCost.amount;

    // 14. SOLID COLUMNS
    const solidColumnsCost = await this.calculateSolidColumns(takeoff);
    lineItems.push(solidColumnsCost);
    subtotal += solidColumnsCost.amount;

    // 15. SPLIT COLUMNS
    const splitColumnsCost = await this.calculateSplitColumns(takeoff);
    lineItems.push(splitColumnsCost);
    subtotal += splitColumnsCost.amount;

    // 16. WOOD SHELVING
    const shelvingCost = await this.calculateShelving(takeoff);
    lineItems.push(shelvingCost);
    subtotal += shelvingCost.amount;

    // 17. STAIRS (STRAIGHT)
    const straightStairsCost = await this.calculateStraightStairs(takeoff);
    lineItems.push(straightStairsCost);
    subtotal += straightStairsCost.amount;

    // 18. STAIRS (CIRC./WIND.)
    const circularStairsCost = await this.calculateCircularStairs(takeoff);
    lineItems.push(circularStairsCost);
    subtotal += circularStairsCost.amount;

    // 19. STAIRS (1/2 FLIGHT)
    const halfFlightCost = await this.calculateHalfFlightStairs(takeoff);
    lineItems.push(halfFlightCost);
    subtotal += halfFlightCost.amount;

    // 20. DOOR CLOSURE MECHANISM
    const doorCloserCost = await this.calculateDoorCloser(takeoff);
    lineItems.push(doorCloserCost);
    subtotal += doorCloserCost.amount;

    // 21. 1/4 ROUND
    const quarterRoundCost = await this.calculateQuarterRound(takeoff);
    lineItems.push(quarterRoundCost);
    subtotal += quarterRoundCost.amount;

    // 22. TALLER DOORS OVER 85
    const tallerDoorsCost = await this.calculateTallerDoorsOver85(takeoff);
    lineItems.push(tallerDoorsCost);
    subtotal += tallerDoorsCost.amount;

    // 23. WET AREAS
    const wetAreasCost = await this.calculateWetAreas(takeoff);
    lineItems.push(wetAreasCost);
    subtotal += wetAreasCost.amount;

    // 24. EXTERIOR LOCKS
    const exteriorLockCost = await this.calculateExteriorLock(takeoff);
    lineItems.push(exteriorLockCost);
    subtotal += exteriorLockCost.amount;

    // 25. HANDRAIL
    const handrailCost = await this.calculateHandrail(takeoff);
    lineItems.push(handrailCost);
    subtotal += handrailCost.amount;

    return {
      lineItems,
      subtotal: this.roundToTwoDecimals(subtotal),
      hst: this.roundToTwoDecimals(subtotal * 0.13), // 13% HST for Ontario
      total: this.roundToTwoDecimals(subtotal * 1.13)
    };
  }

  /**
   * Calculate baseboard cost based on square footage
   */
  async calculateBaseboard(takeoff) {
    // Extract baseboard info from trim array
    const baseboardTrim = takeoff.trim?.find(t =>
      t.item?.toLowerCase().includes('base') ||
      t.details?.toLowerCase().includes('base')
    );

    if (!baseboardTrim || !takeoff.sqFootage) {
      return { description: 'BASEBOARD(SQ FT)', quantity: 0, amount: 0 };
    }

    // Determine casing size from trim details
    const details = baseboardTrim.details || '';
    let casing = '3-1/2'; // default

    if (details.includes('4-7/8') || details.includes('4 7/8')) {
      casing = '4-7/8';
    } else if (details.includes('6-7/8') || details.includes('6 7/8')) {
      casing = '6-7/8';
    } else if (details.includes('9-1/4') || details.includes('9 1/4')) {
      casing = '9-1/4';
    }

    const pricing = await InstallCost.getActivePricing('baseboard', null, casing);
    if (!pricing) {
      return { description: 'BASEBOARD(SQ FT)', quantity: 0, amount: 0 };
    }

    const sqFootage = parseFloat(takeoff.sqFootage) || 0;
    const amount = sqFootage * pricing.installCost;

    return {
      description: 'BASEBOARD(SQ FT)',
      quantity: sqFootage,
      unit: 'sqft',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate single doors cost
   */
  async calculateSingleDoors(takeoff) {
    if (!takeoff.singleDoors || takeoff.singleDoors.length === 0) {
      return { description: 'SINGLE DOOR OR HANDLE', quantity: 0, amount: 0 };
    }

    let totalQty = 0;
    let totalAmount = 0;

    // Determine casing from takeoff data (assuming uniform casing)
    const casing = this.determineCasing(takeoff);

    const basePricing = await InstallCost.getActivePricing('singleDoor', null, casing);
    if (!basePricing) {
      return { description: 'SINGLE DOOR OR HANDLE', quantity: 0, amount: 0 };
    }

    for (const door of takeoff.singleDoors) {
      const left = parseInt(door.left) || 0;
      const right = parseInt(door.right) || 0;
      const qty = left + right;

      if (qty === 0) continue;

      let doorCost = basePricing.installCost;

      // Check for taller doors
      const height = this.parseHeight(door.size);
      if (height >= 81 && height <= 84) {
        const tallerPricing = await InstallCost.findOne({
          item: 'tallerDoor',
          increaseCost: 5.10,
          isActive: true
        });
        if (tallerPricing) doorCost += tallerPricing.increaseCost;
      } else if (height >= 85) {
        const tallerPricing = await InstallCost.findOne({
          item: 'tallerDoor',
          increaseCost: 17.53,
          isActive: true
        });
        if (tallerPricing) doorCost += tallerPricing.increaseCost;
      }

      // Check for solid doors (would need to be indicated in takeoff)
      // This would require additional field in takeoff model

      totalQty += qty;
      totalAmount += qty * doorCost;
    }

    return {
      description: 'SINGLE DOOR OR HANDLE',
      quantity: totalQty,
      unit: 'ea',
      unitPrice: basePricing.installCost,
      amount: this.roundToTwoDecimals(totalAmount)
    };
  }

  /**
   * Calculate double doors cost
   */
  async calculateDoubleDoors(takeoff) {
    if (!takeoff.doubleDoors || takeoff.doubleDoors.length === 0) {
      return { description: 'DOUBLE DOOR OR SLIDERS', quantity: 0, amount: 0 };
    }

    let totalQty = 0;
    let totalAmount = 0;
    const casing = this.determineCasing(takeoff);

    const basePricing = await InstallCost.getActivePricing('doubleDoor', null, casing);
    if (!basePricing) {
      return { description: 'DOUBLE DOOR OR SLIDERS', quantity: 0, amount: 0 };
    }

    for (const door of takeoff.doubleDoors) {
      const qty = parseInt(door.qty) || 0;
      if (qty === 0) continue;

      let doorCost = basePricing.installCost;

      // Check for taller doors
      const height = this.parseHeight(door.height);
      if (height >= 81 && height <= 84) {
        const tallerPricing = await InstallCost.findOne({
          item: 'tallerDoor',
          increaseCost: 5.10,
          isActive: true
        });
        if (tallerPricing) doorCost += tallerPricing.increaseCost;
      } else if (height >= 85) {
        const tallerPricing = await InstallCost.findOne({
          item: 'tallerDoor',
          increaseCost: 17.53,
          isActive: true
        });
        if (tallerPricing) doorCost += tallerPricing.increaseCost;
      }

      totalQty += qty;
      totalAmount += qty * doorCost;
    }

    return {
      description: 'DOUBLE DOOR OR SLIDERS',
      quantity: totalQty,
      unit: 'ea',
      unitPrice: basePricing.installCost,
      amount: this.roundToTwoDecimals(totalAmount)
    };
  }

  /**
   * Calculate cantina doors cost
   */
  async calculateCantinaDoors(takeoff) {
    if (!takeoff.cantinaDoors || takeoff.cantinaDoors.length === 0) {
      return { description: 'CANTINA DOOR', quantity: 0, amount: 0 };
    }

    let totalQty = 0;
    let totalAmount = 0;
    const casing = this.determineCasing(takeoff);

    const basePricing = await InstallCost.getActivePricing('cantinaDoor', null, casing);
    if (!basePricing) {
      return { description: 'CANTINA DOOR', quantity: 0, amount: 0 };
    }

    for (const door of takeoff.cantinaDoors) {
      const qty = parseInt(door.qty) || 0;
      if (qty === 0) continue;

      totalQty += qty;
      totalAmount += qty * basePricing.installCost;
    }

    return {
      description: 'CANTINA DOOR',
      quantity: totalQty,
      unit: 'ea',
      unitPrice: basePricing.installCost,
      amount: this.roundToTwoDecimals(totalAmount)
    };
  }

  /**
   * Calculate archways cost
   */
  async calculateArchways(takeoff) {
    if (!takeoff.arches || takeoff.arches.length === 0) {
      return { description: 'STD ARCHWAYS', quantity: 0, amount: 0 };
    }

    let totalQty = 0;
    let totalAmount = 0;
    const casing = this.determineCasing(takeoff);

    const basePricing = await InstallCost.getActivePricing('archway', null, casing);
    if (!basePricing) {
      return { description: 'STD ARCHWAYS', quantity: 0, amount: 0 };
    }

    for (const arch of takeoff.arches) {
      // Count non-empty columns as quantity
      const qty = [arch.col1, arch.col2, arch.col3, arch.col4, arch.col5]
        .filter(col => col && col.trim() !== '').length;

      if (qty === 0) continue;

      let archCost = basePricing.installCost;

      // Check for taller archways (above 84")
      const size = arch.size || '';
      const height = this.parseHeight(size);
      if (height > 84) {
        const tallerPricing = await InstallCost.getActivePricing('tallerArchway');
        if (tallerPricing) archCost += tallerPricing.increaseCost;
      }

      totalQty += qty;
      totalAmount += qty * archCost;
    }

    return {
      description: 'STD ARCHWAYS',
      quantity: totalQty,
      unit: 'ea',
      unitPrice: basePricing.installCost,
      amount: this.roundToTwoDecimals(totalAmount)
    };
  }

  /**
   * Calculate french doors cost (counted as FD ARCHWAYS in invoice)
   */
  async calculateFrenchDoors(takeoff) {
    if (!takeoff.frenchDoors || takeoff.frenchDoors.length === 0) {
      return { description: 'FD ARCHWAYS', quantity: 0, amount: 0 };
    }

    let totalQty = 0;
    let totalAmount = 0;
    const casing = this.determineCasing(takeoff);

    const basePricing = await InstallCost.getActivePricing('doubleDoor', null, casing);
    if (!basePricing) {
      return { description: 'FD ARCHWAYS', quantity: 0, amount: 0 };
    }

    for (const door of takeoff.frenchDoors) {
      const qty = parseInt(door.qty) || 0;
      if (qty === 0) continue;

      totalQty += qty;
      totalAmount += qty * basePricing.installCost;
    }

    return {
      description: 'FD ARCHWAYS',
      quantity: totalQty,
      unit: 'ea',
      unitPrice: basePricing.installCost,
      amount: this.roundToTwoDecimals(totalAmount)
    };
  }

  /**
   * Calculate regular windows cost
   * Labour array index 7: 'REGULAR WINDOWS'
   */
  async calculateRegularWindows(takeoff) {
    const labourItem = takeoff.labour?.[7]; // Index 7: REGULAR WINDOWS

    if (!labourItem || !labourItem.qty) {
      return { description: 'REGULAR WINDOWS', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'REGULAR WINDOWS', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    const pricing = await InstallCost.getActivePricing('regWindow', null, casing);

    if (!pricing) {
      return { description: 'REGULAR WINDOWS', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'REGULAR WINDOWS',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate round top windows cost
   * Labour array index 8: 'ROUND WINDOWS'
   */
  async calculateRoundWindows(takeoff) {
    const labourItem = takeoff.labour?.[8]; // Index 8: ROUND WINDOWS

    if (!labourItem || !labourItem.qty) {
      return { description: 'ROUND TOP WINDOWS', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'ROUND TOP WINDOWS', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    const basePricing = await InstallCost.getActivePricing('regWindow', null, casing);
    const roundIncrease = await InstallCost.getActivePricing('round_Window', null, casing);

    if (!basePricing || !roundIncrease) {
      return { description: 'ROUND TOP WINDOWS', quantity: 0, amount: 0 };
    }

    const totalCost = basePricing.installCost + roundIncrease.increaseCost;
    const amount = qty * totalCost;

    return {
      description: 'ROUND TOP WINDOWS',
      quantity: qty,
      unit: 'ea',
      unitPrice: totalCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate open to above windows cost
   * Labour array index 9: 'OPEN TO ABOVE WIND'
   */
  async calculateOpenAboveWindows(takeoff) {
    const labourItem = takeoff.labour?.[9]; // Index 9: OPEN TO ABOVE WIND

    if (!labourItem || !labourItem.qty) {
      return { description: 'OPEN TO ABOVE WIN', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'OPEN TO ABOVE WIN', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    const basePricing = await InstallCost.getActivePricing('regWindow', null, casing);
    const openAboveIncrease = await InstallCost.getActivePricing('openToAbove', null, casing);

    if (!basePricing || !openAboveIncrease) {
      return { description: 'OPEN TO ABOVE WIN', quantity: 0, amount: 0 };
    }

    const totalCost = basePricing.installCost + openAboveIncrease.increaseCost;
    const amount = qty * totalCost;

    return {
      description: 'OPEN TO ABOVE WIN',
      quantity: qty,
      unit: 'ea',
      unitPrice: totalCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate bay or bow windows cost
   */
  async calculateBayBowWindows(takeoff) {
    const labourItem = takeoff.labour?.find(l =>
      l.item?.toLowerCase().includes('bay') ||
      l.item?.toLowerCase().includes('bow')
    );

    if (!labourItem) {
      return { description: 'BAY OR BOW WINDOWS', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'BAY OR BOW WINDOWS', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    const basePricing = await InstallCost.getActivePricing('regWindow', null, casing);
    const bayBowIncrease = await InstallCost.getActivePricing('bay_bowWindow', null, casing);

    if (!basePricing || !bayBowIncrease) {
      return { description: 'BAY OR BOW WINDOWS', quantity: 0, amount: 0 };
    }

    const totalCost = basePricing.installCost + bayBowIncrease.increaseCost;
    const amount = qty * totalCost;

    return {
      description: 'BAY OR BOW WINDOWS',
      quantity: qty,
      unit: 'ea',
      unitPrice: totalCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate attic hatch cost
   * Labour array index 11: 'ATTIC HATCH'
   */
  async calculateAtticHatch(takeoff) {
    const labourItem = takeoff.labour?.[11]; // Index 11: ATTIC HATCH

    if (!labourItem || !labourItem.qty) {
      return { description: 'ATTIC HATCH', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'ATTIC HATCH', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    const pricing = await InstallCost.getActivePricing('atticHatch', null, casing);

    if (!pricing) {
      return { description: 'ATTIC HATCH', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'ATTIC HATCH',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate capping cost
   * Labour array index 12: 'CAPPING'
   */
  async calculateCapping(takeoff) {
    const labourItem = takeoff.labour?.[12]; // Index 12: CAPPING

    if (!labourItem || !labourItem.qty) {
      return { description: 'CAPPING #1 SIZES', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'CAPPING #1 SIZES', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    // Default to 'Routered' type unless specified otherwise
    const pricing = await InstallCost.getActivePricing('capping', 'Routered', casing);

    if (!pricing) {
      return { description: 'CAPPING #1 SIZES', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'CAPPING #1 SIZES',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate solid columns cost
   */
  async calculateSolidColumns(takeoff) {
    const labourItem = takeoff.labour?.find(l =>
      l.item?.toLowerCase().includes('solid column')
    );

    if (!labourItem) {
      return { description: 'SOLID COLUMNS', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'SOLID COLUMNS', quantity: 0, amount: 0 };
    }

    // Solid columns pricing would need to be added to InstallCost.json
    // For now, using a placeholder
    const amount = qty * 50.00; // Placeholder value

    return {
      description: 'SOLID COLUMNS',
      quantity: qty,
      unit: 'ea',
      unitPrice: 50.00,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate split columns cost
   */
  async calculateSplitColumns(takeoff) {
    const labourItem = takeoff.labour?.find(l =>
      l.item?.toLowerCase().includes('split column')
    );

    if (!labourItem) {
      return { description: 'SPLIT COLUMNS', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'SPLIT COLUMNS', quantity: 0, amount: 0 };
    }

    // Split columns pricing would need to be added to InstallCost.json
    const amount = qty * 45.00; // Placeholder value

    return {
      description: 'SPLIT COLUMNS',
      quantity: qty,
      unit: 'ea',
      unitPrice: 45.00,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate wire shelving cost
   * Labour array index 13: 'SHELVING'
   */
  async calculateShelving(takeoff) {
    const labourItem = takeoff.labour?.[13]; // Index 13: SHELVING

    if (!labourItem || !labourItem.qty) {
      return { description: 'WIRE SHELVING', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'WIRE SHELVING', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('shelving', 'wire closet shelving');

    if (!pricing) {
      return { description: 'WIRE SHELVING', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'WIRE SHELVING',
      quantity: qty,
      unit: 'lf',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate straight stairs cost
   * Labour array index 14: 'STARIS (STRAIGHT)' - Note: typo in form
   */
  async calculateStraightStairs(takeoff) {
    const labourItem = takeoff.labour?.[14]; // Index 14: STARIS (STRAIGHT)

    if (!labourItem || !labourItem.qty) {
      return { description: 'STAIRS (STRAIGHT)', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'STAIRS (STRAIGHT)', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('stairs', 'straight');

    if (!pricing) {
      return { description: 'STAIRS (STRAIGHT)', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'STAIRS (STRAIGHT)',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate circular/winder stairs cost
   * Labour array index 15: 'STAIRS (CIRC/WIND)'
   */
  async calculateCircularStairs(takeoff) {
    const labourItem = takeoff.labour?.[15]; // Index 15: STAIRS (CIRC/WIND)

    if (!labourItem || !labourItem.qty) {
      return { description: 'STAIRS (CIRC.-WIND.)', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'STAIRS (CIRC.-WIND.)', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('stairs', 'circular');

    if (!pricing) {
      return { description: 'STAIRS (CIRC.-WIND.)', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'STAIRS (CIRC.-WIND.)',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate half flight stairs cost
   * Labour array index 16: 'STAIRS (1/2 FLIGHT)'
   */
  async calculateHalfFlightStairs(takeoff) {
    const labourItem = takeoff.labour?.[16]; // Index 16: STAIRS (1/2 FLIGHT)

    if (!labourItem || !labourItem.qty) {
      return { description: 'STAIRS (½ FLIGHT)', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'STAIRS (½ FLIGHT)', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('stairs', 'half flight');

    if (!pricing) {
      return { description: 'STAIRS (½ FLIGHT)', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'STAIRS (½ FLIGHT)',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate door closer (hardware) cost
   * Hardware array index 11: 'S/Closer'
   */
  async calculateDoorCloser(takeoff) {
    const hardwareItem = takeoff.hardware?.[11]; // Index 11: S/Closer

    if (!hardwareItem || !hardwareItem.qty) {
      return { description: 'DOOR CLOSER', quantity: 0, amount: 0 };
    }

    const qty = parseInt(hardwareItem.qty) || 0;
    if (qty === 0) {
      return { description: 'DOOR CLOSER', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('doorCloser');

    if (!pricing) {
      return { description: 'DOOR CLOSER', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'DOOR CLOSER',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate exterior lock cost
   * Labour array index 23: 'EXTERIOR LOCKS'
   */
  async calculateExteriorLock(takeoff) {
    const labourItem = takeoff.labour?.[23]; // Index 23: EXTERIOR LOCKS

    if (!labourItem || !labourItem.qty) {
      return { description: 'EXTERIOR LOCK', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'EXTERIOR LOCK', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('exteriorLock');

    if (!pricing) {
      return { description: 'EXTERIOR LOCK', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'EXTERIOR LOCK',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate handrail cost
   * Trim array index 3: 'Handrail'
   */
  async calculateHandrail(takeoff) {
    const trimItem = takeoff.trim?.[3]; // Index 3: Handrail

    if (!trimItem || !trimItem.qty || trimItem.qty.trim() === '') {
      return { description: 'HANDRAIL', quantity: 0, amount: 0 };
    }

    const qty = parseInt(trimItem.qty) || 0;
    if (qty === 0) {
      return { description: 'HANDRAIL', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('handrail');

    if (!pricing) {
      return { description: 'HANDRAIL', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'HANDRAIL',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate 1/4 round cost
   * Trim array index 9: '1/4 Round'
   */
  async calculateQuarterRound(takeoff) {
    const trimItem = takeoff.trim?.[9]; // Index 9: 1/4 Round

    if (!trimItem || !trimItem.qty || trimItem.qty.trim() === '') {
      return { description: '1/4 ROUND', quantity: 0, amount: 0 };
    }

    const qty = parseInt(trimItem.qty) || 0;
    if (qty === 0) {
      return { description: '1/4 ROUND', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('quarterRound');

    if (!pricing) {
      return { description: '1/4 ROUND', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: '1/4 ROUND',
      quantity: qty,
      unit: 'rms',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate window seat cost
   * Labour array index 22: 'WINDOW SEAT'
   */
  async calculateWindowSeat(takeoff) {
    const labourItem = takeoff.labour?.[22]; // Index 22: WINDOW SEAT

    if (!labourItem || !labourItem.qty) {
      return { description: 'WINDOW SEAT', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'WINDOW SEAT', quantity: 0, amount: 0 };
    }

    const casing = this.determineCasing(takeoff);
    const pricing = await InstallCost.getActivePricing('windowSeat', null, casing);

    if (!pricing) {
      return { description: 'WINDOW SEAT', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.increaseCost;

    return {
      description: 'WINDOW SEAT',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.increaseCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate wet areas cost
   * Labour array index 26: 'WET AREA'
   */
  async calculateWetAreas(takeoff) {
    const labourItem = takeoff.labour?.[26]; // Index 26: WET AREA

    if (!labourItem || !labourItem.qty) {
      return { description: 'WET AREAS', quantity: 0, amount: 0 };
    }

    const qty = parseInt(labourItem.qty) || 0;
    if (qty === 0) {
      return { description: 'WET AREAS', quantity: 0, amount: 0 };
    }

    const pricing = await InstallCost.getActivePricing('wetAreas');

    if (!pricing) {
      return { description: 'WET AREAS', quantity: 0, amount: 0 };
    }

    const amount = qty * pricing.installCost;

    return {
      description: 'WET AREAS',
      quantity: qty,
      unit: 'ea',
      unitPrice: pricing.installCost,
      amount: this.roundToTwoDecimals(amount)
    };
  }

  /**
   * Calculate taller doors over 85"
   * Counts all single and double doors with height >= 85"
   */
  async calculateTallerDoorsOver85(takeoff) {
    let totalQty = 0;
    let totalAmount = 0;

    // Get pricing for taller doors over 85"
    const pricing = await InstallCost.findOne({
      item: 'tallerDoor',
      increaseCost: 17.53,
      isActive: true
    });

    if (!pricing) {
      return { description: 'TALLER DOORS OVER 85', quantity: 0, amount: 0 };
    }

    // Count single doors with height >= 85"
    if (takeoff.singleDoors && takeoff.singleDoors.length > 0) {
      for (const door of takeoff.singleDoors) {
        const left = parseInt(door.left) || 0;
        const right = parseInt(door.right) || 0;
        const qty = left + right;

        if (qty > 0) {
          const height = this.parseHeight(door.size);
          if (height >= 85) {
            totalQty += qty;
            totalAmount += qty * pricing.increaseCost;
          }
        }
      }
    }

    // Count double doors with height >= 85"
    if (takeoff.doubleDoors && takeoff.doubleDoors.length > 0) {
      for (const door of takeoff.doubleDoors) {
        const qty = parseInt(door.qty) || 0;

        if (qty > 0) {
          const height = this.parseHeight(door.height);
          if (height >= 85) {
            totalQty += qty;
            totalAmount += qty * pricing.increaseCost;
          }
        }
      }
    }

    return {
      description: 'TALLER DOORS OVER 85',
      quantity: totalQty,
      unit: 'ea',
      unitPrice: pricing.increaseCost,
      amount: this.roundToTwoDecimals(totalAmount)
    };
  }

  // ========== UTILITY METHODS ==========

  /**
   * Determine casing size from takeoff data
   * Looks at trim data to find casing information
   */
  determineCasing(takeoff) {
    // Check trim array for casing info
    const casingTrim = takeoff.trim?.find(t =>
      t.item?.toLowerCase().includes('casing') ||
      t.details?.toLowerCase().includes('casing')
    );

    if (casingTrim) {
      const details = casingTrim.details || '';
      if (details.includes('3-1/2') || details.includes('3 1/2')) {
        return '3-1/2';
      }
      if (details.includes('2-3/4') || details.includes('2 3/4')) {
        return '2-3/4';
      }
    }

    // Default to 2-3/4 if not specified
    return '2-3/4';
  }

  /**
   * Parse height from size string
   * Examples: "2/6", "2-6", "84", "2'6\""
   */
  parseHeight(sizeStr) {
    if (!sizeStr) return 0;

    const str = sizeStr.toString().trim();

    // Pattern: 2/6 or 2-6 (feet/inches)
    const feetInchPattern = /(\d+)[\/-](\d+)/;
    const match = str.match(feetInchPattern);
    if (match) {
      const feet = parseInt(match[1]);
      const inches = parseInt(match[2]);
      return feet * 12 + inches;
    }

    // Just a number (assume inches)
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      return parseInt(numMatch[1]);
    }

    return 0;
  }

  /**
   * Round number to 2 decimal places
   */
  roundToTwoDecimals(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
}

module.exports = new InvoiceCalculatorService();
