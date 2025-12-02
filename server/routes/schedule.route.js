const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const scheduleCtrl = require('../controllers/schedule.controller');
const companyHeaderMiddleware = require('../middleware/company-header.middleware');

const router = express.Router();
module.exports = router;

router.use(passport.authenticate('jwt', { session: false }));
router.use(companyHeaderMiddleware);

router.route('/')
  .get(asyncHandler(getEvents))
  .post(asyncHandler(createEvent));

router.route('/:id')
  .get(asyncHandler(getEventById))
  .put(asyncHandler(updateEvent))
  .delete(asyncHandler(deleteEvent));

router.route('/takeoff/:takeoffId')
  .get(asyncHandler(getEventsByTakeoff));

async function createEvent(req, res) {
  const response = await scheduleCtrl.createEvent(
    req.user,
    req.body,
    req.companyFilter
  );
  res.json(response);
}

async function getEvents(req, res) {
  const response = await scheduleCtrl.getEvents(
    req.user,
    req.query,
    req.companyFilter
  );
  res.json(response);
}

async function getEventById(req, res) {
  const response = await scheduleCtrl.getEventById(
    req.user,
    req.params.id,
    req.companyFilter
  );
  res.json(response);
}

async function getEventsByTakeoff(req, res) {
  const response = await scheduleCtrl.getEventsByTakeoff(
    req.user,
    req.params.takeoffId,
    req.companyFilter
  );
  res.json(response);
}

async function updateEvent(req, res) {
  const response = await scheduleCtrl.updateEvent(
    req.user,
    req.params.id,
    req.body,
    req.companyFilter
  );
  res.json(response);
}

async function deleteEvent(req, res) {
  const response = await scheduleCtrl.deleteEvent(
    req.user,
    req.params.id,
    req.companyFilter
  );
  res.json(response);
}
