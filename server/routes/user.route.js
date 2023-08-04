const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const userCtrl = require('../controllers/user.controller');

const router = express.Router();
module.exports = router;

//router.use(passport.authenticate('jwt', { session: false }));

router.route('/').post(asyncHandler(insert));

router.route('/teste').get(asyncHandler(teste));

async function insert(req, res) {
  let user = await userCtrl.insert(req.body);
  res.json(user);
}

async function teste(req, res) {
  //let user = await userCtrl.teste(req.body);
  res.json(user);
}
