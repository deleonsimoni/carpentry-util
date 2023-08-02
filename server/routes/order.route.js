const express = require('express');
const passport = require('passport');
const asyncHandler = require('express-async-handler');
const orderCtrl = require('../controllers/order.controller');

const router = express.Router();
module.exports = router;

router.use(passport.authenticate('jwt', { session: false }));

router.route('/').get(asyncHandler(getOrders));
router.route('/:idOrder').get(asyncHandler(detailOrder));
router.route('/:idOrder/generatePDF').get(asyncHandler(generatePDF));
router.route('/:idOrder/update').post(asyncHandler(updateOrder));
router.route('/:idOrder/finalize').post(asyncHandler(finalizeOrder));

router.route('/').post(asyncHandler(createOrder));

async function createOrder(req, res) {
  let response = await orderCtrl.insert(req.user, req.body);
  res.json(response);
}

async function updateOrder(req, res) {
  let response = await orderCtrl.updateOrder(req.user, req.body, req.params.idOrder);
  res.json(response);
}

async function finalizeOrder(req, res) {
  let response = await orderCtrl.finalizeOrder(req.user, req.body, req.params.idOrder);
  res.json(response);
}

async function generatePDF(req, res) {
  let response = await orderCtrl.generatePDF(req.user, req.params.idOrder);
  res.json(response);
}

async function detailOrder(req, res) {
  let response = await orderCtrl.detailOrder(req.user._id, req.params.idOrder);
  res.json(response);
}

async function getOrders(req, res) {
  let response = await orderCtrl.getOrders(req.user._id);
  res.json(response);
}

