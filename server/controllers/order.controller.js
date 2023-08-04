const User = require('../models/user.model');
const Order = require('../models/order.model');
const { PDFDocument, setFontAndSize, rgb } = require('pdf-lib');
const fs = require('fs');

module.exports = {
  insert,
  detailOrder,
  updateOrder,
  finalizeOrder,
  getOrders,
  backOrderToCarpentry,
  findCarpentryByEmail,
  generatePDF
};

async function insert(idUser, body) {
  body.user = idUser;
  body.status = 1;

  return await new Order(body).save();
}

async function getOrders(idUSer) {
  return await Order.find({ $or: [{ user: idUSer }, { carpentry: idUSer }] })
    .populate("carpentry", 'fullname email')
    .populate("user", 'fullname email')
    .select('custumerName carpentry user status shipTo')
    .sort({
      createdAt: -1
    });
}

async function detailOrder(idUser, idOrder) {
  return await Order.find(
    {
      $and: [{ _id: idOrder }],
      $or: [{ 'user': idUser }, { 'carpentry': idUser }]
    }
  )
    .populate("carpentry", 'fullname email')

}

async function updateOrder(user, body, idOrder) {
  body.status = 2;
  return await Order.findOneAndUpdate(
    {
      $and: [{ _id: idOrder }],
      $or: [{ 'user': user._id }, { 'carpentry': user._id }]
    },
    body
  )
}

async function finalizeOrder(user, body, idOrder) {

  if (user.roles.includes('company')) {
    delete body.status;
  } else {
    body.status = 3;
  }

  return await Order.findOneAndUpdate(
    {
      $and: [{ _id: idOrder }],
      $or: [{ 'user': user._id }, { 'carpentry': user._id }]
    },
    body
  )
}

async function findCarpentryByEmail(user, email) {

  return await User.findOne(
    {
      email: email.toLowerCase(),
      roles: 'carpentry'
    }
  )
}

async function backOrderToCarpentry(user, body, idOrder) {

  body.status = 2;

  return await Order.findOneAndUpdate(
    {
      $and: [{ _id: idOrder }],
      $or: [{ 'user': user._id }, { 'carpentry': user._id }]
    },
    body
  )
}

async function generatePDF(user, idOrder) {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  let order = await Order.findOne(
    {
      $and: [{ _id: idOrder }],
      $or: [{ 'user': user._id }, { 'carpentry': user._id }]
    }
  )

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
        field.setText(order.custumerName || '');
        break;
      case 'foremen':
        field.setText(order.foremen || '');
        break;
      case 'extrasChecked':
        field.setText(order.extrasChecked || '');
        break;
      case 'carpInvoice':
        field.setText(order.carpInvoice || '');
        break;
      case 'shipTo':
        field.setText(order.shipTo || '');
        break;
      case 'lot':
        field.setText(order.lot || '');
        break;
      case 'type':
        field.setText(order.type || '');
        break;
      case 'elev':
        field.setText(order.elev || '');
        break;
      case 'sqFootage':
        field.setText(order.sqFootage || '');
        break;
      case 'streetName':
        field.setText(order.streetName || '');
        break;
      case 'comment':
        field.setText(order.comment || '');
        break;
      case 'preHugs':
        field.setText(order.preHugs || '');
        break;

      //cantinaDoors
      case 'cantina1':
        field.setText(order.cantinaDoors[0].name);
        break;
      case 'cantina2':
        field.setText(order.cantinaDoors[1].name);
        break;
      case 'cantinaSwing1':
        field.setText(order.cantinaDoors[0].swing);
        break;
      case 'cantinaSwing2':
        field.setText(order.cantinaDoors[1].swing);
        break;
      case 'cantinaQty1':
        field.setText(order.cantinaDoors[0].qty);
        break;
      case 'cantinaQty2':
        field.setText(order.cantinaDoors[1].qty);
        break;


      //frenchDoors
      case 'frenchSize1':
        field.setText(order.frenchDoors[0].size + ' ' + order.frenchDoors[0].swing);
        break;
      case 'frenchHeight1':
        field.setText(order.frenchDoors[0].height);
        break;
      case 'frenchQty1':
        field.setText(order.frenchDoors[0].qty);
        break;
      case 'frenchJamb1':
        field.setText(order.frenchDoors[0].jamb);
        break;
      case 'frenchSize2':
        field.setText(order.frenchDoors[1].size + ' ' + order.frenchDoors[1].swing);
        break;
      case 'frenchHeight2':
        field.setText(order.frenchDoors[1].height);
        break;
      case 'frenchQty2':
        field.setText(order.frenchDoors[1].qty);
        break;
      case 'frenchJamb2':
        field.setText(order.frenchDoors[1].jamb);
        break;

      //DoubleDoors
      case 'doubleSize1':
        field.setText(order.doubleDoors[0].size);
        break;
      case 'doubleHeight1':
        field.setText(order.doubleDoors[0].height);
        break;
      case 'doubleQty1':
        field.setText(order.doubleDoors[0].qty);
        break;
      case 'doubleJamb1':
        field.setText(order.doubleDoors[0].jamb);
        break;
      case 'doubleSize2':
        field.setText(order.doubleDoors[1].size);
        break;
      case 'doubleHeight2':
        field.setText(order.doubleDoors[1].height);
        break;
      case 'doubleQty2':
        field.setText(order.doubleDoors[1].qty);
        break;
      case 'doubleJamb2':
        field.setText(order.doubleDoors[1].jamb);
        break;
      case 'doubleSize3':
        field.setText(order.doubleDoors[2].size);
        break;
      case 'doubleHeight3':
        field.setText(order.doubleDoors[2].height);
        break;
      case 'doubleQty3':
        field.setText(order.doubleDoors[2].qty);
        break;
      case 'doubleJamb3':
        field.setText(order.doubleDoors[2].jamb);
        break;
      case 'doubleSize4':
        field.setText(order.doubleDoors[3].size);
        break;
      case 'doubleHeight4':
        field.setText(order.doubleDoors[3].height);
        break;
      case 'doubleQty4':
        field.setText(order.doubleDoors[3].qty);
        break;
      case 'doubleJamb4':
        field.setText(order.doubleDoors[3].jamb);
        break;
      case 'doubleSize5':
        field.setText(order.doubleDoors[4].size);
        break;
      case 'doubleHeight5':
        field.setText(order.doubleDoors[4].height);
        break;
      case 'doubleQty5':
        field.setText(order.doubleDoors[4].qty);
        break;
      case 'doubleJamb5':
        field.setText(order.doubleDoors[4].jamb);
        break;

      //SingleDoors
      case 'singleSize1':
        field.setText(order.singleDoors[0].size);
        break;
      case 'singleLeft1':
        field.setText(order.singleDoors[0].left);
        break;
      case 'singleRight1':
        field.setText(order.singleDoors[0].right);
        break;
      case 'singleJamb1':
        field.setText(order.singleDoors[0].jamb);
        break;

      case 'singleSize2':
        field.setText(order.singleDoors[1].size);
        break;
      case 'singleLeft2':
        field.setText(order.singleDoors[1].left);
        break;
      case 'singleRight2':
        field.setText(order.singleDoors[1].right);
        break;
      case 'singleJamb2':
        field.setText(order.singleDoors[1].jamb);
        break;

      case 'singleSize3':
        field.setText(order.singleDoors[2].size);
        break;
      case 'singleLeft3':
        field.setText(order.singleDoors[2].left);
        break;
      case 'singleRight3':
        field.setText(order.singleDoors[2].right);
        break;
      case 'singleJamb3':
        field.setText(order.singleDoors[2].jamb);
        break;

      case 'singleSize4':
        field.setText(order.singleDoors[3].size);
        break;
      case 'singleLeft4':
        field.setText(order.singleDoors[3].left);
        break;
      case 'singleRight4':
        field.setText(order.singleDoors[3].right);
        break;
      case 'singleJamb4':
        field.setText(order.singleDoors[3].jamb);
        break;

      case 'singleSize5':
        field.setText(order.singleDoors[4].size);
        break;
      case 'singleLeft5':
        field.setText(order.singleDoors[4].left);
        break;
      case 'singleRight5':
        field.setText(order.singleDoors[4].right);
        break;
      case 'singleJamb5':
        field.setText(order.singleDoors[4].jamb);
        break;

      case 'singleSize6':
        field.setText(order.singleDoors[5].size);
        break;
      case 'singleLeft6':
        field.setText(order.singleDoors[5].left);
        break;
      case 'singleRight6':
        field.setText(order.singleDoors[5].right);
        break;
      case 'singleJamb6':
        field.setText(order.singleDoors[5].jamb);
        break;

      case 'singleSize7':
        field.setText(order.singleDoors[6].size);
        break;
      case 'singleLeft7':
        field.setText(order.singleDoors[6].left);
        break;
      case 'singleRight7':
        field.setText(order.singleDoors[6].right);
        break;
      case 'singleJamb7':
        field.setText(order.singleDoors[6].jamb);
        break;


      case 'singleSize8':
        field.setText(order.singleDoors[7].size);
        break;
      case 'singleLeft8':
        field.setText(order.singleDoors[7].left);
        break;
      case 'singleRight8':
        field.setText(order.singleDoors[7].right);
        break;
      case 'singleJamb8':
        field.setText(order.singleDoors[7].jamb);
        break;

      case 'singleSize9':
        field.setText(order.singleDoors[8].size);
        break;
      case 'singleLeft9':
        field.setText(order.singleDoors[8].left);
        break;
      case 'singleRight9':
        field.setText(order.singleDoors[8].right);
        break;
      case 'singleJamb9':
        field.setText(order.singleDoors[8].jamb);
        break;

      case 'singleSize10':
        field.setText(order.singleDoors[9].size);
        break;
      case 'singleLeft10':
        field.setText(order.singleDoors[9].left);
        break;
      case 'singleRight10':
        field.setText(order.singleDoors[9].right);
        break;
      case 'singleJamb10':
        field.setText(order.singleDoors[9].jamb);
        break;

      case 'singleSize11':
        field.setText(order.singleDoors[10].size);
        break;
      case 'singleLeft11':
        field.setText(order.singleDoors[10].left);
        break;
      case 'singleRight11':
        field.setText(order.singleDoors[10].right);
        break;
      case 'singleJamb11':
        field.setText(order.singleDoors[10].jamb);
        break;

      case 'singleSize12':
        field.setText(order.singleDoors[11].size);
        break;
      case 'singleLeft12':
        field.setText(order.singleDoors[11].left);
        break;
      case 'singleRight12':
        field.setText(order.singleDoors[11].right);
        break;
      case 'singleJamb12':
        field.setText(order.singleDoors[11].jamb);
        break;


      case 'singleSize13':
        field.setText(order.singleDoors[12].size);
        break;
      case 'singleLeft13':
        field.setText(order.singleDoors[12].left);
        break;
      case 'singleRight13':
        field.setText(order.singleDoors[12].right);
        break;
      case 'singleJamb13':
        field.setText(order.singleDoors[12].jamb);
        break;

      case 'singleSize14':
        field.setText(order.singleDoors[13].size);
        break;
      case 'singleLeft14':
        field.setText(order.singleDoors[13].left);
        break;
      case 'singleRight14':
        field.setText(order.singleDoors[13].right);
        break;
      case 'singleJamb14':
        field.setText(order.singleDoors[13].jamb);
        break;

      //Arches

      case 'archesCol1':
        field.setText(order.arches[0].col1);
        break;
      case 'archesCol2':
        field.setText(order.arches[0].col2);
        break;
      case 'archesCol3':
        field.setText(order.arches[0].col3);
        break;
      case 'archesCol4':
        field.setText(order.arches[0].col4);
        break;
      case 'archesCol5':
        field.setText(order.arches[0].col5);
        break;


      case 'archesCol12':
        field.setText(order.arches[1].col1);
        break;
      case 'archesCol22':
        field.setText(order.arches[1].col2);
        break;
      case 'archesCol32':
        field.setText(order.arches[1].col3);
        break;
      case 'archesCol42':
        field.setText(order.arches[1].col4);
        break;
      case 'archesCol52':
        field.setText(order.arches[1].col5);
        break;

      case 'archesSize3':
        field.setText(order.arches[2].size);
        break;
      case 'archesCol13':
        field.setText(order.arches[2].col1);
        break;
      case 'archesCol23':
        field.setText(order.arches[2].col2);
        break;
      case 'archesCol33':
        field.setText(order.arches[2].col3);
        break;
      case 'archesCol43':
        field.setText(order.arches[2].col4);
        break;
      case 'archesCol53':
        field.setText(order.arches[2].col5);
        break;

      case 'archesSize4':
        field.setText(order.arches[3].size);
        break;
      case 'archesCol14':
        field.setText(order.arches[3].col1);
        break;
      case 'archesCol24':
        field.setText(order.arches[3].col2);
        break;
      case 'archesCol34':
        field.setText(order.arches[3].col3);
        break;
      case 'archesCol44':
        field.setText(order.arches[3].col4);
        break;
      case 'archesCol54':
        field.setText(order.arches[3].col5);
        break;


      case 'archesCol15':
        field.setText(order.arches[4].col1);
        break;
      case 'archesCol25':
        field.setText(order.arches[4].col2);
        break;
      case 'archesCol35':
        field.setText(order.arches[4].col3);
        break;
      case 'archesCol45':
        field.setText(order.arches[4].col4);
        break;
      case 'archesCol55':
        field.setText(order.arches[4].col5);
        break;

      //trim

      case 'trimDetails1':
        field.setText(order.trim[0].details);
        break;
      case 'trimQty1':
        field.setText(order.trim[0].qty);
        break;


      case 'trimDetails2':
        field.setText(order.trim[1].details);
        break;
      case 'trimQty2':
        field.setText(order.trim[1].qty);
        break;

      case 'trimItem3':
        field.setText(order.trim[2].item);
        break;
      case 'trimDetails3':
        field.setText(order.trim[2].details);
        break;
      case 'trimQty3':
        field.setText(order.trim[2].qty);
        break;


      case 'trimDetails4':
        field.setText(order.trim[3].details);
        break;
      case 'trimQty4':
        field.setText(order.trim[3].qty);
        break;


      case 'trimDetails5':
        field.setText(order.trim[4].details);
        break;
      case 'trimQty5':
        field.setText(order.trim[4].qty);
        break;

      case 'trimItem6':
        field.setText(order.trim[5].item);
        break;
      case 'trimDetails6':
        field.setText(order.trim[5].details);
        break;
      case 'trimQty6':
        field.setText(order.trim[5].qty);
        break;

      case 'trimDetails7':
        field.setText(order.trim[6].details);
        break;
      case 'trimQty7':
        field.setText(order.trim[6].qty);
        break;

      case 'trimDetails8':
        field.setText(order.trim[7].details);
        break;
      case 'trimQty8':
        field.setText(order.trim[7].qty);
        break;

      case 'trimDetails9':
        field.setText(order.trim[8].details);
        break;
      case 'trimQty9':
        field.setText(order.trim[8].qty);
        break;


      case 'trimDetails10':
        field.setText(order.trim[9].details);
        break;
      case 'trimQty10':
        field.setText(order.trim[9].qty);
        break;

      case 'trimItem11':
        field.setText(order.trim[10].item);
        break;
      case 'trimDetails11':
        field.setText(order.trim[10].details);
        break;
      case 'trimQty11':
        field.setText(order.trim[10].qty);
        break;


      case 'trimDetails12':
        field.setText(order.trim[11].details);
        break;
      case 'trimQty12':
        field.setText(order.trim[11].qty);
        break;


      case 'trimDetails13':
        field.setText(order.trim[12].details);
        break;
      case 'trimQty13':
        field.setText(order.trim[12].qty);
        break;


      case 'trimDetails14':
        field.setText(order.trim[13].details);
        break;
      case 'trimQty14':
        field.setText(order.trim[13].qty);
        break;


      case 'trimDetails15':
        field.setText(order.trim[14].details);
        break;
      case 'trimQty15':
        field.setText(order.trim[14].qty);
        break;

      case 'trimItem16':
        field.setText(order.trim[15].item);
        break;
      case 'trimDetails16':
        field.setText(order.trim[15].details);
        break;
      case 'trimQty16':
        field.setText(order.trim[15].qty);
        break;

      case 'trimDetails17':
        field.setText(order.trim[16].details);
        break;
      case 'trimQty17':
        field.setText(order.trim[16].qty);
        break;


      case 'trimDetails18':
        field.setText(order.trim[17].details);
        break;
      case 'trimQty18':
        field.setText(order.trim[17].qty);
        break;

      case 'trimItem19':
        field.setText(order.trim[18].item);
        break;
      case 'trimDetails19':
        field.setText(order.trim[18].details);
        break;
      case 'trimQty19':
        field.setText(order.trim[18].qty);
        break;

      case 'trimDetails20':
        field.setText(order.trim[19].details);
        break;
      case 'trimQty20':
        field.setText(order.trim[19].qty);
        break;


      case 'trimDetails21':
        field.setText(order.trim[20].details);
        break;
      case 'trimQty21':
        field.setText(order.trim[20].qty);
        break;

      case 'trimItem22':
        field.setText(order.trim[21].item);
        break;
      case 'trimDetails22':
        field.setText(order.trim[21].details);
        break;
      case 'trimQty22':
        field.setText(order.trim[21].qty);
        break;

      case 'trimDetails23':
        field.setText(order.trim[22].details);
        break;
      case 'trimQty23':
        field.setText(order.trim[22].qty);
        break;

      case 'trimDetails24':
        field.setText(order.trim[23].details);
        break;
      case 'trimQty24':
        field.setText(order.trim[23].qty);
        break;

      case 'trimDetails25':
        field.setText(order.trim[24].details);
        break;
      case 'trimQty25':
        field.setText(order.trim[24].qty);
        break;

      case 'trimItem26':
        field.setText(order.trim[25].item);
        break;
      case 'trimDetails26':
        field.setText(order.trim[25].details);
        break;
      case 'trimQty26':
        field.setText(order.trim[25].qty);
        break;

      case 'trimDetails27':
        field.setText(order.trim[26].details);
        break;
      case 'trimQty27':
        field.setText(order.trim[26].qty);
        break;

      case 'trimDetails28':
        field.setText(order.trim[27].details);
        break;
      case 'trimQty28':
        field.setText(order.trim[27].qty);
        break;

      case 'trimDetails29':
        field.setText(order.trim[28].details);
        break;
      case 'trimQty29':
        field.setText(order.trim[28].qty);
        break;


      //labour
      case 'labourQty1':
        field.setText(order.labour[0].qty);
        break;

      case 'labourQty2':
        field.setText(order.labour[1].qty);
        break;

      case 'labourQty3':
        field.setText(order.labour[2].qty);
        break;

      case 'labourQty4':
        field.setText(order.labour[3].qty);
        break;

      case 'labourQty5':
        field.setText(order.labour[4].qty);
        break;

      case 'labourQty6':
        field.setText(order.labour[5].qty);
        break;

      case 'labourQty7':
        field.setText(order.labour[6].qty);
        break;

      case 'labourQty8':
        field.setText(order.labour[7].qty);
        break;

      case 'labourQty9':
        field.setText(order.labour[8].qty);
        break;

      case 'labourQty10':
        field.setText(order.labour[9].qty);
        break;

      case 'labourQty11':
        field.setText(order.labour[10].qty);
        break;

      case 'labourQty12':
        field.setText(order.labour[11].qty);
        break;

      case 'labourQty13':
        field.setText(order.labour[12].qty);
        break;

      case 'labourQty14':
        field.setText(order.labour[13].qty);
        break;

      case 'labourQty15':
        field.setText(order.labour[14].qty);
        break;

      case 'labourQty16':
        field.setText(order.labour[15].qty);
        break;

      case 'labourQty17':
        field.setText(order.labour[16].qty);
        break;

      case 'labourQty18':
        field.setText(order.labour[17].qty);
        break;

      case 'labourQty19':
        field.setText(order.labour[18].qty);
        break;

      case 'labourQty20':
        field.setText(order.labour[19].qty);
        break;

      case 'labourQty21':
        field.setText(order.labour[20].qty);
        break;

      case 'labourQty22':
        field.setText(order.labour[21].qty);
        break;

      case 'labourQty23':
        field.setText(order.labour[22].qty);
        break;

      case 'labourQty24':
        field.setText(order.labour[23].qty);
        break;

      case 'labourQty25':
        field.setText(order.labour[24].qty);
        break;

      case 'labourQty26':
        field.setText(order.labour[25].qty);
        break;

      case 'labourQty27':
        field.setText(order.labour[26].qty);
        break;

      case 'labourItem28':
        field.setText(order.labour[27].item);
        break;
      case 'labourQty28':
        field.setText(order.labour[27].qty);
        break;

      case 'labourItem29':
        field.setText(order.labour[28].item);
        break;
      case 'labourQty29':
        field.setText(order.labour[28].qty);
        break;


      //hardware
      case 'hardwareType1':
        field.setText(order.hardware[0].type);
        break;
      case 'hardwareQty1':
        field.setText(order.hardware[0].qty);
        break;

      case 'hardwareType2':
        field.setText(order.hardware[1].type);
        break;
      case 'hardwareQty2':
        field.setText(order.hardware[1].qty);
        break;

      case 'hardwareType3':
        field.setText(order.hardware[2].type);
        break;
      case 'hardwareQty3':
        field.setText(order.hardware[2].qty);
        break;

      case 'hardwareType4':
        field.setText(order.hardware[3].type);
        break;
      case 'hardwareQty4':
        field.setText(order.hardware[3].qty);
        break;

      case 'hardwareType5':
        field.setText(order.hardware[4].type);
        break;
      case 'hardwareQty5':
        field.setText(order.hardware[4].qty);
        break;

      case 'hardwareType6':
        field.setText(order.hardware[5].type);
        break;
      case 'hardwareQty6':
        field.setText(order.hardware[5].qty);
        break;

      case 'hardwareType7':
        field.setText(order.hardware[6].type);
        break;
      case 'hardwareQty7':
        field.setText(order.hardware[6].qty);
        break;

      case 'hardwareType8':
        field.setText(order.hardware[7].type);
        break;
      case 'hardwareQty8':
        field.setText(order.hardware[7].qty);
        break;

      case 'hardwareType9':
        field.setText(order.hardware[8].type);
        break;
      case 'hardwareQty9':
        field.setText(order.hardware[8].qty);
        break;

      case 'hardwareType10':
        field.setText(order.hardware[9].type);
        break;
      case 'hardwareQty10':
        field.setText(order.hardware[9].qty);
        break;

      case 'hardwareType11':
        field.setText(order.hardware[10].type);
        break;
      case 'hardwareQty11':
        field.setText(order.hardware[10].qty);
        break;

      case 'hardwareType12':
        field.setText(order.hardware[11].type);
        break;
      case 'hardwareQty12':
        field.setText(order.hardware[11].qty);
        break;

      case 'hardwareType13':
        field.setText(order.hardware[12].type);
        break;
      case 'hardwareQty13':
        field.setText(order.hardware[12].qty);
        break;

      case 'hardwareType14':
        field.setText(order.hardware[13].type);
        break;
      case 'hardwareQty14':
        field.setText(order.hardware[13].qty);
        break;

      case 'hardwareType15':
        field.setText(order.hardware[14].type);
        break;
      case 'hardwareQty15':
        field.setText(order.hardware[14].qty);
        break;


      //shelves
      case 'shelvesType41':
        field.setText(order.shelves[0].type4);
        break;
      case 'shelvesType61':
        field.setText(order.shelves[0].type6);
        break;
      case 'shelvesType81':
        field.setText(order.shelves[0].type8);
        break;
      case 'shelvesType101':
        field.setText(order.shelves[0].type10);
        break;
      case 'shelvesType121':
        field.setText(order.shelves[0].type12);
        break;
      case 'shelvesQty1':
        field.setText(order.shelves[0].qty);
        break;

      case 'shelvesType42':
        field.setText(order.shelves[1].type4);
        break;
      case 'shelvesType62':
        field.setText(order.shelves[1].type6);
        break;
      case 'shelvesType82':
        field.setText(order.shelves[1].type8);
        break;
      case 'shelvesType102':
        field.setText(order.shelves[1].type10);
        break;
      case 'shelvesType122':
        field.setText(order.shelves[1].type12);
        break;
      case 'shelvesQty2':
        field.setText(order.shelves[1].qty);
        break;


      //closetRods
      case 'closetRodsType11':
        field.setText(order.closetRods[0].type4);
        break;
      case 'closetRodsType21':
        field.setText(order.closetRods[0].type2);
        break;
      case 'closetRodsType31':
        field.setText(order.closetRods[0].type3);
        break;
      case 'closetRodsType41':
        field.setText(order.closetRods[0].type4);
        break;

      //rodSupport
      case 'rodSupportDesc1':
        field.setText(order.rodSupport[0].desc);
        break;
      case 'rodSupportQty1':
        field.setText(order.rodSupport[0].qty);
        break;

      case 'rodSupportDesc2':
        field.setText(order.rodSupport[1].desc);
        break;
      case 'rodSupportQty2':
        field.setText(order.rodSupport[1].qty);
        break;


      //roundWindow
      case 'roundWindowType1':
        field.setText(order.roundWindow[0].type);
        break;

      case 'roundWindowQty1':
        field.setText(order.roundWindow[0].qty);
        break;

      default:
        console.log('Field not found => ' + field.getName())
        break;
    }

    field.setFontSize(11);
    field.enableReadOnly();

  });


  return await pdfDoc.saveAsBase64({ dataUri: true });
}