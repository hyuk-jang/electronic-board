// const SiteManager = require('./SiteManager');

module.exports = {
  /**
   * @param {ebBoardConfig} ebBoardConfig
   */
  getSiteManager(ebBoardConfig) {
    const {
      projectInfo: { projectMainId, projectSubId },
    } = ebBoardConfig;

    const Site = require(`./${projectMainId}/${projectSubId}`);

    /** @type {SiteManager} */
    const siteManager = new Site(ebBoardConfig);

    return siteManager;
  },
};
