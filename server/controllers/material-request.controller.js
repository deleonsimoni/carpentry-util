const User = require('../models/user.model');
const MaterialRequest = require('../models/material-request.model');
const fs = require('fs');
const UserRoles = require('../constants/user-roles');

module.exports = {
  createMaterialRequest,
  detailMaterialRequest,
  getMaterialRequest,
  update
};

async function createMaterialRequest(idUser, body, companyFilter = {}) {

  if (UserRoles.isCarpenter(idUser.roles)) {
    body.carpentry = idUser._id;
  } else {
    body.user = idUser._id;
  }
  body.status = 1;
  body.company = idUser.company;

  return await new MaterialRequest(body).save();
}

async function getMaterialRequest(user, companyFilter = {}) {
  let baseQuery;


  // For other users (manager, carpenter), use existing logic
  baseQuery = {
    $or: [{ user: user._id }, { carpentry: user._id },],
    ...companyFilter
  };


  return await MaterialRequest.find(baseQuery)
    .populate('carpentry', 'fullname email')
    .populate({
      path: 'user',
      select: 'fullname email company',
      populate: {
        path: 'company',
        select: 'name ' // escolha os campos da company que quiser
      }
    })
    .select('customerName carpentry user status requestType')
    .sort({
      createdAt: -1,
    });
}

async function detailMaterialRequest(idUser, id, companyFilter = {}, idCompany, roles) {

  let baseQuery;


    baseQuery = {
      $and: [{ _id: id }],
      $or: [{ user: idUser }, { carpentry: idUser }],
      ...companyFilter
    };
  
  return await MaterialRequest.find(baseQuery)
    .populate('carpentry', 'fullname email');
}

async function update(user, body, id, companyFilter = {}) {

  const baseQuery = {
    $and: [{ _id: id }],
    $or: [{ user: user._id }, { carpentry: user._id }],
    ...companyFilter
  };

  return await MaterialRequest.findOneAndUpdate(baseQuery, body);
}
