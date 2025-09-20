const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const dashboardCtrl = require('../controllers/dashboard.controller');
const companyHeaderMiddleware = require('../middleware/company-header.middleware');
const router = express.Router();

module.exports = router;

// Middleware de autenticação para rotas protegidas
const requireAuth = passport.authenticate('jwt', { session: false });

// Rota para dados do dashboard
router.route('/data')
  .get(requireAuth, companyHeaderMiddleware, asyncHandler(getDashboardData));

async function getDashboardData(req, res) {
  try {
    const data = await dashboardCtrl.getDashboardData(req.user._id, req.companyFilter);
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errors: true,
      message: error.message
    });
  }
}