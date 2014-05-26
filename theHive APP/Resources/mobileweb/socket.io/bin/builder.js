var fs = require("fs"), socket = require("../lib/io"), uglify = require("uglify-js"), activeXObfuscator = require("active-x-obfuscator");

var template = "/*! Socket.IO.%ext% build:" + socket.version + ", %type%. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */\n", development = template.replace("%type%", "development").replace("%ext%", "js"), production = template.replace("%type%", "production").replace("%ext%", "min.js");

var starttagIF = "// if node", endtagIF = "// end node";

var base = [ "io.js", "util.js", "events.js", "json.js", "parser.js", "transport.js", "socket.js", "namespace.js" ];

var baseTransports = {
    websocket: [ "transports/websocket.js" ],
    flashsocket: [ "transports/websocket.js", "transports/flashsocket.js", "vendor/web-socket-js/swfobject.js", "vendor/web-socket-js/web_socket.js" ],
    htmlfile: [ "transports/xhr.js", "transports/htmlfile.js" ],
    "xhr-polling": [ "transports/xhr.js", "transports/xhr-polling.js" ],
    "jsonp-polling": [ "transports/xhr.js", "transports/xhr-polling.js", "transports/jsonp-polling.js" ]
};

var builder = module.exports = function() {
    var transports, options, callback, error = null, args = Array.prototype.slice.call(arguments, 0), settings = {
        minify: true,
        node: false,
        custom: []
    };
    args.forEach(function(arg) {
        var type = Object.prototype.toString.call(arg).replace(/\[object\s(\w+)\]/gi, "$1").toLowerCase();
        switch (type) {
          case "array":
            return transports = arg;

          case "object":
            return options = arg;

          case "function":
            return callback = arg;
        }
    });
    options = options || {};
    transports = transports || Object.keys(baseTransports);
    for (var option in options) settings[option] = options[option];
    var files = [];
    base.forEach(function(file) {
        files.push(__dirname + "/../lib/" + file);
    });
    transports.forEach(function(transport) {
        var dependencies = baseTransports[transport];
        if (!dependencies) {
            error = "Unsupported transport `" + transport + "` supplied as argument.";
            return;
        }
        dependencies.forEach(function(file) {
            var path = __dirname + "/../lib/" + file;
            ~files.indexOf(path) || files.push(path);
        });
    });
    if (error) return callback(error);
    var results = {};
    files.forEach(function(file) {
        fs.readFile(file, function(err, content) {
            err && (error = err);
            results[file] = content;
            if (Object.keys(results).length !== files.length) return;
            if (error) return callback(error);
            var code = development, ignore = 0;
            files.forEach(function(file) {
                code += results[file];
            });
            settings.custom.length && settings.custom.forEach(function(content) {
                code += content;
            });
            code = activeXObfuscator(code);
            settings.node || (code = code.split("\n").filter(function(line) {
                var start = line.indexOf(starttagIF) >= 0, end = line.indexOf(endtagIF) >= 0, ret = ignore;
                if (start) {
                    ignore++;
                    ret = ignore;
                }
                end && ignore--;
                return 0 == ret;
            }).join("\n"));
            if (settings.minify) {
                var ast = uglify.parser.parse(code);
                ast = uglify.uglify.ast_mangle(ast);
                ast = uglify.uglify.ast_squeeze(ast);
                code = production + uglify.uglify.gen_code(ast, {
                    ascii_only: true
                });
            }
            callback(error, code);
        });
    });
};

builder.version = socket.version;

builder.transports = baseTransports;

if (!module.parent) {
    var args = process.argv.slice(2);
    builder(args.length ? args : false, {
        minify: false
    }, function(err, content) {
        if (err) return console.error(err);
        fs.write(fs.openSync(__dirname + "/../dist/socket.io.js", "w"), content, 0, "utf8");
        console.log("Successfully generated the development build: socket.io.js");
    });
    builder(args.length ? args : false, function(err, content) {
        if (err) return console.error(err);
        fs.write(fs.openSync(__dirname + "/../dist/socket.io.min.js", "w"), content, 0, "utf8");
        console.log("Successfully generated the production build: socket.io.min.js");
    });
}