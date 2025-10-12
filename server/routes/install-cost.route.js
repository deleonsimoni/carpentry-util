const express = require('express');
const installCostCtrl = require('../controllers/install-cost.controller');
const passport = require('passport');

const router = express.Router();

// Protect all routes with JWT authentication
router.use(passport.authenticate('jwt', { session: false }));

/**
 * GET /api/install-cost/active
 * Get all active install costs (current pricing)
 * Accessible by: Managers, Super Admins
 */
router.get('/active', installCostCtrl.getAllActive);

/**
 * GET /api/install-cost/version/:version
 * Get install costs by version (e.g., "2025-2027")
 * Accessible by: Managers, Super Admins
 */
router.get('/version/:version', installCostCtrl.getByVersion);

/**
 * GET /api/install-cost/:id
 * Get install cost by ID
 * Accessible by: Managers, Super Admins
 */
router.get('/:id', installCostCtrl.getById);

/**
 * GET /api/install-cost
 * Get all install costs (including inactive)
 * Accessible by: Super Admins only
 */
router.get('/', installCostCtrl.getAll);

/**
 * POST /api/install-cost
 * Create new install cost
 * Accessible by: Super Admins only
 */
router.post('/', installCostCtrl.create);

/**
 * PUT /api/install-cost/:id
 * Update install cost
 * Accessible by: Super Admins only
 */
router.put('/:id', installCostCtrl.update);

/**
 * PATCH /api/install-cost/:id/deactivate
 * Deactivate install cost (soft delete)
 * Accessible by: Super Admins only
 */
router.patch('/:id/deactivate', installCostCtrl.deactivate);

/**
 * DELETE /api/install-cost/:id
 * Delete install cost (hard delete)
 * Accessible by: Super Admins only
 */
router.delete('/:id', installCostCtrl.remove);

module.exports = router;
