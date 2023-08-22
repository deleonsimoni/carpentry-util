const AWS = require('aws-sdk');
const config = require('../config/config');

module.exports = {
  uploadImage,
};

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
