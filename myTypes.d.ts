import { CU } from 'base-util-jh';
import { Moment } from 'moment';
import SiteManager from './src/SiteManager/SiteManager';
const { Timer } = CU;
declare global {
  const SiteManager: SiteManager;
  const Timer: Timer;
  const Moment: Moment;
}
