const Control = require('./src/Control');

module.exports = Control;

// if __main process
if (require !== undefined && require.main === module) {
  console.log('__main__');

  let config;

  if (process.env.NODE_ENV === 'development') {
    require('dotenv').config();
    config = require('./src/config');
  }

  const control = new Control(config);

  control.init().catch(console.trace);

  // control.processBoardView();

  process.on('uncaughtException', err => {
    // BU.debugConsole();
    console.error(err.stack);
    console.log(err.message);
    console.log('Node NOT Exiting...');
  });

  process.on('unhandledRejection', err => {
    // BU.debugConsole();
    console.error(err.stack);
    console.log(err.message);
    console.log('Node NOT Exiting...');
  });
}
