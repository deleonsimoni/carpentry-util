const mongoose = require('mongoose');
const util = require('util');
const debug = require('debug')('express-mongoose-es6-rest-api:index');

const config = require('./config');

// Configure mongoose settings
mongoose.set('strictQuery', false); // Remove deprecation warning

// connect to mongo db
const mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { keepAlive: true, dbName: 'carpentrygo' }).catch(err => {
  console.error('MongoDB connection error:', err.message);
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

// print mongoose logs in dev env
if (config.MONGOOSE_DEBUG) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}
