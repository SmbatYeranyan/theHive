(function(exports, global) {
    var io = exports;
    io.version = "0.9.1-1";
    io.protocol = 1;
    io.transports = [];
    io.j = [];
    io.sockets = {};
    if ("object" == typeof module && "function" == typeof require) {
        io.util = require("./util").util;
        io.JSON = require("./json").JSON;
        io.parser = require("./parser").parser;
        io.EventEmitter = require("./events").EventEmitter;
        io.SocketNamespace = require("./namespace").SocketNamespace;
        io.Transport = require("./transport").Transport;
        io.transports = [ "websocket", "xhr-polling" ];
        io.Transport.XHR = require("./transports/xhr").XHR;
        io.transports.forEach(function(t) {
            io.Transport[t] = require("./transports/" + t)[t];
        });
        io.Socket = require("./socket").Socket;
        io.dist = __dirname + "/../dist";
        io.builder = require("../bin/builder");
    }
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