const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow('development', 'production', 'test', 'provision')
    .default('development'),
  SERVER_PORT: Joi.number().default(4040),
  MONGOOSE_DEBUG: Joi.boolean().when('NODE_ENV', {
    is: Joi.string().equal('development'),
    then: Joi.boolean().default(true),
    otherwise: Joi.boolean().default(false),
  }),
  JWT_SECRET: Joi.string()
    .required()
    .description('JWT Secret required to sign'),
  MONGO_HOST: Joi.string().required().description('Mongo DB host url'),
  MONGO_PORT: Joi.number().default(27017),

  MAIL_FROM: Joi.string().allow('').description('Path Developer AWS S3'),
  MAIL_SECRET: Joi.string().allow('').description('Path Developer AWS S3'),
  AWS_S3_KEY: Joi.string().allow('').description('Path Developer AWS S3'),
  AWS_S3_SECRET: Joi.string().allow('').description('Path Developer AWS S3'),
  PATH_S3_DEV: Joi.string().allow('').description('Path Developer AWS S3'),
  AWS_SES_ID: Joi.string().allow('').description('Path Developer AWS S3'),
  AWS_SES_KEY: Joi.string().allow('').description('Path Developer AWS S3'),
})
  .unknown()
  .required();

const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.SERVER_PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  frontend: envVars.MEAN_FRONTEND || 'angular',
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT,
  },
  MAIL_FROM: envVars.MAIL_FROM,
  MAIL_SECRET: envVars.MAIL_SECRET,
  AWS_S3_KEY: envVars.AWS_S3_KEY,
  AWS_S3_SECRET: envVars.AWS_S3_SECRET,
  PATH_S3_DEV: envVars.PATH_S3_DEV,
  AWS_SES_ID: envVars.AWS_SES_ID,
  AWS_SES_KEY: envVars.AWS_SES_KEY,
};

module.exports = config;
