import { Launcher } from 'comp/launcher';
import { IoFileCache } from './io-file-cache';
import { IoBrowserCache } from './io-browser-cache';

const IoCache = Launcher ? IoFileCache : IoBrowserCache;

export { IoCache };
