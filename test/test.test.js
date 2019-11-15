const { expect } = require('chai');

require('dotenv').config();
const Control = require('../src/Control');
const config = require('../src/config');

describe('Step 1', () => {
  it('Test 1', done => {});

  it.only('Async Test', async () => {
    const control = new Control(config);

    control.processBoardView();
  });
});
