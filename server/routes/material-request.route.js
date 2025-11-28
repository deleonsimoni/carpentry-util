const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const materialRequestCtrl = require('../controllers/material-request.controller');
const companyHeaderMiddleware = require('../middleware/company-header.middleware');



const router = express.Router();
module.exports = router;

router.use(passport.authenticate('jwt', { session: false }));
router.use(companyHeaderMiddleware);

router.route('/').get(asyncHandler(getMaterialRequest));
router.route('/:id').get(asyncHandler(detailMaterialRequest));

router.route('/').post(asyncHandler(createMaterialRequest));

router.route('/:id/update').post(asyncHandler(update));


async function createMaterialRequest(req, res) {
  let response = await materialRequestCtrl.createMaterialRequest(req.user, req.body, req.companyFilter);
  res.json(response);
}

async function detailMaterialRequest(req, res) {
  let response = await materialRequestCtrl.detailMaterialRequest(
    req.user._id,
    req.params.id,
    req.companyFilter,
    req.user.company,
    req.user.roles,

  );
  res.json(response);
}

async function getMaterialRequest(req, res) {
  let response = await materialRequestCtrl.getMaterialRequest(req.user, req.companyFilter);
  res.json(response);
}

async function update(req, res) {
  let response = await materialRequestCtrl.update(
    req.user,
    req.body,
    req.params.id,
    req.companyFilter
  );
  res.json(response);
}
