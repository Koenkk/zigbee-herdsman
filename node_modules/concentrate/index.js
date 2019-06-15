var stream = require("stream"),
    util = require("util");

var Concentrate = module.exports = function Concentrate(options) {
  if (!(this instanceof Concentrate)) { return new Concentrate(options); }

  stream.Readable.call(this, options);

  this.jobs = [];
};
util.inherits(Concentrate, stream.Readable);

Concentrate.prototype._read = function _read(n) {};

Concentrate.prototype.copy = function copy() {
  var copy = new Concentrate();
  copy.jobs = this.jobs.slice(0);
  return copy;
};

Concentrate.prototype.reset = function reset() {
  this.jobs.splice(0);

  return this;
};

Concentrate.prototype.result = function result() {
  // optimisation for if there's only one job and it's a buffer - we don't need
  // to compile anything, we can just shove the buffer right on through. keep on
  // truckin'.
  if (this.jobs.length === 1 && this.jobs[0].type === "buffer") {
    return this.jobs[0].data;
  }

  var buffer = new Buffer(this.jobs.reduce(function(i, v) { return i + v.length; }, 0));

  var offset = 0;
  this.jobs.forEach(function(job) {
    var method = ["write", job.type].join("_");

    if (typeof this[method] === "function") {
      offset += this[method](job, buffer, offset);
    }
  }.bind(this));

  return buffer;
};

Concentrate.prototype.flush = function flush(no_reset) {
  this.push(this.result());
  this.reset();

  return this;
};

Concentrate.prototype.end = function end() {
  this.push(null);

  return this;
};

Concentrate.prototype.write_number = function write_number(job, buffer, offset) {
  buffer[job.method](job.data, offset);
  return job.length;
};

Concentrate.prototype.write_buffer = function write_buffer(job, buffer, offset) {
  job.data.copy(buffer, offset);
  return job.data.length;
};

Concentrate.prototype.buffer = function buffer(data) {
  this.jobs.push({type: "buffer", data: data, length: data.length});
  return this;
};

Concentrate.prototype.string = function string(data, encoding) {
  return this.buffer(new Buffer(data, encoding));
};

[8, 16, 32].forEach(function(b) {
  ["", "u"].forEach(function(s) {
    ["", "le", "be"].forEach(function(e) {
      // derive endiannes postfix supported by node Buffer api
      // for all the numbers, except 8 bit integer, endiannes is mandatory
      var endiannes = e || "le";
      // for 8 bit integers - no endiannes postfix
      if(b === 8){
          endiannes = "";
      }
      
      var type = [s, "int", b, e].join(""),
          method = ["write", s.toUpperCase(), "Int", b, endiannes.toUpperCase()].join(""),
          length = b / 8;

      Concentrate.prototype[type] = function(data) {
        this.jobs.push({
          type: "number",
          method: method,
          length: length,
          data: data,
        });

        return this;
      };
    });
  });
});

[["float", 4], ["double", 8]].forEach(function(t) {
  ["le", "be"].forEach(function(e) {
    var type = [t[0], e].join(""),
        method = ["write", t[0].replace(/^(.)/, function(e) { return e.toUpperCase(); }), e.toUpperCase()].join(""),
        length = t[1];

    Concentrate.prototype[type] = function(data) {
      this.jobs.push({
        type: "number",
        method: method,
        length: length,
        data: data,
      });

      return this;
    };
  });
});
