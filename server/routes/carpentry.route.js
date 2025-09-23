const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const carpentryCtrl = require('../controllers/carpentry.controller');

const router = express.Router();
module.exports = router;

router.use(passport.authenticate('jwt', { session: false }));

router.route('/').get(asyncHandler(getAllCarpentry));

async function getAllCarpentry(req, res) {
  let response = await carpentryCtrl.getAll(req.user);
  res.json(response);
}