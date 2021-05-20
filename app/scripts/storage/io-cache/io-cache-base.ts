import { Logger } from 'util/logger';

export abstract class IoCacheBase {
    protected readonly cacheName: string;
    protected readonly logger: Logger;

    constructor(cacheName: string, logger: Logger) {
        this.cacheName = cacheName;
        this.logger = logger;
    }

    abstract save(id: string, data: ArrayBuffer): Promise<void>;
    abstract load(id: string): Promise<ArrayBuffer>;
    abstract remove(id: string): Promise<void>;
}
