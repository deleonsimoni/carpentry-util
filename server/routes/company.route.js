const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const companyCtrl = require('../controllers/company.controller');
const { tenancyMiddleware } = require('../middleware/tenancy');

const router = express.Router();

// Apply authentication and tenancy middleware to all routes
router.use(passport.authenticate('jwt', { session: false }));
router.use(tenancyMiddleware);

// Company CRUD routes
router.route('/')
  .get(asyncHandler(getCompanies))
  .post(asyncHandler(createCompany));

router.route('/:id')
  .get(asyncHandler(getCompanyById))
  .put(asyncHandler(updateCompany))
  .patch(asyncHandler(updateCompany))
  .delete(asyncHandler(deleteCompany));

router.route('/:id/stats')
  .get(asyncHandler(getCompanyStats));

// Route handlers
async function createCompany(req, res) {
  const response = await companyCtrl.create(req, res);
  return response;
}

async function getCompanies(req, res) {
  const response = await companyCtrl.getCompanies(req, res);
  return response;
}

async function getCompanyById(req, res) {
  const response = await companyCtrl.getCompanyById(req, res);
  return response;
}

async function updateCompany(req, res) {
  const response = await companyCtrl.updateCompany(req, res);
  return response;
}

async function deleteCompany(req, res) {
  const response = await companyCtrl.deleteCompany(req, res);
  return response;
}

async function getCompanyStats(req, res) {
  const response = await companyCtrl.getCompanyStats(req, res);
  return response;
}

module.exports = router;