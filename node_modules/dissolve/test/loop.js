var Dissolve = require("../index");

describe("loop", function() {
  it("should emit data 3 times then end", function(done) {
    var reader = Dissolve().loop(function(end) {
      this.uint8("x").tap(function() {
        if (this.vars.x === 0) {
          return end(true);
        } else {
          this.push(this.vars);
        }
      });
    });

    var counter = 0;

    reader.on("readable", function() {
      var e;
      while (e = reader.read()) {
        counter++;
      }
    });

    reader.on("end", function() {
      if (counter !== 3) {
        return done(Error("invalid counter value"));
      } else {
        return done();
      }
    });

    reader.write(Buffer([0x01, 0x01, 0x01, 0x00, 0x02]));
  });

  it("should populate an array correctly", function(done) {
    var reader = Dissolve().loop("things", function(end) {
      this.uint8("x").tap(function() {
        if (this.vars.x === 0) {
          return end(true);
        }
      });
    }).tap(function() {
      this.push(this.vars);
    });

    reader.on("readable", function() {
      var e;
      while (e = reader.read()) {
        if (typeof e !== "object" || e === null) {
          return done(Error("invalid payload for data event"));
        }

        if (!Array.isArray(e.things)) {
          return done(Error("array property not set or not correct type"));
        }

        if (e.things.length !== 3) {
          return done(Error("invalid number of entries"));
        }

        return done();
      }
    });

    reader.write(Buffer([0x01, 0x01, 0x01, 0x00]));
  });

  it("should work with nested, cancelled loop operations", function(done) {
    var reader = Dissolve().tap(function() {
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

    reader.on("readable", function() {
      var e;
      while (e = reader.read()) {
        if (typeof e !== "object" || e === null) {
          return done(Error("invalid payload for data event"));
        }

        if (!Array.isArray(e.data)) {
          return done(Error("array property not set or not correct type"));
        }

        if (e.data.length !== 2) {
          return done(Error("invalid length for data"));
        }

        if (!Array.isArray(e.data[0].elements)) {
          return done(Error("data[0].elements not set or not correct type"));
        }

        if (e.data[0].elements.length !== 2) {
          return done(Error("invalid length for data[0].elements"));
        }

        if (e.data[0].elements[0].element !== 1) {
          return done(Error("invalid value for data[0].elements[0].element"));
        }

        if (e.data[0].elements[1].element !== 2) {
          return done(Error("invalid value for data[0].elements[1].element"));
        }

        if (!Array.isArray(e.data[1].elements)) {
          return done(Error("data[1].elements not set or not correct type"));
        }

        if (e.data[1].elements.length !== 2) {
          return done(Error("invalid length for data[1].elements"));
        }

        if (e.data[1].elements[0].element !== 3) {
          return done(Error("invalid value for data[1].elements[0].element"));
        }

        if (e.data[1].elements[1].element !== 4) {
          return done(Error("invalid value for data[1].elements[1].element"));
        }

        return done();
      }
    });

    reader.write(new Buffer([
      0x02,
        0x02,
          0x01, 0x02,
        0x02,
          0x03, 0x04,
    ]));
  });
});
