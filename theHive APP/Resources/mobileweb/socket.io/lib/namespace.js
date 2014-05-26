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