import {
    Writer as UnpiWriter,
    Parser as UnpiParser,
    Frame as UnpiFrame,
    Constants as UnpiConstants,
} from '../unpi';

import {wait} from '../utils';

import SerialPort from 'serialport';
import events from 'events';
import Queue from 'queue';

const debug = {
    error: require('debug')('znp:error'),
    log: require('debug')('znp:log'),
    SREQ: require('debug')('znp:SREQ'),
    AREQ: require('debug')('znp:AREQ'),
    SRSP: require('debug')('znp:SRSP'),
};

const resetCmds = ['resetReq', 'systemReset'];
const sreqTimeout = 6000;

var zmeta = require('./zmeta'),
    ZpiObject = require('./zpiObject');

var MT = {
    CMDTYPE: zmeta.CmdType,
    SUBSYS: zmeta.Subsys,
    SYS: zmeta.SYS,
    MAC: zmeta.MAC,
    AF: zmeta.AF,
    ZDO: zmeta.ZDO,
    SAPI: zmeta.SAPI,
    UTIL: zmeta.UTIL,
    DBG: zmeta.DBG,
    APP: zmeta.APP,
    APP_CNF: zmeta.APP_CNF
};

class Znp extends events.EventEmitter {
    private static instance: Znp;

    private serialPort: SerialPort;
    private unpiWriter: UnpiWriter;
    private unpiParser: UnpiParser;
    private initialized: boolean;
    private queue: Queue;

    private constructor() {
        super();

        this.initialized = false;

        this.queue = new Queue();
        this.queue.concurrency = 1;
        this.queue.autostart = true;

        this.onUnpiParsed = this.onUnpiParsed.bind(this);
        this.onUnpiError = this.onUnpiError.bind(this);
        this.onSerialPortClose = this.onSerialPortClose.bind(this);
        this.onSerialPortError = this.onSerialPortError.bind(this);
    }

    private onUnpiParsed(frame: UnpiFrame): void {
        // TODO this.emit('data', data);
        try {
            const argObj = new ZpiObject(frame.subsys, frame.cmd);
            // frame.type = zmeta.CmdType.get(frame.type).key;    // make sure data.type will be string
            // frame.subsys = argObj.subsys;                     // make sure data.subsys will be string
            // frame.cmd = argObj.cmd;                           // make sure data.cmd will be string

            argObj.parse(frame.type, frame.len, frame.payload, function (err, result) {
                console.log(result);
                frame.payload = result;

                //debug(data);

                setImmediate(function () {
                    if (err) {
                        debug(err); // just print out. do nothing if incoming data is invalid
                        return;
                    }

                    var rxEvt,
                        msg,
                        subsys = frame.subsys,
                        cmd = frame.cmd,
                        result = frame.payload;

                    if (frame.type === 'SRSP') {
                        logSrsp('<-- %s, %o', subsys + ':' + cmd, result);
                        rxEvt = 'SRSP:' + subsys + ':' + cmd;
                        this.emit(rxEvt, result);
                    } else if (frame.type === 'AREQ') {
                        logAreq('<-- %s, %o', subsys + ':' + cmd, result);
                        rxEvt = 'AREQ';
                        msg = {
                            subsys: subsys,
                            ind: cmd,
                            data: result
                        };

                        this.emit(rxEvt, msg);

                        if (subsys === 'SYS' && cmd === 'resetInd') {
                            rxEvt = 'AREQ:SYS:RESET';
                            this.emit(rxEvt, result);
                        }
                    }
                });
            });
        } catch (error) {
            console.log(error);
            //todo self._mtIncomingDataHdlr(e, data);
        }
    }

    private onUnpiError(error: Error): void {
        debug.error(`Got unpi error ${error}`);
        // TODO: close here?
    }

    private onSerialPortClose(): void {
        debug.log('Serialport closed');
        this.emit('close');
    }

    private onSerialPortError(error: Error): void {
        debug.log(`Serialport error: ${error}`);
    }

    public init(path: string, options: {baudRate: number; rtscts: boolean}): Promise<void> {
        debug.log(`Initializing with ${path} and ${JSON.stringify(options)}`);
        this.serialPort = new SerialPort(path, {...options, autoOpen: false});

        this.unpiWriter = new UnpiWriter();
        // @ts-ignore
        this.unpiWriter.pipe(this.serialPort);

        this.unpiParser = new UnpiParser();
        this.serialPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed);
        this.unpiParser.on('error', this.onUnpiError);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error: object): Promise<void> => {
                if (error) {
                    reject(`Error while initializing serialport '${error}'`);
                    // TODO this.serialPort.close();
                } else {
                    debug.log('Serialport opened');
                    await this.skipBootloader();
                    this.serialPort.once('close', this.onSerialPortClose);
                    this.serialPort.once('error', this.onSerialPortError);
                    this.initialized = true;
                    this.emit('ready'); // TODO: should be removed
                    resolve();
                }
            });
        });
    }

    private async skipBootloader(): Promise<void> {
        // Send magic byte: https://github.com/Koenkk/zigbee2mqtt/issues/1343 to bootloader
        // and give ZNP 1 second to start.
        const buffer = Buffer.from([0xef]);

        return new Promise((resolve, reject): void => {
            debug.log('Writing skip bootloader payload');
            this.serialPort.write(buffer, async (error): Promise<void> => {
                if (error) {
                    reject(`Error while sending skip bootloader payload '${error}'`);
                } else {
                    await wait(1000);
                    resolve();
                }
            });
        });
    }

    public static getInstance(): Znp {
        if (Znp.instance == null) {
            Znp.instance = new Znp();
        }

        return Znp.instance;
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (this.initialized) {
                this.serialPort.flush((): void => {
                    this.serialPort.close((error): void => {
                        error == null ?
                            resolve() :
                            reject(`Error while closing serialport '${error}'`);
                    });
                });
            } else {
                resolve();
            }
        });

    }

    public send(subsystem: string, command: string, payload: object): Promise<void> {
        if (!this.initialized) {
            throw new Error('Cannot request when znp has not been initialized yet');
        }

        const object = new ZpiObject(subsystem, command, payload);
        const message = `--> ${object.subsys} - ${object.cmd} - ${JSON.stringify(payload)}`

        return new Promise((resolve): void => {
            this.queue.push(async (): Promise<void> => {
                if (object.type === 'SREQ') {
                    debug.SREQ(message);
                    await this.sendSREQ(object);
                } else if (object.type === 'AREQ') {
                    debug.SREQ(message);
                    await this.sendAREQ(object);
                }

                resolve();
            });
        });
    }

    private unpiSend(type: any, subsys: any, cmdId: any, payload: any): void {
        type = UnpiConstants.Type[type];
        subsys = UnpiConstants.Subsystem[subsys];
        var frame = new UnpiFrame(type, subsys, cmdId, Array.from(payload));
        this.unpiWriter.writeFrame(frame);
    };

    private sendSREQ(object: any): Promise<void> {
        const frame = object.frame();
        const srspEvent = `SRSP:${frame.subsys}:${frame.cmd}`;

        if (!frame) {
            throw new Error("Failed to build frame");
        }

        this.unpiSend('SREQ', object.subsys, object.cmdId, frame);

        return new Promise((resolve): void => {
            this.once(srspEvent, (result): void => {
                debug.SRSP(JSON.stringify(result));
            });
        });
    }

    // const timeout = (argObj.cmd === 'bdbStartCommissioning' || argObj.cmd === 'startupFromApp') ? 6000 : 3000;
    // sreqTimeout = setTimeout(function () {
    //     if (self.listenerCount(srspEvt))
    //         self.emit(srspEvt, '__timeout__');

    //     sreqTimeout = null;
    // }, timeout);

    // // attach response listener
    // this.once(srspEvt, function (result) {
    //     self._spinLock = false;

    //     // clear timeout controller if it is there
    //     if (sreqTimeout) {
    //         clearTimeout(sreqTimeout);
    //         sreqTimeout = null;
    //     }

    //     // schedule next transmission if something in txQueue
    //     self._scheduleNextSend();

    //     // check if this event is fired by timeout controller
    //     if (result === '__timeout__') {
    //         logSrsp('<-- %s, __timeout__', argObj.subsys + ':' + argObj.cmd);
    //         callback(new Error('request timeout'));
    //     } else {
    //         self._resetting = false;
    //         callback(null, result);
    //     }
    // });

    // this._unpiSend('SREQ', argObj.subsys, argObj.cmdId, payload);
    // }

    private sendAREQ(object: any): Promise<void> {
        const frame = object.frame();

        if (!frame) {
            throw new Error("Failed to build frame");
        }

        this.unpiSend('AREQ', object.subsys, object.cmdId, frame);

        return new Promise((resolve): void => {
            if (resetCmds.includes((frame.cmd))) {
                this.queue.splice(1, this.queue.length);
                this.once('AREQ:SYS:RESET', (): void => resolve());
            } else {
                resolve();
            }
        });
    }
}

/*********************************/
/*** Create Request Shorthands ***/
/*********************************/
// example: ccznp.sysRequest(), ccznp.zdoRequest()
// var namespaces = [ 'SYS', 'MAC', 'NWK', 'AF', 'ZDO', 'SAPI', 'UTIL', 'DBG', 'APP', 'APP_CNF' ];

// namespaces.forEach(function (subsys) {
//     var reqMethod = subsys.toLowerCase() + 'Request';
//     CcZnp.prototype[reqMethod] = function (cmdId, valObj, callback) {
//         return this.request(subsys, cmdId, valObj, callback);
//     };
// });

/*************************************************************************************************/
/*** Export as a singleton                                                                     ***/
/*************************************************************************************************/

export default Znp;
