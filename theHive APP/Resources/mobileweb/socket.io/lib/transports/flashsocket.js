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