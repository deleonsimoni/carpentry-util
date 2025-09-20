/**
 * Script para atualizar todas as roles inconsistentes no banco de dados
 * para usar as constantes padronizadas
 */

const mongoose = require('mongoose');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

const ROLE_MAPPINGS = {
  'carpinter': UserRoles.CARPENTER,    // Fix common typo
  'carpentry': UserRoles.CARPENTER,    // Alternative spelling
  'manager': UserRoles.MANAGER,        // Already correct
  'super_admin': UserRoles.SUPER_ADMIN, // Already correct
  'delivery': UserRoles.DELIVERY,      // Already correct
  'supervisor': UserRoles.SUPERVISOR   // Already correct
};

async function updateRolesToConstants() {
  try {
    const mongoUri = process.env.MONGO_HOST || 'mongodb://localhost:27017/carpentryutildb';
    console.log('Connecting to MongoDB:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB successfully');

    // Find all users with roles
    const users = await User.find({ roles: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with roles`);

    let updatedCount = 0;

    for (const user of users) {
      let hasChanges = false;
      const updatedRoles = [];

      for (const role of user.roles) {
        if (ROLE_MAPPINGS[role]) {
          updatedRoles.push(ROLE_MAPPINGS[role]);
          if (ROLE_MAPPINGS[role] !== role) {
            hasChanges = true;
          }
        } else {
          console.warn(`Unknown role found: ${role} for user ${user.email}`);
          updatedRoles.push(role); // Keep unknown roles as-is
        }
      }

      if (hasChanges) {
        console.log(`Updating user ${user.email}:`);
        console.log(`  Old roles: [${user.roles.join(', ')}]`);
        console.log(`  New roles: [${updatedRoles.join(', ')}]`);

        await User.updateOne(
          { _id: user._id },
          { $set: { roles: updatedRoles } }
        );

        updatedCount++;
      }
    }

    console.log(`\n✅ Role standardization complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Updated users: ${updatedCount}`);
    console.log(`   - Valid roles: ${UserRoles.getAllRoles().join(', ')}`);

    // Verify no invalid roles remain
    const usersWithInvalidRoles = await User.find({
      roles: { $not: { $all: UserRoles.getAllRoles() } }
    });

    if (usersWithInvalidRoles.length > 0) {
      console.log(`\n⚠️  Warning: Found ${usersWithInvalidRoles.length} users with potentially invalid roles:`);
      for (const user of usersWithInvalidRoles) {
        const invalidRoles = user.roles.filter(role => !UserRoles.getAllRoles().includes(role));
        if (invalidRoles.length > 0) {
          console.log(`   - ${user.email}: [${invalidRoles.join(', ')}]`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error updating roles:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update if called directly
if (require.main === module) {
  updateRolesToConstants()
    .then(() => {
      console.log('\n🎉 Roles standardization completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Roles standardization failed:', error);
      process.exit(1);
    });
}

module.exports = { updateRolesToConstants, ROLE_MAPPINGS };