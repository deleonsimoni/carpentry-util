const express = require('express');
const asyncHandler = require('express-async-handler');
const passport = require('passport');
const userCtrl = require('../controllers/user.controller');
const authCtrl = require('../controllers/auth.controller');
const sendgridCtrl = require('../controllers/sendgrid.controller');
const User = require('../models/user.model');

const config = require('../config/config');
const crypto = require("crypto");

const router = express.Router();
module.exports = router;

router.post('/register', asyncHandler(register));
router.get('/verify-email', asyncHandler(verifyEmail));

router.post(
  '/login',
  passport.authenticate('local', { session: false }),
  login
);
router.get('/me', passport.authenticate('jwt', { session: false }), login);
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

  user = await userCtrl.insert(req.body);
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

  let token = authCtrl.generateToken(user);

  // Incluir informação sobre necessidade de trocar senha
  res.json({
    user,
    token,
    requirePasswordChange: user.requirePasswordChange || false,
    temporaryPassword: user.temporaryPassword || false
  });
}

function updateUser(req, res) {
  let user = req.user;
  let token = authCtrl.updateUser(user, req.body);
  res.json(token);
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
