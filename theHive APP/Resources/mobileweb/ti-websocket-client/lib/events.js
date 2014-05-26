function EventEmitter() {}

var isArray = Array.isArray;

exports.EventEmitter = EventEmitter;

var defaultMaxListeners = 10;

EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || (this._events = {});
    this._maxListeners = n;
};

EventEmitter.prototype.emit = function() {
    var type = arguments[0];
    if (!this._events) return false;
    var handler = this._events[type];
    if (!handler) return false;
    var args, l, i;
    if ("function" == typeof handler) {
        switch (arguments.length) {
          case 1:
            handler.call(this);
            break;

          case 2:
            handler.call(this, arguments[1]);
            break;

          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;

          default:
            l = arguments.length;
            args = new Array(l - 1);
            for (i = 1; l > i; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
        return true;
    }
    if (isArray(handler)) {
        l = arguments.length;
        args = new Array(l - 1);
        for (i = 1; l > i; i++) args[i - 1] = arguments[i];
        var listeners = handler.slice();
        for (i = 0, l = listeners.length; l > i; i++) listeners[i].apply(this, args);
        return true;
    }
    return false;
};

EventEmitter.prototype.addListener = function(type, listener) {
    if ("function" != typeof listener) throw new Error("addListener only takes instances of Function");
    this._events || (this._events = {});
    this.emit("newListener", type, listener);
    if (this._events[type]) if (isArray(this._events[type])) {
        this._events[type].push(listener);
        if (!this._events[type].warned) {
            var m;
            m = void 0 !== this._maxListeners ? this._maxListeners : defaultMaxListeners;
            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                console.trace();
            }
        }
    } else this._events[type] = [ this._events[type], listener ]; else this._events[type] = listener;
    return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
    function g() {
        self.removeListener(type, g);
        listener.apply(this, arguments);
    }
    if ("function" != typeof listener) throw new Error(".once only takes instances of Function");
    var self = this;
    g.listener = listener;
    self.on(type, g);
    return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
    if ("function" != typeof listener) throw new Error("removeListener only takes instances of Function");
    if (!this._events || !this._events[type]) return this;
    var list = this._events[type];
    if (isArray(list)) {
        var i, position = -1;
        for (i = 0, length = list.length; length > i; i++) if (list[i] === listener || list[i].listener && list[i].listener === listener) {
            position = i;
            break;
        }
        if (0 > position) return this;
        list.splice(position, 1);
        0 === list.length && delete this._events[type];
    } else (list === listener || list.listener && list.listener === listener) && delete this._events[type];
    return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
    if (0 === arguments.length) {
        this._events = {};
        return this;
    }
    type && this._events && this._events[type] && (this._events[type] = null);
    return this;
};

EventEmitter.prototype.listeners = function(type) {
    this._events || (this._events = {});
    this._events[type] || (this._events[type] = []);
    isArray(this._events[type]) || (this._events[type] = [ this._events[type] ]);
    return this._events[type];
};