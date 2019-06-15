var Dissolve = require("../index");

describe("integers", function() {
  it("00 through uint8 should result in 0", function(done) {
    var reader = Dissolve().uint8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00", "hex"));
  });

  it("01 through uint8 should result in 1", function(done) {
    var reader = Dissolve().uint8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01", "hex"));
  });

  it("7f through uint8 should result in 127", function(done) {
    var reader = Dissolve().uint8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f", "hex"));
  });

  it("ff through uint8 should result in 255", function(done) {
    var reader = Dissolve().uint8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff", "hex"));
  });

  it("00 through int8 should result in 0", function(done) {
    var reader = Dissolve().int8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00", "hex"));
  });

  it("01 through int8 should result in 1", function(done) {
    var reader = Dissolve().int8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01", "hex"));
  });

  it("7f through int8 should result in 127", function(done) {
    var reader = Dissolve().int8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f", "hex"));
  });

  it("ff through int8 should result in -1", function(done) {
    var reader = Dissolve().int8("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -1) {
        return done(Error("expected -1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff", "hex"));
  });

  it("0000 through uint16be should result in 0", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000", "hex"));
  });

  it("0001 through uint16be should result in 1", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0001", "hex"));
  });

  it("007f through uint16be should result in 127", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("007f", "hex"));
  });

  it("00ff through uint16be should result in 255", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00ff", "hex"));
  });

  it("0000 through int16be should result in 0", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000", "hex"));
  });

  it("0001 through int16be should result in 1", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0001", "hex"));
  });

  it("007f through int16be should result in 127", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("007f", "hex"));
  });

  it("00ff through int16be should result in 255", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00ff", "hex"));
  });

  it("7f00 through uint16be should result in 32512", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32512) {
        return done(Error("expected 32512 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00", "hex"));
  });

  it("7f01 through uint16be should result in 32513", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32513) {
        return done(Error("expected 32513 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f01", "hex"));
  });

  it("7f7f through uint16be should result in 32639", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32639) {
        return done(Error("expected 32639 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f7f", "hex"));
  });

  it("7fff through uint16be should result in 32767", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32767) {
        return done(Error("expected 32767 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7fff", "hex"));
  });

  it("7f00 through int16be should result in 32512", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32512) {
        return done(Error("expected 32512 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00", "hex"));
  });

  it("7f01 through int16be should result in 32513", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32513) {
        return done(Error("expected 32513 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f01", "hex"));
  });

  it("7f7f through int16be should result in 32639", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32639) {
        return done(Error("expected 32639 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f7f", "hex"));
  });

  it("7fff through int16be should result in 32767", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32767) {
        return done(Error("expected 32767 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7fff", "hex"));
  });

  it("ff00 through uint16be should result in 65280", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65280) {
        return done(Error("expected 65280 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00", "hex"));
  });

  it("ff01 through uint16be should result in 65281", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65281) {
        return done(Error("expected 65281 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff01", "hex"));
  });

  it("ff7f through uint16be should result in 65407", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65407) {
        return done(Error("expected 65407 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff7f", "hex"));
  });

  it("ffff through uint16be should result in 65535", function(done) {
    var reader = Dissolve().uint16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65535) {
        return done(Error("expected 65535 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffff", "hex"));
  });

  it("ff00 through int16be should result in -256", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -256) {
        return done(Error("expected -256 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00", "hex"));
  });

  it("ff01 through int16be should result in -255", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -255) {
        return done(Error("expected -255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff01", "hex"));
  });

  it("ff7f through int16be should result in -129", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -129) {
        return done(Error("expected -129 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff7f", "hex"));
  });

  it("ffff through int16be should result in -1", function(done) {
    var reader = Dissolve().int16be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -1) {
        return done(Error("expected -1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffff", "hex"));
  });

  it("0000 through uint16le should result in 0", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000", "hex"));
  });

  it("0100 through uint16le should result in 1", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0100", "hex"));
  });

  it("7f00 through uint16le should result in 127", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00", "hex"));
  });

  it("ff00 through uint16le should result in 255", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00", "hex"));
  });

  it("0000 through int16le should result in 0", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000", "hex"));
  });

  it("0100 through int16le should result in 1", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0100", "hex"));
  });

  it("7f00 through int16le should result in 127", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00", "hex"));
  });

  it("ff00 through int16le should result in 255", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00", "hex"));
  });

  it("007f through uint16le should result in 32512", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32512) {
        return done(Error("expected 32512 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("007f", "hex"));
  });

  it("017f through uint16le should result in 32513", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32513) {
        return done(Error("expected 32513 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("017f", "hex"));
  });

  it("7f7f through uint16le should result in 32639", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32639) {
        return done(Error("expected 32639 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f7f", "hex"));
  });

  it("ff7f through uint16le should result in 32767", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32767) {
        return done(Error("expected 32767 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff7f", "hex"));
  });

  it("007f through int16le should result in 32512", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32512) {
        return done(Error("expected 32512 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("007f", "hex"));
  });

  it("017f through int16le should result in 32513", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32513) {
        return done(Error("expected 32513 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("017f", "hex"));
  });

  it("7f7f through int16le should result in 32639", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32639) {
        return done(Error("expected 32639 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f7f", "hex"));
  });

  it("ff7f through int16le should result in 32767", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 32767) {
        return done(Error("expected 32767 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff7f", "hex"));
  });

  it("00ff through uint16le should result in 65280", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65280) {
        return done(Error("expected 65280 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00ff", "hex"));
  });

  it("01ff through uint16le should result in 65281", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65281) {
        return done(Error("expected 65281 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01ff", "hex"));
  });

  it("7fff through uint16le should result in 65407", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65407) {
        return done(Error("expected 65407 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7fff", "hex"));
  });

  it("ffff through uint16le should result in 65535", function(done) {
    var reader = Dissolve().uint16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 65535) {
        return done(Error("expected 65535 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffff", "hex"));
  });

  it("00ff through int16le should result in -256", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -256) {
        return done(Error("expected -256 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00ff", "hex"));
  });

  it("01ff through int16le should result in -255", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -255) {
        return done(Error("expected -255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01ff", "hex"));
  });

  it("7fff through int16le should result in -129", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -129) {
        return done(Error("expected -129 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7fff", "hex"));
  });

  it("ffff through int16le should result in -1", function(done) {
    var reader = Dissolve().int16le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -1) {
        return done(Error("expected -1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffff", "hex"));
  });

  it("00000000 through uint32be should result in 0", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00000000", "hex"));
  });

  it("00000001 through uint32be should result in 1", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00000001", "hex"));
  });

  it("0000007f through uint32be should result in 127", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000007f", "hex"));
  });

  it("000000ff through uint32be should result in 255", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("000000ff", "hex"));
  });

  it("00000000 through int32be should result in 0", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00000000", "hex"));
  });

  it("00000001 through int32be should result in 1", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00000001", "hex"));
  });

  it("0000007f through int32be should result in 127", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000007f", "hex"));
  });

  it("000000ff through int32be should result in 255", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("000000ff", "hex"));
  });

  it("7f000000 through uint32be should result in 2130706432", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706432) {
        return done(Error("expected 2130706432 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f000000", "hex"));
  });

  it("7f000001 through uint32be should result in 2130706433", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706433) {
        return done(Error("expected 2130706433 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f000001", "hex"));
  });

  it("7f00007f through uint32be should result in 2130706559", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706559) {
        return done(Error("expected 2130706559 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00007f", "hex"));
  });

  it("7f0000ff through uint32be should result in 2130706687", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706687) {
        return done(Error("expected 2130706687 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f0000ff", "hex"));
  });

  it("7f000000 through int32be should result in 2130706432", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706432) {
        return done(Error("expected 2130706432 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f000000", "hex"));
  });

  it("7f000001 through int32be should result in 2130706433", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706433) {
        return done(Error("expected 2130706433 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f000001", "hex"));
  });

  it("7f00007f through int32be should result in 2130706559", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706559) {
        return done(Error("expected 2130706559 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00007f", "hex"));
  });

  it("7f0000ff through int32be should result in 2130706687", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706687) {
        return done(Error("expected 2130706687 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f0000ff", "hex"));
  });

  it("ff000000 through uint32be should result in 4278190080", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190080) {
        return done(Error("expected 4278190080 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff000000", "hex"));
  });

  it("ff000001 through uint32be should result in 4278190081", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190081) {
        return done(Error("expected 4278190081 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff000001", "hex"));
  });

  it("ff00007f through uint32be should result in 4278190207", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190207) {
        return done(Error("expected 4278190207 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00007f", "hex"));
  });

  it("ff0000ff through uint32be should result in 4278190335", function(done) {
    var reader = Dissolve().uint32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190335) {
        return done(Error("expected 4278190335 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff0000ff", "hex"));
  });

  it("ffffff00 through int32be should result in -256", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -256) {
        return done(Error("expected -256 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffffff00", "hex"));
  });

  it("ffffff01 through int32be should result in -255", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -255) {
        return done(Error("expected -255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffffff01", "hex"));
  });

  it("ffffff7f through int32be should result in -129", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -129) {
        return done(Error("expected -129 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffffff7f", "hex"));
  });

  it("ffffffff through int32be should result in -1", function(done) {
    var reader = Dissolve().int32be("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -1) {
        return done(Error("expected -1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffffffff", "hex"));
  });

  it("00000000 through uint32le should result in 0", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00000000", "hex"));
  });

  it("01000000 through uint32le should result in 1", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01000000", "hex"));
  });

  it("7f000000 through uint32le should result in 127", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f000000", "hex"));
  });

  it("ff000000 through uint32le should result in 255", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff000000", "hex"));
  });

  it("00000000 through int32le should result in 0", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 0) {
        return done(Error("expected 0 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00000000", "hex"));
  });

  it("01000000 through int32le should result in 1", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 1) {
        return done(Error("expected 1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01000000", "hex"));
  });

  it("7f000000 through int32le should result in 127", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 127) {
        return done(Error("expected 127 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f000000", "hex"));
  });

  it("ff000000 through int32le should result in 255", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 255) {
        return done(Error("expected 255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff000000", "hex"));
  });

  it("0000007f through uint32le should result in 2130706432", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706432) {
        return done(Error("expected 2130706432 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000007f", "hex"));
  });

  it("0100007f through uint32le should result in 2130706433", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706433) {
        return done(Error("expected 2130706433 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0100007f", "hex"));
  });

  it("7f00007f through uint32le should result in 2130706559", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706559) {
        return done(Error("expected 2130706559 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00007f", "hex"));
  });

  it("ff00007f through uint32le should result in 2130706687", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706687) {
        return done(Error("expected 2130706687 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00007f", "hex"));
  });

  it("0000007f through int32le should result in 2130706432", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706432) {
        return done(Error("expected 2130706432 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0000007f", "hex"));
  });

  it("0100007f through int32le should result in 2130706433", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706433) {
        return done(Error("expected 2130706433 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("0100007f", "hex"));
  });

  it("7f00007f through int32le should result in 2130706559", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706559) {
        return done(Error("expected 2130706559 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f00007f", "hex"));
  });

  it("ff00007f through int32le should result in 2130706687", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 2130706687) {
        return done(Error("expected 2130706687 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff00007f", "hex"));
  });

  it("000000ff through uint32le should result in 4278190080", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190080) {
        return done(Error("expected 4278190080 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("000000ff", "hex"));
  });

  it("010000ff through uint32le should result in 4278190081", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190081) {
        return done(Error("expected 4278190081 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("010000ff", "hex"));
  });

  it("7f0000ff through uint32le should result in 4278190207", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190207) {
        return done(Error("expected 4278190207 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7f0000ff", "hex"));
  });

  it("ff0000ff through uint32le should result in 4278190335", function(done) {
    var reader = Dissolve().uint32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== 4278190335) {
        return done(Error("expected 4278190335 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ff0000ff", "hex"));
  });

  it("00ffffff through int32le should result in -256", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -256) {
        return done(Error("expected -256 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("00ffffff", "hex"));
  });

  it("01ffffff through int32le should result in -255", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -255) {
        return done(Error("expected -255 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("01ffffff", "hex"));
  });

  it("7fffffff through int32le should result in -129", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -129) {
        return done(Error("expected -129 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("7fffffff", "hex"));
  });

  it("ffffffff through int32le should result in -1", function(done) {
    var reader = Dissolve().int32le("i").tap(function() {
      this.push(this.vars.i);
    });

    reader.on("readable", function() {
      var data = reader.read();

      if (data !== -1) {
        return done(Error("expected -1 but got " + JSON.stringify(data)));
      } else {
        return done();
      }
    });

    reader.write(Buffer("ffffffff", "hex"));
  });
});
