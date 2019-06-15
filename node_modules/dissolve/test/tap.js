var Dissolve = require("../index");

describe("tap", function() {
  it("should emit data 2 times then end", function(done) {
    var reader = Dissolve().uint8("x").tap(function() {
      this.push(this.vars.x);

      this.uint8("y").tap(function() {
        this.push(this.vars.y);

        this.tap(function() {
          this.push(null);
        });
      });
    });

    var counter = 0;

    reader.on("readable", function() {
      var data;
      while (data = reader.read()) {
        counter++;
      }
    });

    reader.on("end", function() {
      if (counter !== 2) {
        return done(Error("invalid counter value"));
      } else {
        return done();
      }
    });

    reader.write(Buffer([0x01, 0x01]));
  });

  it("should populate child objects correctly", function(done) {
    var reader = Dissolve().tap("a", function() {
      this.uint8("x").tap("b", function() {
        this.uint8("y").tap(function() {
          this.push(this.vars);
        });
      });
    });

    reader.on("readable", function() {
      var e = reader.read();

      if (typeof e !== "object" || e === null) {
        return done(Error("invalid payload for data event"));
      }

      if (typeof e.a !== "object" || e.a === null || typeof e.a.b !== "object" || e.a.b === null) {
        return done(Error("child object(s) not set correctly"));
      }

      if (typeof e.a.x !== "number" || typeof e.a.b.y !== "number") {
        return done(Error("child object(s) not set correctly"));
      }

      return done();
    });

    reader.write(Buffer([0x01, 0x01]));
  });
});
