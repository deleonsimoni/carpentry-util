const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const takeoffCtrl = require('../controllers/takeoff.controller');

const router = express.Router();
module.exports = router;

router.use(passport.authenticate('jwt', { session: false }));

router.route('/').get(asyncHandler(getTakeoffs));
router.route('/:idTakeoff').get(asyncHandler(detailTakeoff));
router.route('/:idTakeoff/generatePDF').get(asyncHandler(generatePDF));
router.route('/:idTakeoff/update').post(asyncHandler(updateTakeoff));
router.route('/:idTakeoff/finalize').post(asyncHandler(finalizeTakeoff));
router
  .route('/:idTakeoff/backTakeoffToCarpentry')
  .post(asyncHandler(backTakeoffToCarpentry));
router
  .route('/findCarpentryByEmail/:email')
  .get(asyncHandler(findCarpentryByEmail));

router.route('/').post(asyncHandler(createTakeoff));

async function createTakeoff(req, res) {
  let response = await takeoffCtrl.insert(req.user, req.body);
  res.json(response);
}

async function updateTakeoff(req, res) {
  let response = await takeoffCtrl.updateTakeoff(
    req.user,
    req.body,
    req.params.idTakeoff
  );
  res.json(response);
}

async function finalizeTakeoff(req, res) {
  let response = await takeoffCtrl.finalizeTakeoff(
    req.user,
    req.body,
    req.params.idTakeoff
  );
  res.json(response);
}

async function backTakeoffToCarpentry(req, res) {
  let response = await takeoffCtrl.backTakeoffToCarpentry(
    req.user,
    req.body,
    req.params.idTakeoff
  );
  res.json(response);
}

async function findCarpentryByEmail(req, res) {
  let response = await takeoffCtrl.findCarpentryByEmail(
    req.user,
    req.params.email
  );
  res.json(response);
}

async function generatePDF(req, res) {
  let response = await takeoffCtrl.generatePDF(req.user, req.params.idTakeoff);
  res.json(response);
}

async function detailTakeoff(req, res) {
  let response = await takeoffCtrl.detailTakeoff(
    req.user._id,
    req.params.idTakeoff
  );
  res.json(response);
}

async function getTakeoffs(req, res) {
  let response = await takeoffCtrl.getTakeoffs(req.user._id);
  res.json(response);
}
