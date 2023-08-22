const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../models/user.model');
const S3Uploader = require('./aws.controller');
const { v5: uuidv5 } = require('uuid');

module.exports = {
  insert,
  updateImageUser,
};

async function insert(user) {
  user.hashedPassword = bcrypt.hashSync(user.password, 10);
  user.email = user.email.toLowerCase();
  delete user.password;
  return await new User(user).save();
}

async function updateImageUser(user, img) {
  let retorno = {
    temErro: false,
    mensagem: '',
    filesS3: [],
  };

  let fileName =
    'images/public/' + uuidv5(user._id.toString(), uuidv5.URL) + '.jpg';

  let buf = Buffer.from(
    img.content.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  await S3Uploader.uploadImage(fileName, buf).then(
    fileData => {
      console.log('Imagem do usuario ' + fileName);
      return User.findOneAndUpdate(
        {
          _id: user._id,
        },
        { image: fileName }
      );
    },
    err => {
      console.log('Erro ao enviar imagem de perfil  para AWS: ' + fileName);
      retorno.temErro = true;
      retorno.mensagem =
        'Servidor momentaneamente inoperante. Tente novamente mais tarde.';
    }
  );

  return await retorno;
}
