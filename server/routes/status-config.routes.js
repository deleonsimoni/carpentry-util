const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const statusConfigController = require('../controllers/status-config.controller');
const companyHeaderMiddleware = require('../middleware/company-header.middleware');

router.use(passport.authenticate('jwt', { session: false }));
router.use(companyHeaderMiddleware);

router.get('/', asyncHandler(statusConfigController.getAllStatusConfigs));
router.post('/', asyncHandler(statusConfigController.createStatusConfig));
router.put('/:id', asyncHandler(statusConfigController.updateStatusConfig));
router.delete('/:id', asyncHandler(statusConfigController.deleteStatusConfig));
router.get('/by-role', asyncHandler(statusConfigController.getStatusConfigByRole));
router.get('/transitions/:currentStatusId', asyncHandler(statusConfigController.getAvailableTransitions));

module.exports = router;