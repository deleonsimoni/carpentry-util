const express = require('express');
const asyncHandler = require('express-async-handler');
const passport = require('passport');
const userCtrl = require('../controllers/user.controller');
const authCtrl = require('../controllers/auth.controller');
const config = require('../config/config');

const router = express.Router();
module.exports = router;

router.post('/register', asyncHandler(register), login);
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

async function register(req, res, next) {
  let user = await userCtrl.insert(req.body);
  user = user.toObject();
  delete user.hashedPassword;
  req.user = user;
  next();
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
