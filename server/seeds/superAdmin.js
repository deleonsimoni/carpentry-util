const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

const createSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      email: 'admin@email.com',
      roles: UserRoles.SUPER_ADMIN
    });

    if (existingSuperAdmin) {
      console.log('Super Admin already exists');
      return existingSuperAdmin;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create super admin user
    const superAdmin = new User({
      fullname: 'Super Administrator',
      email: 'admin@email.com',
      hashedPassword: hashedPassword,
      roles: [UserRoles.SUPER_ADMIN],
      profile: 'super_admin',
      status: 'active',
      requirePasswordChange: false,
      temporaryPassword: false,
      company: null, // Super admin doesn't belong to any company
      createdAt: new Date()
    });

    const savedSuperAdmin = await superAdmin.save();
    console.log('Super Admin created successfully:', savedSuperAdmin.email);
    return savedSuperAdmin;

  } catch (error) {
    console.error('Error creating Super Admin:', error);
    throw error;
  }
};

module.exports = {
  createSuperAdmin
};

// Run directly if called from command line
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carpentryutildb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    return createSuperAdmin();
  })
  .then(() => {
    console.log('Super Admin seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}