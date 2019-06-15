/* jshint node: true */
'use strict';

var _ = require('busyman'),
    Db = require('./db');

function Storage(database, maxNum) {
    var path;

    if (_.isNumber(database) && arguments.length === 1) {
        maxNum = database;
        database = null;
    }

    if (!_.isNil(maxNum) && !_.isNumber(maxNum))
        throw new Error('maxNum should be a number if given.');

    if (_.isNil(database))
        path = __dirname + '/database/objectbox.db';
    else if (_.isString(database))
        path = database;
    else if (!_.isObject(database) || !_.isFunction(database.removeById))
        throw new Error('database should be a backend data store or a file path.');

    this._count = 0;
    this._maxNum = maxNum || 65536;

    this._box = new Dict();

    if (path)
        this._db = new Db(path);
    else
        this._db = database;
}

/***********************************************************************/
/*** Public Methods                                                  ***/
/***********************************************************************/
Storage.prototype.isEmpty = function () {
    return this._count === 0;
};

Storage.prototype.has = function (id) {
    return this._box.has(id);
};

Storage.prototype.get = function (id) {
    return this._box.get(id);
};

Storage.prototype.getMaxNum = function () {
    return this._maxNum;
};

Storage.prototype.getCount = function () {
    return this._count;
};

Storage.prototype.find = function (predicate) {
    return _.find(this._box.elements, predicate);
};

Storage.prototype.findFromDb = function (query, callback) {
    return this._db.find(query, callback);
};

Storage.prototype.filter = function (path, value) {
    var predicator,
        tokens = [],
        objPath = {};

    if (_.isFunction(path)) {
        predicator = path;
        return _.filter(this._box.elements, predicator);
    }else if (_.isString(path)) {
        tokens = path.split('.');
        
        predicator = function (object) {
            objPath = object;

            _.forEach(tokens, function (token) {
                objPath = objPath[token];
            });

            return _.isEqual(objPath, value);
        };

        return _.filter(this._box.elements, predicator);
    } else {
        return [];
    }
};

Storage.prototype.exportAllIds = function () {
    return _.map(_.keys(this._box.elements), function (n) {
        return parseInt(n, 10);
    });
};

Storage.prototype.exportAllObjs = function () {
    return _.values(this._box.elements);
};

Storage.prototype.set = function (id, obj, callback) {
    if (id > this._maxNum - 1)
        invokeCbAsync(callback, new Error('id can not be larger than the maxNum.'));
    else if (this._count > this._maxNum)
        invokeCbAsync(callback, new Error('storage box is already full.'));
    else if (this.has(id))
        invokeCbAsync(callback, new Error('id: ' + id + ' has been used.'));
    else
        this._set(id, obj, callback);                   // set and update count
}; 

Storage.prototype.add = function (obj, callback) { 
    var id;

    if (_.isFunction(obj.dump))
        id = obj.dump().id;
    else 
        id = obj.id;

    if (!_.isNil(id)) {
        this._set(id, obj, callback);                   // same id, will auto update
    } else {
        id = this._nextId();
        if (!_.isNil(id))
            this.set(id, obj, callback);                // will check id conflicts
        else
            invokeCbAsync(callback, new Error('No room for a new object.'));
    }
}; 

Storage.prototype.removeElement = function (id) {
    return this._box.remove(this, id);                  // remove from box and update count
};

Storage.prototype.remove = function (id, callback) {    // remove from box and database, and update count
    var self = this,
        obj = this._box.get(id);

    if (!this.removeElement(id)) {                      // if not there
        this._db.removeById(id, function (err) {
            callback(null);
        });
    } else {
        this._db.removeById(id, function (err) {
            if (err) {
                self._box.set(self, id, obj);           // remove fail, put it back
                callback(err);
            } else {
                callback(null);
            }
        });
    }
};

Storage.prototype.modify = function (id, path, snippet, callback) {
    return this._updateInfo('modify', id, path, snippet, callback);
};

Storage.prototype.replace = function (id, path, value, callback) {
    return this._updateInfo('replace', id, path, value, callback);
};

Storage.prototype.sync = function (id, callback) {
    var self = this,
        obj = this.get(id),
        storeInfo;

    if (!obj) {
        invokeCbAsync(callback, new Error('No such obj of id: ' + id + '.'));
    } else {
        storeInfo = _.isFunction(obj.dump) ? obj.dump() : obj;
        storeInfo.id = id;
        this._db.insert(storeInfo, function (err) {     // put in database
            if (err) {
                callback(err);
            } else {
                callback(null, id);                     // will update if in db
            }
        });
    }
};

Storage.prototype.maintain = function (callback) {
    var self = this,
        rmvDocs = [],
        syncDocs = [];

    this._db.findAll(function (err, docs) {
        if (err) {
            return callback(err);
        } else {
            _.forEach(docs, function (doc) {
                if (!self.has(doc.id)) {
                    rmvDocs.push(function (cb) {
                        return self._db.removeById(doc.id, cb);
                    });
                } else {
                    syncDocs.push(function (cb) {
                        var obj = self.get(doc.id),
                            storeInfo;

                        storeInfo = (_.isFunction(obj.dump)) ? obj.dump() : obj;

                        return self._db.insert(storeInfo, cb);
                    });
                }
            });
        }

        execAsyncFuncs(rmvDocs, function (err) {
            if (err) {
                callback(err);
            } else {
                execAsyncFuncs(syncDocs, function (err) {
                    callback(err);
                });
            }
        });
    });
};

/***********************************************************************/
/*** Protected Methods                                               ***/
/***********************************************************************/
Storage.prototype._nextId = function () {
    // id should start from 1
    var newId = this._count + 1,
        accIndex = 1;

    while (this._box.has(newId)) {
        if (accIndex === this._maxNum) {
            newId = undefined;
            break;
        }

        newId = (newId === (this._maxNum - 1)) ? 1 : (newId + 1);
        accIndex += 1;
    }

    return newId;
};

Storage.prototype._updateCount = function (c) {
    this._count = c;
    return this._count;
};

Storage.prototype._updateInfo = function (type, id, path, value, callback) {
    var item = this.get(id);

    if (!item) {
        invokeCbAsync(callback, new Error('No such item of id: ' + id + ' for property ' + type + '.'));
    } else {
        this._db[type](id, path, value, function (err, result) {
            if (err)
                callback(err);
            else
                callback(null, result);
        });
    }
};

Storage.prototype._set = function (id, obj, callback) {
    var self = this,
        storeInfo = _.isFunction(obj.dump) ? obj.dump() : obj;

    storeInfo.id = id;

    this._box.set(this, id, obj);                   // put in box, and update count

    this._db.insert(storeInfo, function (err) {     // put in database
        if (err) {
            self._box.remove(self, id);             // remove from box, and update count
            callback(err);
        } else {
            callback(null, id);                     // will update if in db
        }
    });
};

/*************************************************************************************************/
/*** Private Class: Dictionary                                                                 ***/
/*************************************************************************************************/
function Dict() {
    this.elements = {};
}

Dict.prototype.has = function (key) {
    return this.elements.hasOwnProperty(key);
};

Dict.prototype.get = function (key) {
    return this.has(key) ? this.elements[key] : undefined;
};

Dict.prototype.set = function (storage, key, val) {
    this.elements[key] = val;
    storage._updateCount(this.size());

    return key;
};

Dict.prototype.remove = function (storage, key) {
    if (this.has(key)) {
        this.elements[key] = null;
        delete this.elements[key];

        storage._updateCount(this.size());
        return true;
    }
    return false;
};

Dict.prototype.size = function () {
    return Object.keys(this.elements).length;
};

/*************************************************************************************************/
/*** Private Function                                                                          ***/
/*************************************************************************************************/
function execAsyncFuncs (funcs, callback) {
    var count = 0,
        flag = false,
        allResult = [];

    if (_.isEmpty(funcs)) 
        return invokeCbAsync(callback, null);

    _.forEach(funcs, function (func) {
        func(function (err, result) {
            count += 1;

            if (flag) return;

            if (err) {
                callback(err);
                flag = true;
            } else {
                allResult.push(result);
            }

            if (count === funcs.length) 
                callback(null, allResult);
        });
    });
}

function invokeCbAsync (cb, err, result) {
    setImmediate(function () {
        cb(err, result);
    });
}

module.exports = Storage;
