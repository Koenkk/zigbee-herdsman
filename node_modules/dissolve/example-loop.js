#!/usr/bin/env node

var Dissolve = require("./index");

var parser = Dissolve().tap(function() {
  var data_i = 0;

  this.uint8("data_count").loop("data", function(end) {
    if (data_i++ === this.vars.data_count) {
      return end(true);
    }

    var elements_i = 0;

    this.uint8("element_count").loop("elements", function(end) {
      if (elements_i++ === this.vars.element_count) {
        return end(true);
      }

      this.uint8("element");
    });
  }).tap(function() {
    this.push(this.vars);
    this.vars = Object.create(null);
  });
});

parser.on("readable", function() {
  var e;
  while (e = parser.read()) {
    console.log(JSON.stringify(e, null, 2));
  }
});

parser.write(new Buffer([
  0x02,
    0x02,
      0x01, 0x02,
    0x02,
      0x03, 0x04,
]));
