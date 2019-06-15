var expect = require('chai').expect,
    zclId = require('../index');

describe('APIs Arguments Check for Throwing Error', function() {
    describe('#._getCluster', function() {
        it('should be a function', function () {
            expect(zclId._getCluster).to.be.a('function');
        });
    });

    describe('#.profile', function() {
        it('should be a function', function () {
            expect(zclId.profile).to.be.a('function');
        });

        it('should throw TypeError if input profId is not a number and not a string', function () {
            expect(function () { return zclId.profile(); }).to.throw(TypeError);
            expect(function () { return zclId.profile(undefined); }).to.throw(TypeError);
            expect(function () { return zclId.profile(null); }).to.throw(TypeError);
            expect(function () { return zclId.profile(NaN); }).to.throw(TypeError);
            expect(function () { return zclId.profile([]); }).to.throw(TypeError);
            expect(function () { return zclId.profile({}); }).to.throw(TypeError);
            expect(function () { return zclId.profile(true); }).to.throw(TypeError);
            expect(function () { return zclId.profile(new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.profile(function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.profile(260); }).not.to.throw(Error);
            expect(function () { return zclId.profile('260'); }).not.to.throw(Error);
            expect(function () { return zclId.profile(0x0104); }).not.to.throw(Error);
            expect(function () { return zclId.profile('0x0104'); }).not.to.throw(Error);
            expect(function () { return zclId.profile('HA'); }).not.to.throw(Error);
        });
    });

    describe('#.device', function() {
        it('should be a function', function () {
            expect(zclId.device).to.be.a('function');
        });

        it('should throw TypeError if input profId is not a number and not a string', function () {
            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device(undefined, 5); }).to.throw(TypeError);
            expect(function () { return zclId.device(null, 5); }).to.throw(TypeError);
            expect(function () { return zclId.device(NaN, 5); }).to.throw(TypeError);
            expect(function () { return zclId.device([], 5); }).to.throw(TypeError);
            expect(function () { return zclId.device({}, 5); }).to.throw(TypeError);
            expect(function () { return zclId.device(true, 5); }).to.throw(TypeError);
            expect(function () { return zclId.device(new Date(), 5); }).to.throw(TypeError);
            expect(function () { return zclId.device(function () {}, 5); }).to.throw(TypeError);

            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device(undefined, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device(null, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device(NaN, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device([], '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device({}, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device(true, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device(new Date(), '5'); }).to.throw(TypeError);
            expect(function () { return zclId.device(function () {}, '5'); }).to.throw(TypeError);

            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device(undefined, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device(null, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device(NaN, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device([], 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device({}, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device(true, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device(new Date(), 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.device(function () {}, 0x0005); }).to.throw(TypeError);

            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device(undefined, 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device(null, 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device(NaN, 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device([], 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device({}, 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device(true, 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device(new Date(), 'CONFIGURATION_TOOL'); }).to.throw(TypeError);
            expect(function () { return zclId.device(function () {}, 'CONFIGURATION_TOOL'); }).to.throw(TypeError);

            expect(function () { return zclId.device(260, 5); }).not.to.throw(Error);
            expect(function () { return zclId.device(260, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device(260, 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device(260, 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', 5); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, 5); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', 5); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
        });

        it('should throw TypeError if input devId is not a number and not a string', function () {
            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, null); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, []); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, {}); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, true); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.device(260, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', null); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', []); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', {}); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', true); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.device('260', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, null); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, []); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, {}); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, true); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.device(0x0104, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.device(); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', null); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', []); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', {}); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', true); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.device('HA', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.device(260, 5); }).not.to.throw(Error);
            expect(function () { return zclId.device(260, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device(260, 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device(260, 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', 5); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device('260', 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, 5); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device(0x104, 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', 5); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', 0x0005); }).not.to.throw(Error);
            expect(function () { return zclId.device('HA', 'CONFIGURATION_TOOL'); }).not.to.throw(Error);
        });

    });

    describe('#.cluster', function() {
        it('should be a function', function () {
            expect(zclId.cluster).to.be.a('function');
        });

        it('should throw TypeError if input cId is not a number and not a string', function () {
            expect(function () { return zclId.cluster(); }).to.throw(TypeError);
            expect(function () { return zclId.cluster(undefined); }).to.throw(TypeError);
            expect(function () { return zclId.cluster(null); }).to.throw(TypeError);
            expect(function () { return zclId.cluster(NaN); }).to.throw(TypeError);
            expect(function () { return zclId.cluster([]); }).to.throw(TypeError);
            expect(function () { return zclId.cluster({}); }).to.throw(TypeError);
            expect(function () { return zclId.cluster(true); }).to.throw(TypeError);
            expect(function () { return zclId.cluster(new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.cluster(function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.cluster(3); }).not.to.throw(Error);
            expect(function () { return zclId.cluster('3'); }).not.to.throw(Error);
            expect(function () { return zclId.cluster(0x0003); }).not.to.throw(Error);
            expect(function () { return zclId.cluster('0x0003'); }).not.to.throw(Error);
            expect(function () { return zclId.cluster('genIdentify'); }).not.to.throw(Error);
        });
    });

    describe('#.foundation', function() {
        it('should be a function', function () {
            expect(zclId.foundation).to.be.a('function');
        });

        it('should throw TypeError if input cmdId is not a number and not a string', function () {
            expect(function () { return zclId.foundation(); }).to.throw(TypeError);
            expect(function () { return zclId.foundation(undefined); }).to.throw(TypeError);
            expect(function () { return zclId.foundation(null); }).to.throw(TypeError);
            expect(function () { return zclId.foundation(NaN); }).to.throw(TypeError);
            expect(function () { return zclId.foundation([]); }).to.throw(TypeError);
            expect(function () { return zclId.foundation({}); }).to.throw(TypeError);
            expect(function () { return zclId.foundation(true); }).to.throw(TypeError);
            expect(function () { return zclId.foundation(new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.foundation(function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.foundation(3); }).not.to.throw(Error);
            expect(function () { return zclId.foundation('3'); }).not.to.throw(Error);
            expect(function () { return zclId.foundation(0x0003); }).not.to.throw(Error);
            expect(function () { return zclId.foundation('0x0003'); }).not.to.throw(Error);
            expect(function () { return zclId.foundation('writeUndiv'); }).not.to.throw(Error);
        });
    });

    describe('#.functional', function() {
        it('should be a function', function () {
            expect(zclId.functional).to.be.a('function');
        });

        it('should throw TypeError if input cId is not a number and not a string', function () {
            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional(undefined, 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional(null, 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional(NaN, 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional([], 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional({}, 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional(true, 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional(new Date(), 5); }).to.throw(TypeError);
            expect(function () { return zclId.functional(function () {}, 5); }).to.throw(TypeError);

            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional(undefined, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(null, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(NaN, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional([], '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional({}, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(true, '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(new Date(), '5'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(function () {}, '5'); }).to.throw(TypeError);

            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional(undefined, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional(null, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional(NaN, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional([], 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional({}, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional(true, 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional(new Date(), 0x0005); }).to.throw(TypeError);
            expect(function () { return zclId.functional(function () {}, 0x0005); }).to.throw(TypeError);

            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional(undefined, "writeNoRsp"); }).to.throw(TypeError);
            expect(function () { return zclId.functional(null, 'writeNoRsp'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(NaN, 'writeNoRsp'); }).to.throw(TypeError);
            expect(function () { return zclId.functional([], 'writeNoRsp'); }).to.throw(TypeError);
            expect(function () { return zclId.functional({}, 'writeNoRsp'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(true, 'writeNoRsp'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(new Date(), 'writeNoRsp'); }).to.throw(TypeError);
            expect(function () { return zclId.functional(function () {}, 'writeNoRsp'); }).to.throw(TypeError);

            expect(function () { return zclId.functional(5, 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional(5, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional(5, 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional(5, 'recall'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', 'recall'); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, 'recall'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', 'recall'); }).not.to.throw(Error);
        });

        it('should throw TypeError if input cmdId is not a number and not a string', function () {
            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, null); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, []); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, {}); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, true); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.functional(5, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', null); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', []); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', {}); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', true); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.functional('5', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, null); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, []); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, {}); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, true); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.functional(0x0005, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.functional(); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', null); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', []); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', {}); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', true); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.functional('genScenes', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.functional(5, 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional(5, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional(5, 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional(5, 'recall'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional('5', 'recall'); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional(0x0005, 'recall'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', 5); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', '5'); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', 0x05); }).not.to.throw(Error);
            expect(function () { return zclId.functional('genScenes', 'recall'); }).not.to.throw(Error);
        });
    });

    describe('#.getCmdRsp', function() {
        it('should be a function', function () {
            expect(zclId.getCmdRsp).to.be.a('function');
        });

        it('should throw TypeError if input cId is not a number and not a string', function () {
            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(undefined, 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(null, 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(NaN, 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp([], 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp({}, 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(true, 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(new Date(), 0); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(function () {}, 0); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(undefined, '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(null, '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(NaN, '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp([], '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp({}, '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(true, '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(new Date(), '0'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(function () {}, '0'); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(undefined, 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(null, 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(NaN, 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp([], 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp({}, 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(true, 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(new Date(), 0x00); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(function () {}, 0x00); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(undefined, "Rsp"); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(null, 'Rsp'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(NaN, 'Rsp'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp([], 'Rsp'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp({}, 'Rsp'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(true, 'Rsp'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(new Date(), 'Rsp'); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(function () {}, 'Rsp'); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(5, 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(5, '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(5, 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(5, 'Rsp'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', 'Rsp'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, 'Rsp'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', 'Rsp'); }).not.to.throw(Error);
        });

        it('should throw TypeError if input rspId is not a number and not a string', function () {
            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, null); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, []); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, {}); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, true); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(5, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', null); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', []); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', {}); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', true); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('5', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, null); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, []); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, {}); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, true); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp(0x0005, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', null); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', []); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', {}); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', true); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.getCmdRsp('genScenes', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.getCmdRsp(5, 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(5, '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(5, 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(5, 'Rsp'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('5', 'Rsp'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp(0x0005, 'Rsp'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', 0); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', '0'); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', 0x00); }).not.to.throw(Error);
            expect(function () { return zclId.getCmdRsp('genScenes', 'Rsp'); }).not.to.throw(Error);
        });
    });

    describe('#.attr', function() {
        it('should be a function', function () {
            expect(zclId.attr).to.be.a('function');
        });

        it('should throw TypeError if input cId is not a number and not a string', function () {
            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr(undefined, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr(null, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr(NaN, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr([], 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr({}, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr(true, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr(new Date(), 2); }).to.throw(TypeError);
            expect(function () { return zclId.attr(function () {}, 2); }).to.throw(TypeError);

            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr(undefined, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(null, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(NaN, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr([], '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr({}, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(true, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(new Date(), '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(function () {}, '2'); }).to.throw(TypeError);

            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr(undefined, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr(null, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr(NaN, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr([], 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr({}, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr(true, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr(new Date(), 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attr(function () {}, 0x0002); }).to.throw(TypeError);

            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr(undefined, "currentGroup"); }).to.throw(TypeError);
            expect(function () { return zclId.attr(null, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(NaN, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attr([], 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attr({}, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(true, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(new Date(), 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attr(function () {}, 'currentGroup'); }).to.throw(TypeError);

            expect(function () { return zclId.attr(5, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr(5, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr(5, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr(5, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', 'currentGroup'); }).not.to.throw(Error);
        });

        it('should throw TypeError if input attrId is not a number and not a string', function () {
            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, null); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, []); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, {}); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, true); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attr(5, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', null); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', []); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', {}); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', true); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attr('5', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, null); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, []); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, {}); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, true); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attr(0x0005, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attr(); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', null); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', []); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', {}); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', true); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attr('genScenes', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attr(5, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr(5, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr(5, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr(5, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr('5', 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr(0x0005, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attr('genScenes', 'currentGroup'); }).not.to.throw(Error);
        });
    });

    describe('#.attrType', function() {
        it('should be a function', function () {
            expect(zclId.attrType).to.be.a('function');
        });

        it('should throw TypeError if input cId is not a number and not a string', function () {
            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(undefined, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(null, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(NaN, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType([], 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType({}, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(true, 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(new Date(), 2); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(function () {}, 2); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(undefined, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(null, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(NaN, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType([], '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType({}, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(true, '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(new Date(), '2'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(function () {}, '2'); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(undefined, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(null, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(NaN, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType([], 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType({}, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(true, 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(new Date(), 0x0002); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(function () {}, 0x0002); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(undefined, "currentGroup"); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(null, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(NaN, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType([], 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType({}, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(true, 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(new Date(), 'currentGroup'); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(function () {}, 'currentGroup'); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(5, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(5, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(5, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(5, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', 'currentGroup'); }).not.to.throw(Error);
        });

        it('should throw TypeError if input attrId is not a number and not a string', function () {
            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, null); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, []); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, {}); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, true); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(5, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', null); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', []); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', {}); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', true); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('5', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, null); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, []); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, {}); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, true); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attrType(0x0005, function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', undefined); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', null); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', NaN); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', []); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', {}); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', true); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.attrType('genScenes', function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.attrType(5, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(5, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(5, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(5, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('5', 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType(0x0005, 'currentGroup'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', 2); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', '2'); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', 0x0002); }).not.to.throw(Error);
            expect(function () { return zclId.attrType('genScenes', 'currentGroup'); }).not.to.throw(Error);
        });
    });

    describe('#.dataType', function() {
        it('should be a function', function () {
            expect(zclId.dataType).to.be.a('function');
        });

        it('should throw TypeError if input type is not a number and not a string', function () {
            expect(function () { return zclId.dataType(); }).to.throw(TypeError);
            expect(function () { return zclId.dataType(undefined); }).to.throw(TypeError);
            expect(function () { return zclId.dataType(null); }).to.throw(TypeError);
            expect(function () { return zclId.dataType(NaN); }).to.throw(TypeError);
            expect(function () { return zclId.dataType([]); }).to.throw(TypeError);
            expect(function () { return zclId.dataType({}); }).to.throw(TypeError);
            expect(function () { return zclId.dataType(true); }).to.throw(TypeError);
            expect(function () { return zclId.dataType(new Date()); }).to.throw(TypeError);
            expect(function () { return zclId.dataType(function () {}); }).to.throw(TypeError);

            expect(function () { return zclId.dataType(11); }).not.to.throw(Error);
            expect(function () { return zclId.dataType('11'); }).not.to.throw(Error);
            expect(function () { return zclId.dataType(0x0b); }).not.to.throw(Error);
            expect(function () { return zclId.dataType('0x0b'); }).not.to.throw(Error);
            expect(function () { return zclId.dataType('DATA32'); }).not.to.throw(Error);
        });
    });
});
