
const User = require('../models/user.model');
const UserRoles = require('../constants/user-roles');

module.exports = {
  getAll
};


async function getAll() {
  return await User
    .find({ roles: UserRoles.CARPENTER })
    .select('email fullname')
    .sort({
      createAt: -1
    });
}

