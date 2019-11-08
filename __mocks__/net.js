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

    connect = jest.fn(() => {
        this.emit('connect');
        this.emit('ready');
    })

    on = jest.fn().mockImplementation((ev, cb) => cb());

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