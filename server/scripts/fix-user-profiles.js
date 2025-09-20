/**
 * Script para corrigir profiles de usuário com valores antigos para 'carpenter'
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

async function fixUserProfiles() {
  try {
    const mongoUri = process.env.MONGO_HOST || 'mongodb://localhost:27017/carpentryutildb';
    console.log('Connecting to MongoDB:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB successfully');

    // Fix profiles with old values
    const updatesNeeded = [
      { oldValue: 'carpinter', newValue: UserRoles.CARPENTER },
      { oldValue: 'carpentry', newValue: UserRoles.CARPENTER }
    ];

    let totalUpdated = 0;

    for (const update of updatesNeeded) {
      // Update profile field
      const profileResult = await User.updateMany(
        { profile: update.oldValue },
        { $set: { profile: update.newValue } }
      );

      // Update roles array
      const rolesResult = await User.updateMany(
        { roles: update.oldValue },
        { $set: { "roles.$": update.newValue } }
      );

      console.log(`Updated profiles from '${update.oldValue}' to '${update.newValue}': ${profileResult.modifiedCount} users`);
      console.log(`Updated roles from '${update.oldValue}' to '${update.newValue}': ${rolesResult.modifiedCount} users`);

      totalUpdated += profileResult.modifiedCount + rolesResult.modifiedCount;
    }

    // Show current state
    const allUsers = await User.find({}, 'email profile roles').lean();
    console.log('\nCurrent user profiles:');
    allUsers.forEach(user => {
      console.log(`  ${user.email}: profile='${user.profile}', roles=[${user.roles.join(', ')}]`);
    });

    console.log(`\n✅ Profile fix complete! Updated ${totalUpdated} fields total.`);

  } catch (error) {
    console.error('❌ Error fixing profiles:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix if called directly
if (require.main === module) {
  fixUserProfiles()
    .then(() => {
      console.log('\n🎉 Profile fix completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Profile fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUserProfiles };