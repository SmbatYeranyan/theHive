(function(exports, global) {
    var io = exports;
    io.version = "0.9.1-1";
    io.protocol = 1;
    io.transports = [];
    io.j = [];
    io.sockets = {};
    io.connect = function(host, details) {
        var uuri, socket, uri = io.util.parseUri(host);
        if (global && global.location) {
            uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
            uri.host = uri.host || (global.document ? global.document.domain : global.location.hostname);
            uri.port = uri.port || global.location.port;
        }
        uuri = io.util.uniqueUri(uri);
        var options = {
            host: uri.host,
            secure: "https" == uri.protocol,
            port: uri.port || ("https" == uri.protocol ? 443 : 80),
            query: uri.query || ""
        };
        io.util.merge(options, details);
        (options["force new connection"] || !io.sockets[uuri]) && (socket = new io.Socket(options));
        !options["force new connection"] && socket && (io.sockets[uuri] = socket);
        socket = socket || io.sockets[uuri];
        return socket.of(uri.path.length > 1 ? uri.path : "");
    };
})("object" == typeof module ? module.exports : this.io = {}, this);

(function(exports, global) {
    var util = exports.util = {};
    var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    var parts = [ "source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor" ];
    util.parseUri = function(str) {
        var m = re.exec(str || ""), uri = {}, i = 14;
        while (i--) uri[parts[i]] = m[i] || "";
        return uri;
    };
    util.uniqueUri = function(uri) {
        var protocol = uri.protocol, host = uri.host, port = uri.port;
        if ("document" in global) {
            host = host || document.domain;
            port = port || ("https" == protocol && "https:" !== document.location.protocol ? 443 : document.location.port);
        } else {
            host = host || "localhost";
            port || "https" != protocol || (port = 443);
        }
        return (protocol || "http") + "://" + host + ":" + (port || 80);
    };
    util.query = function(base, addition) {
        var query = util.chunkQuery(base || ""), components = [];
        util.merge(query, util.chunkQuery(addition || ""));
        for (var part in query) query.hasOwnProperty(part) && components.push(part + "=" + query[part]);
        return components.length ? "?" + components.join("&") : "";
    };
    util.chunkQuery = function(qs) {
        var kv, query = {}, params = qs.split("&"), i = 0, l = params.length;
        for (;l > i; ++i) {
            kv = params[i].split("=");
            kv[0] && (query[kv[0]] = kv[1]);
        }
        return query;
    };
    var pageLoaded = false;
    util.load = function(fn) {
        if ("document" in global && "complete" === document.readyState || pageLoaded) return fn();
        util.on(global, "load", fn, false);
    };
    util.on = function(element, event, fn, capture) {
        element.attachEvent ? element.attachEvent("on" + event, fn) : element.addEventListener && element.addEventListener(event, fn, capture);
    };
    util.request = function(xdomain) {
        if (xdomain && "undefined" != typeof XDomainRequest) return new XDomainRequest();
        if ("undefined" != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) return new XMLHttpRequest();
        if (!xdomain) try {
            return new (window[[ "Active" ].concat("Object").join("X")])("Microsoft.XMLHTTP");
        } catch (e) {}
        return null;
    };
    "undefined" != typeof window && util.load(function() {
        pageLoaded = true;
    });
    util.defer = function(fn) {
        if (!util.ua.webkit || "undefined" != typeof importScripts) return fn();
        util.load(function() {
            setTimeout(fn, 100);
        });
    };
    util.merge = function(target, additional, deep, lastseen) {
        var prop, seen = lastseen || [], depth = "undefined" == typeof deep ? 2 : deep;
        for (prop in additional) if (additional.hasOwnProperty(prop) && 0 > util.indexOf(seen, prop)) if ("object" == typeof target[prop] && depth) util.merge(target[prop], additional[prop], depth - 1, seen); else {
            target[prop] = additional[prop];
            seen.push(additional[prop]);
        }
        return target;
    };
    util.mixin = function(ctor, ctor2) {
        util.merge(ctor.prototype, ctor2.prototype);
    };
    util.inherit = function(ctor, ctor2) {
        function f() {}
        f.prototype = ctor2.prototype;
        ctor.prototype = new f();
    };
    util.isArray = Array.isArray || function(obj) {
        return "[object Array]" === Object.prototype.toString.call(obj);
    };
    util.intersect = function(arr, arr2) {
        var ret = [], longest = arr.length > arr2.length ? arr : arr2, shortest = arr.length > arr2.length ? arr2 : arr;
        for (var i = 0, l = shortest.length; l > i; i++) ~util.indexOf(longest, shortest[i]) && ret.push(shortest[i]);
        return ret;
    };
    util.indexOf = function(arr, o, i) {
        for (var j = arr.length, i = 0 > i ? 0 > i + j ? 0 : i + j : i || 0; j > i && arr[i] !== o; i++) ;
        return i >= j ? -1 : i;
    };
    util.toArray = function(enu) {
        var arr = [];
        for (var i = 0, l = enu.length; l > i; i++) arr.push(enu[i]);
        return arr;
    };
    util.ua = {};
    util.ua.hasCORS = "undefined" != typeof XMLHttpRequest && function() {
        try {
            var a = new XMLHttpRequest();
        } catch (e) {
            return false;
        }
        return void 0 != a.withCredentials;
    }();
    util.ua.webkit = "undefined" != typeof navigator && /webkit/i.test(navigator.userAgent);
})("undefined" != typeof io ? io : module.exports, this);

(function(exports, io) {
    function EventEmitter() {}
    exports.EventEmitter = EventEmitter;
    EventEmitter.prototype.on = function(name, fn) {
        this.$events || (this.$events = {});
        this.$events[name] ? io.util.isArray(this.$events[name]) ? this.$events[name].push(fn) : this.$events[name] = [ this.$events[name], fn ] : this.$events[name] = fn;
        return this;
    };
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prototype.once = function(name, fn) {
        function on() {
            self.removeListener(name, on);
            fn.apply(this, arguments);
        }
        var self = this;
        on.listener = fn;
        this.on(name, on);
        return this;
    };
    EventEmitter.prototype.removeListener = function(name, fn) {
        if (this.$events && this.$events[name]) {
            var list = this.$events[name];
            if (io.util.isArray(list)) {
                var pos = -1;
                for (var i = 0, l = list.length; l > i; i++) if (list[i] === fn || list[i].listener && list[i].listener === fn) {
                    pos = i;
                    break;
                }
                if (0 > pos) return this;
                list.splice(pos, 1);
                list.length || delete this.$events[name];
            } else (list === fn || list.listener && list.listener === fn) && delete this.$events[name];
        }
        return this;
    };
    EventEmitter.prototype.removeAllListeners = function(name) {
        this.$events && this.$events[name] && (this.$events[name] = null);
        return this;
    };
    EventEmitter.prototype.listeners = function(name) {
        this.$events || (this.$events = {});
        this.$events[name] || (this.$events[name] = []);
        io.util.isArray(this.$events[name]) || (this.$events[name] = [ this.$events[name] ]);
        return this.$events[name];
    };
    EventEmitter.prototype.emit = function(name) {
        if (!this.$events) return false;
        var handler = this.$events[name];
        if (!handler) return false;
        var args = Array.prototype.slice.call(arguments, 1);
        if ("function" == typeof handler) handler.apply(this, args); else {
            if (!io.util.isArray(handler)) return false;
            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; l > i; i++) listeners[i].apply(this, args);
        }
        return true;
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports);

(function(exports, nativeJSON) {
    "use strict";
    function f(n) {
        return 10 > n ? "0" + n : n;
    }
    function date(d) {
        return isFinite(d.valueOf()) ? d.getUTCFullYear() + "-" + f(d.getUTCMonth() + 1) + "-" + f(d.getUTCDate()) + "T" + f(d.getUTCHours()) + ":" + f(d.getUTCMinutes()) + ":" + f(d.getUTCSeconds()) + "Z" : null;
    }
    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return "string" == typeof c ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        var i, k, v, length, partial, mind = gap, value = holder[key];
        value instanceof Date && (value = date(key));
        "function" == typeof rep && (value = rep.call(holder, key, value));
        switch (typeof value) {
          case "string":
            return quote(value);

          case "number":
            return isFinite(value) ? String(value) : "null";

          case "boolean":
          case "null":
            return String(value);

          case "object":
            if (!value) return "null";
            gap += indent;
            partial = [];
            if ("[object Array]" === Object.prototype.toString.apply(value)) {
                length = value.length;
                for (i = 0; length > i; i += 1) partial[i] = str(i, value) || "null";
                v = 0 === partial.length ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            if (rep && "object" == typeof rep) {
                length = rep.length;
                for (i = 0; length > i; i += 1) if ("string" == typeof rep[i]) {
                    k = rep[i];
                    v = str(k, value);
                    v && partial.push(quote(k) + (gap ? ": " : ":") + v);
                }
            } else for (k in value) if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = str(k, value);
                v && partial.push(quote(k) + (gap ? ": " : ":") + v);
            }
            v = 0 === partial.length ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }
    if (nativeJSON && nativeJSON.parse) return exports.JSON = {
        parse: nativeJSON.parse,
        stringify: nativeJSON.stringify
    };
    var JSON = exports.JSON = {};
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
        "\b": "\\b",
        "	": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\"
    }, rep;
    JSON.stringify = function(value, replacer, space) {
        var i;
        gap = "";
        indent = "";
        if ("number" == typeof space) for (i = 0; space > i; i += 1) indent += " "; else "string" == typeof space && (indent = space);
        rep = replacer;
        if (replacer && "function" != typeof replacer && ("object" != typeof replacer || "number" != typeof replacer.length)) throw new Error("JSON.stringify");
        return str("", {
            "": value
        });
    };
    JSON.parse = function(text, reviver) {
        function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && "object" == typeof value) for (k in value) if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = walk(value, k);
                void 0 !== v ? value[k] = v : delete value[k];
            }
            return reviver.call(holder, key, value);
        }
        var j;
        text = String(text);
        cx.lastIndex = 0;
        cx.test(text) && (text = text.replace(cx, function(a) {
            return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }));
        if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
            j = eval("(" + text + ")");
            return "function" == typeof reviver ? walk({
                "": j
            }, "") : j;
        }
        throw new SyntaxError("JSON.parse");
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof JSON ? JSON : void 0);

(function(exports, io) {
    var parser = exports.parser = {};
    var packets = parser.packets = [ "disconnect", "connect", "heartbeat", "message", "json", "event", "ack", "error", "noop" ];
    var reasons = parser.reasons = [ "transport not supported", "client not handshaken", "unauthorized" ];
    var advice = parser.advice = [ "reconnect" ];
    var JSON = io.JSON, indexOf = io.util.indexOf;
    parser.encodePacket = function(packet) {
        var type = indexOf(packets, packet.type), id = packet.id || "", endpoint = packet.endpoint || "", ack = packet.ack, data = null;
        switch (packet.type) {
          case "error":
            var reason = packet.reason ? indexOf(reasons, packet.reason) : "", adv = packet.advice ? indexOf(advice, packet.advice) : "";
            ("" !== reason || "" !== adv) && (data = reason + ("" !== adv ? "+" + adv : ""));
            break;

          case "message":
            "" !== packet.data && (data = packet.data);
            break;

          case "event":
            var ev = {
                name: packet.name
            };
            packet.args && packet.args.length && (ev.args = packet.args);
            data = JSON.stringify(ev);
            break;

          case "json":
            data = JSON.stringify(packet.data);
            break;

          case "connect":
            packet.qs && (data = packet.qs);
            break;

          case "ack":
            data = packet.ackId + (packet.args && packet.args.length ? "+" + JSON.stringify(packet.args) : "");
        }
        var encoded = [ type, id + ("data" == ack ? "+" : ""), endpoint ];
        null !== data && void 0 !== data && encoded.push(data);
        return encoded.join(":");
    };
    parser.encodePayload = function(packets) {
        var decoded = "";
        if (1 == packets.length) return packets[0];
        for (var i = 0, l = packets.length; l > i; i++) {
            var packet = packets[i];
            decoded += "�" + packet.length + "�" + packets[i];
        }
        return decoded;
    };
    var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;
    parser.decodePacket = function(data) {
        var pieces = data.match(regexp);
        if (!pieces) return {};
        var id = pieces[2] || "", data = pieces[5] || "", packet = {
            type: packets[pieces[1]],
            endpoint: pieces[4] || ""
        };
        if (id) {
            packet.id = id;
            packet.ack = pieces[3] ? "data" : true;
        }
        switch (packet.type) {
          case "error":
            var pieces = data.split("+");
            packet.reason = reasons[pieces[0]] || "";
            packet.advice = advice[pieces[1]] || "";
            break;

          case "message":
            packet.data = data || "";
            break;

          case "event":
            try {
                var opts = JSON.parse(data);
                packet.name = opts.name;
                packet.args = opts.args;
            } catch (e) {}
            packet.args = packet.args || [];
            break;

          case "json":
            try {
                packet.data = JSON.parse(data);
            } catch (e) {}
            break;

          case "connect":
            packet.qs = data || "";
            break;

          case "ack":
            var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
            if (pieces) {
                packet.ackId = pieces[1];
                packet.args = [];
                if (pieces[3]) try {
                    packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
                } catch (e) {}
            }
            break;

          case "disconnect":
          case "heartbeat":        }
        return packet;
    };
    parser.decodePayload = function(data) {
        if ("�" == data.charAt(0)) {
            var ret = [];
            for (var i = 1, length = ""; data.length > i; i++) if ("�" == data.charAt(i)) {
                ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
                i += Number(length) + 1;
                length = "";
            } else length += data.charAt(i);
            return ret;
        }
        return [ parser.decodePacket(data) ];
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports);

(function(exports, io) {
    function Transport(socket, sessid) {
        this.socket = socket;
        this.sessid = sessid;
    }
    exports.Transport = Transport;
    io.util.mixin(Transport, io.EventEmitter);
    Transport.prototype.onData = function(data) {
        this.clearCloseTimeout();
        (this.socket.connected || this.socket.connecting || this.socket.reconnecting) && this.setCloseTimeout();
        if ("" !== data) {
            var msgs = io.parser.decodePayload(data);
            if (msgs && msgs.length) for (var i = 0, l = msgs.length; l > i; i++) this.onPacket(msgs[i]);
        }
        return this;
    };
    Transport.prototype.onPacket = function(packet) {
        this.socket.setHeartbeatTimeout();
        if ("heartbeat" == packet.type) return this.onHeartbeat();
        "connect" == packet.type && "" == packet.endpoint && this.onConnect();
        this.socket.onPacket(packet);
        return this;
    };
    Transport.prototype.setCloseTimeout = function() {
        if (!this.closeTimeout) {
            var self = this;
            this.closeTimeout = setTimeout(function() {
                self.onDisconnect();
            }, this.socket.closeTimeout);
        }
    };
    Transport.prototype.onDisconnect = function() {
        this.close && this.open && this.close();
        this.clearTimeouts();
        this.socket.onDisconnect();
        return this;
    };
    Transport.prototype.onConnect = function() {
        this.socket.onConnect();
        return this;
    };
    Transport.prototype.clearCloseTimeout = function() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    };
    Transport.prototype.clearTimeouts = function() {
        this.clearCloseTimeout();
        this.reopenTimeout && clearTimeout(this.reopenTimeout);
    };
    Transport.prototype.packet = function(packet) {
        this.send(io.parser.encodePacket(packet));
    };
    Transport.prototype.onHeartbeat = function() {
        this.packet({
            type: "heartbeat"
        });
    };
    Transport.prototype.onOpen = function() {
        this.open = true;
        this.clearCloseTimeout();
        this.socket.onOpen();
    };
    Transport.prototype.onClose = function() {
        this.open = false;
        this.socket.onClose();
        this.onDisconnect();
    };
    Transport.prototype.prepareUrl = function() {
        var options = this.socket.options;
        return this.scheme() + "://" + options.host + ":" + options.port + "/" + options.resource + "/" + io.protocol + "/" + this.name + "/" + this.sessid;
    };
    Transport.prototype.ready = function(socket, fn) {
        fn.call(this);
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports);

(function(exports, io, global) {
    function Socket(options) {
        this.options = {
            port: 80,
            secure: false,
            document: "document" in global ? document : false,
            resource: "socket.io",
            transports: io.transports,
            "connect timeout": 1e4,
            "try multiple transports": true,
            reconnect: true,
            "reconnection delay": 500,
            "reconnection limit": 1/0,
            "reopen delay": 3e3,
            "max reconnection attempts": 10,
            "sync disconnect on unload": true,
            "auto connect": true,
            "flash policy port": 10843
        };
        io.util.merge(this.options, options);
        this.connected = false;
        this.open = false;
        this.connecting = false;
        this.reconnecting = false;
        this.namespaces = {};
        this.buffer = [];
        this.doBuffer = false;
        if (this.options["sync disconnect on unload"] && (!this.isXDomain() || io.util.ua.hasCORS)) {
            var self = this;
            io.util.on(global, "beforeunload", function() {
                self.disconnectSync();
            }, false);
        }
        this.options["auto connect"] && this.connect();
    }
    function empty() {}
    exports.Socket = Socket;
    io.util.mixin(Socket, io.EventEmitter);
    Socket.prototype.of = function(name) {
        if (!this.namespaces[name]) {
            this.namespaces[name] = new io.SocketNamespace(this, name);
            "" !== name && this.namespaces[name].packet({
                type: "connect"
            });
        }
        return this.namespaces[name];
    };
    Socket.prototype.publish = function() {
        this.emit.apply(this, arguments);
        var nsp;
        for (var i in this.namespaces) if (this.namespaces.hasOwnProperty(i)) {
            nsp = this.of(i);
            nsp.$emit.apply(nsp, arguments);
        }
    };
    Socket.prototype.handshake = function(fn) {
        function complete(data) {
            data instanceof Error ? self.onError(data.message) : fn.apply(null, data.split(":"));
        }
        var self = this, options = this.options;
        var url = [ "http" + (options.secure ? "s" : "") + ":/", options.host + ":" + options.port, options.resource, io.protocol, io.util.query(this.options.query, "t=" + +new Date()) ].join("/");
        if (this.isXDomain() && !io.util.ua.hasCORS) {
            var insertAt = document.getElementsByTagName("script")[0], script = document.createElement("script");
            script.src = url + "&jsonp=" + io.j.length;
            insertAt.parentNode.insertBefore(script, insertAt);
            io.j.push(function(data) {
                complete(data);
                script.parentNode.removeChild(script);
            });
        } else {
            var xhr = io.util.request();
            xhr.open("GET", url, true);
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (4 == xhr.readyState) {
                    xhr.onreadystatechange = empty;
                    200 == xhr.status ? complete(xhr.responseText) : !self.reconnecting && self.onError(xhr.responseText);
                }
            };
            xhr.send(null);
        }
    };
    Socket.prototype.getTransport = function(override) {
        var transports = override || this.transports;
        for (var transport, i = 0; transport = transports[i]; i++) if (io.Transport[transport] && io.Transport[transport].check(this) && (!this.isXDomain() || io.Transport[transport].xdomainCheck())) return new io.Transport[transport](this, this.sessionid);
        return null;
    };
    Socket.prototype.connect = function(fn) {
        if (this.connecting) return this;
        var self = this;
        this.handshake(function(sid, heartbeat, close, transports) {
            function connect(transports) {
                self.transport && self.transport.clearTimeouts();
                self.transport = self.getTransport(transports);
                if (!self.transport) return self.publish("connect_failed");
                self.transport.ready(self, function() {
                    self.connecting = true;
                    self.publish("connecting", self.transport.name);
                    self.transport.open();
                    self.options["connect timeout"] && (self.connectTimeoutTimer = setTimeout(function() {
                        if (!self.connected) {
                            self.connecting = false;
                            if (self.options["try multiple transports"]) {
                                self.remainingTransports || (self.remainingTransports = self.transports.slice(0));
                                var remaining = self.remainingTransports;
                                while (remaining.length > 0 && remaining.splice(0, 1)[0] != self.transport.name) ;
                                remaining.length ? connect(remaining) : self.publish("connect_failed");
                            }
                        }
                    }, self.options["connect timeout"]));
                });
            }
            self.sessionid = sid;
            self.closeTimeout = 1e3 * close;
            self.heartbeatTimeout = 1e3 * heartbeat;
            self.transports = io.util.intersect(transports.split(","), self.options.transports);
            self.setHeartbeatTimeout();
            connect();
            self.once("connect", function() {
                clearTimeout(self.connectTimeoutTimer);
                fn && "function" == typeof fn && fn();
            });
        });
        return this;
    };
    Socket.prototype.setHeartbeatTimeout = function() {
        clearTimeout(this.heartbeatTimeoutTimer);
        var self = this;
        this.heartbeatTimeoutTimer = setTimeout(function() {
            self.transport.onClose();
        }, this.heartbeatTimeout);
    };
    Socket.prototype.packet = function(data) {
        this.connected && !this.doBuffer ? this.transport.packet(data) : this.buffer.push(data);
        return this;
    };
    Socket.prototype.setBuffer = function(v) {
        this.doBuffer = v;
        if (!v && this.connected && this.buffer.length) {
            this.transport.payload(this.buffer);
            this.buffer = [];
        }
    };
    Socket.prototype.disconnect = function() {
        if (this.connected || this.connecting) {
            this.open && this.of("").packet({
                type: "disconnect"
            });
            this.onDisconnect("booted");
        }
        return this;
    };
    Socket.prototype.disconnectSync = function() {
        var xhr = io.util.request(), uri = this.resource + "/" + io.protocol + "/" + this.sessionid;
        xhr.open("GET", uri, true);
        this.onDisconnect("booted");
    };
    Socket.prototype.isXDomain = function() {
        var port = global.location.port || ("https:" == global.location.protocol ? 443 : 80);
        return this.options.host !== global.location.hostname || this.options.port != port;
    };
    Socket.prototype.onConnect = function() {
        if (!this.connected) {
            this.connected = true;
            this.connecting = false;
            this.doBuffer || this.setBuffer(false);
            this.emit("connect");
        }
    };
    Socket.prototype.onOpen = function() {
        this.open = true;
    };
    Socket.prototype.onClose = function() {
        this.open = false;
        clearTimeout(this.heartbeatTimeoutTimer);
    };
    Socket.prototype.onPacket = function(packet) {
        this.of(packet.endpoint).onPacket(packet);
    };
    Socket.prototype.onError = function(err) {
        if (err && err.advice && "reconnect" === err.advice && (this.connected || this.connecting)) {
            this.disconnect();
            this.options.reconnect && this.reconnect();
        }
        this.publish("error", err && err.reason ? err.reason : err);
    };
    Socket.prototype.onDisconnect = function(reason) {
        var wasConnected = this.connected, wasConnecting = this.connecting;
        this.connected = false;
        this.connecting = false;
        this.open = false;
        if (wasConnected || wasConnecting) {
            this.transport.close();
            this.transport.clearTimeouts();
            if (wasConnected) {
                this.publish("disconnect", reason);
                "booted" != reason && this.options.reconnect && !this.reconnecting && this.reconnect();
            }
        }
    };
    Socket.prototype.reconnect = function() {
        function reset() {
            if (self.connected) {
                for (var i in self.namespaces) self.namespaces.hasOwnProperty(i) && "" !== i && self.namespaces[i].packet({
                    type: "connect"
                });
                self.publish("reconnect", self.transport.name, self.reconnectionAttempts);
            }
            clearTimeout(self.reconnectionTimer);
            self.removeListener("connect_failed", maybeReconnect);
            self.removeListener("connect", maybeReconnect);
            self.reconnecting = false;
            delete self.reconnectionAttempts;
            delete self.reconnectionDelay;
            delete self.reconnectionTimer;
            delete self.redoTransports;
            self.options["try multiple transports"] = tryMultiple;
        }
        function maybeReconnect() {
            if (!self.reconnecting) return;
            if (self.connected) return reset();
            if (self.connecting && self.reconnecting) return self.reconnectionTimer = setTimeout(maybeReconnect, 1e3);
            if (self.reconnectionAttempts++ >= maxAttempts) if (self.redoTransports) {
                self.publish("reconnect_failed");
                reset();
            } else {
                self.on("connect_failed", maybeReconnect);
                self.options["try multiple transports"] = true;
                self.transport = self.getTransport();
                self.redoTransports = true;
                self.connect();
            } else {
                limit > self.reconnectionDelay && (self.reconnectionDelay *= 2);
                self.connect();
                self.publish("reconnecting", self.reconnectionDelay, self.reconnectionAttempts);
                self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
            }
        }
        this.reconnecting = true;
        this.reconnectionAttempts = 0;
        this.reconnectionDelay = this.options["reconnection delay"];
        var self = this, maxAttempts = this.options["max reconnection attempts"], tryMultiple = this.options["try multiple transports"], limit = this.options["reconnection limit"];
        this.options["try multiple transports"] = false;
        this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);
        this.on("connect", maybeReconnect);
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);

(function(exports, io) {
    function SocketNamespace(socket, name) {
        this.socket = socket;
        this.name = name || "";
        this.flags = {};
        this.json = new Flag(this, "json");
        this.ackPackets = 0;
        this.acks = {};
    }
    function Flag(nsp, name) {
        this.namespace = nsp;
        this.name = name;
    }
    exports.SocketNamespace = SocketNamespace;
    io.util.mixin(SocketNamespace, io.EventEmitter);
    SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;
    SocketNamespace.prototype.of = function() {
        return this.socket.of.apply(this.socket, arguments);
    };
    SocketNamespace.prototype.packet = function(packet) {
        packet.endpoint = this.name;
        this.socket.packet(packet);
        this.flags = {};
        return this;
    };
    SocketNamespace.prototype.send = function(data, fn) {
        var packet = {
            type: this.flags.json ? "json" : "message",
            data: data
        };
        if ("function" == typeof fn) {
            packet.id = ++this.ackPackets;
            packet.ack = true;
            this.acks[packet.id] = fn;
        }
        return this.packet(packet);
    };
    SocketNamespace.prototype.emit = function(name) {
        var args = Array.prototype.slice.call(arguments, 1), lastArg = args[args.length - 1], packet = {
            type: "event",
            name: name
        };
        if ("function" == typeof lastArg) {
            packet.id = ++this.ackPackets;
            packet.ack = "data";
            this.acks[packet.id] = lastArg;
            args = args.slice(0, args.length - 1);
        }
        packet.args = args;
        return this.packet(packet);
    };
    SocketNamespace.prototype.disconnect = function() {
        if ("" === this.name) this.socket.disconnect(); else {
            this.packet({
                type: "disconnect"
            });
            this.$emit("disconnect");
        }
        return this;
    };
    SocketNamespace.prototype.onPacket = function(packet) {
        function ack() {
            self.packet({
                type: "ack",
                args: io.util.toArray(arguments),
                ackId: packet.id
            });
        }
        var self = this;
        switch (packet.type) {
          case "connect":
            this.$emit("connect");
            break;

          case "disconnect":
            "" === this.name ? this.socket.onDisconnect(packet.reason || "booted") : this.$emit("disconnect", packet.reason);
            break;

          case "message":
          case "json":
            var params = [ "message", packet.data ];
            "data" == packet.ack ? params.push(ack) : packet.ack && this.packet({
                type: "ack",
                ackId: packet.id
            });
            this.$emit.apply(this, params);
            break;

          case "event":
            var params = [ packet.name ].concat(packet.args);
            "data" == packet.ack && params.push(ack);
            this.$emit.apply(this, params);
            break;

          case "ack":
            if (this.acks[packet.ackId]) {
                this.acks[packet.ackId].apply(this, packet.args);
                delete this.acks[packet.ackId];
            }
            break;

          case "error":
            packet.advice ? this.socket.onError(packet) : "unauthorized" == packet.reason ? this.$emit("connect_failed", packet.reason) : this.$emit("error", packet.reason);
        }
    };
    Flag.prototype.send = function() {
        this.namespace.flags[this.name] = true;
        this.namespace.send.apply(this.namespace, arguments);
    };
    Flag.prototype.emit = function() {
        this.namespace.flags[this.name] = true;
        this.namespace.emit.apply(this.namespace, arguments);
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports);

(function(exports, io, global) {
    function WS() {
        io.Transport.apply(this, arguments);
    }
    exports.websocket = WS;
    io.util.inherit(WS, io.Transport);
    WS.prototype.name = "websocket";
    WS.prototype.open = function() {
        var Socket, query = io.util.query(this.socket.options.query), self = this;
        Socket || (Socket = global.MozWebSocket || global.WebSocket);
        this.websocket = new Socket(this.prepareUrl() + query);
        this.websocket.onopen = function() {
            self.onOpen();
            self.socket.setBuffer(false);
        };
        this.websocket.onmessage = function(ev) {
            self.onData(ev.data);
        };
        this.websocket.onclose = function() {
            self.onClose();
            self.socket.setBuffer(true);
        };
        this.websocket.onerror = function(e) {
            self.onError(e);
        };
        return this;
    };
    WS.prototype.send = function(data) {
        this.websocket.send(data);
        return this;
    };
    WS.prototype.payload = function(arr) {
        for (var i = 0, l = arr.length; l > i; i++) this.packet(arr[i]);
        return this;
    };
    WS.prototype.close = function() {
        this.websocket.close();
        return this;
    };
    WS.prototype.onError = function(e) {
        this.socket.onError(e);
    };
    WS.prototype.scheme = function() {
        return this.socket.options.secure ? "wss" : "ws";
    };
    WS.check = function() {
        return "WebSocket" in global && !("__addTask" in WebSocket) || "MozWebSocket" in global;
    };
    WS.xdomainCheck = function() {
        return true;
    };
    io.transports.push("websocket");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);

(function(exports, io) {
    function Flashsocket() {
        io.Transport.websocket.apply(this, arguments);
    }
    exports.flashsocket = Flashsocket;
    io.util.inherit(Flashsocket, io.Transport.websocket);
    Flashsocket.prototype.name = "flashsocket";
    Flashsocket.prototype.open = function() {
        var self = this, args = arguments;
        WebSocket.__addTask(function() {
            io.Transport.websocket.prototype.open.apply(self, args);
        });
        return this;
    };
    Flashsocket.prototype.send = function() {
        var self = this, args = arguments;
        WebSocket.__addTask(function() {
            io.Transport.websocket.prototype.send.apply(self, args);
        });
        return this;
    };
    Flashsocket.prototype.close = function() {
        WebSocket.__tasks.length = 0;
        io.Transport.websocket.prototype.close.call(this);
        return this;
    };
    Flashsocket.prototype.ready = function(socket, fn) {
        function init() {
            var options = socket.options, port = options["flash policy port"], path = [ "http" + (options.secure ? "s" : "") + ":/", options.host + ":" + options.port, options.resource, "static/flashsocket", "WebSocketMain" + (socket.isXDomain() ? "Insecure" : "") + ".swf" ];
            if (!Flashsocket.loaded) {
                "undefined" == typeof WEB_SOCKET_SWF_LOCATION && (WEB_SOCKET_SWF_LOCATION = path.join("/"));
                843 !== port && WebSocket.loadFlashPolicyFile("xmlsocket://" + options.host + ":" + port);
                WebSocket.__initialize();
                Flashsocket.loaded = true;
            }
            fn.call(self);
        }
        var self = this;
        if (document.body) return init();
        io.util.load(init);
    };
    Flashsocket.check = function() {
        if (!("undefined" != typeof WebSocket && "__initialize" in WebSocket && swfobject)) return false;
        return swfobject.getFlashPlayerVersion().major >= 10;
    };
    Flashsocket.xdomainCheck = function() {
        return true;
    };
    "undefined" != typeof window && (WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true);
    io.transports.push("flashsocket");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports);

if ("undefined" != typeof window) var swfobject = function() {
    function f() {
        if (J) return;
        try {
            var Z = j.getElementsByTagName("body")[0].appendChild(C("span"));
            Z.parentNode.removeChild(Z);
        } catch (aa) {
            return;
        }
        J = true;
        var X = U.length;
        for (var Y = 0; X > Y; Y++) U[Y]();
    }
    function K(X) {
        J ? X() : U[U.length] = X;
    }
    function s(Y) {
        if (typeof O.addEventListener != D) O.addEventListener("load", Y, false); else if (typeof j.addEventListener != D) j.addEventListener("load", Y, false); else if (typeof O.attachEvent != D) i(O, "onload", Y); else if ("function" == typeof O.onload) {
            var X = O.onload;
            O.onload = function() {
                X();
                Y();
            };
        } else O.onload = Y;
    }
    function h() {
        T ? V() : H();
    }
    function V() {
        var X = j.getElementsByTagName("body")[0];
        var aa = C(r);
        aa.setAttribute("type", q);
        var Z = X.appendChild(aa);
        if (Z) {
            var Y = 0;
            (function() {
                if (typeof Z.GetVariable != D) {
                    var ab = Z.GetVariable("$version");
                    if (ab) {
                        ab = ab.split(" ")[1].split(",");
                        M.pv = [ parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10) ];
                    }
                } else if (10 > Y) {
                    Y++;
                    setTimeout(arguments.callee, 10);
                    return;
                }
                X.removeChild(aa);
                Z = null;
                H();
            })();
        } else H();
    }
    function H() {
        var ag = o.length;
        if (ag > 0) for (var af = 0; ag > af; af++) {
            var Y = o[af].id;
            var ab = o[af].callbackFn;
            var aa = {
                success: false,
                id: Y
            };
            if (M.pv[0] > 0) {
                var ae = c(Y);
                if (ae) if (!F(o[af].swfVersion) || M.wk && 312 > M.wk) if (o[af].expressInstall && A()) {
                    var ai = {};
                    ai.data = o[af].expressInstall;
                    ai.width = ae.getAttribute("width") || "0";
                    ai.height = ae.getAttribute("height") || "0";
                    ae.getAttribute("class") && (ai.styleclass = ae.getAttribute("class"));
                    ae.getAttribute("align") && (ai.align = ae.getAttribute("align"));
                    var ah = {};
                    var X = ae.getElementsByTagName("param");
                    var ac = X.length;
                    for (var ad = 0; ac > ad; ad++) "movie" != X[ad].getAttribute("name").toLowerCase() && (ah[X[ad].getAttribute("name")] = X[ad].getAttribute("value"));
                    P(ai, ah, Y, ab);
                } else {
                    p(ae);
                    ab && ab(aa);
                } else {
                    w(Y, true);
                    if (ab) {
                        aa.success = true;
                        aa.ref = z(Y);
                        ab(aa);
                    }
                }
            } else {
                w(Y, true);
                if (ab) {
                    var Z = z(Y);
                    if (Z && typeof Z.SetVariable != D) {
                        aa.success = true;
                        aa.ref = Z;
                    }
                    ab(aa);
                }
            }
        }
    }
    function z(aa) {
        var X = null;
        var Y = c(aa);
        if (Y && "OBJECT" == Y.nodeName) if (typeof Y.SetVariable != D) X = Y; else {
            var Z = Y.getElementsByTagName(r)[0];
            Z && (X = Z);
        }
        return X;
    }
    function A() {
        return !a && F("6.0.65") && (M.win || M.mac) && !(M.wk && 312 > M.wk);
    }
    function P(aa, ab, X, Z) {
        a = true;
        E = Z || null;
        B = {
            success: false,
            id: X
        };
        var ae = c(X);
        if (ae) {
            if ("OBJECT" == ae.nodeName) {
                l = g(ae);
                Q = null;
            } else {
                l = ae;
                Q = X;
            }
            aa.id = R;
            (typeof aa.width == D || !/%$/.test(aa.width) && 310 > parseInt(aa.width, 10)) && (aa.width = "310");
            (typeof aa.height == D || !/%$/.test(aa.height) && 137 > parseInt(aa.height, 10)) && (aa.height = "137");
            j.title = j.title.slice(0, 47) + " - Flash Player Installation";
            var ad = M.ie && M.win ? [ "Active" ].concat("").join("X") : "PlugIn", ac = "MMredirectURL=" + O.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + ad + "&MMdoctitle=" + j.title;
            typeof ab.flashvars != D ? ab.flashvars += "&" + ac : ab.flashvars = ac;
            if (M.ie && M.win && 4 != ae.readyState) {
                var Y = C("div");
                X += "SWFObjectNew";
                Y.setAttribute("id", X);
                ae.parentNode.insertBefore(Y, ae);
                ae.style.display = "none";
                (function() {
                    4 == ae.readyState ? ae.parentNode.removeChild(ae) : setTimeout(arguments.callee, 10);
                })();
            }
            u(aa, ab, X);
        }
    }
    function p(Y) {
        if (M.ie && M.win && 4 != Y.readyState) {
            var X = C("div");
            Y.parentNode.insertBefore(X, Y);
            X.parentNode.replaceChild(g(Y), X);
            Y.style.display = "none";
            (function() {
                4 == Y.readyState ? Y.parentNode.removeChild(Y) : setTimeout(arguments.callee, 10);
            })();
        } else Y.parentNode.replaceChild(g(Y), Y);
    }
    function g(ab) {
        var aa = C("div");
        if (M.win && M.ie) aa.innerHTML = ab.innerHTML; else {
            var Y = ab.getElementsByTagName(r)[0];
            if (Y) {
                var ad = Y.childNodes;
                if (ad) {
                    var X = ad.length;
                    for (var Z = 0; X > Z; Z++) 1 == ad[Z].nodeType && "PARAM" == ad[Z].nodeName || 8 == ad[Z].nodeType || aa.appendChild(ad[Z].cloneNode(true));
                }
            }
        }
        return aa;
    }
    function u(ai, ag, Y) {
        var X, aa = c(Y);
        if (M.wk && 312 > M.wk) return X;
        if (aa) {
            typeof ai.id == D && (ai.id = Y);
            if (M.ie && M.win) {
                var ah = "";
                for (var ae in ai) ai[ae] != Object.prototype[ae] && ("data" == ae.toLowerCase() ? ag.movie = ai[ae] : "styleclass" == ae.toLowerCase() ? ah += ' class="' + ai[ae] + '"' : "classid" != ae.toLowerCase() && (ah += " " + ae + '="' + ai[ae] + '"'));
                var af = "";
                for (var ad in ag) ag[ad] != Object.prototype[ad] && (af += '<param name="' + ad + '" value="' + ag[ad] + '" />');
                aa.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + ah + ">" + af + "</object>";
                N[N.length] = ai.id;
                X = c(ai.id);
            } else {
                var Z = C(r);
                Z.setAttribute("type", q);
                for (var ac in ai) ai[ac] != Object.prototype[ac] && ("styleclass" == ac.toLowerCase() ? Z.setAttribute("class", ai[ac]) : "classid" != ac.toLowerCase() && Z.setAttribute(ac, ai[ac]));
                for (var ab in ag) ag[ab] != Object.prototype[ab] && "movie" != ab.toLowerCase() && e(Z, ab, ag[ab]);
                aa.parentNode.replaceChild(Z, aa);
                X = Z;
            }
        }
        return X;
    }
    function e(Z, X, Y) {
        var aa = C("param");
        aa.setAttribute("name", X);
        aa.setAttribute("value", Y);
        Z.appendChild(aa);
    }
    function y(Y) {
        var X = c(Y);
        if (X && "OBJECT" == X.nodeName) if (M.ie && M.win) {
            X.style.display = "none";
            (function() {
                4 == X.readyState ? b(Y) : setTimeout(arguments.callee, 10);
            })();
        } else X.parentNode.removeChild(X);
    }
    function b(Z) {
        var Y = c(Z);
        if (Y) {
            for (var X in Y) "function" == typeof Y[X] && (Y[X] = null);
            Y.parentNode.removeChild(Y);
        }
    }
    function c(Z) {
        var X = null;
        try {
            X = j.getElementById(Z);
        } catch (Y) {}
        return X;
    }
    function C(X) {
        return j.createElement(X);
    }
    function i(Z, X, Y) {
        Z.attachEvent(X, Y);
        I[I.length] = [ Z, X, Y ];
    }
    function F(Z) {
        var Y = M.pv, X = Z.split(".");
        X[0] = parseInt(X[0], 10);
        X[1] = parseInt(X[1], 10) || 0;
        X[2] = parseInt(X[2], 10) || 0;
        return Y[0] > X[0] || Y[0] == X[0] && Y[1] > X[1] || Y[0] == X[0] && Y[1] == X[1] && Y[2] >= X[2] ? true : false;
    }
    function v(ac, Y, ad, ab) {
        if (M.ie && M.mac) return;
        var aa = j.getElementsByTagName("head")[0];
        if (!aa) return;
        var X = ad && "string" == typeof ad ? ad : "screen";
        if (ab) {
            n = null;
            G = null;
        }
        if (!n || G != X) {
            var Z = C("style");
            Z.setAttribute("type", "text/css");
            Z.setAttribute("media", X);
            n = aa.appendChild(Z);
            M.ie && M.win && typeof j.styleSheets != D && j.styleSheets.length > 0 && (n = j.styleSheets[j.styleSheets.length - 1]);
            G = X;
        }
        M.ie && M.win ? n && typeof n.addRule == r && n.addRule(ac, Y) : n && typeof j.createTextNode != D && n.appendChild(j.createTextNode(ac + " {" + Y + "}"));
    }
    function w(Z, X) {
        if (!m) return;
        var Y = X ? "visible" : "hidden";
        J && c(Z) ? c(Z).style.visibility = Y : v("#" + Z, "visibility:" + Y);
    }
    function L(Y) {
        var Z = /[\\\"<>\.;]/;
        var X = null != Z.exec(Y);
        return X && typeof encodeURIComponent != D ? encodeURIComponent(Y) : Y;
    }
    var l, Q, E, B, n, G, D = "undefined", r = "object", S = "Shockwave Flash", W = "ShockwaveFlash.ShockwaveFlash", q = "application/x-shockwave-flash", R = "SWFObjectExprInst", x = "onreadystatechange", O = window, j = document, t = navigator, T = false, U = [ h ], o = [], N = [], I = [], J = false, a = false, m = true, M = function() {
        var aa = typeof j.getElementById != D && typeof j.getElementsByTagName != D && typeof j.createElement != D, ah = t.userAgent.toLowerCase(), Y = t.platform.toLowerCase(), ae = Y ? /win/.test(Y) : /win/.test(ah), ac = Y ? /mac/.test(Y) : /mac/.test(ah), af = /webkit/.test(ah) ? parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, X = !1, ag = [ 0, 0, 0 ], ab = null;
        if (typeof t.plugins != D && typeof t.plugins[S] == r) {
            ab = t.plugins[S].description;
            if (ab && !(typeof t.mimeTypes != D && t.mimeTypes[q] && !t.mimeTypes[q].enabledPlugin)) {
                T = true;
                X = false;
                ab = ab.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                ag[0] = parseInt(ab.replace(/^(.*)\..*$/, "$1"), 10);
                ag[1] = parseInt(ab.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                ag[2] = /[a-zA-Z]/.test(ab) ? parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
            }
        } else if (typeof O[[ "Active" ].concat("Object").join("X")] != D) try {
            var ad = new (window[[ "Active" ].concat("Object").join("X")])(W);
            if (ad) {
                ab = ad.GetVariable("$version");
                if (ab) {
                    X = true;
                    ab = ab.split(" ")[1].split(",");
                    ag = [ parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10) ];
                }
            }
        } catch (Z) {}
        return {
            w3: aa,
            pv: ag,
            wk: af,
            ie: X,
            win: ae,
            mac: ac
        };
    }();
    (function() {
        if (!M.w3) return;
        (typeof j.readyState != D && "complete" == j.readyState || typeof j.readyState == D && (j.getElementsByTagName("body")[0] || j.body)) && f();
        if (!J) {
            typeof j.addEventListener != D && j.addEventListener("DOMContentLoaded", f, false);
            if (M.ie && M.win) {
                j.attachEvent(x, function() {
                    if ("complete" == j.readyState) {
                        j.detachEvent(x, arguments.callee);
                        f();
                    }
                });
                O == top && function() {
                    if (J) return;
                    try {
                        j.documentElement.doScroll("left");
                    } catch (X) {
                        setTimeout(arguments.callee, 0);
                        return;
                    }
                    f();
                }();
            }
            M.wk && function() {
                if (J) return;
                if (!/loaded|complete/.test(j.readyState)) {
                    setTimeout(arguments.callee, 0);
                    return;
                }
                f();
            }();
            s(f);
        }
    })();
    (function() {
        M.ie && M.win && window.attachEvent("onunload", function() {
            var ac = I.length;
            for (var ab = 0; ac > ab; ab++) I[ab][0].detachEvent(I[ab][1], I[ab][2]);
            var Z = N.length;
            for (var aa = 0; Z > aa; aa++) y(N[aa]);
            for (var Y in M) M[Y] = null;
            M = null;
            for (var X in swfobject) swfobject[X] = null;
            swfobject = null;
        });
    })();
    return {
        registerObject: function(ab, X, aa, Z) {
            if (M.w3 && ab && X) {
                var Y = {};
                Y.id = ab;
                Y.swfVersion = X;
                Y.expressInstall = aa;
                Y.callbackFn = Z;
                o[o.length] = Y;
                w(ab, false);
            } else Z && Z({
                success: false,
                id: ab
            });
        },
        getObjectById: function(X) {
            if (M.w3) return z(X);
        },
        embedSWF: function(ab, ah, ae, ag, Y, aa, Z, ad, af, ac) {
            var X = {
                success: false,
                id: ah
            };
            if (M.w3 && !(M.wk && 312 > M.wk) && ab && ah && ae && ag && Y) {
                w(ah, false);
                K(function() {
                    ae += "";
                    ag += "";
                    var aj = {};
                    if (af && typeof af === r) for (var al in af) aj[al] = af[al];
                    aj.data = ab;
                    aj.width = ae;
                    aj.height = ag;
                    var am = {};
                    if (ad && typeof ad === r) for (var ak in ad) am[ak] = ad[ak];
                    if (Z && typeof Z === r) for (var ai in Z) typeof am.flashvars != D ? am.flashvars += "&" + ai + "=" + Z[ai] : am.flashvars = ai + "=" + Z[ai];
                    if (F(Y)) {
                        var an = u(aj, am, ah);
                        aj.id == ah && w(ah, true);
                        X.success = true;
                        X.ref = an;
                    } else {
                        if (aa && A()) {
                            aj.data = aa;
                            P(aj, am, ah, ac);
                            return;
                        }
                        w(ah, true);
                    }
                    ac && ac(X);
                });
            } else ac && ac(X);
        },
        switchOffAutoHideShow: function() {
            m = false;
        },
        ua: M,
        getFlashPlayerVersion: function() {
            return {
                major: M.pv[0],
                minor: M.pv[1],
                release: M.pv[2]
            };
        },
        hasFlashPlayerVersion: F,
        createSWF: function(Z, Y, X) {
            return M.w3 ? u(Z, Y, X) : void 0;
        },
        showExpressInstall: function(Z, aa, X, Y) {
            M.w3 && A() && P(Z, aa, X, Y);
        },
        removeSWF: function(X) {
            M.w3 && y(X);
        },
        createCSS: function(aa, Z, Y, X) {
            M.w3 && v(aa, Z, Y, X);
        },
        addDomLoadEvent: K,
        addLoadEvent: s,
        getQueryParamValue: function(aa) {
            var Z = j.location.search || j.location.hash;
            if (Z) {
                /\?/.test(Z) && (Z = Z.split("?")[1]);
                if (null == aa) return L(Z);
                var Y = Z.split("&");
                for (var X = 0; Y.length > X; X++) if (Y[X].substring(0, Y[X].indexOf("=")) == aa) return L(Y[X].substring(Y[X].indexOf("=") + 1));
            }
            return "";
        },
        expressInstallCallback: function() {
            if (a) {
                var X = c(R);
                if (X && l) {
                    X.parentNode.replaceChild(l, X);
                    if (Q) {
                        w(Q, true);
                        M.ie && M.win && (l.style.display = "block");
                    }
                    E && E(B);
                }
                a = false;
            }
        }
    };
}();

(function() {
    if ("undefined" == typeof window || window.WebSocket) return;
    var console = window.console;
    console && console.log && console.error || (console = {
        log: function() {},
        error: function() {}
    });
    if (!swfobject.hasFlashPlayerVersion("10.0.0")) {
        console.error("Flash Player >= 10.0.0 is required.");
        return;
    }
    "file:" == location.protocol && console.error("WARNING: web-socket-js doesn't work in file:///... URL unless you set Flash Security Settings properly. Open the page via Web server i.e. http://...");
    WebSocket = function(url, protocols, proxyHost, proxyPort, headers) {
        var self = this;
        self.__id = WebSocket.__nextId++;
        WebSocket.__instances[self.__id] = self;
        self.readyState = WebSocket.CONNECTING;
        self.bufferedAmount = 0;
        self.__events = {};
        protocols ? "string" == typeof protocols && (protocols = [ protocols ]) : protocols = [];
        setTimeout(function() {
            WebSocket.__addTask(function() {
                WebSocket.__flash.create(self.__id, url, protocols, proxyHost || null, proxyPort || 0, headers || null);
            });
        }, 0);
    };
    WebSocket.prototype.send = function(data) {
        if (this.readyState == WebSocket.CONNECTING) throw "INVALID_STATE_ERR: Web Socket connection has not been established";
        var result = WebSocket.__flash.send(this.__id, encodeURIComponent(data));
        if (0 > result) return true;
        this.bufferedAmount += result;
        return false;
    };
    WebSocket.prototype.close = function() {
        if (this.readyState == WebSocket.CLOSED || this.readyState == WebSocket.CLOSING) return;
        this.readyState = WebSocket.CLOSING;
        WebSocket.__flash.close(this.__id);
    };
    WebSocket.prototype.addEventListener = function(type, listener) {
        type in this.__events || (this.__events[type] = []);
        this.__events[type].push(listener);
    };
    WebSocket.prototype.removeEventListener = function(type, listener) {
        if (!(type in this.__events)) return;
        var events = this.__events[type];
        for (var i = events.length - 1; i >= 0; --i) if (events[i] === listener) {
            events.splice(i, 1);
            break;
        }
    };
    WebSocket.prototype.dispatchEvent = function(event) {
        var events = this.__events[event.type] || [];
        for (var i = 0; events.length > i; ++i) events[i](event);
        var handler = this["on" + event.type];
        handler && handler(event);
    };
    WebSocket.prototype.__handleEvent = function(flashEvent) {
        "readyState" in flashEvent && (this.readyState = flashEvent.readyState);
        "protocol" in flashEvent && (this.protocol = flashEvent.protocol);
        var jsEvent;
        if ("open" == flashEvent.type || "error" == flashEvent.type) jsEvent = this.__createSimpleEvent(flashEvent.type); else if ("close" == flashEvent.type) jsEvent = this.__createSimpleEvent("close"); else {
            if ("message" != flashEvent.type) throw "unknown event type: " + flashEvent.type;
            var data = decodeURIComponent(flashEvent.message);
            jsEvent = this.__createMessageEvent("message", data);
        }
        this.dispatchEvent(jsEvent);
    };
    WebSocket.prototype.__createSimpleEvent = function(type) {
        if (document.createEvent && window.Event) {
            var event = document.createEvent("Event");
            event.initEvent(type, false, false);
            return event;
        }
        return {
            type: type,
            bubbles: false,
            cancelable: false
        };
    };
    WebSocket.prototype.__createMessageEvent = function(type, data) {
        if (document.createEvent && window.MessageEvent && !window.opera) {
            var event = document.createEvent("MessageEvent");
            event.initMessageEvent("message", false, false, data, null, null, window, null);
            return event;
        }
        return {
            type: type,
            data: data,
            bubbles: false,
            cancelable: false
        };
    };
    WebSocket.CONNECTING = 0;
    WebSocket.OPEN = 1;
    WebSocket.CLOSING = 2;
    WebSocket.CLOSED = 3;
    WebSocket.__flash = null;
    WebSocket.__instances = {};
    WebSocket.__tasks = [];
    WebSocket.__nextId = 0;
    WebSocket.loadFlashPolicyFile = function(url) {
        WebSocket.__addTask(function() {
            WebSocket.__flash.loadManualPolicyFile(url);
        });
    };
    WebSocket.__initialize = function() {
        if (WebSocket.__flash) return;
        WebSocket.__swfLocation && (window.WEB_SOCKET_SWF_LOCATION = WebSocket.__swfLocation);
        if (!window.WEB_SOCKET_SWF_LOCATION) {
            console.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf");
            return;
        }
        var container = document.createElement("div");
        container.id = "webSocketContainer";
        container.style.position = "absolute";
        if (WebSocket.__isFlashLite()) {
            container.style.left = "0px";
            container.style.top = "0px";
        } else {
            container.style.left = "-100px";
            container.style.top = "-100px";
        }
        var holder = document.createElement("div");
        holder.id = "webSocketFlash";
        container.appendChild(holder);
        document.body.appendChild(container);
        swfobject.embedSWF(WEB_SOCKET_SWF_LOCATION, "webSocketFlash", "1", "1", "10.0.0", null, null, {
            hasPriority: true,
            swliveconnect: true,
            allowScriptAccess: "always"
        }, null, function(e) {
            e.success || console.error("[WebSocket] swfobject.embedSWF failed");
        });
    };
    WebSocket.__onFlashInitialized = function() {
        setTimeout(function() {
            WebSocket.__flash = document.getElementById("webSocketFlash");
            WebSocket.__flash.setCallerUrl(location.href);
            WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
            for (var i = 0; WebSocket.__tasks.length > i; ++i) WebSocket.__tasks[i]();
            WebSocket.__tasks = [];
        }, 0);
    };
    WebSocket.__onFlashEvent = function() {
        setTimeout(function() {
            try {
                var events = WebSocket.__flash.receiveEvents();
                for (var i = 0; events.length > i; ++i) WebSocket.__instances[events[i].webSocketId].__handleEvent(events[i]);
            } catch (e) {
                console.error(e);
            }
        }, 0);
        return true;
    };
    WebSocket.__log = function(message) {
        console.log(decodeURIComponent(message));
    };
    WebSocket.__error = function(message) {
        console.error(decodeURIComponent(message));
    };
    WebSocket.__addTask = function(task) {
        WebSocket.__flash ? task() : WebSocket.__tasks.push(task);
    };
    WebSocket.__isFlashLite = function() {
        if (!window.navigator || !window.navigator.mimeTypes) return false;
        var mimeType = window.navigator.mimeTypes["application/x-shockwave-flash"];
        if (!mimeType || !mimeType.enabledPlugin || !mimeType.enabledPlugin.filename) return false;
        return mimeType.enabledPlugin.filename.match(/flashlite/i) ? true : false;
    };
    window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION || (window.addEventListener ? window.addEventListener("load", function() {
        WebSocket.__initialize();
    }, false) : window.attachEvent("onload", function() {
        WebSocket.__initialize();
    }));
})();

(function(exports, io, global) {
    function XHR(socket) {
        if (!socket) return;
        io.Transport.apply(this, arguments);
        this.sendBuffer = [];
    }
    function empty() {}
    exports.XHR = XHR;
    io.util.inherit(XHR, io.Transport);
    XHR.prototype.open = function() {
        this.socket.setBuffer(false);
        this.onOpen();
        this.get();
        this.setCloseTimeout();
        return this;
    };
    XHR.prototype.payload = function(payload) {
        var msgs = [];
        for (var i = 0, l = payload.length; l > i; i++) msgs.push(io.parser.encodePacket(payload[i]));
        this.send(io.parser.encodePayload(msgs));
    };
    XHR.prototype.send = function(data) {
        this.post(data);
        return this;
    };
    XHR.prototype.post = function(data) {
        function stateChange() {
            if (4 == this.readyState) {
                this.onreadystatechange = empty;
                self.posting = false;
                200 == this.status ? self.socket.setBuffer(false) : self.onClose();
            }
        }
        function onload() {
            this.onload = empty;
            self.socket.setBuffer(false);
        }
        var self = this;
        this.socket.setBuffer(true);
        this.sendXHR = this.request("POST");
        global.XDomainRequest && this.sendXHR instanceof XDomainRequest ? this.sendXHR.onload = this.sendXHR.onerror = onload : this.sendXHR.onreadystatechange = stateChange;
        this.sendXHR.send(data);
    };
    XHR.prototype.close = function() {
        this.onClose();
        return this;
    };
    XHR.prototype.request = function(method) {
        var req = io.util.request(this.socket.isXDomain()), query = io.util.query(this.socket.options.query, "t=" + +new Date());
        req.open(method || "GET", this.prepareUrl() + query, true);
        if ("POST" == method) try {
            req.setRequestHeader ? req.setRequestHeader("Content-type", "text/plain;charset=UTF-8") : req.contentType = "text/plain";
        } catch (e) {}
        return req;
    };
    XHR.prototype.scheme = function() {
        return this.socket.options.secure ? "https" : "http";
    };
    XHR.check = function(socket, xdomain) {
        try {
            if (io.util.request(xdomain)) return true;
        } catch (e) {}
        return false;
    };
    XHR.xdomainCheck = function() {
        return XHR.check(null, true);
    };
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);

(function(exports, io) {
    function HTMLFile() {
        io.Transport.XHR.apply(this, arguments);
    }
    exports.htmlfile = HTMLFile;
    io.util.inherit(HTMLFile, io.Transport.XHR);
    HTMLFile.prototype.name = "htmlfile";
    HTMLFile.prototype.get = function() {
        this.doc = new (window[[ "Active" ].concat("Object").join("X")])("htmlfile");
        this.doc.open();
        this.doc.write("<html></html>");
        this.doc.close();
        this.doc.parentWindow.s = this;
        var iframeC = this.doc.createElement("div");
        iframeC.className = "socketio";
        this.doc.body.appendChild(iframeC);
        this.iframe = this.doc.createElement("iframe");
        iframeC.appendChild(this.iframe);
        var self = this, query = io.util.query(this.socket.options.query, "t=" + +new Date());
        this.iframe.src = this.prepareUrl() + query;
        io.util.on(window, "unload", function() {
            self.destroy();
        });
    };
    HTMLFile.prototype._ = function(data, doc) {
        this.onData(data);
        try {
            var script = doc.getElementsByTagName("script")[0];
            script.parentNode.removeChild(script);
        } catch (e) {}
    };
    HTMLFile.prototype.destroy = function() {
        if (this.iframe) {
            try {
                this.iframe.src = "about:blank";
            } catch (e) {}
            this.doc = null;
            this.iframe.parentNode.removeChild(this.iframe);
            this.iframe = null;
            CollectGarbage();
        }
    };
    HTMLFile.prototype.close = function() {
        this.destroy();
        return io.Transport.XHR.prototype.close.call(this);
    };
    HTMLFile.check = function() {
        if ("undefined" != typeof window && [ "Active" ].concat("Object").join("X") in window) try {
            var a = new (window[[ "Active" ].concat("Object").join("X")])("htmlfile");
            return a && io.Transport.XHR.check();
        } catch (e) {}
        return false;
    };
    HTMLFile.xdomainCheck = function() {
        return false;
    };
    io.transports.push("htmlfile");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports);

(function(exports, io, global) {
    function XHRPolling() {
        io.Transport.XHR.apply(this, arguments);
    }
    function empty() {}
    exports["xhr-polling"] = XHRPolling;
    io.util.inherit(XHRPolling, io.Transport.XHR);
    io.util.merge(XHRPolling, io.Transport.XHR);
    XHRPolling.prototype.name = "xhr-polling";
    XHRPolling.prototype.open = function() {
        var self = this;
        io.Transport.XHR.prototype.open.call(self);
        return false;
    };
    XHRPolling.prototype.get = function() {
        function stateChange() {
            if (4 == this.readyState) {
                this.onreadystatechange = empty;
                if (200 == this.status) {
                    self.onData(this.responseText);
                    self.get();
                } else self.onClose();
            }
        }
        function onload() {
            this.onload = empty;
            this.onerror = empty;
            self.onData(this.responseText);
            self.get();
        }
        function onerror() {
            self.onClose();
        }
        if (!this.open) return;
        var self = this;
        this.xhr = this.request();
        if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
            this.xhr.onload = onload;
            this.xhr.onerror = onerror;
        } else this.xhr.onreadystatechange = stateChange;
        this.xhr.send(null);
    };
    XHRPolling.prototype.onClose = function() {
        io.Transport.XHR.prototype.onClose.call(this);
        if (this.xhr) {
            this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
            try {
                this.xhr.abort();
            } catch (e) {}
            this.xhr = null;
        }
    };
    XHRPolling.prototype.ready = function(socket, fn) {
        var self = this;
        io.util.defer(function() {
            fn.call(self);
        });
    };
    io.transports.push("xhr-polling");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);

(function(exports, io, global) {
    function JSONPPolling() {
        io.Transport["xhr-polling"].apply(this, arguments);
        this.index = io.j.length;
        var self = this;
        io.j.push(function(msg) {
            self._(msg);
        });
    }
    var indicator = global.document && "MozAppearance" in global.document.documentElement.style;
    exports["jsonp-polling"] = JSONPPolling;
    io.util.inherit(JSONPPolling, io.Transport["xhr-polling"]);
    JSONPPolling.prototype.name = "jsonp-polling";
    JSONPPolling.prototype.post = function(data) {
        function complete() {
            initIframe();
            self.socket.setBuffer(false);
        }
        function initIframe() {
            self.iframe && self.form.removeChild(self.iframe);
            try {
                iframe = document.createElement('<iframe name="' + self.iframeId + '">');
            } catch (e) {
                iframe = document.createElement("iframe");
                iframe.name = self.iframeId;
            }
            iframe.id = self.iframeId;
            self.form.appendChild(iframe);
            self.iframe = iframe;
        }
        var self = this, query = io.util.query(this.socket.options.query, "t=" + +new Date() + "&i=" + this.index);
        if (!this.form) {
            var iframe, form = document.createElement("form"), area = document.createElement("textarea"), id = this.iframeId = "socketio_iframe_" + this.index;
            form.className = "socketio";
            form.style.position = "absolute";
            form.style.top = "-1000px";
            form.style.left = "-1000px";
            form.target = id;
            form.method = "POST";
            form.setAttribute("accept-charset", "utf-8");
            area.name = "d";
            form.appendChild(area);
            document.body.appendChild(form);
            this.form = form;
            this.area = area;
        }
        this.form.action = this.prepareUrl() + query;
        initIframe();
        this.area.value = io.JSON.stringify(data);
        try {
            this.form.submit();
        } catch (e) {}
        this.iframe.attachEvent ? iframe.onreadystatechange = function() {
            "complete" == self.iframe.readyState && complete();
        } : this.iframe.onload = complete;
        this.socket.setBuffer(true);
    };
    JSONPPolling.prototype.get = function() {
        var self = this, script = document.createElement("script"), query = io.util.query(this.socket.options.query, "t=" + +new Date() + "&i=" + this.index);
        if (this.script) {
            this.script.parentNode.removeChild(this.script);
            this.script = null;
        }
        script.async = true;
        script.src = this.prepareUrl() + query;
        script.onerror = function() {
            self.onClose();
        };
        var insertAt = document.getElementsByTagName("script")[0];
        insertAt.parentNode.insertBefore(script, insertAt);
        this.script = script;
        indicator && setTimeout(function() {
            var iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            document.body.removeChild(iframe);
        }, 100);
    };
    JSONPPolling.prototype._ = function(msg) {
        this.onData(msg);
        this.open && this.get();
        return this;
    };
    JSONPPolling.prototype.ready = function(socket, fn) {
        var self = this;
        if (!indicator) return fn.call(this);
        io.util.load(function() {
            fn.call(self);
        });
    };
    JSONPPolling.check = function() {
        return "document" in global;
    };
    JSONPPolling.xdomainCheck = function() {
        return true;
    };
    io.transports.push("jsonp-polling");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);