var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of string', function() {
    describe('#_.split', function() {
        var string = 'abcde';

        it('should be a function', function () {
            expect(_.split).to.be.a('function');
        });

        it("should be ['ab', 'de']", function () {
            expect(_.split(string, 'c')).to.be.eql(['ab', 'de']);
        });

        it("should be ['a', 'c', 'e']", function () {
            expect(_.split(string, /[bd]/)).to.be.eql(['a', 'c', 'e']);
        });

        it("should be ['a', 'b', 'c']", function () {
            expect(_.split(string, '', 3)).to.be.eql(['a', 'b', 'c']);
        });
    });

    describe('#_.camelCase', function() {
        it('should be a function', function () {
            expect(_.camelCase).to.be.a('function');
        });

        it("should be '24Hour'", function () {
            expect(_.camelCase('24 hour')).to.be.eql('24Hour');
        });

        it("should be 'helloWorld'", function () {
            expect(_.camelCase('HELLO-WORLD')).to.be.eql('helloWorld');
        });

        it("should be 'fooBar'", function () {
            expect(_.camelCase('__FOO_BAR__')).to.be.eql('fooBar');
        });
    });

    describe('#_.endsWith', function() {
        var string = 'abc',
            string1 = 'To be, or not to be, that is the question.';

        it('should be a function', function () {
            expect(_.endsWith).to.be.a('function');
        });

        it('should return true in the following tests', function () {
            expect(_.endsWith(string, 'c')).to.be.true;
            expect(_.endsWith(string, 'b', 2)).to.be.true;
            expect(_.endsWith(string1, 'question.')).to.be.true;
            expect(_.endsWith(string1, 'to be', 19)).to.be.true;
        });

        it('should return false in the following tests', function () {
            expect(_.endsWith(string, 'b')).to.be.false;
            expect(_.endsWith(string1, 'be')).to.be.false;
            expect(_.endsWith(string1, 'the')).to.be.false;
            expect(_.endsWith(string1, 'tion')).to.be.false;
        });
    });

    describe('#_.replace', function() {
        var string = 'abcde';

        it('should be a function', function () {
            expect(_.replace).to.be.a('function');
        });

        it("should be 'ab de'", function () {
            expect(_.replace(string, 'c', ' ')).to.be.eql('ab de');
        });

        it("should be 'ab123'", function () {
            expect(_.replace(string, 'cde', '123')).to.be.eql('ab123');
        });

        it("should be 'a-c-e'", function () {
            expect(_.replace(string, /[bd]/g, '-')).to.be.eql('a-c-e');
        });
    });

    describe('#_.startsWith', function() {
        var string = 'abc',
            string1 = 'To be, or not to be, that is the question.';

        it('should be a function', function () {
            expect(_.startsWith).to.be.a('function');
        });

        it('should return true in the following tests', function () {
            expect(_.startsWith(string, 'a')).to.be.true;
            expect(_.startsWith(string, 'b', 1)).to.be.true;
            expect(_.startsWith(string1, 'To')).to.be.true;
            expect(_.startsWith(string1, 'not to be', 10)).to.be.true;
        });

        it('should return false in the following tests', function () {
            expect(_.startsWith(string, 'b')).to.be.false;
            expect(_.startsWith(string, 'c')).to.be.false;
            expect(_.startsWith(string1, 'be')).to.be.false;
            expect(_.startsWith(string1, 'not to be')).to.be.false;
        });
    });

    describe('#_.toLower', function() {
        it('should be a function', function () {
            expect(_.toLower).to.be.a('function');
        });

        it("should be 'abcde'", function () {
            expect(_.toLower('ABCDE')).to.be.eql('abcde');
        });

        it("should be '24_hour'", function () {
            expect(_.toLower('24_HOUR')).to.be.eql('24_hour');
        });

        it("should be '--foo-bar--'", function () {
            expect(_.toLower('--FOO-BAR--')).to.be.eql('--foo-bar--');
        });
    });

    describe('#_.toUpper', function() {
        it('should be a function', function () {
            expect(_.toUpper).to.be.a('function');
        });

        it("should be 'ABCDE'", function () {
            expect(_.toUpper('abcde')).to.be.eql('ABCDE');
        });

        it("should be '24_HOUR'", function () {
            expect(_.toUpper('24_hour')).to.be.eql('24_HOUR');
        });

        it("should be '--FOO-BAR--'", function () {
            expect(_.toUpper('--foo-bar--')).to.be.eql('--FOO-BAR--');
        });
    });

    describe('#_.lowerCase', function() {
        it('should be a function', function () {
            expect(_.lowerCase).to.be.a('function');
        });

        it("should be 'hello'", function () {
            expect(_.lowerCase('HELLO')).to.be.eql('hello');
        });

        it("should be 'hello world'", function () {
            expect(_.lowerCase('HELLO-WORLD')).to.be.eql('hello world');
        });
    });

    describe('#_.lowerFirst', function() {
        it('should be a function', function () {
            expect(_.lowerFirst).to.be.a('function');
        });

        it("should be 'hELLO'", function () {
            expect(_.lowerFirst('HELLO')).to.be.eql('hELLO');
        });

        it("should be 'hELLO-WORLD'", function () {
            expect(_.lowerFirst('HELLO-WORLD')).to.be.eql('hELLO-WORLD');
        });
    });

    describe('#_.upperCase', function() {
        it('should be a function', function () {
            expect(_.upperCase).to.be.a('function');
        });

        it("should be 'HELLO'", function () {
            expect(_.upperCase('hello')).to.be.eql('HELLO');
        });

        it("should be 'HELLO WORLD'", function () {
            expect(_.upperCase('hello-world')).to.be.eql('HELLO WORLD');
        });
    });

    describe('#_.upperFirst', function() {
        it('should be a function', function () {
            expect(_.upperFirst).to.be.a('function');
        });

        it("should be 'Hello'", function () {
            expect(_.upperFirst('hello')).to.be.eql('Hello');
        });

        it("should be 'Hello-world'", function () {
            expect(_.upperFirst('hello-world')).to.be.eql('Hello-world');
        });
    });
});