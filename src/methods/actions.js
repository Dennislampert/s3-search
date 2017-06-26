import S3Writer from '../utils/S3Writer';
import { factory } from '../utils/factory';
import { uniqueId } from '../utils/uniqueId';

export const actions = {
    _search: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {
                const s3 = S3Writer.getInstance(event);
                // TODO await s3 object from S3Writer....
                const S3Object = await s3.getCurrentData();
                let hits = {};
            
                if (query.hasOwnProperty('_id')) {
                    return S3Object[query._id];
                } else {
                    for (let i = 0; i < Object.keys(S3Object).length; i++) {
                        const doc = S3Object[Object.keys(S3Object)[i]];
                        const result = Object.keys(factory.doc).reduce((acc, jobx) => {
                            let jobDoc = false;
                            if (Object.keys(query).indexOf(jobx) > -1) {
                                jobDoc = factory.doc[jobx](doc, query[jobx]);
                            }
                            if (jobDoc) {
                                const hit = Object.keys(factory.hit).reduce((acc2, joby) => {
                                    let jobHit = false;
                                    if (Object.keys(query).indexOf(joby) > -1) {
                                        jobHit = factory.hit[joby](jobDoc, query[joby]);
                                    } else {
                                        return acc2 = jobDoc;
                                    }
                                    if (jobHit) {
                                        return acc2 = jobHit;
                                    }
                                    return acc2;
                                }, {});
                                return acc = hit;
                            }
                            return acc;
                        }, {});
                        
                        if (result && Object.keys(result).length) {
                            hits[Object.keys(S3Object)[i]] = result;
                        }
                    }
                }
                if (Object.keys(hits).length) {
                    const mrHits = Object.keys(factory.hits).reduce((acc, jobz) => {
                        let jobDone = false;
                        if (Object.keys(query).indexOf(jobz) > -1) {
                            jobDone = factory.hits[jobz](acc, query[jobz]);
                        }
                        if (jobDone) {
                            return acc = jobDone;
                        }
                        return acc;
                    }, hits);
                    hits = mrHits;
                }
                resolve(hits);
            } catch (ex) {
                console.log('err',ex);                
                const error = `${ex}`;
                reject({
                    error: error,
                    message: 'This can hapen if you e.g have incorrect query structure'
                });
            }
        });
    },
    // always generates an _id
    _insert: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {
                const s3 = S3Writer.getInstance(event);
                const S3Object = await s3.getCurrentData();
                const id = uniqueId();
                const newQuery = Object.assign({}, {_id: id}, query);
                S3Object[id] = newQuery;
                await s3.save(S3Object);
                resolve({saved: newQuery, status:200});
            } catch (ex) {
                console.log(ex);
                const error = `${ex}`;
                reject({
                    error: error,
                    message: 'This can hapen if you e.g have incorrect query structure'
                });
            } 
        });
    },
    _delete: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {
                const s3 = S3Writer.getInstance(event);
                const S3Object = await s3.getCurrentData();
                if (query.hasOwnProperty('_id')) {
                    if (S3Object[query._id]) {
                        if (Object.keys(query).length > 1 && query.hasOwnProperty('fields')) {
                            let s3Copy = S3Object;
                            const fields = [];
                            s3Copy = query.fields.reduce((acc, field) => {
                                if (acc[query._id][field]) {
                                    fields.push(field);
                                    delete acc[query._id][field];
                                }
                                return acc;
                            }, s3Copy);
                            s3.save(Object.assign({}, s3Copy));
                            resolve({status: 200, message: `Deleted fields [${fields.join(', ')}] in document with id: ${query._id}`});
                        } else {
                            delete S3Object[query._id];
                            s3.save(S3Object);
                            resolve({status: 200, message: `Deleted document with id: ${query._id}` });
                        }
                    } else {
                        resolve({status: 404, message: `Delete query _id ${query._id} didn't match any document`});
                    }
                } else {
                    resolve({status: 404, message: 'Delete query missing _id'});
                }
            } catch (ex) {
                const error = `${ex}`;
                reject({
                    error: error,
                    message: 'This can hapen if you e.g have incorrect query structure'
                });
            } 
        });
    },
    _update: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {
                const s3 = S3Writer.getInstance(event);
                const S3Object = await s3.getCurrentData();
                if (query.hasOwnProperty('_id')) {
                    if (S3Object[query._id]) {
                        // remove the id to have the object as the way object should look like
                        S3Object[query._id] = Object.assign({},S3Object[query._id], query);
                        s3.save(S3Object);
                        resolve({status: 200, message: `updated document with id: ${query._id}` });
                    } else {
                        resolve({status: 404, message: `Update query _id: ${query._id} didn't match any document`});
                    }
                } else {
                    resolve({status: 404, message: 'Update query missing _id'});
                }
            } catch (ex) {
                const error = `${ex}`;
                reject({
                    error: error,
                    message: 'This can hapen if you e.g have incorrect query structure'
                });
            }
        });
    }
};