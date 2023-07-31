
const User = require('../models/user.model');
const Order = require('../models/order.model');

module.exports = {
  insert,
  detailOrder,
  getOrders
};

async function insert(idUser, body) {
  body.user = idUser;
  return await new Order(body).save();
}

async function getOrders(idUSer) {
  return await Order.find({ $or: [{ user: idUSer }, { carpentry: idUSer }] })
    .populate("carpentry", 'fullname email')
    .populate("user", 'fullname email')
    .select('custumerName carpentry user')
    .sort({
      createAt: -1
    });
}

async function detailOrder(idUser, idOrder) {
  return await Order.find(
    {
      $and: [{ _id: idOrder }],
      $or: [{ 'user': idUser }, { 'carpentry': idUser }]
    }
  )

}