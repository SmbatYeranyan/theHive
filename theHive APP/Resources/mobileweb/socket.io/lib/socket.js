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
        return false;
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