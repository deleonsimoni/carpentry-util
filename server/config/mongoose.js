const mongoose = require('mongoose');
const util = require('util');
const debug = require('debug')('express-mongoose-es6-rest-api:index');

const config = require('./config');

// Configure mongoose settings
mongoose.set('strictQuery', false); // Remove deprecation warning

// connect to mongo db
const mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { keepAlive: true }); // Update keepAlive to boolean
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env
if (config.MONGOOSE_DEBUG) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}
