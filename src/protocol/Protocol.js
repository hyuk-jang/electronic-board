const ProtocolConverter = require('../utils/ProtocolConverter');

class Protocol {
  constructor() {
    this.protocolConverter = new ProtocolConverter();
  }

  /**
   *
   * @param {Object} boardData
   */
  generationCommand(boardData) {}
}
module.exports = Protocol;
