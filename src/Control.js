const _ = require('lodash');
const cron = require('cron');
const moment = require('moment');
const { BU } = require('base-util-jh');

const config = require('./config');

const DeviceManager = require('./utils/DeviceManager');
const SiteManager = require('./SiteManager');

class Control {
  /**
   *
   * @param {ebBoardConfig} ebBoardConfig
   */
  constructor(ebBoardConfig = config) {
    this.config = ebBoardConfig;
    this.siteManager = new SiteManager(ebBoardConfig);

    this.deviceManager = new DeviceManager();
  }

  /**
   * 초기화
   * 장치 접속 관리자 연결
   */
  async init() {
    // 전광판과 접속이 완료될때까지 대기
    await this.deviceManager.connect(this.config.deviceInfo);

    this.runCronRequestElecBoard();
  }

  /**
   * 현황판 데이터 요청 스케줄러
   */
  runCronRequestElecBoard() {
    this.processBoardView().catch(console.error);
    try {
      if (!_.isNil(this.cronScheduler)) {
        this.cronScheduler.stop();
      }
      // 1분마다 요청
      this.cronScheduler = new cron.CronJob(
        this.config.inquirySchedulerInfo.intervalCronFormat,
        () => {
          this.inquirySchedulerRunMoment = moment();
          this.processBoardView().catch(console.error);
        },
        null,
        true,
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 현황판 출력을 처리하는 메소드
   */
  async processBoardView() {
    try {
      const boardData = await this.siteManager.getRefinedBoardData();

      if (_.isArray(boardData)) {
        boardData.forEach((data, index) => {
          setTimeout(() => {
            this.deviceManager.write(data).catch(err => BU.error(err.message));
          }, 100 * index);
        });
      } else if (_.isObject(boardData)) {
        this.deviceManager.write(boardData).catch(err => BU.CLI(err));
      } else {
        throw new Error('boardData is empty.');
      }
    } catch (error) {
      BU.CLI(error);
    }
  }
}
module.exports = Control;
