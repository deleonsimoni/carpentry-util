const express = require('express');
const asyncHandler = require('express-async-handler');
const passport = require('passport');
const userCtrl = require('../controllers/user.controller');
const authCtrl = require('../controllers/auth.controller');
const sendgridCtrl = require('../controllers/sendgrid.controller');
const User = require('../models/user.model');
const Company = require('../models/company.model');

const config = require('../config/config');
const crypto = require("crypto");

const router = express.Router();
module.exports = router;

router.post('/register', asyncHandler(register));
router.get('/verify-email', asyncHandler(verifyEmail));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

router.post(
  '/login',
  passport.authenticate('local', { session: false }),
  asyncHandler(login)
);
router.get('/me', passport.authenticate('jwt', { session: false }), asyncHandler(getMe));
router.post(
  '/me',
  passport.authenticate('jwt', { session: false }),
  updateUser
);
router.post(
  '/first-password-change',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(firstPasswordChange)
);

// Multi-tenancy: Select/switch company
router.post(
  '/select-company',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(selectCompany)
);

// Multi-tenancy: Get user's companies
router.get(
  '/my-companies',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(getMyCompanies)
);

async function verifyEmail(req, res) {
  try {
    const { token, email } = req.query;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).send("User not found.");

    if (user.verificationCode !== token) {
      return res.status(400).send("Invalid Token.");
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    return res.redirect("/login?verified=true");    

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no servidor.");
  }
  }

async function register(req, res, next) {

  let user = await User.findOne({email: req.body.email.toLowerCase()});

  if(user && user.isVerified === false){
      let codEmail = generateVerificationCode();
      user.verificationCode = codEmail;
      authCtrl.updateUser(user, { verificationCode: codEmail});
      const emailSent = await sendVerificationEmail(user.email, codEmail); 
      return res.status(400).json({ message: "We resend a code for your email" });
  }

  if (user) return res.status(400).json({ message: "User already register" });

  let codEmail = generateVerificationCode();
  req.body.verificationCode = codEmail;
  req.body.isVerified = false;

  user = await userCtrl.insert(req.body, codEmail);
  user = user.toObject();
  delete user.hashedPassword;
  req.user = user;

  // Enviar email de verificação
  const emailSent = await sendVerificationEmail(user.email, codEmail);
  
  return res.status(201).json({
        success: true,
        message: 'We\'ve sent a verification link to your email. Please check your inbox to validate.'
      });
}

async function sendVerificationEmail(email, codEmail) {
  
  const subject = "Welcome to CarpentryGo - Confirm your registration";

  const verificationUrl = `https://carpentrygo.ca/api/auth/verify-email?token=${codEmail}&email=${email}`;
  
  const html=`
    <h2>Welcome to CarpentryGo 🎉</h2>
    <p>Hello, thank you for registering!</p>
    <p>Click the button below to confirm your registration:</p>
    <a href="${verificationUrl}"
    style="display:inline-block;padding:10px 20px;background:#004a80;color:#fff;text-decoration:none;border-radius:5px;">
    Confirm my registration
    </a>
    <p>Or click the link below to register.</p>
    <a href="${verificationUrl}">${verificationUrl}</a>

    <p>If you were not the one who registered, ignore this email.</p>
  `;

  await sendgridCtrl.enviarEmail(email, subject, html);

}


function generateVerificationCode() {
  return crypto.randomBytes(32).toString("hex");
}

async function login(req, res) {
  let user = req.user;

  // Atualizar último login
  await authCtrl.updateLastLogin(user._id);

  // Get fresh user data with companies populated
  const freshUser = await User.findById(user._id)
    .populate('companies', 'name status')
    .lean();

  // Filter active companies
  const activeCompanies = (freshUser.companies || []).filter(
    c => c && c.status === 'active'
  );

  // Ensure user object has companies data
  const userToSend = { ...freshUser };
  delete userToSend.hashedPassword;
  userToSend.companies = activeCompanies.map(c => c._id);

  // Check if user needs to select a company (has multiple)
  if (activeCompanies.length > 1 && !freshUser.activeCompany) {
    // User has multiple companies and no active one selected
    // Return companies list for selection
    return res.json({
      needsCompanySelection: true,
      companies: activeCompanies,
      user: userToSend,
      token: authCtrl.generateToken(userToSend),
      requirePasswordChange: user.requirePasswordChange || false,
      temporaryPassword: user.temporaryPassword || false
    });
  }

  // Single company or already has active company selected
  // Ensure activeCompany is set
  if (!freshUser.activeCompany && activeCompanies.length === 1) {
    // Auto-select the only company
    await User.findByIdAndUpdate(user._id, {
      activeCompany: activeCompanies[0]._id,
      company: activeCompanies[0]._id
    });
    userToSend.activeCompany = activeCompanies[0]._id;
    userToSend.company = activeCompanies[0]._id;
  }

  let token = authCtrl.generateToken(userToSend);

  // Normal login response
  res.json({
    user: userToSend,
    token,
    requirePasswordChange: user.requirePasswordChange || false,
    temporaryPassword: user.temporaryPassword || false
  });
}

// Get current user info (for /me endpoint)
async function getMe(req, res) {
  let user = req.user;

  // Get fresh user data with companies populated
  const freshUser = await User.findById(user._id)
    .populate('companies', 'name status')
    .lean();

  // Filter active companies
  const activeCompanies = (freshUser.companies || []).filter(
    c => c && c.status === 'active'
  );

  const userToSend = { ...freshUser };
  delete userToSend.hashedPassword;
  userToSend.companies = activeCompanies.map(c => c._id);

  let token = authCtrl.generateToken(userToSend);

  res.json({
    user: userToSend,
    token,
    requirePasswordChange: freshUser.requirePasswordChange || false,
    temporaryPassword: freshUser.temporaryPassword || false
  });
}

// Select/switch company for multi-tenancy
async function selectCompany(req, res) {
  const { companyId } = req.body;
  const userId = req.user._id;

  if (!companyId) {
    return res.status(400).json({ message: 'Company ID is required' });
  }

  try {
    const result = await authCtrl.selectCompany(userId, companyId);
    res.json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Company switched successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

// Get all companies user belongs to
async function getMyCompanies(req, res) {
  try {
    const companies = await authCtrl.getUserCompanies(req.user._id);
    res.json({
      success: true,
      companies,
      activeCompany: req.user.activeCompany || req.user.company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

function updateUser(req, res) {
  let user = req.user;
  let token = authCtrl.updateUser(user, req.body);
  res.json(token);
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    await authCtrl.forgotPassword(email);
    // Always return success to avoid revealing whether email exists
    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    // Still return success to avoid revealing information
    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    await authCtrl.resetPassword(token, password);
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function firstPasswordChange(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        errors: true,
        message: 'Nova senha e confirmação não conferem'
      });
    }

    const result = await userCtrl.changePassword(userId, currentPassword, newPassword);

    // Gerar novo token com dados atualizados
    const updatedUser = result.user.toObject();
    const token = authCtrl.generateToken(updatedUser);

    res.json({
      success: true,
      user: updatedUser,
      token,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}
