const User = require('../models/user.model');
const MaterialRequest = require('../models/material-request.model');
const fs = require('fs');
const UserRoles = require('../constants/user-roles');
const sendgridCtrl = require('./sendgrid.controller');
const materialRequestEmailTemplate = require('../templates/materialRequestEmailTemplate');
const materialRequestPdfTemplatePDF = require("../templates/materialRequestEmailTemplatePDF");
const { formatDateToDDMMYYYY } = require("../utils/utils");

module.exports = {
  createMaterialRequest,
  detailMaterialRequest,
  getMaterialRequest,
  update,
  generatePDF
};

async function createMaterialRequest(user, body, companyFilter = {}) {

  if (UserRoles.isCarpenter(user.roles)) {
    body.carpentry = user._id;
  } else {
    body.user = user._id;
  }
  body.status = 1;
  body.company = user.company;

  await new MaterialRequest(body).save();

  sendMaterialRequestEmail(user, body);

  return true;
}

async function sendMaterialRequestEmail(user, materialRequest) {

  const supervisorEmails = await User.find({
    company: user.company,
    roles: { $in: ['supervisor'] }
  }).distinct('email');

  const htmlTemplate = materialRequestEmailTemplate({
    user: user.fullname,
    date: new Date().toLocaleDateString("en-US"),
    customerName: materialRequest.customerName,
    requestType: materialRequest.requestType,
    deliveryOrPickupDate: materialRequest.deliveryOrPickupDate,
    deliveryAddressStreet: materialRequest.deliveryAddressStreet,
    deliveryAddressCity: materialRequest.deliveryAddressCity,
    deliveryAddressProvince: materialRequest.deliveryAddressProvince,
    deliveryAddressPostalCode: materialRequest.deliveryAddressPostalCode,
    deliveryInstruction: materialRequest.deliveryInstruction,
    material: materialRequest.material
  });

  const subject = `New Material Request - ${materialRequest.customerName}`;

  await sendgridCtrl.enviarEmail(supervisorEmails, subject, htmlTemplate);

}

async function getMaterialRequest(user, companyFilter = {}) {
  let baseQuery;


  if (UserRoles.isSupervisor(user.roles)) {

    baseQuery = {
      $or: [{ company: user.company }],
      ...companyFilter // Only company filter for delivery users
    };

  } else {

    baseQuery = {
      $or: [{ user: user._id }, { carpentry: user._id },],
      ...companyFilter
    };

  }


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
    .select('customerName carpentry user status requestType deliveryOrPickupDate')
    .sort({
      createdAt: -1,
    });
}

async function detailMaterialRequest(idUser, id, companyFilter = {}, idCompany, roles) {

  let baseQuery;

  if (UserRoles.isSupervisor(roles)) {
    baseQuery = {
      $and: [{ _id: id, company: idCompany }],
      ...companyFilter // Only company filter for delivery users
    };
  } else {

    baseQuery = {
      $and: [{ _id: id }],
      $or: [{ user: idUser }, { carpentry: idUser }],
      ...companyFilter
    };
  }

  return await MaterialRequest.find(baseQuery)
    .populate('carpentry', 'fullname email');
}

async function update(user, body, id, companyFilter = {}) {

  let baseQuery;

  if (UserRoles.isSupervisor(user.roles)) {
    baseQuery = {
      $and: [{ _id: id }],
      $or: [{ company: user.company }],
      ...companyFilter // Only company filter for delivery users
    };
  } else {
    baseQuery = {
      $and: [{ _id: id }],
      $or: [{ user: user._id }, { carpentry: user._id }],
      ...companyFilter
    };

  }


  return await MaterialRequest.findOneAndUpdate(baseQuery, body);
}

async function generatePDF(user, idMR) {
  try {
    const mr = await MaterialRequest.findById(idMR)
      .populate('carpentry', 'fullname email')
      .populate({
        path: 'user',
        select: 'fullname email company',
        populate: {
          path: 'company',
          select: 'name '
        }
      });

    if (!mr) return null;

    const pdfDoc = materialRequestPdfTemplatePDF({
      user: mr.carpentry?.fullname ? mr.carpentry?.fullname : mr.user?.fullname,
      date: new Date(mr.deliveryOrPickupDate).toLocaleDateString("pt-BR"),
      customerName: mr.customerName,
      requestType: mr.requestType,
      deliveryOrPickupDate: formatDateToDDMMYYYY(mr.deliveryOrPickupDate),
      deliveryAddressStreet: mr.deliveryAddressStreet,
      deliveryAddressCity: mr.deliveryAddressCity,
      deliveryAddressProvince: mr.deliveryAddressProvince,
      deliveryAddressPostalCode: mr.deliveryAddressPostalCode,
      deliveryInstruction: mr.deliveryInstruction,
      material: mr.material
    });

    return {
      pdfDoc,
      customerName: mr.customerName
    };

  } catch (err) {
    console.error(err);
    return null;
  }
}

