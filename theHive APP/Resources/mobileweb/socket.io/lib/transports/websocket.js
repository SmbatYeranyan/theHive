(function(exports, io, global) {
    function WS() {
        io.Transport.apply(this, arguments);
    }
    exports.websocket = WS;
    io.util.inherit(WS, io.Transport);
    WS.prototype.name = "websocket";
    WS.prototype.open = function() {
        var Socket, query = io.util.query(this.socket.options.query), self = this;
        Socket = require("ws");
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
        return true;
    };
    WS.xdomainCheck = function() {
        return true;
    };
    io.transports.push("websocket");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);