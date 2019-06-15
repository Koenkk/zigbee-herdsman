var _ = require('busyman'),
    expect = require('chai').expect,
    fs = require('fs'),
    DataStore = require('nedb'),
    Db = require('../lib/db');

var db,
    dbPath = '../lib/database/objectbox.db';

fs.exists(dbPath, function (isThere) {
    if (isThere) { fs.unlink(dbPath); }
});

var nc1 = {
        id: 1,
        name: 'nc1',
        enabled: false,
        protocol: 'zigbee',
        startTime: 0,
        defaultJoinTime: 180,
        traffic: {
            in: { hits: 0, bytes: 0 },
            out: { hits: 0, bytes: 0 }
        }
    },
    nc2 = {
        id: 2,
        name: 'nc2',
        enabled: true,
        protocol: 'bluetooth',
        startTime: 19200,
        defaultJoinTime: 30,
        traffic: {
            in: { hits: 0, bytes: 0 },
            out: { hits: 3, bytes: 20 }
        }
    },
    nc3 = {
        id: 3,
        name: 'nc3',
        enabled: true,
        protocol: 'mqtt',
        startTime: 25000,
        defaultJoinTime: 60,
        traffic: {
            in: { hits: 5, bytes: 60 },
            out: { hits: 10, bytes: 300 }
        }
    },
    nc4 = {
        id: 4,
        name: 'nc4',
        enabled: false,
        protocol: 'coap',
        startTime: 600,
        defaultJoinTime: 90,
        traffic: {
            in: { hits: 0, bytes: 0 },
            out: { hits: 0, bytes: 0 }
        }
    };

describe('Constructor Check', function () {
    it('new Db()', function () {
        db = new Db(dbPath);
        expect(db._db).to.be.instanceof(DataStore);
        expect(function () { return new Db(10); }).to.throw();
    });
});

describe('Insert Check', function () {
    it('insert nc1', function (done) {
        db.insert(nc1, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc1, doc)) done();
        });
    });

    it('insert nc2', function (done) {
        db.insert(nc2, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc2, doc)) done();
        });
    });

    it('insert nc3', function (done) {
        db.insert(nc3, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc3, doc)) done();
        });
    });

    it('insert nc1 again', function (done) {
        nc1.defaultJoinTime = 60;
        db.insert(nc1, function (err, doc) {
            delete doc._id;
            if (_.isEqual(doc, nc1)) done();
        });
    });

    it('insert nc2 again', function (done) {
        nc2.defaultJoinTime = 90;
        db.insert(nc2, function (err, doc) {
            delete doc._id;
            if (_.isEqual(doc, nc2)) done();
        });
    });

    it('insert nc3 again', function (done) {
        nc3.defaultJoinTime = 30;
        db.insert(nc3, function (err, doc) {
            delete doc._id;
            if (_.isEqual(doc, nc3)) done();
        });
    });
});

describe('Find By Id Check', function () {
    it('find nc1', function (done) {
        db.findById(nc1.id, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc1, doc)) done();
        });
    });

    it('find nc2', function (done) {
        db.findById(nc2.id, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc2, doc)) done();
        });
    });

    it('find nc3', function (done) {
        db.findById(nc3.id, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc3, doc)) done();
        });
    });

    it('find nc4', function (done) {
        db.findById(nc4.id, function (err, doc) {
            if (!doc) done();
        });
    });

    it('insert nc4', function (done) {
        db.insert(nc4, function (err, doc) {
            delete doc._id;
            if (_.isEqual(doc, nc4)) done();
        });
    });

    it('find nc4', function (done) {
        db.findById(nc4.id, function (err, doc) {
            delete doc._id;
            if (_.isEqual(nc4, doc)) done();
        });
    });
});

describe('Modify Check', function () {
    it('modify() id', function (done) {
        db.modify(1, 'id', 5, function (err) {
            if (err) done();
        });
    });

    it('modify() id', function (done) {
        db.modify(1, 'id', { x: 10 }, function (err) {
            if (err) done();
        });
    });

    it('modify()', function (done) {
        db.modify(1, 'protocol', 'zigbeee', function (err, diff) {
            if (_.isEqual(diff, { protocol: 'zigbeee' })) done();
        });
    });

    it('modify()', function (done) {
        db.modify(1, 'startTime', 6500, function (err, diff) {
            if (_.isEqual(diff, { startTime: 6500 })) done();
        });
    });
    
    it('modify()', function (done) {
        db.modify(1, 'traffic.in', { hits: 1, bytes: 0 }, function (err, diff) {
            if (_.isEqual(diff, { hits: 1 })) done();
        });
    });

    it('modify()', function (done) {
        db.modify(1, 'traffic.in', { hits: 1, bytes: 50 }, function (err, diff) {
            if (_.isEqual(diff, { bytes: 50 })) done();
        });
    });

    it('modify()', function (done) {
        db.modify(1, 'traffic.in', { hits: 1 }, function (err, diff) {
            if (_.isEqual(diff, { })) done();
        });
    });

    it('modify() - find nothing', function (done) {
        db.modify(1, 'traffic.in', { hitss: 1 }, function (err) {
            if (err) done();
        });
    });

    it('modify() - find nothing', function (done) {
        db.modify(1, 'traffic', { hits: 1 }, function (err) {
            if (err) done();
        });
    });

    it('modify() - find nothing', function (done) {
        db.modify(1, 'Xtraffic', { hits: 1 }, function (err) {
            if (err) done();
        });
    });

    it('modify() - find nothing', function (done) {
        db.modify(5, 'traffic.in', { hits: 1 }, function (err) {
            if (err) done();
        });
    });
});

describe('Replace Check', function () {
    it('replace id', function (done) {
        db.replace(1, 'id', 5, function (err) {
            if (err) done();
        });
    });

    it('replace()', function (done) {
        db.replace(1, 'startTime', 20000, function (err) {
            if (err) {
                console.log(err);
            } else {
                db.findById(1, function (err, doc) {
                    if (doc.startTime === 20000) done();
                });
            }
        });
    });

    it('replace()', function (done) {
        db.replace(1, 'enabled', true, function (err) {
            if (err) {
                console.log(err);
            } else {
                db.findById(1, function (err, doc) {
                    if (doc.enabled === true) done();
                });
            }
        });
    });

    it('replace()', function (done) {
        db.replace(1, 'traffic.in.hits', 10, function (err) {
            if (err) {
                console.log(err);
            } else {
                db.findById(1, function (err, doc) {
                    if (doc.traffic.in.hits === 10) done();
                });
            }
        });
    });

    it('replace()', function (done) {
        db.replace(1, 'traffic.out', { hits: 5, bytes: 85 }, function (err) {
            if (err) {
                console.log(err);
            } else {
                db.findById(1, function (err, doc) {
                    if (_.isEqual(doc.traffic.out, { hits: 5, bytes: 85 })) done();
                });
            }
        });
    });

    it('replace() - find nothing', function (done) {
        db.replace(5, 'traffic.in.hits', 10, function (err) {
            if (err) done();
        });
    });

    it('replace() - find nothing', function (done) {
        db.replace(1, 'traffic.in.hitss', 10, function (err) {
            if (err) done();
        });
    });

    it('replace() - find nothing', function (done) {
        db.replace(1, 'trafficc.in.hitss', 10, function (err) {
            if (err) done();
        });
    });
});

describe('Find Check', function () {
    it('find()', function (done) {
        db.find({id: 3, name: 'nc3'}, function (err, docs) {
            delete docs[0]._id;
            if (_.isEqual(docs[0], nc3)) done();
        });
    });
});

describe('Find All Check', function () {
    it('findAll()', function (done) {
        db.findAll(function (err, docs) {
            if (_.size(docs) === 4) done();
        });
    });
});

describe('Remove By Id Check', function () {
    it('removeById()', function (done) {
        db.removeById(1, function () {
            db.findById(1, function(err, doc) {
                if (_.isNull(doc)) done();
            });
        });
    });
});
