/**
 * Seed script to import InstallCost pricing data into MongoDB
 * Run this script every 2 years when pricing updates are available
 *
 * Usage: node server/scripts/seed-install-costs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const InstallCost = require('../models/install-cost.model');
const config = require('../config/config');

// InstallCost data for 2025-2027 period
const installCosts2025 = [
  // DOORS / ARCHWAYS
  { item: 'singleDoor', casing: '2-3/4', installCost: 50.79, description: 'Single door installation', version: '2025-2027' },
  { item: 'singleDoor', casing: '3-1/2', installCost: 56.12, description: 'Single door installation', version: '2025-2027' },
  { item: 'doubleDoor', casing: '2-3/4', installCost: 77.23, description: 'Double door installation', version: '2025-2027' },
  { item: 'doubleDoor', casing: '3-1/2', installCost: 85.30, description: 'Double door installation', version: '2025-2027' },
  { item: 'tallerDoor', increaseCost: 5.10, description: 'Additional cost for doors 81"-84" height', notes: 'Add to installCost when height is between 81" and 84"', version: '2025-2027' },
  { item: 'tallerDoor', increaseCost: 17.53, description: 'Additional cost for doors 85"+ height', notes: 'Add to installCost when height is 85" or more', version: '2025-2027' },
  { item: 'solidDoor', increaseCost: 7.84, description: 'Additional cost for solid doors', notes: 'Add to installCost when door is SOLID', version: '2025-2027' },
  { item: 'drillDoor', increaseCost: 5.86, description: 'Additional cost for drilling doors', notes: 'Add to total door installation price when carpenter indicates drilling', version: '2025-2027' },
  { item: 'archway', casing: '2-3/4', installCost: 38.62, description: 'Archway up to 84"', version: '2025-2027' },
  { item: 'archway', casing: '3-1/2', installCost: 42.72, description: 'Archway up to 84"', version: '2025-2027' },
  { item: 'tallerArchway', increaseCost: 8.74, description: 'Additional cost for archways above 84"', notes: 'Add to installCost when archway height is above 84"', version: '2025-2027' },
  { item: 'cantinaDoor', casing: '2-3/4', installCost: 63.92, description: 'Cantina door installation', version: '2025-2027' },
  { item: 'cantinaDoor', casing: '3-1/2', installCost: 70.57, description: 'Cantina door installation', version: '2025-2027' },
  { item: 'atticHatch', casing: '2-3/4', installCost: 38.62, description: 'Attic hatch installation', version: '2025-2027' },
  { item: 'atticHatch', casing: '3-1/2', installCost: 42.72, description: 'Attic hatch installation', version: '2025-2027' },

  // WINDOWS
  { item: 'regWindow', casing: '2-3/4', installCost: 30.54, description: 'Regular window installation', version: '2025-2027' },
  { item: 'regWindow', casing: '3-1/2', installCost: 33.60, description: 'Regular window installation', version: '2025-2027' },
  { item: 'ceilingWindow', installCost: 82.74, description: 'Ceiling window installation', version: '2025-2027' },
  { item: 'bay_bowWindow', casing: '2-3/4', increaseCost: 9.73, description: 'Additional cost for bay/bow windows', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'bay_bowWindow', casing: '3-1/2', increaseCost: 10.00, description: 'Additional cost for bay/bow windows', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'round_Window', casing: '2-3/4', increaseCost: 9.90, description: 'Additional cost for round top windows', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'round_Window', casing: '3-1/2', increaseCost: 10.00, description: 'Additional cost for round top windows', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: '4pc_round_Window', casing: '2-3/4', increaseCost: 71.10, description: 'Additional cost for 4pc round windows', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: '4pc_round_Window', casing: '3-1/2', increaseCost: 75.32, description: 'Additional cost for 4pc round windows', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'openToAbove', casing: '2-3/4', increaseCost: 26.38, description: 'Additional cost for windows above 12 feet', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'openToAbove', casing: '3-1/2', increaseCost: 31.78, description: 'Additional cost for windows above 12 feet', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'parapetOpening', casing: '2-3/4', installCost: 56.83, description: 'Parapet opening installation', version: '2025-2027' },
  { item: 'parapetOpening', casing: '3-1/2', installCost: 65.40, description: 'Parapet opening installation', version: '2025-2027' },
  { item: 'windowSeat', casing: '2-3/4', increaseCost: 50.79, description: 'Additional cost for window seat', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'windowSeat', casing: '3-1/2', increaseCost: 56.13, description: 'Additional cost for window seat', notes: 'Add to regWindow installCost', version: '2025-2027' },
  { item: 'buildOut4', increaseCost: 20.22, description: 'Additional cost for build out up to 4"', notes: 'Add to regWindow installCost. Need to add this field to takeoff', version: '2025-2027' },
  { item: 'buildOutOver4', increaseCost: 30.54, description: 'Additional cost for build out over 4"', notes: 'Add to regWindow installCost. Need to add this field to takeoff', version: '2025-2027' },

  // CAPPING
  { item: 'capping', type: 'Routered', casing: '2-3/4', installCost: 25.44, description: 'Routered capping installation', version: '2025-2027' },
  { item: 'capping', type: 'Routered', casing: '3-1/2', installCost: 27.75, description: 'Routered capping installation', version: '2025-2027' },
  { item: 'capping', type: 'High Square', casing: '2-3/4', installCost: 50.88, description: 'High square capping installation', version: '2025-2027' },
  { item: 'capping', type: 'High Square', casing: '3-1/2', installCost: 55.19, description: 'High square capping installation', version: '2025-2027' },
  { item: 'capping', type: 'High Curve', casing: '2-3/4', installCost: 101.76, description: 'High curve capping installation', version: '2025-2027' },
  { item: 'capping', type: 'High Curve', casing: '3-1/2', installCost: 110.99, description: 'High curve capping installation', version: '2025-2027' },

  // SHELVING
  { item: 'shelving', type: 'wood closet', installCost: 9.45, description: 'Wood closet shelving installation (per linear foot)', version: '2025-2027' },
  { item: 'shelving', type: 'wire closet shelving', installCost: 10.19, description: 'Wire closet shelving installation (per linear foot)', version: '2025-2027' },
  { item: 'shelving', type: 'wire shelving', installCost: 28.33, description: 'Wire shelving installation (per linear foot)', version: '2025-2027' },

  // BASEBOARD
  { item: 'baseboard', casing: '3-1/2', installCost: 0.14, description: 'Baseboard installation (per sqft) for sizes up to 3-1/2"', version: '2025-2027' },
  { item: 'baseboard', casing: '4-7/8', installCost: 0.24, description: 'Baseboard installation (per sqft) for sizes 3-5/8" to 4-7/8"', version: '2025-2027' },
  { item: 'baseboard', casing: '6-7/8', installCost: 0.26, description: 'Baseboard installation (per sqft) for sizes 5" to 6-7/8"', version: '2025-2027' },
  { item: 'baseboard', casing: '9-1/4', installCost: 0.37, description: 'Baseboard installation (per sqft) for sizes 7" to 9-1/4"', version: '2025-2027' },
  { item: 'cutOutBoxes', installCost: 19.99, description: 'Cut out boxes service', notes: 'Add to total price when service is provided', version: '2025-2027' },

  // STAIRS - QUARTEROUND & DOORSTOP
  { item: 'stairs', type: 'straight', installCost: 55.19, description: 'Straight stairs installation', version: '2025-2027' },
  { item: 'stairs', type: 'half flight', installCost: 26.26, description: 'Half flight stairs installation', notes: 'Only charge when quantity is 2 or more. Need to create this field in takeoff', version: '2025-2027' },
  { item: 'stairs', type: 'circular', installCost: 154.45, description: 'Circular stairs installation', version: '2025-2027' },
  { item: 'baseboardStairs', installCost: 43.78, description: 'Baseboard on circular stairs', notes: 'Add to circular stairs installCost when there is baseboard. Need to add option in takeoff', version: '2025-2027' },
  { item: 'handrail', installCost: 26.66, description: 'Handrail installation', version: '2025-2027' },
  { item: 'basementStairs', installCost: 26.14, description: 'Basement stairs installation', notes: 'Uncommon item. Will be handled later', version: '2025-2027' },
  { item: 'wetAreas', installCost: 122.40, description: 'Wet areas service', notes: 'Need to create this field in takeoff', version: '2025-2027' },

  // HARDWARE & OTHER
  { item: 'doorCloser', installCost: 28.38, description: 'Door closer installation (S/Closer)', notes: 'From HARDWARE group in takeoff', version: '2025-2027' },
  { item: 'exteriorLock', installCost: 13.14, description: 'Exterior lock installation', notes: 'Need to create this field in takeoff', version: '2025-2027' },
  { item: 'quarterRound', installCost: 30.54, description: 'Quarter round installation (RMS 1/4 round)', notes: 'From LABOUR group in takeoff', version: '2025-2027' },
];

/**
 * Main seed function
 */
async function seedInstallCosts() {
  try {
    console.log('🌱 Starting InstallCost seed process...');
    console.log(`📊 Version: 2025-2027`);

    // Connect to MongoDB
    await mongoose.connect(config.mongo.host, {
      keepAlive: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Mark all existing 2025-2027 costs as inactive
    const updateResult = await InstallCost.updateMany(
      { version: '2025-2027' },
      { isActive: false }
    );
    console.log(`📝 Marked ${updateResult.modifiedCount} existing 2025-2027 costs as inactive`);

    // Insert new costs
    const insertedCosts = [];
    for (const cost of installCosts2025) {
      const newCost = new InstallCost({
        ...cost,
        validFrom: new Date('2025-05-01'), // Adjust date as needed
        validUntil: new Date('2027-04-30'), // Adjust date as needed
        isActive: true
      });

      const saved = await newCost.save();
      insertedCosts.push(saved);
    }

    console.log(`✅ Successfully inserted ${insertedCosts.length} install costs`);
    console.log('\n📊 Summary by category:');

    // Group by item for summary
    const summary = insertedCosts.reduce((acc, cost) => {
      acc[cost.item] = (acc[cost.item] || 0) + 1;
      return acc;
    }, {});

    Object.entries(summary).forEach(([item, count]) => {
      console.log(`   - ${item}: ${count} entries`);
    });

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   - Use InstallCost.getActivePricing(item, type, casing) to get current pricing');
    console.log('   - Use InstallCost.getAllActivePricing() to get all active pricing');
    console.log('   - Run this script again when pricing updates are available (every 2 years)');

  } catch (error) {
    console.error('❌ Error seeding install costs:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run seed if called directly
if (require.main === module) {
  seedInstallCosts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedInstallCosts, installCosts2025 };
