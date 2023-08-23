const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const takeoffRoutes = require('./takeoff.route');
const materialRequestRoutes = require('./materialRequest.route');
const carpentryRoutes = require('./carpentry.route');

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/takeoff', takeoffRoutes);
router.use('/material-request', materialRequestRoutes);
router.use('/carpentry', carpentryRoutes);

module.exports = router;
