(function(module, io, should) {
    module.exports = {
        "add listeners": function() {
            var event = new io.EventEmitter(), calls = 0;
            event.on("test", function(a, b) {
                ++calls;
                a.should().eql("a");
                b.should().eql("b");
            });
            event.emit("test", "a", "b");
            calls.should().eql(1);
            event.on.should().eql(event.addListener);
        },
        "remove listener": function() {
            function empty() {}
            var event = new io.EventEmitter();
            event.on("test", empty);
            event.on("test:more", empty);
            event.removeAllListeners("test");
            event.listeners("test").should().eql([]);
            event.listeners("test:more").should().eql([ empty ]);
        },
        "remove all listeners with no arguments": function() {
            function empty() {}
            var event = new io.EventEmitter();
            event.on("test", empty);
            event.on("test:more", empty);
            event.removeAllListeners();
            event.listeners("test").should().eql([ empty ]);
            event.listeners("test:more").should().eql([ empty ]);
        },
        "remove listeners functions": function() {
            function one() {
                ++calls;
            }
            function two() {
                ++calls;
            }
            function three() {
                ++calls;
            }
            var event = new io.EventEmitter(), calls = 0;
            event.on("one", one);
            event.removeListener("one", one);
            event.listeners("one").should().eql([]);
            event.on("two", two);
            event.removeListener("two", one);
            event.listeners("two").should().eql([ two ]);
            event.on("three", three);
            event.on("three", two);
            event.removeListener("three", three);
            event.listeners("three").should().eql([ two ]);
        },
        "number of arguments": function() {
            var event = new io.EventEmitter(), number = [];
            event.on("test", function() {
                number.push(arguments.length);
            });
            event.emit("test");
            event.emit("test", null);
            event.emit("test", null, null);
            event.emit("test", null, null, null);
            event.emit("test", null, null, null, null);
            event.emit("test", null, null, null, null, null);
            [ 0, 1, 2, 3, 4, 5 ].should().eql(number);
        },
        once: function() {
            function removed() {
                should().fail("not removed");
            }
            var event = new io.EventEmitter(), calls = 0;
            event.once("test", function() {
                ++calls;
            });
            event.emit("test", "a", "b");
            event.emit("test", "a", "b");
            event.emit("test", "a", "b");
            event.once("test:removed", removed);
            event.removeListener("test:removed", removed);
            event.emit("test:removed");
            calls.should().eql(1);
        }
    };
})("undefined" == typeof module ? module = {} : module, "undefined" == typeof io ? require("socket.io-client") : io, "undefined" != typeof should && should.fail ? should : require("should"));