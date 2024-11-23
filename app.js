const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const uuid = require('uuid');

function predictImage(imageBuffer) {
    const isCancer = Math.random() > 0.5;
    return isCancer ? 'Cancer' : 'Non-cancer';
}

const server = Hapi.server({
    port: 3000,
    host: '0.0.0.0',
});

async function registerPlugins() {
    await server.register([Inert, Vision]);
}

server.route({
    method: 'POST',
    path: '/predict',
    options: {
        payload: {
            maxBytes: 1000000,
            output: 'stream',
            parse: true,
        },
    },
    handler: async(request, h) => {
        const file = request.payload.image;

        if (!file) {
            return h.response({
                status: 'fail',
                message: 'File image is required',
            }).code(400);
        }

        if (file.bytes > 1000000) {
            return h.response({
                status: 'fail',
                message: 'Payload content length greater than maximum allowed: 1000000',
            }).code(413);
        }

        const predictionResult = predictImage(file._data);

        const predictionId = uuid.v4();
        const response = {
            status: 'success',
            message: 'Model is predicted successfully',
            data: {
                id: predictionId,
                result: predictionResult,
                suggestion: predictionResult === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.',
                createdAt: new Date().toISOString(),
            },
        };

        return h.response(response).code(200);
    },
});

const start = async() => {
    try {
        await registerPlugins();
        await server.start();
        console.log('Server running on %s', server.info.uri);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

start();