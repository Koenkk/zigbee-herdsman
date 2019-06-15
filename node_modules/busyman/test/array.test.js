var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of function', function() {
    describe('#_.concat', function() {
        it('should be a function', function () {
            expect(_.concat).to.be.a('function');
        });

        it('should concat arrays and values', function () {
            var array = [1],
                actual = _.concat(array, 2, [3], [[4]]);

            expect(actual).to.be.eql([1, 2, 3, [4]]);
        });
    });

    describe('#_.drop', function() {
        var array = [1, 2, 3, 1, 2, 3];

        it('should be a function', function () {
            expect(_.drop).to.be.a('function');
        });

        it('should return all elements', function () {
            expect(_.drop(array)).to.be.eql([1, 2, 3, 1, 2, 3]);
        });

        it('should drop the first two elements', function () {
            expect(_.drop(array, 2)).to.be.eql([3, 1, 2, 3]);
        });

        it('should return an empty array when `n` >= `length`', function () {
            expect(_.drop(array, 8)).to.be.eql([]);
        });
    });

    describe('#_.dropRight', function() {
        var array = [1, 2, 3, 1, 2, 3];

        it('should be a function', function () {
            expect(_.dropRight).to.be.a('function');
        });

        it('should return all elements', function () {
            expect(_.dropRight(array)).to.be.eql([1, 2, 3, 1, 2, 3]);
        });

        it('should drop the last two elements', function () {
            expect(_.dropRight(array, 2)).to.be.eql([1, 2, 3, 1]);
        });

        it('should return an empty array when `n` >= `length`', function () {
            expect(_.dropRight(array, 8)).to.be.eql([]);
        });
    });

    describe('#_.findIndex', function() {
        var array = [1, 2, 3, 1, 2, 3];

        it('should be a function', function () {
            expect(_.findIndex).to.be.a('function');
        });

        it('should return 2 when find the first matched value', function () {
            expect(_.findIndex(array, function (element, index, array) {
                return element > 2;
            })).to.be.eql(2);
        });

        it('should return -1 when no matched value', function () {
            expect(_.findIndex(array, function (element, index, array) {
                return element > 4;
            })).to.be.eql(-1);
        });
    });

    describe('#_.indexOf', function() {
        var array = [1, 2, 3, 1, 2, 3, ['a', 'b']];

        it('should be a function', function () {
            expect(_.indexOf).to.be.a('function');
        });

        it('should return the index of the first matched value', function () {
               expect(_.indexOf(array, 3)).to.be.eql(2);
        });

        it('should work with a positive `fromIndex`', function () {
               expect(_.indexOf(array, 1, 2)).to.be.eql(3);
        });
    });

    describe('#_.join', function() {
        var array = ['a', 'b', 'c'];

        it('should be a function', function () {
            expect(_.join).to.be.a('function');
        });


        it('should return join all array elements into a string with default separator', function () {
            expect(_.join(array)).to.be.eql('a,b,c');
        });

        it('should return join all array elements into a string with given separator', function () {
            expect(_.join(array, '-')).to.be.eql('a-b-c');
        });
    });

    describe('#_.last', function() {
        var array = [1, 2, 3, 4];

        it('should be a function', function () {
            expect(_.last).to.be.a('function');
        });

        it('should return the last element', function () {
            expect(_.last(array)).to.be.eql(4);
        });

        it('should return `undefined` when querying empty array', function () {
            var array = [];

            expect(_.last(array)).to.be.eql(undefined);
        });
    });

    describe('#_.pull', function() {
        var array = ['a', 'b', 'c', 'a', 'b', 'c'];

        it('should be a function', function () {
            expect(_.pull).to.be.a('function');
        });

        it('should removes all given values from array', function () {
            expect(_.pull(array, 'a', 'c')).to.be.eql(['b', 'b']);
        });

        it('should return empty array when pull all values', function () {
            expect(_.pull(array, 'a', 'b', 'c')).to.be.eql([]);
        });
    });

    describe('#_.slice', function() {
        var array = [1, 2, 3];

        it('should be a function', function () {
            expect(_.slice).to.be.a('function');
        });

        it('should use a default `start` and a default `end`', function () {
            expect(_.slice(array)).to.be.eql([1, 2, 3]);
        });

        it('should use a given `start` and a default `end`', function () {
            expect(_.slice(array, 1)).to.be.eql([2, 3]);
        });

        it('should use a given `start` and a given `end`', function () {
            expect(_.slice(array, 1, 2)).to.be.eql([2]);
        });

        it('should return empty array when `start` > `length`', function () {
            expect(_.slice(array, 3)).to.be.eql([]);
        });

        it('should return empty array when `start` < `end`', function () {
            expect(_.slice(array, 3, 1)).to.be.eql([]);
        });
    });

    describe('#_.take', function() {
        var array = [1, 2, 3];

        it('should be a function', function () {
            expect(_.take).to.be.a('function');
        });

        it('should take the first two elements', function () {
            expect(_.take(array, 2)).to.be.eql([1, 2]);
        });

        it('should return all elements when use a default `n`', function () {
            expect(_.take(array)).to.be.eql([1, 2, 3]);
        });

        it('should return all elements when `n` >= `length`', function () {
            expect(_.take(array, 5)).to.be.eql([1, 2, 3]);
        });

        it('should return empty array when `n` = 0', function () {
            expect(_.take(array, 0)).to.be.eql([]);
        });
    });

    describe('#_.map', function() {
        var array = [1, 2, 3];

        it('should be a function', function () {
            expect(_.map).to.be.a('function');
        });

        it('should map values in array to a new array', function () {
            expect(_.map(array, String)).to.be.eql(['1', '2', '3']);
        });
    });

    describe('#_.reject', function() {
        var array = [1, 2, 3, 4],
            object = {
                'a': 1,
                'b': 2,
                'c': 3
            };

        it('should be a function', function () {
            expect(_.reject).to.be.a('function');
        });

        it('should reject values in array when `collection` is array and `pred` is a function', function () {
            expect(_.reject(array, function (val) { return val % 2 === 0; })).to.be.eql([1, 3]);
        });

        it('should reject values in array when `collection` is object and `pred` is a function', function () {
            expect(_.reject(object, function (val) { return val % 2 === 0; })).to.be.eql([1, 3]);
        });

        it('should throw when `pred` is a value', function () {
            expect(function () { _.reject(array, 4); }).to.throw(TypeError);
        });
    });

    describe('#_.some', function() {
        var array = [1, 3, 5, [ 'a', 'b' ], { a: 1, b: 2 }],
            object = {
                a: 1,
                b: 3,
                c: ['a', 'b'],
                d: {
                    x: 5,
                    y: 7
                }
            };

        it('should be a function', function () {
            expect(_.some).to.be.a('function');
        });

        it('should return when `collection` is array and `pred` is a function', function () {
            expect(_.some(array, function (val) { return val % 2 === 1; })).to.be.true;
            expect(_.some(array, function (val) { return val % 2 === 0; })).to.be.false;
        });

        it('should return when `collection` is object and `pred` is a function', function () {
            expect(_.some(object, function (val) { return val % 2 === 1; })).to.be.true;
            expect(_.some(object, function (val) { return val % 2 === 0; })).to.be.false;
        });

        it('should throw when `pred` is a value', function () {
            expect(function () { _.some(array, 3); }).to.throw(TypeError);
        });

        it('should throw when `pred` is a object', function () {
            expect(function () { _.some(array, { a: 1, b: 2 }); }).to.throw(TypeError);
        });
    });

    describe('#_.remove', function() {
        var array = [1, 2, 3, 4];

        it('should be a function', function () {
            expect(_.remove).to.be.a('function');
        });

        it('should modify the array and return removed elements when `pred` is a function', function () {
            expect(_.remove(array, function (val) { return val % 2 === 0; })).to.be.eql([2, 4]);
            expect(array).to.be.eql([1, 3]);
        });

        it('should modify the array and return removed elements when `pred` is a value', function () {
            var array = [1, 2, '3', '4'];

            expect(_.remove(array, '4')).to.be.eql(['4']);
            expect(array).to.be.eql([1, 2, '3']);
        });
    });
});
