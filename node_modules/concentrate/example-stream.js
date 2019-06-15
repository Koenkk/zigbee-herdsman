#!/usr/bin/env node

var Concentrate = require("./index");

var c = Concentrate();

c.on("end", function() {
  console.log("ended");
});

c.on("readable", function() {
  var e;
  while (e = c.read()) {
    console.log(e);
  }
});

c.uint8(1).uint8(2).uint32be(555).string("hi there", "utf8").floatbe(2.1).doublebe(2.1).flush();
c.uint8(5).uint8(6);
c.uint8(7);
c.uint8(30);
c.flush().end();
