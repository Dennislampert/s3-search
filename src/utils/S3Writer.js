import AWS from 'aws-sdk';
import EventCache from './EventCache';
const NODE_ENV = process.env.NODE_ENV || 'development';
let instances = {};

export default class S3Writer extends EventCache {
    constructor(event, instanceId) {
        super();
        this.s3 = S3Writer.getNewS3Instance();
        // bucet = db
        this.bucket = event.bucket;
        // path = table or now called type
        this.path = `${NODE_ENV.toLowerCase()}/${event.type}`;
        // index = file and can be user, backup etc
        this.file = event.index;
        this.finish = event.reply;
        this.instanceId = instanceId;
    }

    static getNewS3Instance() {
        return new AWS.S3({
            httpOptions: {
                timeout: 60000,
            },
        });
    }
    
    get instanceId() {
        return this._instanceId;
    }
    
    set instanceId(instanceId) {
        this._instanceId = instanceId;
    }

    static getInstance(event) {
        const instanceId = [event.bucket, event.path, event.file].join('-');
        if (instances.hasOwnProperty(instanceId)) {
            // dont run same instance in process
            return instances[instanceId];
        }
        instances[instanceId] = new S3Writer(event, instanceId);
        return instances[instanceId];
    }

    /**
     * Get the full file path within the bucket.
     * Defaults to current
     * @param tag
     * @returns {string}
     */
    getFilePath(tag = 'current') {
        return `${this.path}/${this.file}.${tag}.json`;
    }

    /**
     * Get current file
     *
     * @params {object} S3 specific params
     * (see s3 documentation http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html)
     */
    getCurrentData(onlyBodyAsJson = true, params = {}) {
        return new Promise((resolve, reject) => {
            if (this.cache) {
                console.log('Found server cache');
                return resolve(this.cache);
            }
            console.log('No-cache found');
            const key = this.getFilePath();
            const s3Params = Object.assign({},
                params,
                {
                    Bucket: this.bucket,
                    Key: this.getFilePath(),
                });
            this.s3.getObject(s3Params, (err, data) => {
                /*
                    Response incluudes else then Body
                    {
                        "AcceptRanges": "bytes",
                        "LastModified": "2017-06-09T18:17:52.000Z",
                        "ContentLength": 1289760,
                        "ETag": "\"7b81d9b687283e28fe02d23e9955750b\"",
                        "ContentType": "application/octet-stream",
                        "Metadata": {}
                    }
                */

                /*
                 * E.g. first time ever
                 */
                if (err && err.code === 'NoSuchKey') {
                    return resolve({});
                } else if (err) {
                    /*
                     * Don't log NotModified e.g. when using etags or since
                     */
                    if (err.statusCode !== 304) {
                        console.log(err, `Error getting s3 key ${key}`);
                    }
                    return reject(err);
                }

                if (data) {
                    try {
                        const obj = onlyBodyAsJson
                            ? JSON.parse(data.Body)
                            : data;
                        console.log('saveding envent cache...');
                        this.cache = obj;
                        return resolve(obj);
                    } catch (e) {
                        console.log(e, 'You are asking for json format but it is not.');
                        return reject(e);
                    }
                }
                return resolve({});
            });
        });
    }
    
    save(newCacheObject) {
        this.cache = newCacheObject;
    }

    /**
     * Save data to S3.
     * Return true if success, else false.
     * @param data
     * @param toLowerCase {Boolean.<Optional>}
     * @returns {Promise.<boolean>}
     */
    async writeCache(data, toLowerCase = false, backup = false) {

        try {
            const tag = new Date().toISOString();
            const keyWithTimestamp = this.getFilePath(tag);
            const currentKey = this.getFilePath();

            if (backup) {
                await this.putData(data, keyWithTimestamp, toLowerCase);
            } else {
                await this.putData(data, currentKey, toLowerCase);
            }
        } catch (ex) {
            console.log(ex, 'Unable to store channels file to S3.', data);
            this.emit('done');
            return false;
        }
        this.emit('done');
        return true;
    }

    /**
     * Put sites and channels to S3
     * @param data
     * @param key
     * @param toLowerCase {Boolean.<Optional>}
     * @returns {Promise}
     */
    putData(data, key, toLowerCase = false) {
        return new Promise((resolve, reject) => {
            let jsonString;
            try {
                jsonString = toLowerCase
                    ? JSON.stringify(data).toLowerCase() : JSON.stringify(data);
                JSON.parse(jsonString); // sanity check
            } catch (ex) {
                return reject(ex);
            }
            if (jsonString.length < 5) {
                const error = new Error(
                    `Hmm, incoming json is too short. ${jsonString}`
                );
                return reject(error);
            }

            return this.s3.putObject({
                Bucket: this.bucket,
                Key: key,
                Body: jsonString,
            }, (err, resp) => {
                if (!err && resp) {
                    return resolve();
                }
                console.log(err, `Unable to store channels file ${key} to S3.`);
                const error = new Error('Unable to save changes');
                return reject(error);
            });
        });
    }
}