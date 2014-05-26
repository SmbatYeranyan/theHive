function Controller() {
    function accel() {
        motor += 10;
        Ti.Stream.write(socket, Ti.createBuffer({
            value: motor.toString()
        }), writeCallback);
    }
    function deccel() {
        motor -= 10;
        Ti.Stream.write(socket, Ti.createBuffer({
            value: motor.toString()
        }), writeCallback);
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
    $.__views.label = Ti.UI.createButton({
        title: "Accelerate",
        id: "label"
    });
    $.__views.index.add($.__views.label);
    accel ? $.__views.label.addEventListener("click", accel) : __defers["$.__views.label!click!accel"] = true;
    $.__views.label2 = Ti.UI.createButton({
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE,
        color: "#000",
        top: "100dp",
        title: "Deccelerate",
        id: "label2"
    });
    $.__views.index.add($.__views.label2);
    deccel ? $.__views.label2.addEventListener("click", deccel) : __defers["$.__views.label2!click!deccel"] = true;
    $.__views.dot = Ti.UI.createView({
        backgroundColor: "red",
        width: 20,
        height: 20,
        top: "10dp",
        left: "10dp",
        id: "dot"
    });
    $.__views.index.add($.__views.dot);
    exports.destroy = function() {};
    _.extend($, $.__views);
    var motor = 0;
    $.index.open();
    Titanium.UI.createWindow({
        title: "Accelerometer",
        backgroundColor: "#fff"
    });
    var lastTime = new Date().getTime();
    var offset = 100;
    var filter = 1;
    var last_x = 0;
    var last_y = 0;
    Titanium.Accelerometer.addEventListener("update", function(e) {
        var now = new Date().getTime();
        if (now > lastTime + offset) {
            last_x = e.x * filter + last_x * (1 - filter);
            last_y = e.y * filter + last_y * (1 - filter);
            console.log(5 * last_x + " " + 5 * last_y);
            lastTime = now;
        }
    });
    Ti.Gesture.addEventListener("orientationchange", function() {
        var curAct = Ti.Android.currentActivity;
        curAct.setRequestedOrientation(Ti.Android.SCREEN_ORIENTATION_PORTRAIT);
    });
    var socket = Ti.Network.Socket.createTCP({
        host: "192.168.0.118",
        port: 5e3,
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
    __defers["$.__views.label!click!accel"] && $.__views.label.addEventListener("click", accel);
    __defers["$.__views.label2!click!deccel"] && $.__views.label2.addEventListener("click", deccel);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;