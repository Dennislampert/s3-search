import EventEmitter from 'events';

export default class EventCache extends EventEmitter {
    constructor() {
        super();
        this._cache = false;
        this.processingEvent = false;
        this.requestStocked = false;
        this.backupEveryXH = +process.env.BACKUP_EVERY_X_H || 1;// every one hour
        this.lastBackupTime = 0;
        this.lastCangeTime = 0;
        this.on('done', this.eventCheck);
        this.backupHandler();
    }

    get cache() {
        console.log('fetching cache');
        return this._cache;
    }

    set cache(s3Object) {
        // if cahce exist we will override it and trigger a save
        if (this.cache) {
            this.lastCangeTime = new Date().getTime();
            console.log('override envent cache');
            this._cache = s3Object;
            this.writeCache(this.cache);
        } else {
            // e.g first time, we only set the cache
            console.log('initalized envent cache');
            this._cache = s3Object;
        }
    }

    saveEventCache() {
        if (!this.processingEvent) {
            this.processingEvent = true;
            this.writeCache(this.cache);
        } else {
            this.requestQueued = true;
        }
    }

    eventCheck() {
        this.processingEvent = false;
        if (this.requestQueued) {
            this.requestQueued = false;
            this.saveEventCache();
        }
    }
    
    // checks if we have a backup of the latest data every x hour
    backupHandler() {
        setInterval( async () => {
            if (this.lastCangeTime > this.lastBackupTime) {
                try {
                    const success = await this.writeCache(this.cache, false, true);
                    if (success) {
                        console.log('saved backup');
                        this.lastBackupTime = new Date().getTime();
                    }
                } catch (ex) {
                    console.error(`Backup failed: ${ex}`);
                }
            } else {
                console.log('backup is not needed. (up to date)');
            }
        }, (1000 * 60 * 60 * this.backupEveryXH) || 1000);
    }
}
