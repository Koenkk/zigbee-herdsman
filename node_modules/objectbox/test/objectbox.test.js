var _ = require('busyman'),
    expect = require('chai').expect,
    fs = require('fs'),
    Db = require('../lib/db'),
    Storage = require('../lib/objectbox');

var dbPath = __dirname + '/../lib/database/objectbox.db',
    gadBox;

fs.exists(dbPath, function (isThere) {
    if (isThere) { fs.unlink(dbPath); }
});

var gad1 = {
        _id: null,
        _dev: {
            _netcore: 'ble-core',
            _id: 5,
            _net: {
                address: {
                    permanent: '0x78c5e570737f',
                    dynamic: '0'
                }
            }
        },
        _auxId: 0x2a1c,
        _panel: {
            enabled: false,
            profile: '',
            class: 'TempMeas',
        },
        _props: {
            name: 'gad1',
            description: 'for test'
        },
        _attrs: {
            temperature: 26
        },
        extra: null
    },
    gad2 = {
        _id: null,
        _dev: {
            _netcore: 'zigbee-core',
            _id: 8,
            _net: {
                address: {
                    permanent: '0x00124b00043126d1',
                    dynamic: '0x768e'
                }
            }
        },
        _auxId: 0x0003,
        _panel: {
            enabled: true,
            profile: 'HomeAutomation',
            class: 'light',
        },
        _props: {
            name: 'gad2',
            description: 'for test'
        },
        _attrs: {
            onoff: false
        },
        extra: null
    },
    gad3 = {
        _id: null,
        _dev: {
            _netcore: 'mqtt-core',
            _id: 13,
            _net: {
                address: {
                    permanent: '0x12345678',
                    dynamic: '0x1234'
                }
            }
        },
        _auxId: 3328,
        _panel: {
            enabled: true,
            profile: 'CommTempSensors',
            class: 'power',
        },
        _props: {
            name: 'gad3',
            description: 'for test'
        },
        _attrs: {
            power: 60
        },
        extra: null
    },
    gadInfo4 = {
        id: 4,
        dev: {
            id: 27,
            permAddr: '192.168.1.0'
        },
        auxId: '/light/0',
        panel: {
            enabled: false,
            profile: 'sersor',
            class: 'light',
        },
        props: {
            name: 'gad4',
            description: 'for test'
        },
        attrs: {
            onoff: false
        }
    },
    gadInfo5 = {
        id: 5,
        dev: {
            id: 40,
            permAddr: 'xxxxxxxxxx'
        },
        auxId: '0x1800.0x2a00',
        panel: {
            enabled: false,
            profile: 'sersor',
            class: 'humidity',
        },
        props: {
            name: 'gad5',
            description: 'for test'
        },
        attrs: {
            sensorValue: 60
        }
    };

gad1.dump = gad2.dump = gad3.dump = function () {
    return {
        id: this._id,
        dev: {
            id: this._dev._id,
            permAddr: this._dev._net.address.permanent
        },
        auxId: this._auxId,
        panel: this._panel,
        props: this._props,
        attrs: this._attrs
    };
};

describe('Constructor Check', function () {
    it('new Storage()', function () {
        gadBox = new Storage(dbPath, 100);
        expect(gadBox._count).to.be.equal(0);
        expect(gadBox._maxNum).to.be.equal(100);
        expect(gadBox._box).to.be.Object;
        expect(gadBox._db).to.be.instanceof(Db);
        expect(function () { return new Storage(1, 10); }).to.throw();
    });
});

describe('Functional Check', function () {
    it('isEmpty() - empty', function () {
        expect(gadBox.isEmpty()).to.be.true;
    });

    it('has() - empty', function () {
        expect(gadBox.has(1)).to.be.false;
    });

    it('get() - empty', function () {
        expect(gadBox.get(1)).to.be.undefined;
    });

    it('getCount() - empty', function () {
        expect(gadBox.getCount()).to.be.equal(0);
    });

    it('getMaxNum()', function () {
        expect(gadBox.getMaxNum()).to.be.eql(100);
    });

    it('set()', function (done) {
        gadBox.set(1, gad1, function (err, id) {
            gad1._id = id;
            if (id === 1) done();
        });
    });

    it('set()', function (done) {
        gadBox.set(2, gad2, function (err, id) {
            gad2._id = id;
            if (id === 2) done();
        });
    });

    it('set() - bad id', function (done) {
        gadBox.set(200, gad1, function (err) {
            if (err.message === 'id can not be larger than the maxNum.') done();
        });
    });

    it('set() - set repeat', function (done) {
        gadBox.set(1, gad1, function (err) {
            if (err.message === 'id: 1 has been used.') done();
        });
    });

    it('add()', function (done) {
        gadBox.add(gad3, function (err, id) {
            gad3._id = id;
            if (id === 3) done();
        });
    });

    it('isEmpty()', function () {
        expect(gadBox.isEmpty()).to.be.false;
    });

    it('has()', function () {
        expect(gadBox.has(1)).to.be.true;
    });

    it('get()', function () {
        expect(gadBox.get(1)).to.be.deep.equal(gad1);
    });

    it('getCount()', function () {
        expect(gadBox.getCount()).to.be.equal(3);
    });

    it('filter()', function () {
        var result1,
            result2,
            result3,
            result4;

        result1 = gadBox.filter(function (obj) {
            return obj.extra === null;
        });
        expect(result1).to.be.deep.equal([gad1, gad2, gad3]);

        result2 = gadBox.filter(function (obj) {
            return obj._auxId === 3328;
        });
        expect(result2).to.be.deep.equal([gad3]);

        result3 = gadBox.filter(function (obj) {
            return obj._id === 5;
        });
        expect(result3).to.be.deep.equal([]);

        result4 = gadBox.filter(function (obj) {
            return obj._xxx === 5;
        });
        expect(result4).to.be.deep.equal([]);

        expect(gadBox.filter('extra', null)).to.be.deep.equal([gad1, gad2, gad3]);
        expect(gadBox.filter('_auxId', 3328)).to.be.deep.equal([gad3]);
        expect(gadBox.filter('_id', 5)).to.be.deep.equal([]);
        expect(gadBox.filter('_xxx', 5)).to.be.deep.equal([]);
        expect(gadBox.filter('_panel.enabled', false)).to.be.deep.equal([gad1]);
    });

    it('find()', function () {
        expect(gadBox.find(function(o) { return o._panel.class === 'power'; })).to.be.deep.equal(gad3);
    });

    it('exportAllIds()', function () {
        expect(gadBox.exportAllIds()).to.be.deep.equal([1, 2, 3]);
    });

    it('exportAllObjs()', function () {
        expect(gadBox.exportAllObjs()).to.be.deep.equal([gad1, gad2, gad3]);
    });

    it('add() - with id', function (done) {
        gadBox.add(gad1, function (err, id) {
            if (id === 1) done();
        });
    });

    it('add() - no dump()', function (done) {
        gadBox.add(gadInfo4, function (err, id) {
            if (id === 4) done();
        });
    });

    it('set() - no dump()', function (done) {
        gadBox.set(5, gadInfo5, function (err, id) {
            if (id === 5) done();
        });
    });

    it('modify() - modify id', function (done) {
        gadBox.modify(1, 'id', 3, function (err) {
            if (err.message === 'id can not be modified.') done();
        });
    });

    it('modify() - with invalid id', function (done) {
        gadBox.modify(6, 'auxId', 500, function (err) {
            if (err.message === 'No such item of id: 6 for property modify.') done();
        });
    });

    it('modify() - with invalid property', function (done) {
        gadBox.modify(1, 'auxxId', 500, function (err) {
            if (err.message === 'No such property auxxId to modify.') done();
        });
    });

    it('modify()', function (done) {
        gadBox.modify(1, 'auxId', 500, function (err, result) {
            if (_.isEqual(result, {auxId: 500})) done();
        });
    });

    it('modify()', function (done) {
        gadBox.modify(3, 'attrs.power', 500, function (err, result) {
            if (_.isEqual(result, {attrs: {power: 500}})) done();
        });
    });

    it('modify()', function (done) {
        gadBox.modify(3, 'props', {name: 'gad33'}, function (err, result) {
            if (_.isEqual(result, {name: 'gad33'})) done();
        });
    });

    it('modify() - find nothing', function (done) {
        gadBox.modify(3, 'props', {name: 'gad33', description: 'hello'}, function (err, result) {
            if (_.isEqual(result, {description: 'hello'})) done();
        });
    });

    it('modify() - find nothing', function (done) {
        gadBox.modify(3, 'props', {namee: 'gad3', description: 'hello'}, function (err, result) {
            if (err) done();
        });
    });

    it('modify() - find nothing', function (done) {
        gadBox.modify(3, 'propss', {name: 'gad3', description: 'hello'}, function (err, result) {
            if (err) done();
        });
    });

    it('replace() - replace id', function (done) {
        gadBox.replace(1, 'id', 3, function (err, result) {
            if (err.message === 'id can not be replaced.') done();
        });
    });

    it('replace() - with invalid id', function (done) {
        gadBox.replace(6, 'id', 3, function (err, result) {
            if (err.message === 'No such item of id: 6 for property replace.') done();
        });
    });

    it('replace() - with invalid property', function (done) {
        gadBox.replace(1, 'auxIdd', 3, function (err, result) {
            if (err.message === 'No such property auxIdd to replace.') done();
        });
    });

    it('replace()', function (done) {
        gadBox.replace(3, 'props', {}, function () {
            gadBox.findFromDb({id: 3}, function (err, docs) {
                if (_.isEqual(docs[0].props, {})) done();
            });
        });
    });

    it('replace()', function (done) {
        gadBox.replace(3, 'attrs.power', 10, function () {
            gadBox.findFromDb({id: 3}, function (err, docs) {
                if (docs[0].attrs.power === 10) done();
            });
        });
    });

    it('sync() - with invalid id', function (done) {
        gadBox.sync(6, function (err) {
            if (err.message === 'No such obj of id: 6.') done();
        });
    });

    it('sync()', function (done) {
        gadBox.sync(1, function () {
            gadBox.findFromDb({id: 1}, function (err, docs) {
                delete docs[0]._id;

                if (_.isEqual(docs[0], gad1.dump())) 
                    done();
            });
        });
    });

    it('removeElement()', function () {
        expect(gadBox.removeElement(10)).to.be.false;
        expect(gadBox.removeElement(5)).to.be.true;
    });

    it('remove() - with invalid id', function (done) {
        gadBox.remove(8, function (err) {
            if (!err) done();
        });
    });

    it('remove()', function (done) {
        gadBox.remove(1, function (err) {
            if (!gadBox.get(1)) done();
        });
    });

    it('findFromDb()', function (done) {
        gadBox.findFromDb({ auxId: '/light/0' }, function (err, docs) {
            delete docs[0]._id;
            if (_.isEqual(docs[0], gadInfo4)) done();
        });
    });

    it('maintain()', function (done) {
        gadBox.maintain(function (err) {
            if (err) {
                console.log(err);
            } else {
                gadBox.findFromDb({id: {$exists: true}},function(err, docs) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (docs.length === 3) done();
                    }
                });
            }
        });
    });
});