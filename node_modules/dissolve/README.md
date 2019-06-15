Dissolve
========

Parse and consume binary streams with a neat DSL.

Overview
--------

Dissolve allows you to parse packed binary data into numbers, buffers, strings
and more*! With a simple syntax inspired by [node-binary](https://github.com/substack/node-binary)
and a solid, minimal implementation, you can be up and running in no time.

(* implementing "more" is left as an exercise to the reader)

If you want to produce binary data, might I suggest [concentrate](https://github.com/deoxxa/concentrate)?

Features
--------

* Accurate handling of [u]int{8,16,32} numbers in both signed and unsigned
  variants using fast, built-in [Buffer](http://nodejs.org/docs/latest/api/buffer.html)
  methods
* Fast approximation of [u]int64 numbers in signed and unsigned variants
* Extendable base class for building your own parsers and implementing
  custom types
* Tiny (~250 LoC) implementation, allowing for easy debugging

Installation
------------

Available via [npm](http://npmjs.org/):

> $ npm install dissolve

Or via git:

> $ git clone git://github.com/deoxxa/dissolve.git node_modules/dissolve

Usage
-----

Also see [example.js](https://github.com/deoxxa/dissolve/blob/master/example.js),
[example-complex.js](https://github.com/deoxxa/dissolve/blob/master/example-complex.js)
and [example-loop.js](https://github.com/deoxxa/dissolve/blob/master/example-loop.js).

```javascript
#!/usr/bin/env node

var Dissolve = require("./index");

var parser = Dissolve().loop(function(end) {
  this.uint8("id").tap(function() {
    if (this.vars.id === 0x01) {
      this.uint16be("a").uint16be("b");
    } else if (this.vars.id === 0x02) {
      this.uint32be("x").uint32be("y");
    }
  }).tap(function() {
    this.push(this.vars);
    this.vars = {};
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
```

Methods
-------

All parser methods are chainable and return the same parser instance they were
called on.

Tap
---

`tap(name, callback)`

This method allows you to "tap" into the parser at an arbitrary point. The
callback will be called bound to the parser instance, so you can use parser
methods on `this`. Any additional parser steps you introduce inside the callback
will be executed before any existing steps that are already scheduled to run
after the `tap` call.

If you provide a `name` parameter, all actions performed in the callback will be
applied to a child object that will be put into a new property named after
`name`. Note that in the callback, even if you provide a `name` parameter, you
can still pretend you were in the outer "scope" because of some prototype
trickery done with the `vars` object under the hood. You don't need to worry
about that too much, the examples should make it a bit clearer.

Loop
----

`loop(name, callback)`

This method is like `tap` except that the callback is called over and over until
signalled to stop. You do this by calling the `end` function that's provided as
the first argument to your callback. When you call the `end` function, you can
provide an optional truthy/non-truthy flag to tell Dissolve to ignore the result
of the iteration of the loop where `end` was called. This is useful if you are
reading until a null entry or similar.

If you provide a `name` parameter, a new array will be placed into a property
named for that parameter, and after each iteration of the loop, any new values
will be appended to the array as an object. As with the `name` stuff on `tap`,
the examples will make that explanation a lot clearer.

The same semantics for job ordering and "scoping" apply as for `tap`.

Basic Parsing Methods
---------------------

For each basic parsing method, the `name` value is the key under which the value
will be attached to `this.vars`.

Buffer/String Methods
---------------------

For these methods, the `length` parameter tells the parser how many bytes to
pull out. If it's a string, it will be assumed that it is the name of a
previously-set `this.vars` entry. If it's a number, it will be used as-is.

* `buffer(name, length)` - binary slice
* `string(name, length)` - utf8 string slice

Numeric Methods
---------------

* `int8(name)` - signed 8 bit integer
* `sint8(name)` - signed 8 bit integer
* `uint8(name)` - unsigned 8 bit integer
* `int16(name)` - signed, little endian 16 bit integer
* `int16le(name)` - signed, little endian 16 bit integer
* `int16be(name)` - signed, big endian 16 bit integer
* `sint16(name)` - signed, little endian 16 bit integer
* `sint16le(name)` - signed, little endian 16 bit integer
* `sint16be(name)` - signed, big endian 16 bit integer
* `uint16(name)` - unsigned, little endian 16 bit integer
* `uint16le(name)` - unsigned, little endian 16 bit integer
* `uint16be(name)` - unsigned, big endian 16 bit integer
* `int32(name)` - signed, little endian 32 bit integer
* `int32le(name)` - signed, little endian 32 bit integer
* `int32be(name)` - signed, big endian 32 bit integer
* `sint32(name)` - signed, little endian 32 bit integer
* `sint32le(name)` - signed, little endian 32 bit integer
* `sint32be(name)` - signed, big endian 32 bit integer
* `uint32(name)` - unsigned, little endian 32 bit integer
* `uint32le(name)` - unsigned, little endian 32 bit integer
* `uint32be(name)` - unsigned, big endian 32 bit integer
* `int64(name)` - signed, little endian 64 bit integer
* `int64le(name)` - signed, little endian 64 bit integer
* `int64be(name)` - signed, big endian 64 bit integer
* `sint64(name)` - signed, little endian 64 bit integer
* `sint64le(name)` - signed, little endian 64 bit integer
* `sint64be(name)` - signed, big endian 64 bit integer
* `uint64(name)` - unsigned, little endian 64 bit integer
* `uint64le(name)` - unsigned, little endian 64 bit integer
* `uint64be(name)` - unsigned, big endian 64 bit integer
* `floatbe(data)` - big endian 32 bit float
* `floatle(data)` - little endian 32 bit float
* `doublebe(data)` - big endian 64 bit double
* `doublele(data)` - little endian 64 bit double

License
-------

3-clause BSD. A copy is included with the source.

Contact
-------

* GitHub ([deoxxa](http://github.com/deoxxa))
* Twitter ([@deoxxa](http://twitter.com/deoxxa))
* ADN ([@deoxxa](https://alpha.app.net/deoxxa))
* Email ([deoxxa@fknsrs.biz](mailto:deoxxa@fknsrs.biz))
