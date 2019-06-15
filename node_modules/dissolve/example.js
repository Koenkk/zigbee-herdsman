#!/usr/bin/env node

var Dissolve = require("./index");

var parser = Dissolve().loop(function(end) {
  this.uint8("id").tap("payload", function() {
    this.tap("asdf", function() {
      if (this.vars.id === 0x01) {
        this.uint16be("a").uint16be("b");
      } else if (this.vars.id === 0x02) {
        this.uint32be("x").uint32be("y");
      } else if (this.vars.id === 0x03) {
        this.floatbe("l").doublebe("m");
      }
    });
  }).tap(function() {
    this.push(this.vars);
    this.vars = Object.create(null);
  });
});

parser.on("readable", function() {
  var e;
  while (e = parser.read()) {
    console.log(e);
  }
});

parser.write(new Buffer([0x01, 0x00, 0x02, 0x00, 0x03])); // {id: 1, a: 2, b: 3}
parser.write(new Buffer([0x02, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x05])); // {id: 2, x: 4, y: 5}
parser.write(new Buffer([0x01]));
parser.write(new Buffer([0x00, 0x02, 0x00]));
parser.write(new Buffer([0x03])); // {id: 1, a: 2, b: 3}
parser.write(new Buffer([0x03, 0x40, 0x06, 0x66, 0x66, 0x40, 0x00, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcd])); // {id: 3, l: ~2.1, m: ~2.1}
