'strict'
var Dissolve = require('dissolve');

module.exports = function () {
    var dChunks = Dissolve(),
        _rules = [],
        compiled = false;

    dChunks.join = function (rules) {
        if (typeof rules === 'function') {
            rules = [ rules ];
        }

        rules.forEach(function (rule, idx) {
            if (typeof rule === 'object') {
                rules[idx] = Rule.squash(rule.name, rule.rules);
                rule = rules[idx];
            } else if (typeof rule !== 'function') {
                throw new Error('x rule should be a function or a planned object.');
            }
            _rules.push(rule);
        });

        return dChunks;
    };

    dChunks.compile = function (config) {
        var config = config || { once: false };

        if (compiled) {
            throw new Error('The parser has been compiled.');
        }

        _rules.push(Rule.term());

        _rules.forEach(function (rule, idx) {
            if (typeof rule === 'object') {
               _rules[idx] = Rule.squash(rule.name, rule.rules);
            } else if (typeof rule !== 'function') {
                throw new Error('rule should be a function or a planned object.');
            } else {
                if (!rule.hasOwnProperty('claused')) {
                    throw new Error(rule.name + ' is not a valid rule.');
                }
            }
        });

        if (config.once) {
            dChunks.tap(function () {
                _rules.forEach(function (rule) {
                    dChunks = rule(dChunks);
                });
            }); 

            dChunks.once("readable", function() {
                var parsed;
                while (parsed = dChunks.read()) {
                    dChunks.emit('parsed', deepRebuild(parsed));
                }
            });
        } else {
            dChunks.loop(function () {
                this.tap(function () {
                    _rules.forEach(function (rule) {
                        dChunks = rule(dChunks);
                    });
                }); 
            });

            dChunks.on("readable", function() {
                var parsed;
                while (parsed = dChunks.read()) {
                    dChunks.emit('parsed', deepRebuild(parsed));
                }
            });
        }
        compiled = true;
        return dChunks;
    };

    dChunks.Rule = function () {
        return Rule;
    };

    return dChunks;
};

/*************************************************************************************************/
/*** Protected Functions                                                                       ***/
/*************************************************************************************************/

var uintRules = [
  'int8', 'sint8', 'uint8',
  'int16', 'int16le', 'int16be', 'sint16', 'sint16le', 'sint16be', 'uint16', 'uint16le', 'uint16be',
  'int32', 'int32le', 'int32be', 'sint32', 'sint32le', 'sint32be', 'uint32', 'uint32le', 'uint32be',
  'int64', 'int64le', 'int64be', 'sint64', 'sint64le', 'sint64be', 'uint64', 'uint64le', 'uint64be',
  'floatbe', 'floatle', 'doublebe', 'doublele'
];

var Rule = {
    squash: function (name, rules) {
        var clausedRule;
        if (typeof name !== 'string') {
            rules = name;
            name = undefined;
        }

        if (typeof rules === 'function' && rules.claused) {
            rules = [ rules ];
        }

        if (!Array.isArray(rules)) {
            throw new Error('rules should be an array of clasued functions, or a single claused function.');
        }
        clausedRule = function (par) {
            par.tap(name, function () {
                rules.forEach(function (rule, idx) {
                    if (typeof rule === 'object') {
                        rules[idx] = Rule.squash(rule.name, rule.rules);
                        rule = rules[idx];
                    } else if (typeof rule !== 'function' || !rule.claused) {
                        throw new Error('rule should be a claused function or a rule object.');
                    }
                    par = rule(par);
                });
            }).tap(function () {
                for (var k in this.vars) {
                    delete this.vars[k].__proto__;
                }
            });
            return par;
        };

        clausedRule.claused = true;
        return clausedRule;
    },
    clause: function (ruleName, ruleFn) {
        var theRule;

        if (typeof ruleName !== 'string') {
            ruleFn = ruleName;
            ruleName = null;
        }

        if (typeof ruleFn !== 'function') {
            throw new Error('The ruleFn should be a function.');
        }

        theRule = function () {
            var args = arguments,
                clausedRule;

            clausedRule = function (par) {
                ruleFn.apply(par, args);
                return par;
            };
            clausedRule.claused = true;
            return clausedRule;
        };

        if (ruleName) {
            Rule[ruleName] = theRule;
        }
        return theRule;
    },
    term: function () {
        var clausedRule = function (par) {
            par.tap(function () {
                this.push(this.vars);
                this.vars = {};
            });
            return par;
        };

        clausedRule.claused = true;
        return clausedRule;
    },
    buffer: function (name, length) {
        var clausedRule = function (par) {
            par.buffer(name, length);
            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    },
    string: function (name, length) {
        var clausedRule = function (par) {
            par.string(name, length);
            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    },
    bufferPreLenUint8: function (name) {
        var clausedRule = function (par) {
            par.uint8('len').tap(function () {
                this.buffer(name, this.vars.len);
                delete this.vars.len;
            });
            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    },
    bufferPreLenUint16: function (name) {
        var clausedRule = function (par) {
            par.uint16('len').tap(function () {
                this.buffer(name, this.vars.len);
                delete this.vars.len;
            });
            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    },
    stringPreLenUint8: function (name) {
        var clausedRule = function (par) {
            par.uint8('len').tap(function () {
                this.string(name, this.vars.len);
                delete this.vars.len;
            });
            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    },
    stringPreLenUint16: function (name) {
        var clausedRule = function (par) {
            par.uint16('len').tap(function () {
                this.string(name, this.vars.len);
                delete this.vars.len;
            });
            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    },
    repeat: function (name, parFn, times) {
        var timed = false,
            lenType;
        if (typeof name !== 'string') {
            throw new Error('Argument name should be given with a string.');
        }
        if (typeof parFn !== 'function') {
            throw new Error('Argument parFn should be a function.');
        }

        if (typeof times === 'number') {
            timed = true;
        } else if (typeof times === 'string') {
            lenType = times;
        } else {
            lenType = 'uint8';
        }
        var clausedRule = function (par) {
            var tmpName = 'tmp',
                mapped = [],
                repeatCount = 0;

            par.tap(name, function () {
                var rpLength;

                if (!timed) { this[lenType]('len'); }

                this.loop('tmpArr',function (end) {
                    if (!timed) {
                        rpLength = this.vars.len;
                    } else {
                        rpLength = times;
                    }
                    par = parFn(tmpName)(par);
                    repeatCount += 1;

                    if (repeatCount === rpLength) {
                        end();
                    }
                }).tap(function () {
                    if (!timed) { delete this.vars.len; }
                    this.vars.tmpArr.forEach(function (n) {
                        mapped.push(n[tmpName]);
                    });
                    this.vars = mapped;
                });
            }).tap(function () {
                this.vars[name] = mapped;
            });

            return par;
        };
        clausedRule.claused = true;
        return clausedRule;
    }
};


makeRulesOntoRule(Rule, uintRules);

/*************************************************************************************************/
/*** Private Functions                                                                         ***/
/*************************************************************************************************/
function makeRulesOntoRule(ruleObj, ruleNames) {
    for (var i = 0, len = ruleNames.length; i < len; i++) {
        if (!ruleObj.hasOwnProperty(ruleNames[i])) {
            (function () {
                var ruleName = ruleNames[i];
                ruleObj[ruleName] = function () {
                    var args = arguments,
                        clausedRule;

                    clausedRule = function (par) {
                        par[ruleName].apply(par, args);
                        return par;
                    };
                    clausedRule.claused = true;
                    return clausedRule;
                };
            }());
        }
    }
}

function deepRebuild(obj) {
    var built,
        keys;

    if (Array.isArray(obj)) {
        built = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            built.push(deepRebuild(obj[i]));
        }
    } else if (typeof obj === 'object' && !Buffer.isBuffer(obj)) {
        built = {};
        keys = Object.keys(obj);
        keys.forEach(function (prop) {
            built[prop] = deepRebuild(obj[prop]);
        });

    } else {
        built = obj;
    }

    return built;
}
