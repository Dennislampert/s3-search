import S3Writer from '../utils/S3Writer';
import { factory } from '../utils/factory';

function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}

function uniqueId () {
    const y = new Date().getTime();
    const list = ['a', 'b', 'c', 'd', 'x', 'y', 't'];
    const min = 0;
    const x = Math.round(Math.random() * (list.length - min)) + min;
    const z = Math.round(Math.random() * (list.length - min)) + min;
    const a = Math.round(Math.random() * (list.length - min)) + min;
    const b = Math.round(Math.random() * (list.length - min)) + min;
    const joker = Math.round(Math.random() * (9 - min)) + min;
    const id = shuffle([joker, list[x], list[a], a, list[b], y, b, x, list[z]]);
    console.log(id);
    return id.join('');
}

export const actions = {
    _search: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {
                const s3 = S3Writer.getInstance(event);
                // TODO await s3 object from S3Writer....
                const S3Object = await s3.getCurrentData();
                const hits = {};
            
                if (query.hasOwnProperty('_id')) {
                    return S3Object[query._id];
                } else {
                    for (let i = 0; i < Object.keys(S3Object).length; i++) {
                        const doc = S3Object[Object.keys(S3Object)[i]];
                        const result = Object.keys(factory).reduce((acc, job) => {
                            let hit = false;
                            if (Object.keys(query).indexOf(job) > -1) {
                                hit = factory[job](doc, query[job]);
                            }
                            if (hit) {
                              return acc[i] = hit;
                            }
                            return acc;
                        }, {});
                        console.log('result::',result);
                        if (result && Object.keys(result).length) {
                            hits[Object.keys(S3Object)[i]] = result;
                        }
                    }
                }
                resolve(hits);
            } catch (ex) {
                console.log('err',ex)
                reject({
                    error: `${ex}`,
                    message: 'this can hapen if you e.g try to search inside a boolean or int'
                });
            } 
        });
    },
    _insert: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {    
                const s3 = S3Writer.getInstance(event);
                const S3Object = await s3.getCurrentData();
                // NOTE: this will override existing keys
                if (
                    Object.keys(query).length &&
                    Object.keys(query)[0] === query[Object.keys(query)[0]]._id
                ) {
                    console.log('saving.. has equal id:, ');
                    await s3.save(Object.assign({}, S3Object, query));
                    return resolve({saved: query, status:200});
                } else if (query.hasOwnProperty('_id')) {
                    console.log('saving.. Has id');
                    S3Object[query._id] = query;
                    await s3.save(S3Object);
                    return resolve({updated: query, status:200});
                } else {
                    console.log('inside else');
                    const id = uniqueId();
                    console.log('inside else id:: ', id);
                    const newQuery = Object.assign({}, {_id: id}, query);
                    S3Object[id] = newQuery;
                    await s3.save(S3Object);
                    return resolve({saved: newQuery, status:200});
                }
                
            } catch (ex) {
                console.log(ex);
                const error = `${ex}`;
                reject({
                    error: error,
                    message: 'this can hapen if you e.g mess with ids or object structure'
                });
            } 
        });
    },
    // TODO: add a _UPDATE that search for the id to update and possiblilliyt to change one field without pass all data. Prio!
    _delete: (query, event) => {
        return new Promise( async (resolve, reject) => {
            try {
                const s3 = S3Writer.getInstance(event);
                const S3Object = await s3.getCurrentData();
                if (query.hasOwnProperty('_id')) {
                    // something like...
                    delete S3Object[query._id];
                    const s3_2 = await S3Writer.getInstance(event);
                    s3_2.save(S3Object);
                    resolve({status: 200, message: `Deleted document with id: ${query._id}` });
                    
                }
            } catch (ex) {
                reject(ex);
            } 
        });
    },
};

/*
{
    8uwud9s08d: {
        _id: 8uwud9s08d,
        user:'kalle',
        payments: [
            23,
            33,
            44
        ],
        currency: 'sk';
        timestamp: 89234203984,
        description: 'This is a true storry of a kopinget buyer'
        
    }
}

 {
    fields: ['user', 'payments', 'currency'],
    filter: {
        // filtering or selection should be used dot separated to search in structure
        payments: { lte: 25, gt: 15 },
        timestamp: { gt: 89230480 },
        currency: {
            must: 'kr',
        },
        description: {
            must: 'This is a true storry of a kopinget buyer',
            contains: ['inget']
            must_not: ['bubbel']
        }
    },
 }

*/