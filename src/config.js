require('dotenv').config();
// const {integratedDataLoggerConfig} = require('../../default-intelligence').dcmConfigModel;
const ENV = process.env;

require('../../default-intelligence');

/** @type {ebBoardConfig} */
const config = {
  projectInfo: {
    projectMainId: ENV.PJ_MAIN_ID || 'UPSAS',
    projectSubId: ENV.PJ_SUB_ID || 'muan',
    projectUuid: ENV.PJ_UUID || 'A',
  },
  dbInfo: {
    port: ENV.PJ_DB_PORT || '3306',
    host: ENV.PJ_DB_HOST || 'localhost',
    user: ENV.PJ_DB_USER || 'root',
    password: ENV.PJ_DB_PW || 'test',
    database: ENV.PJ_DB_DB || 'test',
  },
  inquirySchedulerInfo: {
    intervalCronFormat: '0 * * * * *',
    intervalSaveCnt: 1,
    validInfo: {
      diffType: 'minutes',
      duration: 2,
    },
  },
  /** @type {deviceInfo} */
  deviceInfo: {
    target_id: 0,
    connect_info: {
      type: 'serial',
      port: 'COM1',
      baudRate: 9600,
    },
  },
};
module.exports = config;
