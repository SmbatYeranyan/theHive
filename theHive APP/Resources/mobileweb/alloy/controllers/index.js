function Controller() {
    function doClick() {
        alert($.label.text);
        socket.emit("keys", "DATA!!!!");
    }
    function writeCallback() {
        Ti.API.info("Successfully wrote to socket.");
    }
    function readCallback(e) {
        -1 == e.bytesProcessed;
        try {
            if (e.buffer) {
                var received = e.buffer.toString();
                Ti.API.info("Received: " + received);
            } else Ti.API.error("Error: read callback called with no buffer!");
        } catch (ex) {
            Ti.API.error(ex);
        }
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "index";
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.index = Ti.UI.createWindow({
        backgroundColor: "white",
        id: "index"
    });
    $.__views.index && $.addTopLevelView($.__views.index);
    $.__views.label = Ti.UI.createLabel({
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        color: "#000",
        text: "Hello, World",
        id: "label"
    });
    $.__views.index.add($.__views.label);
    doClick ? $.__views.label.addEventListener("click", doClick) : __defers["$.__views.label!click!doClick"] = true;
    exports.destroy = function() {};
    _.extend($, $.__views);
    $.index.open();
    var socket = Ti.Network.Socket.createTCP({
        host: "http://192.168.0.118",
        port: 8e3,
        connected: function(e) {
            Ti.API.info("Socket opened!");
            Ti.Stream.pump(e.socket, readCallback, 1024, true);
            Ti.Stream.write(socket, Ti.createBuffer({
                value: "GET http://blog.example.com/index.html HTTP/1.1\r\n\r\n"
            }), writeCallback);
        },
        error: function(e) {
            Ti.API.info("Error (" + e.errorCode + "): " + e.error);
        }
    });
    socket.connect();
    __defers["$.__views.label!click!doClick"] && $.__views.label.addEventListener("click", doClick);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;