import { config } from 'dotenv';
config();
const SERVER_PORT = process.env.PORT || 8089;
import Hapi from 'hapi';


import { actions } from './methods/actions';

const server = new Hapi.Server();

server.connection({ port: SERVER_PORT, host:process.env.IP });

server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
        console.log(request.params);
        reply({
            message: 'Hejsan och välkommen till s3-search.. Some Swedish there.',
            status: 'S3 is connected an we are up and running',
            version: 'this is the first version, callit v0.0.0 :D hehe',
        });
    },
});

// routs to get payers
server.route({
    method: 'GET',
    path: '/{type}/{index}',
    handler: (request, reply) => {
        console.log('kjaskjdlkj');
        try {
            const action = '_search';
            const event = { 
                bucket: 'waib',
                type: request.params.type,
                index: request.params.index,
            };
            const query = {all: {'_id': '*'}};
            console.log('executing');
            actions[action](query, event).then((event) => {
                reply(event);
            }).catch((err) => {
                console.log('catch', err);
                reply({ error: err });
            });
        } catch (ex) {
            console.log('catch', ex);
            reply({ error: `${ex}` });
        }

    },
});

 server.route({
     method: 'POST',
     path: '/{type}/{index}/{_action}',
     handler: (request, reply) => {
        console.log('kjaskjdlkjasdsada');
        try {
            const event = { 
                bucket: 'waib',
                type: request.params.type,
                index: request.params.index,
            };
            console.log(request.payload);
            const query = request.payload;
            console.log('ruuun');
            actions[request.params._action](query, event).then((data) => {
                console.log('insert--data:', data);
                reply(data);
            }).catch((ex) => {
                reply(ex);
            });
        } catch (ex) {
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
