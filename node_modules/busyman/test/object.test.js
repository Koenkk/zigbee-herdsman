var expect = require('chai').expect,
    _ = require('../index.js');     // busyman module

describe('Methods of object', function() {
    describe('#_.assign', function() {
        var originObj = {
                user: 'barney'
            },
            sourceObj1 = {
                age: 36
            },
            sourceObj2 = { x: 'hi', y: [0, 1, 2] },
            sourceObj3 = { z: { z3: [ 0, 1, 2 ] } };

        it('should be a function', function () {
            expect(_.assign).to.be.a('function');
        });

        it('assigned object should be equal to originObj', function () {
            expect(_.assign(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                user: 'barney',
                age: 36
            });

            expect(_.assign(originObj, sourceObj2, sourceObj3)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                user: 'barney',
                age: 36,
                x: 'hi', 
                y: [0, 1, 2],
                z: { z3: [ 0, 1, 2 ] }
            });

            sourceObj1.age = 40;
            expect(_.assign(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                user: 'barney',
                age: 40,
                x: 'hi', 
                y: [0, 1, 2],
                z: { z3: [ 0, 1, 2 ] }
            });
        });
    });

    describe('#_.keys', function() {
        var obj = { a:0, b:1, c:2 },
            arr = [ 1, 2, 3, 4, 5 ],
            str = 'hey';

        it('should be a function', function() {
            expect(_.keys).to.be.a('function');
        });

        it('should returns the array of property names', function() {
            expect(_.keys(obj)).to.be.deep.equal([ 'a', 'b', 'c' ]);
            expect(_.keys(arr)).to.be.deep.equal([ '0', '1', '2', '3', '4' ]);
            // ES6 ok, ES5 will throw, that's correct behavior
            // expect(_.keys(str)).to.be.deep.equal([ '0', '1', '2' ]);
        });
    });

    describe('#_.values', function() {
        var obj = { a: 0, b: 1, c: 2 },
            arr = [ 1, 'a', 'b', {}, [] ],
            str = 'hey';

        it('should be a function', function() {
            expect(_.values).to.be.a('function');
        });

        it('should returns the array of property names', function() {
            expect(_.values(obj)).to.be.deep.equal([ 0, 1, 2 ]);
            expect(_.values(arr)).to.be.deep.equal([ 1, 'a', 'b', {}, [] ]);
            expect(_.values(str)).to.be.deep.equal([ 'h', 'e', 'y' ]);
        });
    });

    describe('#_.forOwn', function() {
        var Foo = function () {
              this.a = 1;
              this.b = 2;
            },
            keys = [],
            vals = [];

        Foo.prototype.c = 3;

        it('should be a function', function() {
            expect(_.forOwn).to.be.a('function');
        });

        it('should on iterates own properties of instance', function () {
            _.forOwn(new Foo, function (val, key) {
                keys.push(key);
                vals.push(val);
            });

            expect(keys).to.be.deep.equal(['a', 'b']);
            expect(vals).to.be.deep.equal([1, 2]);
        });        
    });

    describe('#_.get', function() {
        var object = { 'a': [{ 'b': { 'c': 3 } }] };

        it('should be a function', function() {
            expect(_.get).to.be.a('function');
        });

        it('should be the value of the specified path', function() {
            expect(_.get(object, 'a[0].b.c')).to.be.equal(3);
            expect(_.get(object,  ['a', '0', 'b'])).to.be.deep.equal({ 'c': 3 });
            expect(_.get(object,  'a.b.c')).to.be.equal(undefined);
            expect(_.get(object,  'a.b.c', 'default')).to.be.equal('default');
        });
    });

    describe('#_.has', function() {
        var object = { 'a': [{ 'b': { 'c': 3 } }] };

        it('should be a function', function() {
            expect(_.has).to.be.a('function');
        });

        it('should be the value of the specified path', function() {
            expect(_.has(object, 'a')).to.be.equal(true);
            expect(_.has(object,  ['a', '0'])).to.be.equal(true);
            expect(_.has(object,  'a[0].b.c')).to.be.equal(true);
            expect(_.has(object,  'a.b.c')).to.be.equal(false);
        });
    });

    describe('#_.merge', function () {
        var originObj = {
                data: [ { 'user': 'barney' }, { 'user': 'fred' } ]
            },
            sourceObj1 = {
                data: [ { 'age': 36 }, { 'age': 40 } ]
            },
            sourceObj2 = { x: 'hi', y: [0, 1, 2], z: { z1: 'hello', z2: false } },
            sourceObj3 = { z: { z3: [ 0, 1, 2 ] } };

        it('should be a function', function() {
            expect(_.merge).to.be.a('function');
        });

        it('merged object should be equal to originObj', function () {
            expect(_.merge(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            expect(_.merge(originObj, sourceObj2, sourceObj3)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false,
                    z3: [ 0, 1, 2 ] },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            expect(_.merge(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false,
                    z3: [ 0, 1, 2 ] },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 }
                ]
            });

            sourceObj1.data.push({ age: 100 });
            expect(_.merge(originObj, sourceObj1)).to.be.equal(originObj);
            expect(originObj).to.be.deep.equal({
                x: 'hi',
                y: [0, 1, 2],
                z: {
                    z1: 'hello',
                    z2: false,
                    z3: [ 0, 1, 2 ] },
                data: [
                    { 'user': 'barney', 'age': 36 },
                    { 'user': 'fred', 'age': 40 },
                    { 'age': 100 }
                ]
            });
        });
    });

    describe('#_.omit', function () {
        var object = { 'a': 1, 'b': '2', 'c': 3, 'd': '4' },
            array = [ 'a', 'b', 'c', 'x', 'y', 'z' ];

        it('should be a function', function() {
            expect(_.omit).to.be.a('function');
        });

        it('object should has properties that are not omitted', function () {
            expect(_.omit(object, [ 'e' ])).to.be.not.equal(object);
            expect(_.omit(object, [ 'e' ])).to.be.deep.equal(object);
            expect(_.omit(object, 'b')).to.be.deep.equal({ 'a': 1, 'c': 3, 'd': '4' });
            expect(_.omit(object, [ 'a', 'c' ])).to.be.deep.equal({ 'b': '2', 'd': '4' });
            expect(_.omit(array, [ '0', '3', '4' ])).to.be.deep.equal({ '1': 'b', '2': 'c', '5': 'z' });
        });
    });

    describe('#_.pick', function () {
        var object = { 'a': 1, 'b': '2', 'c': 3, 'd': '4' },
            array = [ 'a', 'b', 'c', 'x', 'y', 'z' ];

        it('should be a function', function() {
            expect(_.pick).to.be.a('function');
        });

        it('object should composed of picked properties', function () {
            expect(_.pick(object, [ 'a', 'b', 'c', 'd' ])).to.be.not.equal(object);
            expect(_.pick(object, [ 'a', 'b', 'c', 'd' ])).to.be.deep.equal(object);
            expect(_.pick(object, 'b')).to.be.deep.equal({ 'b': '2' });
            expect(_.pick(object, [ 'a', 'c' ])).to.be.deep.equal({ 'a': 1, 'c': 3 });
            expect(_.pick(array, [ '0', '3', '4' ])).to.be.deep.equal({ '0': 'a', '3': 'x', '4': 'y' });
        });
    });

    describe('#_.set', function () {
        var object = { 'a': [{ 'b': { 'c': 3 } }] };

        it('should be a function', function() {
            expect(_.set).to.be.a('function');
        });

        it('object should be set with given path and value', function () {
            expect(_.set(object, 'd', 4)).to.be.equal(object);
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { 'c': 3 } }], 'd': 4 });

            expect(_.set(object, ['x', '0', 'y', 'z'], 5)).to.be.equal(object);
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { 'c': 3 } }], 'd': 4, 'x': [{ 'y': { 'z': 5 } }] });

            expect(_.set(object, 'a[0].b.c', 4)).to.be.equal(object);
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { 'c': 4 } }], 'd': 4, 'x': [{ 'y': { 'z': 5 } }] });

            expect(_.set(object, 'a[0].b', 4)).to.be.equal(object);
            expect(object).to.be.deep.equal({ 'a': [{ 'b': 4 }], 'd': 4, 'x': [{ 'y': { 'z': 5 } }] });

        });
    });

    describe('#_.unset', function () {
        var object = { 'a': [ { 'b': { 'c': 3, x: 'hi', y: { z: 'xxx' } } }], b: '2' };
        var object2 = {
            x: {
                y: [ { z: 5, m: 'hi' } ]
            }
        };

        it('should be a function', function() {
            expect(_.unset).to.be.a('function');
        });

        it('object should be unset with given path', function () {
            expect(_.unset(object, 'd')).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { 'c': 3, x: 'hi', y: { z: 'xxx' } }}] , b: '2' });

            expect(_.unset(object, ['x', '0', 'y', 'z'])).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { 'c': 3, x: 'hi', y: { z: 'xxx' }} }], b: '2'});

            expect(_.unset(object, 'a[0].b.c')).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { x: 'hi', y: { z: 'xxx' } } }] , b: '2' });

            expect(_.unset(object, 'a[0].b.c')).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { x: 'hi', y: { z: 'xxx' } } }] , b: '2' });

            expect(_.unset(object, 'a[0].b.y')).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [{ 'b': { x: 'hi' } }] , b: '2' });

            expect(_.unset(object, 'a[0]')).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [] , b: '2' });

            expect(object).to.be.deep.equal({ 'a': [] , b: '2' });

            expect(_.unset(object, 'b')).to.be.true;
            expect(object).to.be.deep.equal({ 'a': [] });

            expect(_.unset(object2, 'x.y[0].z')).to.be.true;
            expect(object2).to.be.deep.equal({ x: { y: [ { m: 'hi' } ]} });
        });
    });
});