var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of utils', function() {
    describe('#_.now', function() {
        var now1 = _.now(),
            now2 = Date.now();

        it('should be a function', function () {
            expect(_.now).to.be.a('function');
        });

        it('should return unix time in ms, which is a number', function () {
            expect(_.now()).to.be.a('number');
        });

        it('should return unix time in ms elapsed from 1 Jan 1970 00:00:00 UTC', function () {
            expect(now1).to.be.equal(now2);
        });
    });

    describe('#_.parseInt', function() {
        it('should be a function', function () {
            expect(_.parseInt).to.be.a('function');
        });

        it('should return 15 in the following tests', function () {
            expect(_.parseInt(" 0xF", 16)).to.be.equal(15);
            expect(_.parseInt(" F", 16)).to.be.equal(15);
            expect(_.parseInt(" F", 16)).to.be.equal(15);
            expect(_.parseInt("17", 8)).to.be.equal(15);
            expect(_.parseInt(021, 8)).to.be.equal(15);
            expect(_.parseInt("015", 10)).to.be.equal(15);
            expect(_.parseInt(15.99, 10)).to.be.equal(15);
            expect(_.parseInt("15,123", 10)).to.be.equal(15);
            expect(_.parseInt("FXX123", 16)).to.be.equal(15);
            expect(_.parseInt("1111", 2)).to.be.equal(15);
            expect(_.parseInt("15*3", 10)).to.be.equal(15);
            expect(_.parseInt("15e2", 10)).to.be.equal(15);
            expect(_.parseInt("15px", 10)).to.be.equal(15);
            expect(_.parseInt("12", 13)).to.be.equal(15);

            expect(_.parseInt("0xF")).to.be.equal(15);
            expect(_.parseInt(" 0xF")).to.be.equal(15);
        });

        it('should return -15 in the following tests', function () {
            expect(_.parseInt("-F", 16)).to.be.equal(-15);
            expect(_.parseInt("-0F", 16)).to.be.equal(-15);
            expect(_.parseInt("-0XF", 16)).to.be.equal(-15);
            expect(_.parseInt(-15.1, 10)).to.be.equal(-15);
            expect(_.parseInt(" -17", 8)).to.be.equal(-15);
            expect(_.parseInt(" -15", 10)).to.be.equal(-15);
            expect(_.parseInt("-1111", 2)).to.be.equal(-15);
            expect(_.parseInt("-15e1", 10)).to.be.equal(-15);
            expect(_.parseInt("-12", 13)).to.be.equal(-15);
        });

        it('should return 224 in the following tests', function () {
            expect(_.parseInt("0e0", 16)).to.be.equal(224);
        });

        it('should return NaN when input is a string cannot be parsed into a number', function () {
            expect(_.parseInt("hello", 16)).to.be.NaN;
        });

        it('should return NaN when input is a string with wrong radix format', function () {
            expect(_.parseInt("546", 2)).to.be.NaN;
            expect(_.parseInt("0xG", 16)).to.be.NaN;
            expect(_.parseInt(090, 8)).to.be.NaN;
            expect(_.parseInt("9", 8)).to.be.NaN;
        });

        it('should return NaN when input not a string or a number at all', function () {
            expect(_.parseInt([], 16)).to.be.NaN;
            expect(_.parseInt({}, 16)).to.be.NaN;
            expect(_.parseInt(true, 16)).to.be.NaN;
            expect(_.parseInt(NaN, 16)).to.be.NaN;
            expect(_.parseInt(undefined, 16)).to.be.NaN;
            expect(_.parseInt(null, 16)).to.be.NaN;
        });
    });

    describe('#_.isEmpty', function() {
        it('should be a function', function () {
            expect(_.isEmpty).to.be.a('function');
        });

        it('should return true if input is an empty object', function () {
            function X () {
            }
            X.prototype.someProp = 0;

            expect(_.isEmpty({})).to.be.true;
            expect(_.isEmpty(new X())).to.be.true;
        });

        it('should return true if input is an empty array', function () {
            expect(_.isEmpty([])).to.be.true;
        });

        it('should return true if input is an empty arguments', function () {
            function x() {
                expect(_.isEmpty(arguments)).to.be.true;
            }

            x();
        });

        it('should return true if input is an empty string', function () {
            expect(_.isEmpty('')).to.be.true;
        });

        it('should return true if input is null', function () {
            expect(_.isEmpty(null)).to.be.true;
        });

        it('should return false if input is an non-empty object', function () {
            function X (name) {
                this.name = name;
            }

            expect(_.isEmpty({ x: 1 })).to.be.false;
            expect(_.isEmpty(new X('simen'))).to.be.false;
        });

        it('should return false if input is an non-empty array', function () {
            expect(_.isEmpty([ 'hi' ])).to.be.false;
        });

        it('should return true if input is an non-empty arguments', function () {
            function x(a, b, c) {
                expect(_.isEmpty(arguments)).to.be.false;
            }

            x('hi');
        });

        it('should return true if input is an non-empty string', function () {
            expect(_.isEmpty('xx')).to.be.false;
        });
    });

    describe('#_.isEqual', function() {
        var someObj = { s: 3, n: { n1: 'hi', n2: [ 111, 222 ] } },
            originObj = { user: 'fred', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3 ], z: someObj },
            otherObj1 = { user: 'fred', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3 ], z: someObj },
            otherObj2 = { user: 'fred1', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3 ], z: someObj },
            otherObj3 = { user: 'fred', x: { x1: 'hi', x2: 3, x3: 1 }, y: [ 0, 1, 3 ], z: someObj },
            otherObj4 = { user: 'fred', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3, 2 ], z: someObj },
            otherObj5 = { user: 'fred', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3 ], z: someObj, k: 3 };

        var originArr = [ 0, 1, { x: { x1: 3} } ],
            otherArr1 = [ 0, 1, { x: { x1: 3} } ],
            otherArr2 = [ 1, 0, { x: { x1: 3} } ];

        it('should be a function', function () {
            expect(_.isEqual).to.be.a('function');
        });

        it('originObj and originObj should be euqal', function () {
            expect(_.isEqual(originObj, originObj)).to.be.true;
            expect(originObj === originObj).to.be.true;
        });

        it('otherObj5 and otherObj5 should be euqal', function () {
            expect(_.isEqual(otherObj5, otherObj5)).to.be.true;
            expect(otherObj5 === otherObj5).to.be.true;
        });
        
        it('originObj and otherObj1 should be euqal', function () {
            expect(_.isEqual(originObj, otherObj1)).to.be.true;
            expect(originObj === otherObj1).to.be.false;
        });

        it('originObj and otherObj2 should not be euqal', function () {
            expect(_.isEqual(originObj, otherObj2)).to.be.false;
            expect(originObj === otherObj2).to.be.false;
        });

        it('originObj and otherObj3 should not be euqal', function () {
            expect(_.isEqual(originObj, otherObj3)).to.be.false;
            expect(originObj === otherObj3).to.be.false;
        });

        it('originObj and otherObj4 should not be euqal', function () {
            expect(_.isEqual(originObj, otherObj4)).to.be.false;
            expect(originObj === otherObj4).to.be.false;
        });

        it('originObj and otherObj5 should not be euqal', function () {
            expect(_.isEqual(originObj, otherObj5)).to.be.false;
            expect(originObj === otherObj5).to.be.false;
        });

        it('originArr and otherArr1 should be euqal', function () {
            expect(_.isEqual(originArr, otherArr1)).to.be.true;
            expect(originArr === otherArr1).to.be.false;
        });

        it('originArr and otherArr2 should not be euqal', function () {
            expect(_.isEqual(originArr, otherArr2)).to.be.false;
            expect(originArr === otherArr2).to.be.false;
        });

        it('originObj and number should not be euqal', function () {
            expect(_.isEqual(originObj, 3)).to.be.false;
        });

        it('originObj and array should not be euqal', function () {
            expect(_.isEqual(originObj, [])).to.be.false;
        });

        it('originObj and bool should not be euqal', function () {
            expect(_.isEqual(originObj, true)).to.be.false;
        });

        it('originObj and string should not be euqal', function () {
            expect(_.isEqual(originObj, 'hi')).to.be.false;
        });

        it('originObj and null should not be euqal', function () {
            expect(_.isEqual(originObj, null)).to.be.false;
        });

        it('originObj and NaN should not be euqal', function () {
            expect(_.isEqual(originObj, NaN)).to.be.false;
        });

        it('originObj and undefined should not be euqal', function () {
            expect(_.isEqual(originObj, undefined)).to.be.false;
        });

        it('originObj and new Date() should not be euqal', function () {
            expect(_.isEqual(originObj, new Date())).to.be.false;
        });

        it('originObj and function should not be euqal', function () {
            expect(_.isEqual(originObj, function () {})).to.be.false;
        });
    });

    describe('#_.toPath', function() {
        it('should be a function', function () {
            expect(_.toPath).to.be.a('function');
        });

        it("should be [ 'a', 'b', 'c' ]", function () {
            expect(_.toPath('a.b.c')).to.be.eql([ 'a', 'b', 'c' ]);
        });

        it("should be [ 'a', '0', b', 'c' ]", function () {
            expect(_.toPath('a[0].b.c')).to.be.eql([ 'a', '0', 'b', 'c' ]);
        });

        it("should be [ 'a', '0', 'b', '3', 'c', '2' ]", function () {
            expect(_.toPath('a[0].b[3].c[2]')).to.be.eql([ 'a', '0', 'b', '3', 'c', '2' ]);
        });
    });

    describe('#_.clone', function() {
        var someObj = { s: 3, n: { n1: 'hi', n2: [ 111, 222 ] } },
            originObj = { user: 'fred', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3 ], z: someObj },
            clonedObj = _.clone(originObj);

        it('should be a function', function () {
            expect(_.clone).to.be.a('function');
        });

        it('originObj and clonedObj should be shallow equal', function () {
            expect(clonedObj).not.to.be.equal(originObj);
            expect(clonedObj.user).to.be.equal(originObj.user);
            expect(clonedObj.x).to.be.equal(originObj.x);
            expect(clonedObj.y).to.be.equal(originObj.y);
            expect(clonedObj.z).to.be.equal(originObj.z);
            expect(clonedObj.z).to.be.equal(someObj);
            expect(originObj.z).to.be.equal(someObj);
        });
    });

    describe('#_.cloneDeep', function() {
        var someObj = { s: 3, n: { n1: 'hi', n2: [ 111, 222 ] } },
            originObj = { user: 'fred', x: { x1: 'hi', x2: 3 }, y: [ 0, 1, 3 ], z: someObj },
            clonedObj = _.cloneDeep(originObj);

        it('should be a function', function () {
            expect(_.cloneDeep).to.be.a('function');
        });

        it('originObj and clonedObj should be deep equal', function () {
            expect(clonedObj).not.to.be.equal(originObj);
            expect(clonedObj).to.be.deep.equal(originObj);
            expect(clonedObj.x).to.be.deep.equal(originObj.x);
            expect(clonedObj.y).to.be.deep.equal(originObj.y);
            expect(clonedObj.z).to.be.deep.equal(originObj.z);
            expect(clonedObj.z).to.be.deep.equal(someObj);
            expect(originObj.z).to.be.deep.equal(someObj);

            expect(clonedObj.x).not.to.be.equal(originObj.x);
            expect(clonedObj.y).not.to.be.equal(originObj.y);
            expect(clonedObj.z).not.to.be.equal(originObj.z);
            expect(clonedObj.z).not.to.be.equal(someObj);
            expect(originObj.z).to.be.equal(someObj);

            expect(_.isEqual(originObj, clonedObj)).to.be.true;
        });
    });

    describe('#_._mergeTwoObjs', function() {
        var originObj = {
                data: [ { 'user': 'barney' }, { 'user': 'fred' } ]
            },
            sourceObj1 = {
                data: [ { 'age': 36 }, { 'age': 40 } ]
            },
            sourceObj2 = { x: 'hi', y: [0, 1, 2], z: { z1: 'hello', z2: false } },
            sourceObj3 = { z: { z3: [ 0, 1, 2 ] } },
            merged;

        it('should be a function', function () {
            expect(_._mergeTwoObjs).to.be.a('function');
        });

        it('merged object should be equal to originObj', function () {
            expect(_._mergeTwoObjs(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            expect(_._mergeTwoObjs(originObj, sourceObj2)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            expect(_._mergeTwoObjs(originObj, sourceObj3)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false,
                    z3: [ 0, 1, 2 ]
                },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            expect(_._mergeTwoObjs(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false,
                    z3: [ 0, 1, 2 ]
                },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            sourceObj1.data.push({ age: 100 });
            expect(_._mergeTwoObjs(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false,
                    z3: [ 0, 1, 2 ]
                },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 },
                    { 'age': 100 }
                ]
            });
        });
    });
});
