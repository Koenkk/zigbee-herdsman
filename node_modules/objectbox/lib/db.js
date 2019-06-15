var Datastore = require('nedb'),
    _ = require('busyman');

function Db (fileName) {
    if (typeof fileName !== 'string')
        throw new Error('fileName must be a string.');

    this._db = new Datastore({ filename: fileName, autoload: true });
    this._db.ensureIndex({ fieldName: 'id', unique: true }, function (err) {
        if (err) throw err;
    });
}

Db.prototype.insert = function (doc, callback) {
    var self = this;

    this.findById(doc.id, function (err, result) {
        if (err) {  
            callback(err);
        } else if (!result) {
            self._db.insert(doc, function (err, newDoc) {
                if (err)
                    callback(err);
                else
                    callback(null, newDoc);
            });
        } else {
            self._db.update({ id: result.id }, { $set: doc }, { multi: true }, function (err, numReplaced) {
                self.findById(doc.id, function (err, updatedDoc) {
                    if (err)
                        callback(err);
                    else
                        callback(null, updatedDoc);
                });
            });
        }
    });
};

Db.prototype.removeById = function (id, callback) {
    this._db.remove({ id: id }, { multi: true }, function (err, numRemoved) {
        if (err)
            callback(err);
        else 
            callback(null, numRemoved);
    });
};

Db.prototype.findById = function (id, callback) {
    this._db.findOne({ id: id }, function (err, doc) {
        if (err)
            callback(err);
        else 
            callback(null, doc);
    });
};

Db.prototype.modify = function (id, path, snippet, callback) {
    var self = this,
        pLength = path.length + 1,
        diffSnippet = {},
        invalidPath = [],
        objToModify = {};

    if (path === 'id' /*|| snippet.id !== undefined*/) {
        setImmediate(function () {
            callback(new Error('id can not be modified.'));
        });
    } else {

        if (typeof snippet === 'object') 
            objToModify = buildPathValuePair(path, snippet);
        else 
            objToModify[path] = snippet;

        this.findById(id, function (err, item) {

            if (err) {
                callback(err);
            } else if (!item) {
                callback(new Error('No such object ' + id + ' for property modifying.'));
            } else {
                _.forEach(objToModify, function (val, key) {
                    if (!_.has(item, key))
                        invalidPath.push(key);
                });

                if (invalidPath.length !== 0) {
                    callback(new Error('No such property ' + invalidPath[0] + ' to modify.'));
                } else {
                    self._db.update({ id: id }, { $set: objToModify }, { multi: true }, function (err, numReplaced) {
                        if (err) {
                            callback(err);
                        } else {
                            self.findById(id, function (err, newItem) {
                                _.forEach(objToModify, function (val, checkPath) {
                                    var subPath = checkPath.substr(pLength),
                                        newVal = _.get(newItem, checkPath),
                                        oldVal = _.get(item, checkPath);

                                    subPath = (subPath === '') ? checkPath : subPath;
                                    if ( newVal !== oldVal)
                                        _.set(diffSnippet, subPath, newVal);
                                });

                                callback(null, diffSnippet);
                            });
                        }
                    });
                }
            }
        });
    }
};

Db.prototype.replace = function (id, path, value, callback) {
    var self = this,
        objToReplace = {};

    if (path === 'id') {
        setImmediate(function () {
            callback(new Error('id can not be replaced.'));
        });
    } else {
        objToReplace[path] = value;

        this.findById(id, function (err, item) {
            if (!item) {
                callback(new Error('No such object ' + id + ' for property replacing.'));
            } else if (!_.has(item, path)) {
                callback(new Error('No such property ' + path + ' to replace.'));
            } else {
                self._db.update({ id: id }, { $set: objToReplace }, { multi: true }, function (err, numReplaced) {
                    if (err)
                        callback(err);
                    else 
                        callback(null, numReplaced);
                });
            }
        });
    }
};

Db.prototype.findAll = function (callback) {
    var cursor = this._db.find({ id: { $exists: true } });

    cursor.sort({ id: 1 }).exec(function (err, docs) {
        if (err)
            callback(err);
        else
            callback(null, docs);
    });
};

Db.prototype.find = function (query, callback) {
    return this._db.find(query, callback);
};

/***********************************************************************/
/*** Private: helpers                                                ***/
/***********************************************************************/
function buildPathValuePair (path, obj) {
    var result = {};

    _.forEach(obj, function (val, key) {
        if (_.isObject(val))
            result = _.merge(result, buildPathValuePair(path + '.' + key, val));
        else 
            result[path + '.' + key] = val;
    });

    return result;
}

module.exports = Db;
