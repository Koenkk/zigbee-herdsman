var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of type checking', function() {
    describe('#_.isArray', function() {

        it('should be a function', function () {
            expect(_.isArray).to.be.a('function');
        });

        it('should return true with an input of array', function () {
            expect(_.isArray([ 1, 'xx', 3 ])).to.be.true;
        });

        it('should return false with an input of not array', function () {
            expect(_.isArray(null)).to.be.false;
            expect(_.isArray(undefined)).to.be.false;
            expect(_.isArray(NaN)).to.be.false;
            expect(_.isArray(1)).to.be.false;
            expect(_.isArray({})).to.be.false;
            expect(_.isArray(true)).to.be.false;
            expect(_.isArray('xxx')).to.be.false;
            expect(_.isArray(new Date())).to.be.false;
            expect(_.isArray(function () {})).to.be.false;
        });
    });

    describe('#_.isNaN', function() {
        it('should be a function', function () {
            expect(_.isNaN).to.be.a('function');
        });

        it('should return true with an input of not number', function () {
            expect(_.isNaN(undefined)).to.be.true;
            expect(_.isNaN(NaN)).to.be.true;
            expect(_.isNaN({})).to.be.true;
            expect(_.isNaN([1, 2])).to.be.true;
            expect(_.isNaN('xxx')).to.be.true;
            expect(_.isNaN(function () {})).to.be.true;
            expect(_.isNaN(new Date().toString())).to.be.true;
            expect(_.isNaN('blabla')).to.be.true;
            expect(_.isNaN(function () {})).to.be.true;
        });

        it('should return false with an input of number', function () {
            expect(_.isNaN(null)).to.be.false;
            expect(_.isNaN(true)).to.be.false;
            expect(_.isNaN(3)).to.be.false;
            expect(_.isNaN('37')).to.be.false;
            expect(_.isNaN('37.37')).to.be.false;
            expect(_.isNaN(new Date())).to.be.false;
            expect(_.isNaN([1])).to.be.false;
            expect(_.isNaN([])).to.be.false;
        });
    });

    describe('#_.isBuffer', function() {
        it('should be a function', function () {
            expect(_.isBuffer).to.be.a('function');
        });

        it('should return true with an input of buffer', function () {
            expect(_.isBuffer(new Buffer(0))).to.be.true;
            expect(_.isBuffer(new Buffer(1))).to.be.true;
            expect(_.isBuffer(new Buffer([ 1, 2 ]))).to.be.true;
        });

        it('should return false with an input of not buffer', function () {
            expect(_.isBuffer([])).to.be.false;
            expect(_.isBuffer({})).to.be.false;
            expect(_.isBuffer(undefined)).to.be.false;
            expect(_.isBuffer(NaN)).to.be.false;
            expect(_.isBuffer(null)).to.be.false;
            expect(_.isBuffer(true)).to.be.false;
            expect(_.isBuffer(3)).to.be.false;
            expect(_.isBuffer('37')).to.be.false;
            expect(_.isBuffer('37.37')).to.be.false;
            expect(_.isBuffer(new Date())).to.be.false;
            expect(_.isBuffer(function () {})).to.be.false;
        });
    });

    describe('#_.isInteger', function() {
        it('should be a function', function () {
            expect(_.isInteger).to.be.a('function');
        });

        it('should return true with an input of integer', function () {
            expect(_.isInteger(37)).to.be.true;
        });

        it('should return false with an input of not integer', function () {
            expect(_.isInteger([])).to.be.false;
            expect(_.isInteger({})).to.be.false;
            expect(_.isInteger(undefined)).to.be.false;
            expect(_.isInteger(NaN)).to.be.false;
            expect(_.isInteger(null)).to.be.false;
            expect(_.isInteger(true)).to.be.false;
            expect(_.isInteger('xxx')).to.be.false;
            expect(_.isInteger('37')).to.be.false;
            expect(_.isInteger('37.37')).to.be.false;
            expect(_.isInteger(new Date())).to.be.false;
            expect(_.isInteger(function () {})).to.be.false;
        });
    });

    describe('#_.isBoolean', function() {
        it('should be a function', function () {
            expect(_.isBoolean).to.be.a('function');
        });

        it('should return true with an input of boolean', function () {
            expect(_.isBoolean(true)).to.be.true;
            expect(_.isBoolean(false)).to.be.true;
        });

        it('should return false with an input of not boolean', function () {
            expect(_.isBoolean([])).to.be.false;
            expect(_.isBoolean({})).to.be.false;
            expect(_.isBoolean(undefined)).to.be.false;
            expect(_.isBoolean(NaN)).to.be.false;
            expect(_.isBoolean(null)).to.be.false;
            expect(_.isBoolean(66)).to.be.false;
            expect(_.isBoolean('xxx')).to.be.false;
            expect(_.isBoolean('37')).to.be.false;
            expect(_.isBoolean('37.37')).to.be.false;
            expect(_.isBoolean(new Date())).to.be.false;
            expect(_.isBoolean(function () {})).to.be.false;
        });
    });

    describe('#_.isNumber', function() {
        it('should be a function', function () {
            expect(_.isNumber).to.be.a('function');
        });

        it('should return true with an input of number', function () {
            expect(_.isNumber(66)).to.be.true;
            expect(_.isNumber(66.66)).to.be.true;
            expect(_.isNumber(-66)).to.be.true;
            expect(_.isNumber(-66.66)).to.be.true;
            expect(_.isNumber(NaN)).to.be.true;
        });

        it('should return false with an input of not number', function () {
            expect(_.isNumber([])).to.be.false;
            expect(_.isNumber({})).to.be.false;
            expect(_.isNumber(undefined)).to.be.false;
            expect(_.isNumber(null)).to.be.false;
            expect(_.isNumber(true)).to.be.false;
            expect(_.isNumber('xxx')).to.be.false;
            expect(_.isNumber('37')).to.be.false;
            expect(_.isNumber('37.37')).to.be.false;
            expect(_.isNumber(new Date())).to.be.false;
            expect(_.isNumber(function () {})).to.be.false;
        });
    });

    describe('#_.isString', function() {
        it('should be a function', function () {
            expect(_.isString).to.be.a('function');
        });

        it('should return true with an input of string', function () {
            expect(_.isString('xxx')).to.be.true;
            expect(_.isString(new Date().toString())).to.be.true;
        });

        it('should return false with an input of not string', function () {
            expect(_.isString([])).to.be.false;
            expect(_.isString({})).to.be.false;
            expect(_.isString(undefined)).to.be.false;
            expect(_.isString(null)).to.be.false;
            expect(_.isString(NaN)).to.be.false;
            expect(_.isString(true)).to.be.false;
            expect(_.isString(100)).to.be.false;
            expect(_.isString(new Date())).to.be.false;
            expect(_.isString(function () {})).to.be.false;
        });
    });

    describe('#_.isFunction', function() {
        it('should be a function', function () {
            expect(_.isFunction).to.be.a('function');
        });

        it('should return true with an input of function', function () {
            expect(_.isFunction(function () {})).to.be.true;
        });

        it('should return false with an input of not function', function () {
            expect(_.isFunction([])).to.be.false;
            expect(_.isFunction({})).to.be.false;
            expect(_.isFunction(undefined)).to.be.false;
            expect(_.isFunction(null)).to.be.false;
            expect(_.isFunction(true)).to.be.false;
            expect(_.isFunction(NaN)).to.be.false;
            expect(_.isFunction(100)).to.be.false;
            expect(_.isFunction('xxx')).to.be.false;
            expect(_.isFunction('37')).to.be.false;
            expect(_.isFunction('37.37')).to.be.false;
            expect(_.isFunction(new Date())).to.be.false;
        });
    });

    describe('#_.isUndefined', function() {
        it('should be a function', function () {
            expect(_.isUndefined).to.be.a('function');
        });

        it('should return true with an input of undefined', function () {
            expect(_.isUndefined(undefined)).to.be.true;
        });

        it('should return false with an input of not undefined', function () {
            expect(_.isUndefined([])).to.be.false;
            expect(_.isUndefined({})).to.be.false;
            expect(_.isUndefined(null)).to.be.false;
            expect(_.isUndefined(true)).to.be.false;
            expect(_.isUndefined(NaN)).to.be.false;
            expect(_.isUndefined(100)).to.be.false;
            expect(_.isUndefined('xxx')).to.be.false;
            expect(_.isUndefined('37')).to.be.false;
            expect(_.isUndefined('37.37')).to.be.false;
            expect(_.isUndefined(new Date())).to.be.false;
            expect(_.isUndefined(function () {})).to.be.false;
        });
    });

    describe('#_.isNull', function() {
        it('should be a function', function () {
            expect(_.isNull).to.be.a('function');
        });

        it('should return true with an input of null', function () {
            expect(_.isNull(null)).to.be.true;
        });

        it('should return false with an input of not null', function () {
            expect(_.isNull([])).to.be.false;
            expect(_.isNull({})).to.be.false;
            expect(_.isNull(undefined)).to.be.false;
            expect(_.isNull(true)).to.be.false;
            expect(_.isNull(NaN)).to.be.false;
            expect(_.isNull(100)).to.be.false;
            expect(_.isNull('xxx')).to.be.false;
            expect(_.isNull('37')).to.be.false;
            expect(_.isNull('37.37')).to.be.false;
            expect(_.isNull(new Date())).to.be.false;
            expect(_.isNull(function () {})).to.be.false;
        });
    });

    describe('#_.isNil', function() {
        it('should be a function', function () {
            expect(_.isNil).to.be.a('function');
        });

        it('should return true with an input of null or undefined', function () {
            expect(_.isNil(null)).to.be.true;
            expect(_.isNil(undefined)).to.be.true;
        });

        it('should return false with an input of not null and not undefined', function () {
            expect(_.isNil([])).to.be.false;
            expect(_.isNil({})).to.be.false;
            expect(_.isNil(true)).to.be.false;
            expect(_.isNil(NaN)).to.be.false;
            expect(_.isNil(100)).to.be.false;
            expect(_.isNil('xxx')).to.be.false;
            expect(_.isNil('37')).to.be.false;
            expect(_.isNil('37.37')).to.be.false;
            expect(_.isNil(new Date())).to.be.false;
            expect(_.isNil(function () {})).to.be.false;
        });
    });

    describe('#_.isObjectLike', function() {
        it('should be a function', function () {
            expect(_.isObjectLike).to.be.a('function');
        });

        it('should return true with an input of object-like', function () {
            expect(_.isObjectLike([])).to.be.true;
            expect(_.isObjectLike({})).to.be.true;
            expect(_.isObjectLike(new Date())).to.be.true;
        });

        it('should return false with an input of not object-like', function () {
            expect(_.isObjectLike(null)).to.be.false;
            expect(_.isObjectLike(undefined)).to.be.false;
            expect(_.isObjectLike(true)).to.be.false;
            expect(_.isObjectLike(NaN)).to.be.false;
            expect(_.isObjectLike(100)).to.be.false;
            expect(_.isObjectLike('xxx')).to.be.false;
            expect(_.isObjectLike('37')).to.be.false;
            expect(_.isObjectLike('37.37')).to.be.false;
            expect(_.isObjectLike(function () {})).to.be.false;
        });
    });

    describe('#_.isObject', function() {
        it('should be a function', function () {
            expect(_.isObject).to.be.a('function');
        });

        it('should return true with an input of object', function () {
            expect(_.isObject({})).to.be.true;
            expect(_.isObject([])).to.be.true;
            expect(_.isObject(new Date())).to.be.true;
        });

        it('should return false with an input of not object', function () {
            expect(_.isObject(undefined)).to.be.false;
            expect(_.isObject(null)).to.be.false;
            expect(_.isObject(true)).to.be.false;
            expect(_.isObject(NaN)).to.be.false;
            expect(_.isObject(100)).to.be.false;
            expect(_.isObject('xxx')).to.be.false;
            expect(_.isObject('37')).to.be.false;
            expect(_.isObject('37.37')).to.be.false;
            expect(_.isObject(function () {})).to.be.false;
        });
    });

    describe('#_.isPlainObject', function() {
        it('should be a function', function () {
            expect(_.isPlainObject).to.be.a('function');
        });

        it('should return true with an input of object', function () {
            expect(_.isPlainObject({})).to.be.true;
        });

        it('should return false with an input of not object', function () {
            expect(_.isPlainObject(undefined)).to.be.false;
            expect(_.isPlainObject(null)).to.be.false;
            expect(_.isPlainObject(true)).to.be.false;
            expect(_.isPlainObject(NaN)).to.be.false;
            expect(_.isPlainObject(100)).to.be.false;
            expect(_.isPlainObject('xxx')).to.be.false;
            expect(_.isPlainObject('37')).to.be.false;
            expect(_.isPlainObject('37.37')).to.be.false;
            expect(_.isPlainObject(function () {})).to.be.false;
            expect(_.isPlainObject(new Date())).to.be.false;
            expect(_.isPlainObject([])).to.be.false;

            function X(name) {
                this.name = name;
            }
            expect(_.isPlainObject(new X('foo'))).to.be.false;
        });
    });

    describe('#_.isArguments', function() {
        it('should be a function', function () {
            expect(_.isArguments).to.be.a('function');
        });

        it('should return true if input is an arguments', function () {
            function x () {
                expect(_.isArguments(arguments)).to.be.true;
            };
            x();
        });

        it('should return false if input is an ordinary object', function () {
            expect(_.isArguments({})).to.be.false;
        });

        it('should return false if input is an constructed object', function () {
            function Foo() {}
            expect(_.isArguments(new Foo())).to.be.false;
        });

        it('should return false if input is an array', function () {
             expect(_.isArguments([])).to.be.false;
        });

        it('should return false if input is with other kinds of data type', function () {
             expect(_.isArguments(null)).to.be.false;
             expect(_.isArguments(undefined)).to.be.false;
             expect(_.isArguments()).to.be.false;
             expect(_.isArguments(NaN)).to.be.false;
             expect(_.isArguments(true)).to.be.false;
             expect(_.isArguments(new Date())).to.be.false;
             expect(_.isArguments('xxx')).to.be.false;
             expect(_.isArguments(3)).to.be.false;
             expect(_.isArguments(3.14)).to.be.false;
        });
    });
});