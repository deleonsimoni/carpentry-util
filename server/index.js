// config should be imported before importing any other file
const config = require('./config/config');
const app = require('./config/express');
require('./config/mongoose');
const https = require('https');
const fs = require('fs');

let https_options;

try {
  https_options = {
    ca: fs.readFileSync("/home/ubuntu/carpentryutil/certificado/ca_bundle.crt"),
    key: fs.readFileSync("/home/ubuntu/carpentryutil/certificado/private.key"),
    cert: fs.readFileSync("/home/ubuntu/carpentryutil/certificado/certificate.crt")
  };
} catch (err) {
  console.log('Certificados não encontrados')
}

const httpsServer = https.createServer(https_options, app);

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  app.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`);
  });

  httpsServer.listen(8443, () => {
    console.log('HTTPS Server running on port 8443');
  });
}

module.exports = app;
