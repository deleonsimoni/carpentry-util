const User = require('../models/user.model');
const Takeoff = require('../models/takeoff.model');
const { PDFDocument, setFontAndSize, rgb } = require('pdf-lib');
const fs = require('fs');
const UserRoles = require('../constants/user-roles');

module.exports = {
  insert,
  detailTakeoff,
  updateTakeoff,
  finalizeTakeoff,
  getTakeoffs,
  backTakeoffToCarpentry,
  findCarpentryByEmail,
  generatePDF,
  updateTakeoffStatus,
  uploadDeliveryPhoto,
  updateTrimCarpenter,
  removeTrimCarpenter,
  getTakeoffsForInvoice,
};

async function insert(idUser, body, companyFilter = {}) {
  body.user = idUser;
  body.status = 1;

  // Set company from the filter if provided
  if (companyFilter.company) {
    body.company = companyFilter.company;
  }

  return await new Takeoff(body).save();
}

async function getTakeoffs(user, companyFilter = {}) {
  let baseQuery;

  // If user is delivery, show all takeoffs from their company
  if (UserRoles.isDelivery(user.roles)) {
    baseQuery = {
      ...companyFilter // Only company filter for delivery users
    };
  } else {
    // For other users (manager, carpenter), use existing logic
    baseQuery = {
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
      ...companyFilter
    };
  }

  return await Takeoff.find(baseQuery)
    .populate('carpentry', 'fullname email')
    .populate('trimCarpentry', 'fullname email')
    .populate('user', 'fullname email')
    .select('custumerName carpentry trimCarpentry user status shipTo lot')
    .sort({
      createdAt: -1,
    });
}

async function detailTakeoff(idUser, idTakeoff, companyFilter = {}) {
  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: idUser }, { carpentry: idUser }, { trimCarpentry: idUser }],
    ...companyFilter
  };

  return await Takeoff.find(baseQuery)
    .populate('carpentry', 'fullname email')
    .populate('trimCarpentry', 'fullname email');
}

async function updateTakeoff(user, body, idTakeoff, companyFilter = {}) {
  body.status = 2;

  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    ...companyFilter
  };

  return await Takeoff.findOneAndUpdate(baseQuery, body);
}

async function finalizeTakeoff(user, body, idTakeoff, companyFilter = {}) {
  if (UserRoles.isManager(user.roles)) {
    delete body.status;
  } else {
    body.status = 3;
  }

  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    ...companyFilter
  };

  return await Takeoff.findOneAndUpdate(baseQuery, body);
}

async function findCarpentryByEmail(user, email, companyFilter = {}) {
  const filters = {
    email: email.toLowerCase(),
    roles: UserRoles.CARPENTER,
    ...companyFilter
  };

  return await User.findOne(filters);
}

async function backTakeoffToCarpentry(user, body, idTakeoff, companyFilter = {}) {
  body.status = 2;

  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    ...companyFilter
  };

  return await Takeoff.findOneAndUpdate(baseQuery, body);
}

async function generatePDF(user, idTakeoff, companyFilter = {}) {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    ...companyFilter
  };

  let takeoff = await Takeoff.findOne(baseQuery);

  const filePath = 'template.pdf';

  // Ler o arquivo PDF existente
  const pdfBytes = await fs.promises.readFile(filePath);

  // Carregar o documento PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  fields.forEach(field => {
    switch (field.getName()) {
      case 'date':
        field.setText(dd + '/' + mm + '/' + yyyy);
        break;
      case 'contractor':
        field.setText(user.fullname || '');
        break;
      case 'custumerName':
        field.setText(takeoff.custumerName || '');
        break;
      case 'foremen':
        field.setText(takeoff.foremen || '');
        break;
      case 'extrasChecked':
        field.setText(takeoff.extrasChecked || '');
        break;
      case 'carpInvoice':
        field.setText(takeoff.carpInvoice || '');
        break;
      case 'shipTo':
        field.setText(takeoff.shipTo || '');
        break;
      case 'lot':
        field.setText(takeoff.lot || '');
        break;
      case 'type':
        field.setText(takeoff.type || '');
        break;
      case 'elev':
        field.setText(takeoff.elev || '');
        break;
      case 'sqFootage':
        field.setText(takeoff.sqFootage || '');
        break;
      case 'streetName':
        field.setText(takeoff.streetName || '');
        break;
      case 'comment':
        field.setText(takeoff.comment || '');
        break;
      case 'preHugs':
        field.setText(takeoff.preHugs || '');
        break;

      //cantinaDoors
      case 'cantina1':
        field.setText(takeoff.cantinaDoors[0].name);
        break;
      case 'cantina2':
        field.setText(takeoff.cantinaDoors[1].name);
        break;
      case 'cantinaSwing1':
        field.setText(takeoff.cantinaDoors[0].swing);
        break;
      case 'cantinaSwing2':
        field.setText(takeoff.cantinaDoors[1].swing);
        break;
      case 'cantinaQty1':
        field.setText(takeoff.cantinaDoors[0].qty);
        break;
      case 'cantinaQty2':
        field.setText(takeoff.cantinaDoors[1].qty);
        break;

      //frenchDoors
      case 'frenchSize1':
        field.setText(
          takeoff.frenchDoors[0].size + ' ' + takeoff.frenchDoors[0].swing
        );
        break;
      case 'frenchHeight1':
        field.setText(takeoff.frenchDoors[0].height);
        break;
      case 'frenchQty1':
        field.setText(takeoff.frenchDoors[0].qty);
        break;
      case 'frenchJamb1':
        field.setText(takeoff.frenchDoors[0].jamb);
        break;
      case 'frenchSize2':
        field.setText(
          takeoff.frenchDoors[1].size + ' ' + takeoff.frenchDoors[1].swing
        );
        break;
      case 'frenchHeight2':
        field.setText(takeoff.frenchDoors[1].height);
        break;
      case 'frenchQty2':
        field.setText(takeoff.frenchDoors[1].qty);
        break;
      case 'frenchJamb2':
        field.setText(takeoff.frenchDoors[1].jamb);
        break;

      //DoubleDoors
      case 'doubleSize1':
        field.setText(takeoff.doubleDoors[0].size);
        break;
      case 'doubleHeight1':
        field.setText(takeoff.doubleDoors[0].height);
        break;
      case 'doubleQty1':
        field.setText(takeoff.doubleDoors[0].qty);
        break;
      case 'doubleJamb1':
        field.setText(takeoff.doubleDoors[0].jamb);
        break;
      case 'doubleSize2':
        field.setText(takeoff.doubleDoors[1].size);
        break;
      case 'doubleHeight2':
        field.setText(takeoff.doubleDoors[1].height);
        break;
      case 'doubleQty2':
        field.setText(takeoff.doubleDoors[1].qty);
        break;
      case 'doubleJamb2':
        field.setText(takeoff.doubleDoors[1].jamb);
        break;
      case 'doubleSize3':
        field.setText(takeoff.doubleDoors[2].size);
        break;
      case 'doubleHeight3':
        field.setText(takeoff.doubleDoors[2].height);
        break;
      case 'doubleQty3':
        field.setText(takeoff.doubleDoors[2].qty);
        break;
      case 'doubleJamb3':
        field.setText(takeoff.doubleDoors[2].jamb);
        break;
      case 'doubleSize4':
        field.setText(takeoff.doubleDoors[3].size);
        break;
      case 'doubleHeight4':
        field.setText(takeoff.doubleDoors[3].height);
        break;
      case 'doubleQty4':
        field.setText(takeoff.doubleDoors[3].qty);
        break;
      case 'doubleJamb4':
        field.setText(takeoff.doubleDoors[3].jamb);
        break;
      case 'doubleSize5':
        field.setText(takeoff.doubleDoors[4].size);
        break;
      case 'doubleHeight5':
        field.setText(takeoff.doubleDoors[4].height);
        break;
      case 'doubleQty5':
        field.setText(takeoff.doubleDoors[4].qty);
        break;
      case 'doubleJamb5':
        field.setText(takeoff.doubleDoors[4].jamb);
        break;

      //SingleDoors
      case 'singleSize1':
        field.setText(takeoff.singleDoors[0].size);
        break;
      case 'singleLeft1':
        field.setText(takeoff.singleDoors[0].left);
        break;
      case 'singleRight1':
        field.setText(takeoff.singleDoors[0].right);
        break;
      case 'singleJamb1':
        field.setText(takeoff.singleDoors[0].jamb);
        break;

      case 'singleSize2':
        field.setText(takeoff.singleDoors[1].size);
        break;
      case 'singleLeft2':
        field.setText(takeoff.singleDoors[1].left);
        break;
      case 'singleRight2':
        field.setText(takeoff.singleDoors[1].right);
        break;
      case 'singleJamb2':
        field.setText(takeoff.singleDoors[1].jamb);
        break;

      case 'singleSize3':
        field.setText(takeoff.singleDoors[2].size);
        break;
      case 'singleLeft3':
        field.setText(takeoff.singleDoors[2].left);
        break;
      case 'singleRight3':
        field.setText(takeoff.singleDoors[2].right);
        break;
      case 'singleJamb3':
        field.setText(takeoff.singleDoors[2].jamb);
        break;

      case 'singleSize4':
        field.setText(takeoff.singleDoors[3].size);
        break;
      case 'singleLeft4':
        field.setText(takeoff.singleDoors[3].left);
        break;
      case 'singleRight4':
        field.setText(takeoff.singleDoors[3].right);
        break;
      case 'singleJamb4':
        field.setText(takeoff.singleDoors[3].jamb);
        break;

      case 'singleSize5':
        field.setText(takeoff.singleDoors[4].size);
        break;
      case 'singleLeft5':
        field.setText(takeoff.singleDoors[4].left);
        break;
      case 'singleRight5':
        field.setText(takeoff.singleDoors[4].right);
        break;
      case 'singleJamb5':
        field.setText(takeoff.singleDoors[4].jamb);
        break;

      case 'singleSize6':
        field.setText(takeoff.singleDoors[5].size);
        break;
      case 'singleLeft6':
        field.setText(takeoff.singleDoors[5].left);
        break;
      case 'singleRight6':
        field.setText(takeoff.singleDoors[5].right);
        break;
      case 'singleJamb6':
        field.setText(takeoff.singleDoors[5].jamb);
        break;

      case 'singleSize7':
        field.setText(takeoff.singleDoors[6].size);
        break;
      case 'singleLeft7':
        field.setText(takeoff.singleDoors[6].left);
        break;
      case 'singleRight7':
        field.setText(takeoff.singleDoors[6].right);
        break;
      case 'singleJamb7':
        field.setText(takeoff.singleDoors[6].jamb);
        break;

      case 'singleSize8':
        field.setText(takeoff.singleDoors[7].size);
        break;
      case 'singleLeft8':
        field.setText(takeoff.singleDoors[7].left);
        break;
      case 'singleRight8':
        field.setText(takeoff.singleDoors[7].right);
        break;
      case 'singleJamb8':
        field.setText(takeoff.singleDoors[7].jamb);
        break;

      case 'singleSize9':
        field.setText(takeoff.singleDoors[8].size);
        break;
      case 'singleLeft9':
        field.setText(takeoff.singleDoors[8].left);
        break;
      case 'singleRight9':
        field.setText(takeoff.singleDoors[8].right);
        break;
      case 'singleJamb9':
        field.setText(takeoff.singleDoors[8].jamb);
        break;

      case 'singleSize10':
        field.setText(takeoff.singleDoors[9].size);
        break;
      case 'singleLeft10':
        field.setText(takeoff.singleDoors[9].left);
        break;
      case 'singleRight10':
        field.setText(takeoff.singleDoors[9].right);
        break;
      case 'singleJamb10':
        field.setText(takeoff.singleDoors[9].jamb);
        break;

      case 'singleSize11':
        field.setText(takeoff.singleDoors[10].size);
        break;
      case 'singleLeft11':
        field.setText(takeoff.singleDoors[10].left);
        break;
      case 'singleRight11':
        field.setText(takeoff.singleDoors[10].right);
        break;
      case 'singleJamb11':
        field.setText(takeoff.singleDoors[10].jamb);
        break;

      case 'singleSize12':
        field.setText(takeoff.singleDoors[11].size);
        break;
      case 'singleLeft12':
        field.setText(takeoff.singleDoors[11].left);
        break;
      case 'singleRight12':
        field.setText(takeoff.singleDoors[11].right);
        break;
      case 'singleJamb12':
        field.setText(takeoff.singleDoors[11].jamb);
        break;

      case 'singleSize13':
        field.setText(takeoff.singleDoors[12].size);
        break;
      case 'singleLeft13':
        field.setText(takeoff.singleDoors[12].left);
        break;
      case 'singleRight13':
        field.setText(takeoff.singleDoors[12].right);
        break;
      case 'singleJamb13':
        field.setText(takeoff.singleDoors[12].jamb);
        break;

      case 'singleSize14':
        field.setText(takeoff.singleDoors[13].size);
        break;
      case 'singleLeft14':
        field.setText(takeoff.singleDoors[13].left);
        break;
      case 'singleRight14':
        field.setText(takeoff.singleDoors[13].right);
        break;
      case 'singleJamb14':
        field.setText(takeoff.singleDoors[13].jamb);
        break;

      //Arches

      case 'archesCol1':
        field.setText(takeoff.arches[0].col1);
        break;
      case 'archesCol2':
        field.setText(takeoff.arches[0].col2);
        break;
      case 'archesCol3':
        field.setText(takeoff.arches[0].col3);
        break;
      case 'archesCol4':
        field.setText(takeoff.arches[0].col4);
        break;
      case 'archesCol5':
        field.setText(takeoff.arches[0].col5);
        break;

      case 'archesCol12':
        field.setText(takeoff.arches[1].col1);
        break;
      case 'archesCol22':
        field.setText(takeoff.arches[1].col2);
        break;
      case 'archesCol32':
        field.setText(takeoff.arches[1].col3);
        break;
      case 'archesCol42':
        field.setText(takeoff.arches[1].col4);
        break;
      case 'archesCol52':
        field.setText(takeoff.arches[1].col5);
        break;

      case 'archesSize3':
        field.setText(takeoff.arches[2].size);
        break;
      case 'archesCol13':
        field.setText(takeoff.arches[2].col1);
        break;
      case 'archesCol23':
        field.setText(takeoff.arches[2].col2);
        break;
      case 'archesCol33':
        field.setText(takeoff.arches[2].col3);
        break;
      case 'archesCol43':
        field.setText(takeoff.arches[2].col4);
        break;
      case 'archesCol53':
        field.setText(takeoff.arches[2].col5);
        break;

      case 'archesSize4':
        field.setText(takeoff.arches[3].size);
        break;
      case 'archesCol14':
        field.setText(takeoff.arches[3].col1);
        break;
      case 'archesCol24':
        field.setText(takeoff.arches[3].col2);
        break;
      case 'archesCol34':
        field.setText(takeoff.arches[3].col3);
        break;
      case 'archesCol44':
        field.setText(takeoff.arches[3].col4);
        break;
      case 'archesCol54':
        field.setText(takeoff.arches[3].col5);
        break;

      case 'archesCol15':
        field.setText(takeoff.arches[4].col1);
        break;
      case 'archesCol25':
        field.setText(takeoff.arches[4].col2);
        break;
      case 'archesCol35':
        field.setText(takeoff.arches[4].col3);
        break;
      case 'archesCol45':
        field.setText(takeoff.arches[4].col4);
        break;
      case 'archesCol55':
        field.setText(takeoff.arches[4].col5);
        break;

      //trim

      case 'trimDetails1':
        field.setText(takeoff.trim[0].details);
        break;
      case 'trimQty1':
        field.setText(takeoff.trim[0].qty);
        break;

      case 'trimDetails2':
        field.setText(takeoff.trim[1].details);
        break;
      case 'trimQty2':
        field.setText(takeoff.trim[1].qty);
        break;

      case 'trimItem3':
        field.setText(takeoff.trim[2].item);
        break;
      case 'trimDetails3':
        field.setText(takeoff.trim[2].details);
        break;
      case 'trimQty3':
        field.setText(takeoff.trim[2].qty);
        break;

      case 'trimDetails4':
        field.setText(takeoff.trim[3].details);
        break;
      case 'trimQty4':
        field.setText(takeoff.trim[3].qty);
        break;

      case 'trimDetails5':
        field.setText(takeoff.trim[4].details);
        break;
      case 'trimQty5':
        field.setText(takeoff.trim[4].qty);
        break;

      case 'trimItem6':
        field.setText(takeoff.trim[5].item);
        break;
      case 'trimDetails6':
        field.setText(takeoff.trim[5].details);
        break;
      case 'trimQty6':
        field.setText(takeoff.trim[5].qty);
        break;

      case 'trimDetails7':
        field.setText(takeoff.trim[6].details);
        break;
      case 'trimQty7':
        field.setText(takeoff.trim[6].qty);
        break;

      case 'trimDetails8':
        field.setText(takeoff.trim[7].details);
        break;
      case 'trimQty8':
        field.setText(takeoff.trim[7].qty);
        break;

      case 'trimDetails9':
        field.setText(takeoff.trim[8].details);
        break;
      case 'trimQty9':
        field.setText(takeoff.trim[8].qty);
        break;

      case 'trimDetails10':
        field.setText(takeoff.trim[9].details);
        break;
      case 'trimQty10':
        field.setText(takeoff.trim[9].qty);
        break;

      case 'trimItem11':
        field.setText(takeoff.trim[10].item);
        break;
      case 'trimDetails11':
        field.setText(takeoff.trim[10].details);
        break;
      case 'trimQty11':
        field.setText(takeoff.trim[10].qty);
        break;

      case 'trimDetails12':
        field.setText(takeoff.trim[11].details);
        break;
      case 'trimQty12':
        field.setText(takeoff.trim[11].qty);
        break;

      case 'trimDetails13':
        field.setText(takeoff.trim[12].details);
        break;
      case 'trimQty13':
        field.setText(takeoff.trim[12].qty);
        break;

      case 'trimDetails14':
        field.setText(takeoff.trim[13].details);
        break;
      case 'trimQty14':
        field.setText(takeoff.trim[13].qty);
        break;

      case 'trimDetails15':
        field.setText(takeoff.trim[14].details);
        break;
      case 'trimQty15':
        field.setText(takeoff.trim[14].qty);
        break;

      case 'trimItem16':
        field.setText(takeoff.trim[15].item);
        break;
      case 'trimDetails16':
        field.setText(takeoff.trim[15].details);
        break;
      case 'trimQty16':
        field.setText(takeoff.trim[15].qty);
        break;

      case 'trimDetails17':
        field.setText(takeoff.trim[16].details);
        break;
      case 'trimQty17':
        field.setText(takeoff.trim[16].qty);
        break;

      case 'trimDetails18':
        field.setText(takeoff.trim[17].details);
        break;
      case 'trimQty18':
        field.setText(takeoff.trim[17].qty);
        break;

      case 'trimItem19':
        field.setText(takeoff.trim[18].item);
        break;
      case 'trimDetails19':
        field.setText(takeoff.trim[18].details);
        break;
      case 'trimQty19':
        field.setText(takeoff.trim[18].qty);
        break;

      case 'trimDetails20':
        field.setText(takeoff.trim[19].details);
        break;
      case 'trimQty20':
        field.setText(takeoff.trim[19].qty);
        break;

      case 'trimDetails21':
        field.setText(takeoff.trim[20].details);
        break;
      case 'trimQty21':
        field.setText(takeoff.trim[20].qty);
        break;

      case 'trimItem22':
        field.setText(takeoff.trim[21].item);
        break;
      case 'trimDetails22':
        field.setText(takeoff.trim[21].details);
        break;
      case 'trimQty22':
        field.setText(takeoff.trim[21].qty);
        break;

      case 'trimDetails23':
        field.setText(takeoff.trim[22].details);
        break;
      case 'trimQty23':
        field.setText(takeoff.trim[22].qty);
        break;

      case 'trimDetails24':
        field.setText(takeoff.trim[23].details);
        break;
      case 'trimQty24':
        field.setText(takeoff.trim[23].qty);
        break;

      case 'trimDetails25':
        field.setText(takeoff.trim[24].details);
        break;
      case 'trimQty25':
        field.setText(takeoff.trim[24].qty);
        break;

      case 'trimItem26':
        field.setText(takeoff.trim[25].item);
        break;
      case 'trimDetails26':
        field.setText(takeoff.trim[25].details);
        break;
      case 'trimQty26':
        field.setText(takeoff.trim[25].qty);
        break;

      case 'trimDetails27':
        field.setText(takeoff.trim[26].details);
        break;
      case 'trimQty27':
        field.setText(takeoff.trim[26].qty);
        break;

      case 'trimDetails28':
        field.setText(takeoff.trim[27].details);
        break;
      case 'trimQty28':
        field.setText(takeoff.trim[27].qty);
        break;

      case 'trimDetails29':
        field.setText(takeoff.trim[28].details);
        break;
      case 'trimQty29':
        field.setText(takeoff.trim[28].qty);
        break;

      //labour
      case 'labourQty1':
        field.setText(takeoff.labour[0].qty);
        break;

      case 'labourQty2':
        field.setText(takeoff.labour[1].qty);
        break;

      case 'labourQty3':
        field.setText(takeoff.labour[2].qty);
        break;

      case 'labourQty4':
        field.setText(takeoff.labour[3].qty);
        break;

      case 'labourQty5':
        field.setText(takeoff.labour[4].qty);
        break;

      case 'labourQty6':
        field.setText(takeoff.labour[5].qty);
        break;

      case 'labourQty7':
        field.setText(takeoff.labour[6].qty);
        break;

      case 'labourQty8':
        field.setText(takeoff.labour[7].qty);
        break;

      case 'labourQty9':
        field.setText(takeoff.labour[8].qty);
        break;

      case 'labourQty10':
        field.setText(takeoff.labour[9].qty);
        break;

      case 'labourQty11':
        field.setText(takeoff.labour[10].qty);
        break;

      case 'labourQty12':
        field.setText(takeoff.labour[11].qty);
        break;

      case 'labourQty13':
        field.setText(takeoff.labour[12].qty);
        break;

      case 'labourQty14':
        field.setText(takeoff.labour[13].qty);
        break;

      case 'labourQty15':
        field.setText(takeoff.labour[14].qty);
        break;

      case 'labourQty16':
        field.setText(takeoff.labour[15].qty);
        break;

      case 'labourQty17':
        field.setText(takeoff.labour[16].qty);
        break;

      case 'labourQty18':
        field.setText(takeoff.labour[17].qty);
        break;

      case 'labourQty19':
        field.setText(takeoff.labour[18].qty);
        break;

      case 'labourQty20':
        field.setText(takeoff.labour[19].qty);
        break;

      case 'labourQty21':
        field.setText(takeoff.labour[20].qty);
        break;

      case 'labourQty22':
        field.setText(takeoff.labour[21].qty);
        break;

      case 'labourQty23':
        field.setText(takeoff.labour[22].qty);
        break;

      case 'labourQty24':
        field.setText(takeoff.labour[23].qty);
        break;

      case 'labourQty25':
        field.setText(takeoff.labour[24].qty);
        break;

      case 'labourQty26':
        field.setText(takeoff.labour[25].qty);
        break;

      case 'labourQty27':
        field.setText(takeoff.labour[26].qty);
        break;

      case 'labourItem28':
        field.setText(takeoff.labour[27].item);
        break;
      case 'labourQty28':
        field.setText(takeoff.labour[27].qty);
        break;

      case 'labourItem29':
        field.setText(takeoff.labour[28].item);
        break;
      case 'labourQty29':
        field.setText(takeoff.labour[28].qty);
        break;

      //hardware
      case 'hardwareType1':
        field.setText(takeoff.hardware[0].type);
        break;
      case 'hardwareQty1':
        field.setText(takeoff.hardware[0].qty);
        break;

      case 'hardwareType2':
        field.setText(takeoff.hardware[1].type);
        break;
      case 'hardwareQty2':
        field.setText(takeoff.hardware[1].qty);
        break;

      case 'hardwareType3':
        field.setText(takeoff.hardware[2].type);
        break;
      case 'hardwareQty3':
        field.setText(takeoff.hardware[2].qty);
        break;

      case 'hardwareType4':
        field.setText(takeoff.hardware[3].type);
        break;
      case 'hardwareQty4':
        field.setText(takeoff.hardware[3].qty);
        break;

      case 'hardwareType5':
        field.setText(takeoff.hardware[4].type);
        break;
      case 'hardwareQty5':
        field.setText(takeoff.hardware[4].qty);
        break;

      case 'hardwareType6':
        field.setText(takeoff.hardware[5].type);
        break;
      case 'hardwareQty6':
        field.setText(takeoff.hardware[5].qty);
        break;

      case 'hardwareType7':
        field.setText(takeoff.hardware[6].type);
        break;
      case 'hardwareQty7':
        field.setText(takeoff.hardware[6].qty);
        break;

      case 'hardwareType8':
        field.setText(takeoff.hardware[7].type);
        break;
      case 'hardwareQty8':
        field.setText(takeoff.hardware[7].qty);
        break;

      case 'hardwareType9':
        field.setText(takeoff.hardware[8].type);
        break;
      case 'hardwareQty9':
        field.setText(takeoff.hardware[8].qty);
        break;

      case 'hardwareType10':
        field.setText(takeoff.hardware[9].type);
        break;
      case 'hardwareQty10':
        field.setText(takeoff.hardware[9].qty);
        break;

      case 'hardwareType11':
        field.setText(takeoff.hardware[10].type);
        break;
      case 'hardwareQty11':
        field.setText(takeoff.hardware[10].qty);
        break;

      case 'hardwareType12':
        field.setText(takeoff.hardware[11].type);
        break;
      case 'hardwareQty12':
        field.setText(takeoff.hardware[11].qty);
        break;

      case 'hardwareType13':
        field.setText(takeoff.hardware[12].type);
        break;
      case 'hardwareQty13':
        field.setText(takeoff.hardware[12].qty);
        break;

      case 'hardwareType14':
        field.setText(takeoff.hardware[13].type);
        break;
      case 'hardwareQty14':
        field.setText(takeoff.hardware[13].qty);
        break;

      case 'hardwareType15':
        field.setText(takeoff.hardware[14].type);
        break;
      case 'hardwareQty15':
        field.setText(takeoff.hardware[14].qty);
        break;

      //shelves
      case 'shelvesType41':
        field.setText(takeoff.shelves[0].type4);
        break;
      case 'shelvesType61':
        field.setText(takeoff.shelves[0].type6);
        break;
      case 'shelvesType81':
        field.setText(takeoff.shelves[0].type8);
        break;
      case 'shelvesType101':
        field.setText(takeoff.shelves[0].type10);
        break;
      case 'shelvesType121':
        field.setText(takeoff.shelves[0].type12);
        break;
      case 'shelvesQty1':
        field.setText(takeoff.shelves[0].qty);
        break;

      case 'shelvesType42':
        field.setText(takeoff.shelves[1].type4);
        break;
      case 'shelvesType62':
        field.setText(takeoff.shelves[1].type6);
        break;
      case 'shelvesType82':
        field.setText(takeoff.shelves[1].type8);
        break;
      case 'shelvesType102':
        field.setText(takeoff.shelves[1].type10);
        break;
      case 'shelvesType122':
        field.setText(takeoff.shelves[1].type12);
        break;
      case 'shelvesQty2':
        field.setText(takeoff.shelves[1].qty);
        break;

      //closetRods
      case 'closetRodsType11':
        field.setText(takeoff.closetRods[0].type4);
        break;
      case 'closetRodsType21':
        field.setText(takeoff.closetRods[0].type2);
        break;
      case 'closetRodsType31':
        field.setText(takeoff.closetRods[0].type3);
        break;
      case 'closetRodsType41':
        field.setText(takeoff.closetRods[0].type4);
        break;

      //rodSupport
      case 'rodSupportDesc1':
        field.setText(takeoff.rodSupport[0].desc);
        break;
      case 'rodSupportQty1':
        field.setText(takeoff.rodSupport[0].qty);
        break;

      case 'rodSupportDesc2':
        field.setText(takeoff.rodSupport[1].desc);
        break;
      case 'rodSupportQty2':
        field.setText(takeoff.rodSupport[1].qty);
        break;

      //roundWindow
      case 'roundWindowType1':
        field.setText(takeoff.roundWindow[0].type);
        break;

      case 'roundWindowQty1':
        field.setText(takeoff.roundWindow[0].qty);
        break;

      default:
        break;
    }

    field.setFontSize(11);
    field.enableReadOnly();
  });

  return await pdfDoc.saveAsBase64({ dataUri: true });
}

async function updateTakeoffStatus(user, takeoffId, newStatus, companyFilter = {}) {
  const validStatuses = [1, 2, 3, 4, 5, 6, 7, 8];

  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status value');
  }

  let baseQuery;

  // If user is delivery, allow access to all company takeoffs
  if (UserRoles.isDelivery(user.roles)) {
    baseQuery = {
      $and: [{ _id: takeoffId }],
      ...companyFilter
    };
  } else {
    // For other users (manager, carpenter), use existing logic
    baseQuery = {
      $and: [{ _id: takeoffId }],
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
      ...companyFilter
    };
  }

  return await Takeoff.findOneAndUpdate(
    baseQuery,
    { status: newStatus },
    { new: true }
  );
}

async function uploadDeliveryPhoto(user, takeoffId, file) {
  try {
    // Verify user has permission to upload delivery photo
    const takeoff = await Takeoff.findOne({
      $and: [{ _id: takeoffId }],
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    });

    if (!takeoff) {
      throw new Error('Takeoff not found or access denied');
    }

    // Only managers and delivery users can upload delivery photos
    if (!UserRoles.isManager(user.roles) && !UserRoles.isDelivery(user.roles)) {
      throw new Error('Only managers and delivery users can upload delivery photos');
    }

    // Update takeoff with delivery photo information
    const updatedTakeoff = await Takeoff.findByIdAndUpdate(
      takeoffId,
      {
        deliveryPhoto: file.path,
        deliveryPhotoUploadedAt: new Date()
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Delivery photo uploaded successfully',
      data: {
        deliveryPhoto: updatedTakeoff.deliveryPhoto,
        uploadedAt: updatedTakeoff.deliveryPhotoUploadedAt
      }
    };
  } catch (error) {
    // If there's an error, try to delete the uploaded file
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
}

async function updateTrimCarpenter(user, trimCarpenterId, idTakeoff, companyFilter = {}) {
  if (!UserRoles.isManager(user.roles) && !UserRoles.isSupervisor(user.roles)) {
    const error = new Error('Only managers and supervisors can assign trim carpenters');
    error.status = 403;
    throw error;
  }

  if (!trimCarpenterId) {
    const error = new Error('Trim carpenter ID is required');
    error.status = 400;
    throw error;
  }

  const carpenter = await User.findOne({
    _id: trimCarpenterId,
    roles: UserRoles.CARPENTER,
    ...companyFilter
  });

  if (!carpenter) {
    const error = new Error('Carpenter not found or does not belong to your company');
    error.status = 404;
    throw error;
  }

  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    ...companyFilter
  };

  const updatedTakeoff = await Takeoff.findOneAndUpdate(
    baseQuery,
    { trimCarpentry: trimCarpenterId },
    { new: true }
  ).populate('trimCarpentry', 'fullname email')
   .populate('carpentry', 'fullname email');

  if (!updatedTakeoff) {
    const error = new Error('Takeoff not found or access denied');
    error.status = 404;
    throw error;
  }

  return updatedTakeoff;
}

async function removeTrimCarpenter(user, idTakeoff, companyFilter = {}) {
  if (!UserRoles.isManager(user.roles) && !UserRoles.isSupervisor(user.roles)) {
    const error = new Error('Only managers and supervisors can remove trim carpenters');
    error.status = 403;
    throw error;
  }

  const baseQuery = {
    $and: [{ _id: idTakeoff }],
    $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
    ...companyFilter
  };

  const updatedTakeoff = await Takeoff.findOneAndUpdate(
    baseQuery,
    { $unset: { trimCarpentry: "" } },
    { new: true }
  ).populate('carpentry', 'fullname email')
   .populate('trimCarpentry', 'fullname email');

  if (!updatedTakeoff) {
    const error = new Error('Takeoff not found or access denied');
    error.status = 404;
    throw error;
  }

  return updatedTakeoff;
}

/**
 * Get takeoffs ready for invoice generation
 * Returns takeoffs with status >= 3 (UNDER_REVIEW or higher)
 */
async function getTakeoffsForInvoice(user, companyFilter = {}) {
  const invoiceCalculator = require('../services/invoice-calculator.service');

  let baseQuery;

  // If user is delivery or manager, show all takeoffs from their company with status >= 3
  if (UserRoles.isDelivery(user.roles) || UserRoles.isManager(user.roles)) {
    baseQuery = {
      status: { $gte: 3 }, // Status 3 (UNDER_REVIEW) or higher
      ...companyFilter
    };
  } else {
    // For carpenters, only show their takeoffs with status >= 3
    baseQuery = {
      status: { $gte: 3 },
      $or: [{ user: user._id }, { carpentry: user._id }, { trimCarpentry: user._id }],
      ...companyFilter
    };
  }

  const takeoffs = await Takeoff.find(baseQuery)
    .populate('carpentry', 'fullname email')
    .populate('trimCarpentry', 'fullname email')
    .populate('user', 'fullname email')
    .sort({ updatedAt: -1 });

  // Format response to match frontend expectations and calculate totalValue
  const formattedTakeoffs = [];

  for (const takeoff of takeoffs) {
    let totalValue = 0;

    try {
      // Calculate invoice to get total value
      const invoiceData = await invoiceCalculator.calculateInvoice(takeoff);
      totalValue = invoiceData.total || 0;
    } catch (error) {
      console.error(`Error calculating totalValue for takeoff ${takeoff._id}:`, error);
      // Continue with totalValue = 0 if calculation fails
    }

    formattedTakeoffs.push({
      _id: takeoff._id,
      takeoffNumber: takeoff._id, // Using ID as takeoff number for now
      customer: {
        name: takeoff.custumerName || 'N/A',
        email: takeoff.user?.email || 'N/A'
      },
      totalValue: totalValue,
      status: takeoff.status,
      completedDate: takeoff.updatedAt,
      description: `${takeoff.shipTo || ''} - Lot ${takeoff.lot || ''}`.trim(),
      role: takeoff.trimCarpentry ? 'trim' : 'measure',
      selected: false,
      // Additional fields for invoice calculation
      shipTo: takeoff.shipTo,
      lot: takeoff.lot,
      foremen: takeoff.foremen,
      carpInvoice: takeoff.carpInvoice,
      carpenter: takeoff.carpentry?.fullname || takeoff.trimCarpentry?.fullname || 'N/A',
      manager: takeoff.user?.fullname || 'N/A'
    });
  }

  return formattedTakeoffs;
}
