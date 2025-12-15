const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/user.model');
const Company = require('../models/company.model');

module.exports = {
  generateToken,
  updateUser,
  updateLastLogin,
  selectCompany,
  getUserCompanies,
};

function generateToken(user) {
  const payload = JSON.stringify(user);
  return jwt.sign(payload, config.jwtSecret);
}

async function updateUser(user, body) {
  delete body.email;
  return await User.findOneAndUpdate(
    {
      _id: user._id,
    },
    body
  );
}

async function updateLastLogin(userId) {
  return await User.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { new: true }
  );
}

/**
 * Select/switch company for a user
 * Updates activeCompany and company fields, returns new token
 */
async function selectCompany(userId, companyId) {
  // Verify company exists
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Get user and verify they belong to this company
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user belongs to this company
  const belongsToCompany = user.companies && user.companies.some(
    c => c.toString() === companyId.toString()
  );

  if (!belongsToCompany) {
    throw new Error('User does not belong to this company');
  }

  // Update user's active company
  user.activeCompany = companyId;
  user.company = companyId; // Keep backwards compatibility
  await user.save();

  // Return updated user object for token generation
  const updatedUser = user.toObject();
  delete updatedUser.hashedPassword;

  return {
    user: updatedUser,
    token: generateToken(updatedUser)
  };
}

/**
 * Get all companies for a user (populated with company details)
 */
async function getUserCompanies(userId) {
  const user = await User.findById(userId)
    .populate('companies', 'name status address')
    .lean();

  if (!user) {
    throw new Error('User not found');
  }

  // Filter only active companies
  const activeCompanies = (user.companies || []).filter(
    c => c && c.status === 'active'
  );

  return activeCompanies;
}
