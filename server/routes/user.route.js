const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const userCtrl = require('../controllers/user.controller');
const router = express.Router();
const fileUpload = require('express-fileupload');

module.exports = router;

//router.use(passport.authenticate('jwt', { session: false }));

router.route('/').post(asyncHandler(insert));

router.put(
  '/updateProfilePic',
  [
    passport.authenticate('jwt', {
      session: false,
    }),
    fileUpload(),
  ],
  asyncHandler(updateImageProfile)
);

router.route('/teste').get(asyncHandler(teste));

async function insert(req, res) {
  let user = await userCtrl.insert(req.body);
  res.json(user);
}

async function updateImageProfile(req, res) {
  let responseUpload = await userCtrl.updateImageUser(req.user, req.body);

  if (responseUpload.temErro) {
    return res.status(500).send('Error! ' + responseUpload.mensagem);
  } else {
    return res.json('OK');
  }
}

async function teste(req, res) {
  //let user = await userCtrl.teste(req.body);
  res.json(user);
}
