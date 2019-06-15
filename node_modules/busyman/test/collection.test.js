var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of collection', function() {
    describe('#_.forEach', function () {
        var obj = { a: 0, b: 1, c: 'x', d: '2' },
            arr = [ 'x', 'y', 3, '0' ];

        it('should be a function', function () {
            expect(_.forEach).to.be.a('function');
        });

        it ('should iterates each properties of object', function () {
            var vals = [],
                keys = [],
                collection;

            _.forEach(obj, function (val, key, collect) {
                vals.push(val);
                keys.push(key);
                collection = collect;
            });

            expect(vals).to.be.deep.equal([ 0, 1, 'x', '2' ]);
            expect(keys).to.be.deep.equal([ 'a', 'b', 'c', 'd' ]);
            expect(collection).to.be.deep.equal(obj);
        });

        it ('iteration should exit if iteratee functions return false', function () {
            var vals = [],
                keys = [],
                collection;

            _.forEach(obj, function (val, key, collect) {
                vals.push(val);
                keys.push(key);
                collection = collect;

                if (val === 'x')
                    return false;
            });

            expect(vals).to.be.deep.equal([ 0, 1, 'x' ]);
            expect(keys).to.be.deep.equal([ 'a', 'b', 'c' ]);
            expect(collection).to.be.deep.equal(obj);
        });

        it ('should iterates each properties of array', function () {
            var vals = [],
                keys = [],
                collection;

            _.forEach(arr, function (val, key, collect) {
                vals.push(val);
                keys.push(key);
                collection = collect;
            });

            expect(vals).to.be.deep.equal([ 'x', 'y', 3, '0' ]);
            expect(keys).to.be.deep.equal([ 0, 1, 2, 3 ]);
            expect(collection).to.be.deep.equal(arr);
        });

        it ('should pass numeric index to iteratee if collection is an arguments', function () {
            var allNumericIndex = true;
            function foo() {
                _.forEach(arguments, function (v, i, collection) {
                    if (!_.isNumber(i) || !_.isInteger(i))
                        allNumericIndex = false;
                });
            }

            foo('a', 1, 'hello', {}, []);
            expect(allNumericIndex).to.be.true;
        });
    });

    describe('#_.includes', function () {
        var obj = { 'user': 'fred', 'age': 40 },
            arr = [1, 2, 3],
            str = 'pebbles';

        it('should be a function', function () {
            expect(_.includes).to.be.a('function');
        });

        it('should return true if value is in collection', function () {
            expect(_.includes(obj, 'fred')).to.be.equal(true);
            expect(_.includes(obj, 'freddy')).to.be.equal(false);
            expect(_.includes(arr, 2)).to.be.equal(true);
            expect(_.includes(arr, 4)).to.be.equal(false);
            expect(_.includes(str, 'eb')).to.be.equal(true);
            expect(_.includes(str, 'ese')).to.be.equal(false);
        });
    });

    describe('#_.size', function () {
        var obj = { 'user': 'fred', 'age': 40 },
            arr = [1, 2, 3],
            str = 'pebbles';

        it('should be a function', function () {
            expect(_.size).to.be.a('function');
        });

        it('should return size of collection', function () {
            expect(_.size()).to.be.equal(0);
            expect(_.size(obj)).to.be.equal(2);
            expect(_.size(arr)).to.be.equal(3);
            expect(_.size(str)).to.be.equal(7);
        });
    });

    describe('#_.filter', function () {
        var users = [
              { 'user': 'barney', 'age': 36, 'active': true },
              { 'user': 'fred',   'age': 40, 'active': false },
              { 'user': 'pebbles', 'active': true }
            ];

        it('should be a function', function () {
            expect(_.filter).to.be.a('function');
        });

        it('should return an array of all elements predicate returns truthy for', function () {
            var result1,
                result2,
                result3;

            result1 = _.filter(users, function (user) {
                return user.active === true;
            });
            expect(result1).to.be.deep.equal([users[0], users[2]]);

            result2 = _.filter(users, function (user) {
                return _.has(user, 'age');
            });
            expect(result2).to.be.deep.equal([users[0], users[1]]);
        });
    });

    describe('#_.find', function () {
        var users = [
              { 'user': 'barney',  'age': 36, 'active': true },
              { 'user': 'fred',    'age': 40, 'active': false },
              { 'user': 'pebbles', 'age': 1,  'active': true }
            ];

        it('should be a function', function () {
            expect(_.find).to.be.a('function');
        });

        it('should return the first element predicate returns truthy for', function () {
            var result1,
                result2;

            result1 = _.find(users, function (user) {
                return user.age < 40;
            });
            expect(result1).to.be.equal(users[0]);

            result2 = _.find(users, function (user) {
                return user.active === false;
            });
            expect(result2).to.be.equal(users[1]);
        });
    });

    describe('#_.every', function () {
        it('should be a function', function () {
            expect(_.every).to.be.a('function');
        });

        it('should return true if [ 1, 2, 3, 4, 5 ] all numbers', function () {
            var every = _.every([ 1, 2, 3, 4, 5 ], _.isNumber);
            expect(every).to.be.true;
        });

        it('should return false if [ 1, "xx", 3, 4, 5 ] all numbers', function () {
            var every = _.every([ 1, "xx", 3, 4, 5 ], _.isNumber);
            expect(every).to.be.false;
        });

        it('should return true if { x: 1, y: 2, z: 3 } all numbers', function () {
            var every = _.every({ x: 1, y: 2, z: 3 }, _.isNumber);
            expect(every).to.be.true;
        });

        it('should return true if { x: 1, y: 1, z: 1 } all numbers', function () {
            var every = _.every({ x: 1, y: 1, z: 1 }, function (v) {
                return v === 1;
            });
            expect(every).to.be.true;
        });
    });
});