function Controller() {
    function dtest() {
        $.dot.top += 100;
        console.log($.dot);
        alert($.dot.top);
    }
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
    dtest ? $.__views.dot.addEventListener("click", dtest) : __defers["$.__views.dot!click!dtest"] = true;
    exports.destroy = function() {};
    _.extend($, $.__views);
    var motor = 0;
    $.index.open();
    __defers["$.__views.label!click!accel"] && $.__views.label.addEventListener("click", accel);
    __defers["$.__views.label2!click!deccel"] && $.__views.label2.addEventListener("click", deccel);
    __defers["$.__views.dot!click!dtest"] && $.__views.dot.addEventListener("click", dtest);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;