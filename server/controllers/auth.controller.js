const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/user.model');

module.exports = {
  generateToken,
  updateUser,
  updateLastLogin,
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
