const SiteManager = require('./SiteManager');

module.exports = class {
  /**
   * @param {ebBoardConfig} ebBoardConfig
   */
  constructor(ebBoardConfig) {
    const {
      projectInfo: { projectMainId, projectSubId },
      dbInfo,
    } = ebBoardConfig;

    const Site = require(`./${projectMainId}/${projectSubId}`);

    /** @type {SiteManager} */
    const siteManager = new Site(ebBoardConfig);

    return siteManager;
  }
};
