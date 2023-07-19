const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../models/user.model');
const { PDFDocument, setFontAndSize, rgb } = require('pdf-lib');
const fs = require('fs');

const userSchema = Joi.object({
  fullname: Joi.string().required(),
  email: Joi.string().email(),
  mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/),
  password: Joi.string().required(),
  repeatPassword: Joi.string().required().valid(Joi.ref('password')),
});

module.exports = {
  insert,
  teste,
};

async function insert(user) {
  user = await userSchema.validateAsync(user, { abortEarly: false });
  user.hashedPassword = bcrypt.hashSync(user.password, 10);
  delete user.password;
  return await new User(user).save();
}

async function teste(user) {
  console.log('OK');

  const filePath = 'template.pdf';

  // Ler o arquivo PDF existente
  const pdfBytes = await fs.promises.readFile(filePath);

  // Carregar o documento PDF
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const form = pdfDoc.getForm();

  // Modificar os valores no PDF
  const fields = form.getFields();

  const textField = form.getTextField('ss1');
  textField.setFontSize(11);
  textField.setText('12CM');
  textField.enableReadOnly();

  //textField.updateAppearances(customFont);
  const da = textField.acroField.getDefaultAppearance() ?? '';
  //const newDa = da + '\n' + setFillingRgbColor(1, 0, 0).toString();
  const newDa = da + '\n' + setFontAndSize('Courier', 8).toString(); //setFontAndSize() method came to resuce
  textField.acroField.setDefaultAppearance(newDa);

  // Alterar o valor de campos específicos
  fields.forEach(field => {
    if (field.getName() === 'Text1') {
      field.setText('Novo Valor 1');
    }
  });

  // Serializar o documento PDF modificado
  const modifiedPdfBytes = await pdfDoc.save();

  // Salvar o arquivo PDF modificado
  await fs.promises.writeFile('modified2.pdf', modifiedPdfBytes);

  return 'OK';
}
