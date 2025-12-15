const express = require('express');
const router = express.Router();
const passport = require('passport');
const UserRoles = require('../constants/user-roles');
const superadminCtrl = require('../controllers/superadmin.controller');

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !UserRoles.isSuperAdmin(req.user.roles)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
  }
  next();
};

// All routes require authentication and super admin role
router.use(passport.authenticate('jwt', { session: false }));
router.use(requireSuperAdmin);

// Users endpoints
router.get('/users', superadminCtrl.getAllUsers);
router.get('/users/company/:companyId', superadminCtrl.getUsersByCompany);
router.patch('/users/:userId/status', superadminCtrl.updateUserStatus);

// Companies endpoints
router.get('/companies', superadminCtrl.getAllCompanies);
router.patch('/companies/:companyId/status', superadminCtrl.updateCompanyStatus);

// Statistics
router.get('/stats', superadminCtrl.getSystemStats);

module.exports = router;
