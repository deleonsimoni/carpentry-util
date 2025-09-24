const AWS = require('aws-sdk');
const config = require('../config/config');
const nodemailer = require("nodemailer");

module.exports = {
  uploadImage,
  enviarEmail
};

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com", // ajuste para a sua região SES
  port: 465,
  secure: true,
  auth: {
    user: process.env.AWS_SES_ID,
    pass: process.env.AWS_SES_KEY,
  },
});

async function enviarEmail(email, assunto, corpo) {
  try {
    const info = await transporter.sendMail({
      from: '"CarpentryGo" <contact@carpentrygo.com>', // precisa estar verificado no SES
      to: email,
      subject: assunto,
      html: corpo,
      text: corpo.replace(/<[^>]+>/g, ""), // fallback texto puro
    });

    return info && info.messageId ? true : false;
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err.message);
    return false;
  }
}

function uploadImage(key, file) {
  const s3 = new AWS.S3({
    accessKeyId: config.AWS_S3_KEY,
    secretAccessKey: config.AWS_S3_SECRET,
  });

  var s3Config = {
    Bucket: 'carpentryutil-public',
    Key: key,
    Body: file,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
  };

  return new Promise((resolve, reject) => {
    s3.putObject(s3Config, (err, resp) => {
      if (err) {
        console.log('Erro AWS', err);
        reject({ success: false, data: err });
      }
      resolve({ sucess: true, data: resp });
    });
  });
}
