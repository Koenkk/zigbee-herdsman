var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of function', function() {
    describe('#_.bind', function() {
        function fn() {
            var result = [this];
            Array.prototype.push.apply(result, arguments);
            return result;
        }

        it('should be a function', function () {
            expect(_.bind).to.be.a('function');
        });

        it('should bind a function to an object', function () {
            var object = {},
                bound = _.bind(fn, object, 'a');

            expect(bound()).to.be.eql([object, 'a']);

            bound = _.bind(fn, object);
            expect(bound('a')).to.be.eql([object, 'a']);
        });

        it('should partially apply arguments', function () {
            var object = {},
                bound = _.bind(fn, object, 'a');

            expect(bound()).to.be.eql([object, 'a']);
            expect(bound('b')).to.be.eql([object, 'a', 'b']);
            expect(bound('b', 'c', 'd')).to.be.eql([object, 'a', 'b', 'c', 'd']);
        });
    });

    describe('#_.delay', function() {

        it('should be a function', function () {
            expect(_.delay).to.be.a('function');
        });

        it('should delay `func` execution', function () {
            var result = false;

            _.delay(function () {
                result = true;
            }, 50);

            setTimeout(function() {
                expect(result).to.be.false;
            }, 1);

            setTimeout(function () {
                expect(result).to.be.true;
            }, 100);
        });

        it('should provide additional arguments to `func`', function () {
            var args = [];

            _.delay(function() {
                for (var i = 0, len = arguments.length; i < len; i++) {
                    args.push(arguments[i]);
                }
            }, 50, 1, 2);

            setTimeout(function () {
                expect(result).to.be.eql([1, 2]);
            }, 100);
        });
        
        it('should use a default `wait` of `0`', function () {
            var result = false;

            _.delay(function () {
                result = true;
            });

            setTimeout(function () {
                expect(result).to.be.true;
            }, 0);
        });

        it('should be cancelable', function () {
            var result = false,
                dly = _.delay(function () {
                        result = true;
                    }, 50);

            clearTimeout(dly);

            setTimeout(function () {
                expect(result).to.be.false;
            }, 100);
        });
    });
});