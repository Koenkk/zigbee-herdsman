const net = jest.genMockFromModule('net')

import { EventEmitter } from 'events'

class MockTcpServer extends EventEmitter {

    listen = jest.fn((port) => {
        return this
    })

    close = jest.fn(() => {
        return this
    })

}

class MockTcpSocket extends EventEmitter {

    write = jest.fn();
    pipe = jest.fn();

    connect = jest.fn((port, host) => {
        this.port = port;
        this.host = host;
    })

    on = jest.fn().mockImplementation((ev, cb) => 
        {
            if (this.port == 666) {
                if (ev == 'error') {
                    cb();
                }
            } else {
                if (ev == 'connect' || ev == 'ready') {
                    cb();
                }
            }
            
        });

    setNoDelay = jest.fn();
}

let server = new MockTcpServer()
let socket = new MockTcpSocket()

function reset() {
    server = new MockTcpServer()
    socket = new MockTcpSocket()
    net.__server = server
    net.__socket = socket
}

function createServer(cb) {
    cb(socket)
    return server
}

net.createServer = createServer
net.__reset = reset
net.Socket = MockTcpSocket
net.Server = MockTcpSocket

net.__server = server
net.__socket = socket

module.exports = net