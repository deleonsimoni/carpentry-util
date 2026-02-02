const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const User = require('../models/user.model');
const Company = require('../models/company.model');
const sendgridCtrl = require('./sendgrid.controller');

module.exports = {
  generateToken,
  updateUser,
  updateLastLogin,
  selectCompany,
  getUserCompanies,
  forgotPassword,
  resetPassword,
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

async function forgotPassword(email) {
  // Always return success to avoid revealing whether email exists
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `https://carpentrygo.ca/reset-password?token=${token}`;

  const html = `
    <h2>Password Reset - CarpentryGo</h2>
    <p>Hello,</p>
    <p>You requested a password reset. Click the button below to set a new password:</p>
    <a href="${resetUrl}"
      style="display:inline-block;padding:10px 20px;background:#004a80;color:#fff;text-decoration:none;border-radius:5px;">
      Reset my password
    </a>
    <p>Or copy and paste this link into your browser:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request a password reset, ignore this email.</p>
  `;

  await sendgridCtrl.enviarEmail(email, 'CarpentryGo - Password Reset', html);

  return { success: true };
}

async function resetPassword(token, newPassword) {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token. Please request a new password reset link.');
  }

  const salt = bcrypt.genSaltSync(10);
  user.hashedPassword = bcrypt.hashSync(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.requirePasswordChange = false;
  user.temporaryPassword = false;
  await user.save();

  return { success: true };
}
