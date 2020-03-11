const _ = require('lodash');

const { BU } = require('base-util-jh');
const { BM } = require('base-model-jh');

const SiteManager = require('../SiteManager');

const BiModule = require('../../model/BiModule');
const RefineModel = require('../../model/RefineModel');
const WeatherModel = require('../../model/WeatherModel');

class Muan100kW extends SiteManager {
  /**
   * 전광판을 뿌려주기 위한 설정 값을 이용한 생성자 초기화
   * @param {ebBoardConfig} ebBoardConfig
   */
  constructor(ebBoardConfig) {
    super(ebBoardConfig);

    BU.debugConsole(10);

    this.biModule = new BiModule(this.dbInfo);
    this.refineModel = new RefineModel(this.dbInfo);
    this.weatherModel = new WeatherModel(this.dbInfo);

    this.siteNumber = null;

    // this.setSiteNumber();

    _.once(this.setSiteNumber);
  }

  async setSiteNumber() {
    const { projectUuid } = this.projectInfo;
    const mainWhere = _.isString(projectUuid) ? { uuid: projectUuid } : null;

    if (mainWhere === null) return false;

    const mainRow = await this.biModule.getTableRow('MAIN', mainWhere);

    this.siteNumber = _.get(mainRow, 'main_seq', null);
  }

  /**
   * 전광판 데이터 정제
   * @implements
   * @return {Promise<Object|Object[]>}
   */
  async getBoardData() {
    await this.setSiteNumber();

    // BU.CLI('refineGeneralPowerInfo');
    const { powerGenerationInfo } = await this.refineModel.refineGeneralPowerInfo(this.siteNumber);

    /** @type {WEATHER_DEVICE_DATA} */
    const weatherDeviceRow = await this.weatherModel.getWeatherDeviceRow();

    // 기상 환경 정보 합침
    _.assign(powerGenerationInfo, {
      solar: _.get(weatherDeviceRow, 'solar', 0),
      temp: _.get(weatherDeviceRow, 'temp', 0),
    });

    return powerGenerationInfo;
  }

  /**
   * @implements
   * 각 전광판 프로토콜맵에 따른 데이터 형식 변환
   * @param {Object} boardData
   * @param {number} boardData.currKw
   * @param {number} boardData.cumulativePower
   * @param {number} boardData.solar
   * @param {number} boardData.temp
   * @param {number} boardData.co2
   */
  encodingBoardData(boardData) {
    BU.CLI(boardData);
    // BU.CLIN(this);
    const { co2, cumulativePower, currKw, solar, temp } = boardData;

    // 실제 뿌려질 데이터 형식을 정의 (형식에 맞지 않는 데이터일 경우 소수점 강제 부여)
    const ebViewLength = 4;
    // 현황판 데이터 목록
    const ebViewList = [
      _.padStart(this.convertFixedData(currKw, 1), ebViewLength, ' '),
      _.padStart(this.convertFixedData(cumulativePower, 1), ebViewLength, ' '),
      _.padStart(solar, ebViewLength, ' '),
      _.padStart(this.convertFixedData(temp, 1), ebViewLength, ' '),
      _.padStart(this.convertFixedData(co2, 1), ebViewLength, ' '),
    ];

    // BU.CLI(ebViewList);

    // BU.CLI(this.ebBoardConfig);
    const STX = Buffer.from('1002', 'hex');
    const ETX = Buffer.from('1003', 'hex');
    const DST = Buffer.alloc(1, this.ebBoardConfig.deviceInfo.target_id);
    // BU.CLI(DST);
    const CMD = Buffer.from('94', 'hex');
    // 00 고정
    const bufPage = Buffer.from('00', 'hex');
    // 00: 0번, 01: 1번, 02: 2번
    const bufSection = Buffer.from('00', 'hex');
    // 00: Off, 01: 1회, ... 63: ON
    const bufViewControl = Buffer.from('63', 'hex');
    // 00: Normal, 01: Clear
    const bufViewWay = Buffer.from('01', 'hex');
    // 00: 완성형(한글), 01: 유니코드
    const bufCharCode = Buffer.from('00', 'hex');
    // 01: 12(pixel), 02: 12, 03: 16, 04: 20, ...
    const bufCharSize = Buffer.from('03', 'hex');
    // 00: , 06: 이동하기-왼쪽
    const bufEntranceEffect = Buffer.from('01', 'hex');
    const bufExitEffect = Buffer.from('00', 'hex');
    // 00: 사용하지 않음
    const bufSubEffect = Buffer.from('00', 'hex');
    // 입장/퇴장 효과를 위한 상대적인 속도로, 수치가 작을수록 속도가 빠릅니다
    const bufEffectSpeed = Buffer.from('00', 'hex');
    // 효과를 구현한 후의 유지시간 설정 코드 (헥삭밧 x 0.5초)
    const bufEffectMaintain = Buffer.from('00', 'hex');
    // 화면 분할 시 각 섹션(00/01/02)의 시작/종료 좌표값 (4 픽셀 단위로 설정)
    const bufStartX = Buffer.from('00', 'hex');
    const bufStartY = Buffer.from('00', 'hex');
    const bufEndX = Buffer.from('00', 'hex');
    const bufEndY = Buffer.from('00', 'hex');
    // 00: 사용안함
    const bufBG = Buffer.from('00', 'hex');
    // 0:검정, 1:적색(Red), 2:녹색(Green), 3:노랑(Yellow), 4:파랑(Blue), 5:분홍(Red Orange)
    const fontColor = '01';

    // 16 Byte 고정 표시 속성 정의
    const bufferHeader = Buffer.concat([
      bufPage,
      bufSection,
      bufViewControl,
      bufViewWay,
      bufCharCode,
      bufCharSize,
      bufEntranceEffect,
      bufExitEffect,
      bufSubEffect,
      bufEffectSpeed,
      bufEffectMaintain,
      bufStartX,
      bufStartY,
      bufEndX,
      bufEndY,
      bufBG,
    ]);

    // BU.CLI(ebViewList);
    const encodingBoardBodyBuffer = _.reduce(
      ebViewList,
      (prev, strData) => {
        // 문자 색상 컬러를 표시문자 길이 만큼 동일 색상으로 지정
        let fontColorList = '';
        for (let idx = 0; idx < strData.length; idx += 1) {
          fontColorList += fontColor;
        }

        // 최종 인코딩 Buffer 정의
        prev.colorBuffer = Buffer.concat([prev.colorBuffer, Buffer.from(fontColorList, 'hex')]);
        prev.charBuffer = Buffer.concat([prev.charBuffer, Buffer.from(strData)]);

        return prev;
      },
      { colorBuffer: Buffer.alloc(0), charBuffer: Buffer.alloc(0) },
    );
    // BU.CLI(encodingBoardBodyBuffer);

    // 프로토콜에 맞는 패킷 Length 정의(sum[명령 길이(1), 표시속성길이(16), 문자색상(동적), 표시문자(동적)])
    const charBufferLength = _(encodingBoardBodyBuffer)
      .map(encodingBuffer => encodingBuffer.length)
      .sum();
    // BU.CLI(charBufferLength);
    const LEN = this.protocolConverter.convertNumToHxToBuf(_.sum([1, 16, charBufferLength]), 2);
    // BU.CLIS(STX, DST, LEN, CMD, bufferHeader);

    // 최종 인코딩 Buffer 정의
    return Buffer.concat([
      STX,
      DST,
      LEN,
      CMD,
      bufferHeader,
      encodingBoardBodyBuffer.colorBuffer,
      encodingBoardBodyBuffer.charBuffer,
      ETX,
    ]);

    // const encodingBoardDataList = _.map(ebViewList, (strData, index) => {
    //   // 문자 색상 컬러를 표시문자 길이 만큼 동일 색상으로 지정
    //   let fontColorList = '';
    //   for (let idx = 0; idx < strData.length; idx += 1) {
    //     fontColorList += fontColor;
    //   }

    //   // 프로토콜에 맞는 패킷 Length 정의(sum[명령 길이(1), 표시속성길이(16), 문자색상(동적), 표시문자(동적)])
    //   const LEN = this.protocolConverter.convertNumToHxToBuf(_.sum([1, 16, fontColorList.length]));

    //   // 최종 인코딩 Buffer 정의
    //   return Buffer.concat([
    //     STX,
    //     this.protocolConverter.convertNumToHxToBuf(index, 1),
    //     LEN,
    //     CMD,
    //     bufferHeader,
    //     Buffer.from(fontColorList, 'hex'),
    //     Buffer.from(strData),
    //     ETX,
    //   ]);
    // });

    // BU.CLI(encodingBoardDataList);

    // return encodingBoardDataList;
  }
}
module.exports = Muan100kW;
