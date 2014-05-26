var io = require("socket.io");

(function() {
    var nowObjects = {};
    var noConflict = function(uri, options) {
        uri = uri || "";
        if (nowObjects[uri]) return nowObjects[uri];
        options = options || {};
        options.socketio = options.socketio || {};
        options.socketio.resource = options.socketio.resource || "socket.io";
        var socket;
        var closures = {};
        var nowReady = false;
        var readied = 0;
        var lastTimeout;
        var util, lib;
        var isIE = false;
        var fqnMap = {
            data: {},
            arrays: {},
            get: function(fqn) {
                return fqnMap.data[fqn];
            },
            set: function(fqn, val) {
                if (void 0 !== fqnMap.data[fqn]) fqnMap.deleteChildren(fqn, val); else {
                    var lastIndex = fqn.lastIndexOf(".");
                    var parent = fqn.substring(0, lastIndex);
                    fqnMap.addParent(parent, fqn.substring(lastIndex + 1));
                }
                return fqnMap.data[fqn] = val;
            },
            addParent: function(parent, key) {
                if (parent) {
                    util.isArray(fqnMap.data[parent]) || fqnMap.set(parent, []);
                    fqnMap.data[parent].push(key);
                }
            },
            deleteChildren: function(fqn) {
                var keys = this.data[fqn];
                var children = [];
                if (util.isArray(this.data[fqn])) for (var i = 0; keys.length; ) {
                    var arr = this.deleteVar(fqn + "." + keys[i]);
                    for (var j = 0; arr.length > j; j++) children.push(arr[j]);
                }
                return children;
            },
            deleteVar: function(fqn) {
                var lastIndex = fqn.lastIndexOf(".");
                var parent = fqn.substring(0, lastIndex);
                if (util.hasProperty(this.data, parent)) {
                    var index = util.indexOf(this.data[parent], fqn.substring(lastIndex + 1));
                    index > -1 && this.data[parent].splice(index, 1);
                }
                var children = this.deleteChildren(fqn);
                children.push(fqn);
                delete this.data[fqn];
                this.unflagAsArray(fqn);
                return children;
            },
            flagAsArray: function(val) {
                return this.arrays[val] = true;
            },
            unflagAsArray: function(val) {
                delete this.arrays[val];
            }
        };
        util = {
            _events: {},
            on: function(name, fn) {
                util.hasProperty(util._events, name) || (util._events[name] = []);
                util._events[name].push(fn);
                return util;
            },
            indexOf: function(arr, val) {
                for (var i = 0, ii = arr.length; ii > i; i++) if ("" + arr[i] === val) return i;
                return -1;
            },
            emit: function(name, args) {
                if (util.hasProperty(util._events, name)) {
                    var events = util._events[name].slice(0);
                    for (var i = 0, ii = events.length; ii > i; i++) events[i].apply(util, void 0 === args ? [] : args);
                }
                return util;
            },
            removeEvent: function(name, fn) {
                if (util.hasProperty(util._events, name)) for (var a = 0, l = util._events[name].length; l > a; a++) util._events[name][a] === fn && util._events[name].splice(a, 1);
                return util;
            },
            hasProperty: function(obj, prop) {
                return Object.prototype.hasOwnProperty.call(Object(obj), prop);
            },
            isArray: Array.isArray || function(obj) {
                return "[object Array]" === Object.prototype.toString.call(obj);
            },
            createVarAtFqn: function(scope, fqn, value) {
                var path = fqn.split(".");
                var currVar = util.forceGetParentVarAtFqn(scope, fqn);
                var key = path.pop();
                fqnMap.set(fqn, value && "object" == typeof value ? [] : value);
                util.isArray(value) && fqnMap.flagAsArray(fqn);
                currVar[key] = value;
                isIE || util.isArray(currVar) || util.watch(currVar, key, fqn);
            },
            forceGetParentVarAtFqn: function(scope, fqn) {
                var path = fqn.split(".");
                path.shift();
                var currVar = scope;
                while (path.length > 1) {
                    var prop = path.shift();
                    util.hasProperty(currVar, prop) || (currVar[prop] = isNaN(path[0]) ? {} : []);
                    currVar[prop] && "object" == typeof currVar[prop] || (currVar[prop] = {});
                    currVar = currVar[prop];
                }
                return currVar;
            },
            getVarFromFqn: function(scope, fqn) {
                var path = fqn.split(".");
                path.shift();
                var currVar = scope;
                while (path.length > 0) {
                    var prop = path.shift();
                    if (!util.hasProperty(currVar, prop)) return false;
                    currVar = currVar[prop];
                }
                return currVar;
            },
            generateRandomString: function() {
                return Math.random().toString().substr(2);
            },
            getValOrFqn: function(val, fqn) {
                if ("function" == typeof val) {
                    if (val.remote) return void 0;
                    return {
                        fqn: fqn
                    };
                }
                return val;
            },
            watch: function(obj, label, fqn) {
                function getter() {
                    return val;
                }
                function setter(newVal) {
                    if (val !== newVal && newVal !== fqnMap.get(fqn)) {
                        if (val && "object" == typeof val) {
                            fqnMap.deleteVar(fqn);
                            socket.emit("del", [ fqn ]);
                            val = newVal;
                            lib.processScope(obj, fqn.substring(0, fqn.lastIndexOf(".")));
                            return newVal;
                        }
                        if (newVal && "object" == typeof newVal) {
                            fqnMap.deleteVar(fqn);
                            socket.emit("del", [ fqn ]);
                            val = newVal;
                            lib.processScope(obj, fqn.substring(0, fqn.lastIndexOf(".")));
                            return newVal;
                        }
                        fqnMap.set(fqn, newVal);
                        val = newVal;
                        "function" == typeof newVal && (newVal = {
                            fqn: fqn
                        });
                        var toReplace = {};
                        toReplace[fqn] = newVal;
                        socket.emit("rv", toReplace);
                    }
                    return newVal;
                }
                var val = obj[label];
                if (Object.defineProperty) Object.defineProperty(obj, label, {
                    get: getter,
                    set: setter
                }); else {
                    obj.__defineSetter__ && obj.__defineSetter__(label, setter);
                    obj.__defineGetter__ && obj.__defineGetter__(label, getter);
                }
            },
            unwatch: function(obj, label) {
                if (Object.defineProperty) Object.defineProperty(obj, label, {
                    get: void 0,
                    set: void 0
                }); else {
                    obj.__defineSetter__ && obj.__defineSetter__(label, void 0);
                    obj.__defineGetter__ && obj.__defineGetter__(label, void 0);
                }
            }
        };
        var now = {
            ready: function(func) {
                if (0 === arguments.length) util.emit("ready"); else {
                    nowReady && func();
                    util.on("ready", func);
                }
            },
            core: {
                on: util.on,
                options: options,
                removeEvent: util.removeEvent,
                clientId: void 0,
                noConflict: noConflict
            }
        };
        lib = {
            deleteVar: function(fqn) {
                var path, currVar, key;
                path = fqn.split(".");
                currVar = now;
                for (var i = 1; path.length > i; i++) {
                    key = path[i];
                    if (void 0 === currVar) {
                        fqnMap.deleteVar(fqn);
                        return;
                    }
                    if (i === path.length - 1) {
                        delete currVar[path.pop()];
                        fqnMap.deleteVar(fqn);
                        return;
                    }
                    currVar = currVar[key];
                }
            },
            replaceVar: function(data) {
                for (var fqn in data) {
                    util.hasProperty(data[fqn], "fqn") && (data[fqn] = lib.constructRemoteFunction(fqn));
                    util.createVarAtFqn(now, fqn, data[fqn]);
                }
            },
            remoteCall: function(data) {
                var func;
                func = "closure" === data.fqn.split("_")[0] ? closures[data.fqn] : util.getVarFromFqn(now, data.fqn);
                var i, ii, args = data.args;
                if ("object" == typeof args && !util.isArray(args)) {
                    var newargs = [];
                    for (i in args) newargs.push(args[i]);
                    args = newargs;
                }
                for (i = 0, ii = args.length; ii > i; i++) util.hasProperty(args[i], "fqn") && (args[i] = lib.constructRemoteFunction(args[i].fqn));
                func.apply({
                    now: now
                }, args);
            },
            serverReady: function() {
                nowReady = true;
                lib.processNowScope();
                util.emit("ready");
            },
            constructRemoteFunction: function(fqn) {
                var remoteFn = function() {
                    lib.processNowScope();
                    var args = [];
                    for (var i = 0, ii = arguments.length; ii > i; i++) args[i] = arguments[i];
                    for (i = 0, ii = args.length; ii > i; i++) if ("function" == typeof args[i]) {
                        var closureId = "closure_" + args[i].name + "_" + util.generateRandomString();
                        closures[closureId] = args[i];
                        args[i] = {
                            fqn: closureId
                        };
                    }
                    socket.emit("rfc", {
                        fqn: fqn,
                        args: args
                    });
                };
                remoteFn.remote = true;
                return remoteFn;
            },
            handleNewConnection: function(socket) {
                if (socket.handled) return;
                socket.handled = true;
                socket.on("rfc", function(data) {
                    lib.remoteCall(data);
                    util.emit("rfc", data);
                });
                socket.on("rv", function(data) {
                    lib.replaceVar(data);
                    util.emit("rv", data);
                });
                socket.on("del", function(data) {
                    lib.deleteVar(data);
                    util.emit("del", data);
                });
                socket.on("rd", function() {
                    2 === ++readied && lib.serverReady();
                });
                socket.on("disconnect", function() {
                    readied = 0;
                    util.emit("disconnect");
                });
                socket.on("error", function() {
                    util.emit("error");
                });
                socket.on("retry", function() {
                    util.emit("retry");
                });
                socket.on("reconnect", function() {
                    util.emit("reconnect");
                });
                socket.on("reconnect_failed", function() {
                    util.emit("reconnect_failed");
                });
                socket.on("connect_failed", function() {
                    util.emit("connect_failed");
                });
            },
            processNowScope: function() {
                lib.processScope(now, "now");
                "number" == typeof lastTimeout && clearTimeout(lastTimeout);
                socket.socket.connected && (lastTimeout = setTimeout(lib.processNowScope, 1e3));
            },
            processScope: function(obj, path) {
                var data = {};
                lib.traverseScope(obj, path, data);
                for (var i in data) if (util.hasProperty(data, i) && void 0 !== data[i]) {
                    socket.emit("rv", data);
                    break;
                }
            },
            traverseScope: function(obj, path, data) {
                if (obj && "object" == typeof obj) {
                    var objIsArray = util.isArray(obj);
                    var keys = fqnMap.get(path);
                    for (var key in obj) {
                        var fqn = path + "." + key;
                        if ("now.core" === fqn || "now.ready" === fqn) continue;
                        if (util.hasProperty(obj, key)) {
                            var val = obj[key];
                            var mapVal = fqnMap.get(fqn);
                            var wasArray = fqnMap.arrays[fqn];
                            var valIsArray = util.isArray(val);
                            var valIsObj = val && "object" == typeof val;
                            var wasObject = util.isArray(mapVal) && !wasArray;
                            if (objIsArray || isIE) {
                                if (valIsObj) {
                                    if (valIsArray) {
                                        if (!wasArray) {
                                            fqnMap.set(fqn, []);
                                            fqnMap.flagAsArray(fqn);
                                            data[fqn] = [];
                                        }
                                    } else if (!wasObject) {
                                        fqnMap.set(fqn, []);
                                        fqnMap.unflagAsArray(fqn);
                                        data[fqn] = {};
                                    }
                                } else if (val !== mapVal) {
                                    fqnMap.set(fqn, val);
                                    fqnMap.unflagAsArray(fqn);
                                    data[fqn] = util.getValOrFqn(val, fqn);
                                }
                            } else if (void 0 === mapVal) {
                                util.watch(obj, key, fqn);
                                if (valIsObj) if (valIsArray) {
                                    fqnMap.set(fqn, []);
                                    fqnMap.flagAsArray(fqn);
                                    data[fqn] = [];
                                } else {
                                    fqnMap.set(fqn, []);
                                    data[fqn] = {};
                                } else {
                                    fqnMap.set(fqn, val);
                                    data[fqn] = util.getValOrFqn(val, fqn);
                                }
                            }
                            valIsObj && lib.traverseScope(val, fqn, data);
                        }
                    }
                    if (keys && "object" == typeof keys) {
                        var toDelete = [];
                        for (var i = 0; keys.length > i; i++) if (void 0 !== keys[i] && void 0 === obj[keys[i]]) {
                            toDelete.push(path + "." + keys[i]);
                            fqnMap.deleteVar(path + "." + keys[i]);
                            --i;
                        }
                        toDelete.length > 0 && socket.emit("del", toDelete);
                    }
                }
            },
            traverseScopeIE: function() {}
        };
        (function() {
            socket = io.connect(uri + "/", now.core.options.socketio || {});
            now.core.socketio = socket;
            socket.on("connect", function() {
                now.core.clientId = socket.socket.sessionid;
                lib.handleNewConnection(socket);
                setTimeout(function() {
                    lib.processNowScope();
                    socket.emit("rd");
                    if (2 === ++readied) {
                        nowReady = true;
                        util.emit("ready");
                    }
                }, 100);
                util.emit("connect");
            });
            socket.on("disconnect", function() {
                (function(y) {
                    y(y, now);
                })(function(fn, obj) {
                    for (var i in obj) obj[i] && "object" == typeof obj[i] && obj[i] !== now.core ? fn(fn, obj[i]) : "function" == typeof obj[i] && obj[i].remote && delete obj[i];
                });
                fqnMap.data = {};
            });
        })();
        return nowObjects[uri] = now;
    };
    exports.nowInitialize = noConflict;
})();