export const factory = {
    filter: (doc, order) => {
        const valid = Object.keys(order).every((prop) => {
            const func = Object.prototype.toString.call(doc[prop]);

            if (doc.hasOwnProperty(prop) && filterOptions.hasOwnProperty(func)) {
                return filterOptions[Object.prototype.toString.call(doc[prop])](
                    doc[prop],
                    order[prop],
                    prop
                );
            }
            return false;
        });
        return valid ? doc : false;
    },
    all: (doc, order) => {
        return doc;
    },
    fields: (doc, order) => {
        
    },
}

const filterOptions = {
    '[object String]': (a, b) =>
        Object.keys(b).every((condition) =>
            conditions[condition](a, b[condition])),
    '[object Array]': (a, b) => Object.keys(b).every((condition) => 
        conditions[condition](a, b[condition])),
    '[object Number]': (a, b) => Object.keys(b).every((condition) => 
        conditions[condition](a, b[condition])),
    '[object Object]': (a, b) => Object.keys(b).every((condition) => 
        conditions[condition](Object.keys(a), b[condition])),
    '[object Boolean]': (a, b) => {
    console.log('condition:, ',a, b);
    return Object.keys(b).every((condition) => 
        conditions[condition](a, b[condition]))},
};

const conditions = {
    must: (description, query) => description === query,
    must_not: (description, query) => description !== query,
    must_contain: (description, query) => 
        query.every(
            (con) => JSON.stringify(description,null,0).indexOf(con) !== -1
        ),
    must_not_contain: (description, query) =>
        query.every(
            (con) => JSON.stringify(description,null,0).indexOf(con) === -1
        ),
    gte: (description, query) => description >= query,
    lte: (description, query) => {
        console.log('condition: ',description, query);
        return description <= query
        
    },
    lt: (description, query) => description < query,
    gt: (description, query) => description > query,
}
// server cashe get queries response until file change
