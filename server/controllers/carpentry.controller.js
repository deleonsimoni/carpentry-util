
const User = require('../models/user.model');

module.exports = {
  getAll
};


async function getAll() {
  return await User
    .find({ roles: 'carpentry' })
    .select('email fullname')
    .sort({
      createAt: -1
    });
}

