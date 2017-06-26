import { config } from 'dotenv';
config();
const SERVER_PORT = process.env.SERVER_PORT || process.env.PORT || 8080;
import Hapi from 'hapi';


import { actions } from './methods/actions';

const server = new Hapi.Server();

server.connection({ port: SERVER_PORT, host: process.env.SERVER_IP || process.env.IP });

server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
        reply({
            message: 'Hejsan och välkommen till s3-search.. Some Swedish there.',
            status: 'S3 is connected an we are up and running',
            version: 'this is the first version, callit v0.0.0 :D hehe',
        });
    },
});

// routs to get payers
// server.route({
//     method: 'GET',
//     path: '/{type}/{index}',
//     handler: (request, reply) => {
//         console.time('processTime');
//         console.log('search');
//         try {
//             const action = '_search';
//             const event = {
//                 bucket: 'waib',
//                 type: request.params.type,
//                 index: request.params.index,
//             };
//             const query = {all: {}};
//             actions[action](query, event).then((event) => {
//                 console.timeEnd('processTime');
//                 reply(event);
//             }).catch((err) => {
//                 console.timeEnd('processTime');
//                 reply({ error: `${err}` });
//             });
//         } catch (ex) {
//             console.log('eroro', ex);
//             console.timeEnd('processTime');
//             reply({ error: `${ex}` });
//         }
// 
//     },
// });

 server.route({
     method: 'POST',
     path: '/{type}/{index}/{_action}',
     handler: (request, reply) => {
        console.log('_search');
        console.time('processTime');
        try {
            const event = { 
                bucket: 'waib',
                type: request.params.type,
                index: request.params.index,
            };
            const query = request.payload;
            actions[request.params._action](query, event).then((data) => {
                console.timeEnd('processTime');
                reply(data);
            }).catch((ex) => {
                console.log('error: ', ex);
                console.timeEnd('processTime');
                reply(ex);
            });
        } catch (ex) {
            console.log('error: ', ex);
            console.timeEnd('processTime');
            reply({ error: `${ex}` });
        }
     },
 });

server.start((err) => {
    console.log('started with settings: ',{ port: SERVER_PORT});
    if (err) {
        throw err;
    }
});
