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