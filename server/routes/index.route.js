const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const takeoffRoutes = require('./takeoff.route');
const materialRequestRoutes = require('./material-request.route');
const carpentryRoutes = require('./carpentry.route');
const dashboardRoutes = require('./dashboard.route');
const companyRoutes = require('./company.route');
const statusConfigRoutes = require('./status-config.routes');
const invoiceRoutes = require('./invoice.route');
const installCostRoutes = require('./install-cost.route');

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/takeoff', takeoffRoutes);
router.use('/material-request', materialRequestRoutes);
router.use('/carpentry', carpentryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/company', companyRoutes);
router.use('/status-config', statusConfigRoutes);
router.use('/invoice', invoiceRoutes);
router.use('/install-cost', installCostRoutes);

module.exports = router;
