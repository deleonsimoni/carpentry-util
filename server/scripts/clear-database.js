const mongoose = require('mongoose');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');
const Company = require('../models/company.model');
const Takeoff = require('../models/takeoff.model');
const { createSuperAdmin } = require('../seeds/superAdmin');

require('dotenv').config();

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_HOST || 'mongodb://localhost:27017/carpentryutildb';
    console.log('Connecting to MongoDB:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB successfully');

    // Get super admin before clearing
    const superAdmin = await User.findOne({
      email: 'admin@email.com',
      roles: UserRoles.SUPER_ADMIN
    });

    console.log('Super admin found:', superAdmin ? superAdmin.email : 'Not found');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));

    // Clear all collections except keeping the super admin
    console.log('\nClearing database collections...');

    // Clear takeoffs
    if (mongoose.connection.db.collection('takeoffs')) {
      const takeoffResult = await mongoose.connection.db.collection('takeoffs').deleteMany({});
      console.log(`Cleared ${takeoffResult.deletedCount} takeoffs`);
    }

    // Clear companies
    if (mongoose.connection.db.collection('companies')) {
      const companyResult = await mongoose.connection.db.collection('companies').deleteMany({});
      console.log(`Cleared ${companyResult.deletedCount} companies`);
    }

    // Clear users except super admin
    if (mongoose.connection.db.collection('users')) {
      const userResult = await mongoose.connection.db.collection('users').deleteMany({
        email: { $ne: 'admin@email.com' }
      });
      console.log(`Cleared ${userResult.deletedCount} users (keeping super admin)`);
    }

    // Clear material requests if exists
    if (mongoose.connection.db.collection('materialrequests')) {
      const materialResult = await mongoose.connection.db.collection('materialrequests').deleteMany({});
      console.log(`Cleared ${materialResult.deletedCount} material requests`);
    }

    // Clear any other collections you might have
    const otherCollections = ['carpentries', 'sessions', 'logs'];
    for (const collName of otherCollections) {
      try {
        const result = await mongoose.connection.db.collection(collName).deleteMany({});
        if (result.deletedCount > 0) {
          console.log(`Cleared ${result.deletedCount} documents from ${collName}`);
        }
      } catch (error) {
        // Collection might not exist, ignore error
      }
    }

    // Ensure super admin exists
    console.log('\nEnsuring super admin exists...');
    await createSuperAdmin();

    // Verify final state
    const remainingUsers = await User.find({});
    const remainingCompanies = await Company.find({});
    const remainingTakeoffs = await Takeoff.find({});

    console.log('\n=== DATABASE CLEARED SUCCESSFULLY ===');
    console.log(`Remaining users: ${remainingUsers.length}`);
    console.log(`Remaining companies: ${remainingCompanies.length}`);
    console.log(`Remaining takeoffs: ${remainingTakeoffs.length}`);

    if (remainingUsers.length > 0) {
      console.log('\nRemaining users:');
      remainingUsers.forEach(user => {
        console.log(`- ${user.email} (${user.roles.join(', ')})`);
      });
    }

    console.log('\n✅ Database reset complete! Only super admin remains.');
    console.log('Super admin login: admin@email.com / admin123');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the script
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearDatabase };