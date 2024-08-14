const {Controller} = require('zigbee-herdsman');

const SERIAL = '/dev/ttyACM0';
const DB = './devices.db';

const coordinator = new Controller({
    serialPort: {path: SERIAL},
    databasePath: DB,
});

coordinator.on('message', async (msg) => {
    console.log(msg);
});

coordinator
    .start()
    .then(() => {
        console.log('started with device', SERIAL);
        return coordinator.permitJoin(true, null, 600);
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
