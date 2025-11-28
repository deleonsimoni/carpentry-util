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
router.route("/pdf/:id").get(asyncHandler(generatePDF));

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

async function generatePDF(req, res) {

  const result = await materialRequestCtrl.generatePDF(
    req.user,
    req.params.id
  );

  if (!result) {
    return res.status(404).json({ error: "Material Request not found" });
  }

  const { pdfDoc, customerName } = result;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=material-request-${customerName}.pdf`
  );

  pdfDoc.pipe(res);
  pdfDoc.end();
}

