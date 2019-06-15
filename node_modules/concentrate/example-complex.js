#!/usr/bin/env node

var Concentrate = require("./index"),
    util = require("util");

function Serialiser() {
  if (!(this instanceof Serialiser)) { return new Serialiser(); }

  Concentrate.call(this);
}
util.inherits(Serialiser, Concentrate);

Serialiser.prototype.metadata = function metadata(data) {
  return this.uint8(data.id).uint16be(data.data.length).string(data.data, "ucs2");
};

var data = Serialiser().uint8(1).uint8(2).metadata({id: 5, data: "some data"}).uint32be(555).string("hi there", "utf8").result();

console.log(data);
