# proving
A very simple type checking helper.

<br />

## Table of Contents

1. [Overiew](#Overiew)  
2. [Installation](#Installation)  
3. [Usage](#Usage)
4. [APIs](#APIs)  

<br />

<a name="Overiew"></a>  
## 1. Overview  

When I was doing many type checking for function arguments, I found myself doing a lot of `if (type_not_met) throw new TypeError(msg)` to make assertions. That's why I collect all these simple checkers together to be **DON'T REPEAT YOURSELF** as well as to help myself lower down line-of-codes.
  
Only 56 LOC to meet my daily use.  

<a name="Installation"></a>
## 2. Installation

> $ npm install proving --save
  
<a name="Usage"></a>
## 3. Usage

Here is a quick example, it's very very simple.

```js
var proving = require('proving');
function myFunc(foo, bar) {
    proving.number(foo, 'foo should be a number.');
    proving.string(bar);    // this will throw will a default message
    // ...
}

myFunc(20, 'hello');    // not throw

myFunc('x', 'hello');   // throw TypeError('foo should be a number.')

myFunc(20, {});         // throw TypeError('Input value should be a string.')
```

<a name="APIs"></a>
## 4. APIs

### .defined(val[, msg])
Throw if val is undefined.  
Default message: `'Input value should be given.'`

### .string(val[, msg])
Throw if val is not a string.  
Default message: `'Input value should be a string.'`

### .number(val[, msg])
Throw if val is not a number. Also throw if val is NaN.  
Default message: `'Input value should be a number and cannot be a NaN.'`

### .boolean(val[, msg])
Throw if val is not a bool.  
Default message: `'Input value should be a bool.'`

### .array(val[, msg])
Throw if val is not an array.  
Default message: `'Input value should be an array.'`

### .object(val[, msg])
Throw if val is not an object. Also throw if val is NaN or null.  
Default message: `'Input value should be an object.'`

### .fn(val[, msg])
Throw if val is not a function.  
Default message: `'Input value should be a function.'`

### .stringOrNumber(val[, msg])
Throw if val is not a string nor a number.  
Default message: `'Input value should be a number or a string.'`

