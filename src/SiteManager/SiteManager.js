const _ = require('lodash');

const { BU } = require('base-util-jh');

const ProtocolConverter = require('../utils/ProtocolConverter');

class SiteManager {
  /**
   * 전광판을 뿌려주기 위한 설정 값을 이용한 생성자 초기화
   * @param {ebBoardConfig} ebBoardConfig
   */
  constructor(ebBoardConfig) {
    const { dbInfo, projectInfo } = ebBoardConfig;
    this.dbInfo = dbInfo;
    this.projectInfo = projectInfo;
    this.ebBoardConfig = ebBoardConfig;

    this.protocolConverter = new ProtocolConverter();
    // BU.CLIN(this.protocolConverter);
  }

  /**
   * 인코딩 처리된 전광판 데이터 정제
   * @return {Promise<Object|Object[]>}
   */
  getRefinedBoardData() {
    return this.getBoardData()
      .then(data => this.encodingBoardData(data))
      .catch(console.trace);
  }

  /**
   * 전광판 데이터 정제
   * @interface
   * @return {Promise<Object|Object[]>}
   */
  getBoardData() {}

  /**
   * @interface
   * 각 전광판 프로토콜맵에 따른 데이터 형식 변환
   */
  encodingBoardData() {}

  /**
   *
   * @param {number} data
   * @param {number} fixed 소수점 이하
   * @param {number=} scale 배율
   * @return {string}
   */
  convertFixedData(data, fixed = 1, scale = 1) {
    const strData = _.round(data, scale).toString();

    let strAddData = '';

    if (strData.includes('.')) {
      const padFixedLen = strData.length - strData.indexOf('.') - 1;
      strAddData = _.padEnd(strAddData, fixed - padFixedLen, '0');
    } else if (strData !== '0') {
      strAddData = `.${_.padEnd(strAddData, fixed, '0')}`;
    }
    return strData + strAddData;
  }
}
module.exports = SiteManager;
