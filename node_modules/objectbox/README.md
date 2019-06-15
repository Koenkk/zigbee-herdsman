# objectbox
A dictionary to maintain objects with persistence. 

[![NPM](https://nodei.co/npm/objectbox.png?downloads=true)](https://nodei.co/npm/objectbox/)  

[![Travis branch](https://travis-ci.org/hedywings/objectbox.svg?branch=master)](https://travis-ci.org/hedywings/objectbox)
[![npm](https://img.shields.io/npm/v/objectbox.svg?maxAge=2592000)](https://www.npmjs.com/package/objectbox)
[![npm](https://img.shields.io/npm/l/objectbox.svg?maxAge=2592000)](https://www.npmjs.com/package/objectbox)

<br />
  
## Documentation  

Please visit the [Wiki](https://github.com/hedywings/objectbox/wiki).

<br />

## Overview  

**objectbox** is a dictionary to maintain objects with persistence. **objectbox** will give you an unique numeric id when your object is added to the dictionary successfully. You can then use this id to find out the object from the box. **objectbox** uses [NeDB](https://www.npmjs.com/package/nedb) datastore to permanently keep your objects, database is just there by default. If you don't like NeDB, **objectbox** allows you to use your own persistence facility as the datastore for the objects.  

<br />

## Installation  

> $ npm install objectbox --save

<br />

## Usage  

See [Usage](https://github.com/hedywings/objectbox/wiki#Usage) on the Wiki for details.  

Here is an quick example of how to create a box.  

```js
var Objectbox = require('objectbox'),
    boxPath = __dirname + '/database/box.db',
    box = new Objectbox(boxPath, 1000);
```

<br />
  
## License  

Licensed under [MIT](https://github.com/hedywings/objectbox/blob/master/LICENSE).  
