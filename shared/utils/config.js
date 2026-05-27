const cds = require('@sap/cds');

const env = process.env;

module.exports = {
  environment: env.NODE_ENV || 'development',
  databaseUrl: env.DATABASE_URL || 'sqlite:db/data/neuroflow.db',
  hanaUrl: env.HANA_URL || '',
  xsuaaCredentials: env.XSUAA_CREDENTIALS ? JSON.parse(env.XSUAA_CREDENTIALS) : null,
  isCloud: Boolean(env.VCAP_SERVICES),
  get serviceUri() {
    return env.SERVICE_URI || 'http://localhost:4004';
  },
  get cds() {
    return cds;
  }
};
