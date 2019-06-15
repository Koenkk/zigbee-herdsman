# Introduction

[![travis](https://img.shields.io/travis/adrai/enum.svg)](https://travis-ci.org/adrai/enum) [![npm](https://img.shields.io/npm/v/enum.svg)](https://npmjs.org/package/enum) [![Sauce Test Status](https://saucelabs.com/buildstatus/adrirai)](https://saucelabs.com/u/adrirai)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/adrirai.svg)](https://saucelabs.com/u/adrirai)

<!---
[![browser support](https://ci.testling.com/adrai/enum.png)](https://ci.testling.com/adrai/enum)
-->


Enum is a javascript module that introduces the Enum Type. It works for node.js and in the browser.

...and [ref](https://github.com/TooTallNate/ref) compatible [Known Types](https://github.com/TooTallNate/ref/wiki/Known-%22types%22)

# Download
Releases for a browser are available for download from GitHub.

| **Version** | **Description** | **Size** |
|:------------|:----------------|:---------|
| `enum-2.4.0.js` | *uncompressed, with comments* | [Download](https://raw.github.com/adrai/enum/master/enum-2.4.0.js) |
| `enum-2.4.0.min.js` | *compressed, without comments* | [Download](https://raw.github.com/adrai/enum/master/enum-2.4.0.min.js) |

# Installation (node.js)

    $ npm install enum

# Installation (browser)

    <script src="enum.js"></script>

# Usage

````js
// use it as module
var Enum = require('enum');

// or extend node.js with this new type
require('enum').register();

// define a simple enum (automatically flaggable -> A: 0x01, B: 0x02, C: 0x04)
//Uses bitwise 'OR' operation in between the values and creates enumerated constants. For example, if 'Read':1, 'Write':2, then ReadWrite= Read | Write = 1 | 2 = 3;
var myEnum = new Enum(['A', 'B', 'C']);

//define a flagged enum object to create a multicolor option; just pass an array
var myEnum = new Enum(['Black', 'Red', 'Green', 'Blue']);
myEnum; //=> Enum {_options: Object, enums: Array[4], Black: EnumItem, Red: EnumItem, Green: EnumItem….....}
myEnum.isFlaggable; //=> true

for(var i=1; i<8; i++){ console.log(myEnum.get(i).value + '=> '+ myEnum.get(i).key)}
    1=> Black
    2=> Red
    3=> Black | Red
    4=> Green
    5=> Black | Green
    6=> Red | Green
    7=> Black | Red | Green

// define an enum with own values
var myEnum = new Enum({'A': 1, 'B': 2, 'C': 4});

// if defining a flaggable enum, you can define your own separator (default is ' | ')
var myEnum = new Enum(['A', 'B', 'C'], { separator: ' | ' });

// if you want your enum to have a name define it in the options
var myEnum = new Enum(['A', 'B', 'C'], { name: 'MyEnum' });

// or
var myEnum = new Enum(['A', 'B', 'C'], 'MyEnum');

// if you want your enum to have an explicit "endianness", define it in the options
// (defaults to `os.endianness()`)
var myEnum = new Enum(['A', 'B', 'C'], { endianness: 'BE' });

// if you want your enum to be not case sensitive
// (defaults to `false`)
var myEnum = new Enum(['One', 'tWo', 'ThrEE'], { ignoreCase: true });
myEnum.get('one'); // => myEnum.One
myEnum.get('TWO'); // => myEnum.tWo
myEnum.ThrEE.is('three'); // => true

// this option will make instances of Enum non-extensible
// (defaults to `false`)
var myEnum = new Enum(['ONE', 'TWO', 'THREE'], { freez: true });

//define enum type without flag
var myEnum = new Enum({'None': 0, 'Black':1, 'Red': 2, 'Red2': 3, 'Green': 4, 'Blue': 5});
myEnum; //=>  Enum {_options: Object, enums: Array[6], None: EnumItem, Black: EnumItem, Red: EnumItem…........}
myEnum.isFlaggable; //=> false

myEnum.toJSON(); // returns {'None': 0, 'Black':1, 'Red': 2, 'Red2': 3, 'Green': 4, 'Blue': 5}
JSON.stringify(myEnum); // returns '{"None":0,"Black":1,"Red":2,"Red2":3,"Green":4,"Blue":5}'

for(var i=0; i<=5; i++){ console.log(myEnum.get(i).value + '=> '+ myEnum.get(i).key)}
    0=> None
    1=> Black
    2=> Red
    3=> Red2
    4=> Green
    5=> Blue

// iterating over an enum
myEnum.enums.forEach(function(enumItem) {
  console.log(enumItem.key);
});
// => None
// => Black
// => Red
// => Red2
// => Green
// => Blue

// get your item
myEnum.A

// or
myEnum.get('A')

// or
myEnum.get(1)

// or
myEnum.get('A | B')

// or
myEnum.get(3)


// get your value
myEnum.A.value

// get your key
myEnum.A.key


// get all items
myEnum.enums // returns all enums in an array

// check if it's defined
myEnum.isDefined(myEnum.A) // returns true
myEnum.isDefined('A')      // returns true
myEnum.isDefined(1)        // returns true

// compare
myEnum.A.is(myEnum.A)

// or
myEnum.A.is('A')

// or
myEnum.A.is(1)

// or
myEnum.A == myEnum.A

// or
myEnum.A === myEnum.A


// check flag
var myItem = myEnum.get(3); // or [myEnum.get('A | B')]
myItem.has(myEnum.A)

// or
myItem.has('A')

// or
myItem.has(1)


// other functions
myItem.toString() // returns 'A | C'
myItem.toJSON() // returns '"A | C"'
myItem.valueOf() // returns 3

JSON.stringify(myItem) // returns '"A | C"'

//Type Safety:
//Newly created enumerable objects are Type-Safe in a way that it's non-configurable and no longer extensible.
//Each EnumItem has a beack-reference to a constructor and they are implicitly final.
Object.getOwnPropertyDescriptor(myEnum, 'Red'); //=> Object {value: EnumItem, writable: false, enumerable: true, configurable: false}
Object.isExtensible(myEnum); //=> false
myEnum instanceof Enum; //=> true

//Instances of Enum created with 'new' from similar objects are not equal
myEnum1=new Enum({'A':1, 'B':2, 'C':4});
myEnum2=new Enum({'A':1, 'B':2, 'C':4});
myEnum1 == myEnum2 //=> false
myEnum1.A == myEnum2.A //=> false
myEnum1.A.value == myEnum2.A.value //=> true

//This enum object has no properties other than those defined during its creation. Existing Data is 'Persistent' and preserves the original version
myEnum.B.value; //=> 2
myEnum.B = 5; //=> Throws TypeError
delete myEnum.B; //=> false
myEnum.D = 6; //=> doesn't add to the enum object, silently ignores
myEnum.D; // undefined

//Try to define new property throws TypeError
Object.defineProperty(myEnum, D, {value:6, writable:false, enumerable:true});
//=>TypeError: Cannot define property:D, object is not extensible.
````


# License

Copyright (c) 2016 Adriano Raiano, Christoph Hermann

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
