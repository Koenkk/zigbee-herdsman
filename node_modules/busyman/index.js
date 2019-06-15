var _ = {};

/*************************************************************************************************/
/*** Polyfill                                                                                ***/
/*************************************************************************************************/
// polyfill for ES5
if (typeof Object.assign != 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var source = arguments[index];
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/) {
    'use strict';
    if (this == null) {
      throw new TypeError('Array.prototype.includes called on null or undefined');
    }

    var O = Object(this);
    var len = parseInt(O.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    'use strict';
    if (this == null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

/*************************************************************************************************/
/*** Type Check                                                                                ***/
/*************************************************************************************************/
_.isArray = Array.isArray;

_.isNaN = isNaN;

_.isBuffer = Buffer.isBuffer;

_.isInteger = Number.isInteger;

_.isBoolean = function (val) {
    return (typeof val === 'boolean');
};

_.isNumber = function (val) {
    return (typeof val === 'number');
};

_.isString = function (val) {
    return (typeof val === 'string');
};

_.isFunction = function (val) {
    return (typeof val === 'function');
};

_.isUndefined = function (val) {
    return (undefined === val);
};

_.isNull = function (val) {
    return (null === val);
};

_.isNil = function (val) {
    return ((undefined === val) || (null === val));
};

_.isObjectLike = function (val) {
    return !!val && typeof val === 'object';
};

_.isObject = function (val) {
    // null is considered not an object
    return (typeof val === 'object' && val !== null);
};

_.isPlainObject = function (val) {
    // an object, not null, not array, not from Class
    var proto,
        validConstr,
        validProto,
        preCheckPass = _.isObject(val) && !_.isArray(val) && Object.prototype.toString.call(val) === '[object Object]';

    if (!preCheckPass)
        return false;

    validConstr = (typeof val.constructor === 'function');

    if (!validConstr)
        return false;

    proto = val.constructor.prototype;
    validProto = _.isObject(proto);

    if (!validProto || !proto.hasOwnProperty('isPrototypeOf'))
        return false;

    return true;
};

/*************************************************************************************************/
/*** Object                                                                                    ***/
/*************************************************************************************************/
_.assign = Object.assign;

_.keys = Object.keys;

_.values = function (obj) {
    var strLen,
        result = [];

    if (_.isString(obj)) {
        strLen = obj.length;
        for(var i = 0; i < strLen; i += 1) {
            result.push(obj[i]);
        }
    } else if (_.isObject(obj))
        result =  _.map(obj, function (val) {
            return val;
        });

    return result;
};

_.forOwn = function (obj, iteratee) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
            if (false === iteratee(obj[key], key, obj))
                break;  // exit iteration early by explicitly returning false
    }
};

_.get = function (obj, path, defaultValue) {
    var has = true,
        target = obj;

    path = this.toPath(path);

    _.forEach(path, function (key) {
        if (!_.isObject(target)) {
            has = false;
            return false;
        } else if (!(key in target)) {
            has = false;
            return false;
        } else {
            target = target[key];
        }
    });

    return has ? target : defaultValue;
};

_.has = function (obj, path) {
    var has = true,
        target = obj;

    path = this.toPath(path);

    _.forEach(path, function (key) {
        if (!_.isObject(target)) {
            has = false;
            return false;
        } else if (!(key in target)) {
            has = false;
            return false;
        } else {
            target = target[key];
        }
    });

    return has;
};

_.merge = function () {
    var dstObj = arguments[0],
        len = arguments.length;

    for (var i = 1; i < len; i++) {
        _._mergeTwoObjs(dstObj, arguments[i]);
    }

    return dstObj;
};

_.omit = function (obj, props) {
    var copied = _.clone(obj);

    if (_.isArray(copied)) {
        copied = {};

        _.forEach(obj, function (val, i) {
            copied[i] = val;
        });
    }

    if (_.isString(props)) {
        delete copied[props];
    } else if (_.isArray(props)) {
        _.forEach(props, function (prop) {
            delete copied[prop];
        });
    }

    return copied;
};  // return new object (shallow copy)

_.pick = function (obj, props) {
    var copied = {};

    if (_.isString(props))
        props = [ props ];

    _.forEach(props, function (prop) {
        if (_.isString(prop) && !_.isUndefined(obj[prop]))
            copied[prop] = obj[prop];
    });

    return copied;
};  // return new object (shallow copy)

_.set = function (obj, path, val) {
    var allocated = obj,
        lastObj,
        lastKey;

    path = _.toPath(path);
    // [a, k]
    _.forEach(path, function (key, i) {
        if (!_.isObject(allocated[key]))
            if (!_.isNaN(_.parseInt(path[i + 1])))
                allocated[key] = [];
            else
                allocated[key] = {};
        else if (!allocated.hasOwnProperty(key))
            allocated[key] = undefined;

        lastObj = allocated;
        lastKey = key;
        allocated = allocated[key];
    });

    lastObj[lastKey] = val;

    return obj;
};

_.has = function (obj, path) {
    var has = true,
        target = obj;

    path = this.toPath(path);

    _.forEach(path, function (key) {
        if (!_.isObject(target)) {
            has = false;
            return false;
        } else if (!(key in target)) {
            has = false;
            return false;
        } else {
            target = target[key];
        }
    });

    return has;
};

_.unset = function (obj, path) {
    var maxIdx = 0,
        deleted = true,
        parentObj = obj;

    path = _.toPath(path);
    maxIdx = path.length - 1;

    _.forEach(path, function (key, i) {
        if (!_.isObject(parentObj))
            return false;   // break immediately

        if (i === maxIdx && (key in parentObj))
            delete parentObj[key];
        else
            parentObj = parentObj[key];
    });

    return deleted;
};

/*************************************************************************************************/
/*** Collection                                                                                ***/
/*************************************************************************************************/
_.forEach = function (collection, iter) {
    if (_.isArray(collection) || _.isArguments(collection)) {
        // we don't use Array.prototype.forEach, since it cannot early break.
        for (var i = 0, len = collection.length; i < len; i++) {
            if (false === iter(collection[i], i, collection))
                break;
        }
    } else if (_.isObject(collection)) {
        return _.forOwn(collection, iter);
    }
};

_.includes = function (collection, val) {
    var included = false;

    if (_.isString(collection)) {
        included = collection.includes(val);
    } else if (_.isArray(collection) || _.isObject(collection)) {
        _.forEach(collection, function (item) {
            if (item === val) {
                included = true;
                return false;   //  break the loop
            }
        });
    }

    return included;
};

_.size = function (val) {
    var size = 0;

    if (val === null)
        size = 0;
    else if (_.isArray(val))
        size = val.length;
    else if (_.isObject(val))
        size = Object.keys(val).length;
    else if (_.isString(val))
        size = val.length;

    return size;
};

_.filter = function (colleciton, pred) {
    var toPred,
        result = [];

    if (!_.isFunction(pred)) {
        toPred = function (val) {
            return val === pred;
        };
    } else {
        toPred = pred;
    }

    _.forEach(colleciton, function (val, key) {
        if (true === toPred(val, key, colleciton))
            result.push(colleciton[key]);
    });

    return result;
};

_.find = function (colleciton, pred) {
    var result;

    if (_.isArray(colleciton)) {
        result = colleciton.find(pred);
    } else {
        _.forEach(colleciton, function (val, key) {
            if (true === pred(val, key, colleciton)) {
                result = (colleciton[key]);
                return false;   // break the loop
            }
        });
    }

    return result;
};

_.every = function (colleciton, pred) {
    var every = true;

    if (!_.isFunction(pred)) 
        throw new TypeError('pred should be a function.');

    _.forEach(colleciton, function (val, key) {
        if (false === pred(val, key, colleciton)) {
            every = false;
            return false;
        }
    });

    return every;
};

/*************************************************************************************************/
/*** Array                                                                                     ***/
/*************************************************************************************************/
_.concat = function () {
    var arr = arguments[0],
        args = [];

    for (var i = 1, len = arguments.length; i < len; i++) {
        args.push(arguments[i]);
    }

    return Array.prototype.concat.apply(arr, args);
};

_.drop = function (arr, n) {
    n = n || 0;
    return Array.prototype.slice.call(arr, n, arr.length);
};

_.dropRight = function (arr, n) {
    var end;
    n = n || 0;
    end = arr.length - n;
    end = end < 0 ? 0 : end;
    return Array.prototype.slice.call(arr, 0, end);
};

_.findIndex = function (arr, pred, thisArg) {
    return Array.prototype.findIndex.call(arr, pred, thisArg);
};

_.indexOf = function (arr, val, index) {
    return Array.prototype.indexOf.call(arr, val, index);
};

_.join = function (arr, sep) {
    return Array.prototype.join.call(arr, sep);
};

_.last = function (arr) {
    return arr[arr.length - 1];
};

_.pull = function () {
    var valMaxIndex = arguments.length,
        arr = arguments[0];

    for (var i = 1; i < valMaxIndex; i++) {
        _.remove(arr, arguments[i]);
    }

    return arr;
};

_.slice = function (arr, start, end) {
    return Array.prototype.slice.call(arr, start, end);
};

_.take = function (arr, n) {
    return Array.prototype.slice.call(arr, 0, n);
};

_.map = function (arr, fn) {
    var result = [];

    _.forEach(arr, function(val, index) {
        result.push(fn(val, index, arr));
    });

    return result;
};

_.reject = function (colleciton, pred) {
    var result = [];

    if (!_.isFunction(pred))
        throw new TypeError('pred should be a function.');

    _.forEach(colleciton, function (val, key) {
        if (false === pred(val, key, colleciton))
            result.push(colleciton[key]);
    });

    return result;
};

_.some = function (colleciton, pred) {
    var has = false;

    if (!_.isFunction(pred)) 
        throw new TypeError('pred should be a function.');

    _.forEach(colleciton, function (val, key) {
        if (true === pred(val, key, colleciton)) {
           has = true;
           return false;
        }
    });

    return has;
};

_.now = Date.now;

_.remove = function (arr, pred) {
    var toPred,
        len = arr.length,
        hit = false,
        removed = [];

    if (!_.isFunction(pred))
        toPred = function (val, idx) {
            return pred === val;
        };
    else
        toPred = pred;

    for (var i = 0; i < len; i++) {
        hit = toPred(arr[i], i, arr);
        if (hit) {
            removed.push(arr.splice(i, 1)[0]);
            len -= 1;
            i -= 1;
        }
    }

    return removed;
};

/*************************************************************************************************/
/*** Function                                                                                  ***/
/*************************************************************************************************/
_.bind = function () {
    var fn = arguments[0],
        thisArg = arguments[1],
        partials = [];    

    for (var i = 2, len = arguments.length; i < len; i++) {
        partials.push(arguments[i]);
    }

    function wrapper() {
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(leftLength + argsLength);

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }

        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }

        return fn.apply(thisArg, args);
      }

    return wrapper;
};

_.delay = function () {
    var fn = arguments[0],
        dly = arguments[1] || 0,
        args = [];

    for (var i = 2, len = arguments.length; i < len; i++) {
        args.push(arguments[i]);
    }

    return setTimeout(function () {
        fn.apply(null, args);
    }, dly);
};

/*************************************************************************************************/
/*** String                                                                                    ***/
/*************************************************************************************************/
_.parseInt = parseInt;

_.split = function (str) {
    return String.prototype.split.call(str, arguments[1], arguments[2]);
};

_.camelCase = function (str) {
    var result;
    // replace -, _ with  (space)
    str = str.replace(/-/g, ' ');
    str = str.replace(/_/g, ' ');
    str = str.trim();
    str = str.toLowerCase();

    str = str.split(' ');

    _.forEach(str, function (str, idx) {
        // 1st lower case, ... Uppercae, then concat all
        if (idx === 0)
            result = str;
        else
            result += _.upperFirst(str);
    });

    return result;
};

_.endsWith = function (str) {
    return String.prototype.endsWith.call(str, arguments[1], arguments[2]);
};

_.replace = function (str) {
    return String.prototype.replace.call(str, arguments[1], arguments[2]);
};

_.startsWith = function (str) {
    return String.prototype.startsWith.call(str, arguments[1], arguments[2]);
};

_.toLower = function (str) {
    return str.toLowerCase();
};

_.toUpper = function (str) {
    return str.toUpperCase();
};

_.lowerCase = function (str) {
    // replace -, _ with  (space)
    str = str.replace(/-/g, ' ');
    str = str.replace(/_/g, ' ');
    str = str.trim();

    return str.toLowerCase();
};

_.lowerFirst = function (str) {
    var head = str.substr(0, 1).toLowerCase(),
        tail = str.substr(1, str.length - 1);

    return (head + tail);
};

_.upperCase = function (str) {
    // replace -, _ with  (space)
    str = str.replace(/-/g, ' ');
    str = str.replace(/_/g, ' ');
    str = str.trim();

    return str.toUpperCase();
};

_.upperFirst = function (str) {
    var head = str.substr(0, 1).toUpperCase(),
        tail = str.substr(1, str.length - 1);

    return (head + tail);
};

/*************************************************************************************************/
/*** Utils                                                                                     ***/
/*************************************************************************************************/
_.isEmpty = function (val) {
    var empty = false;

    if (_.isObject(val))
        empty = !_.keys(val).length;
    else if (_.isArray(val) || _.isString(val) || _.isBuffer(val))
        empty = !val.length;
    else if (_.isNil(val))
        empty = true;
    else if (Object.prototype.hasOwnProperty.call(val, 'length'))
        empty = !val.length;
    else if (Object.prototype.hasOwnProperty.call(val, 'size'))
        empty = !val.size;

    return empty;
};

_.isEqual = function (val, other) {
    var isEq = true;

    if (typeof val !== typeof other)
        return false;
    else if (_.isArray(val) && !_.isArray(other))
        return false;
    else if (_.isArray(other) && !_.isArray(val))
        return false;
    else if (_.isFunction(val) || _.isFunction(other))
        return false;
    else if (!_.isObjectLike(val))
        return val === other;

    // object-like comparison
    if (_.size(val) !== _.size(other))
        return false;

    _.forEach(other, function (v, k) {
        isEq = _.isEqual(val[k], v);
        return isEq;    // false, break immediately
    });

    return isEq;
};

_.toPath = function (str) {
    var pathArr;

    if (_.isArray(str)) {
        pathArr = str.map(function (val) {
            return val.toString();
        });
    } else if (_.isString(str)) {
        pathArr = str.split(/\.|\[|\]/);
        _.remove(pathArr, '');
    }

    return pathArr;
};

_.clone = function (collection) {
    var copied;

    if (_.isArray(collection))
        copied = [];
    else if (_.isObject)
        copied = {};

    if (copied) {
        _.forEach(collection, function (val, key) {
            copied[key] = val;
        });
    }

    return copied;
};  // shallow copy

_.cloneDeep = function (collection) {
    var copied;

    if (_.isArray(collection))
        copied = [];
    else if (_.isObject(collection))
        copied = {};

    if (copied) {
        _.forEach(collection, function (val, key) {
            copied[key] = _.cloneDeep(val);
        });
    } else {
        copied = collection;
    }

    return copied;
};  // deep copy

_._mergeTwoObjs = function (dst, src) {
    _.forEach(src, function (val, key) {
        if (!_.isUndefined(val)) {
            if (!_.isObjectLike(val))
                dst[key] = val;
            else if (!_.isObjectLike(dst[key]))
                dst[key] = val;
            else
                _._mergeTwoObjs(dst[key], val);
        }
    });

    return dst;
};

_.isArguments = function (arg) {
    return Object.prototype.toString.call(arg) === "[object Arguments]";
};

module.exports = _;
