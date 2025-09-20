const httpError = require('http-errors');
const UserRoles = require('../constants/user-roles');

const requireAdmin = function (req, res, next) {
  if (req.user && (req.user.isAdmin || UserRoles.isManager(req.user.roles))) return next();
  const err = new httpError(401);
  return next(err);
};

module.exports = requireAdmin;
