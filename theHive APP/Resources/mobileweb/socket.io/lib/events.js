(function(exports, io) {
    function EventEmitter() {}
    exports.EventEmitter = EventEmitter;
    EventEmitter.prototype.on = function(name, fn) {
        this.$events || (this.$events = {});
        this.$events[name] ? io.util.isArray(this.$events[name]) ? this.$events[name].push(fn) : this.$events[name] = [ this.$events[name], fn ] : this.$events[name] = fn;
        return this;
    };
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prototype.once = function(name, fn) {
        function on() {
            self.removeListener(name, on);
            fn.apply(this, arguments);
        }
        var self = this;
        on.listener = fn;
        this.on(name, on);
        return this;
    };
    EventEmitter.prototype.removeListener = function(name, fn) {
        if (this.$events && this.$events[name]) {
            var list = this.$events[name];
            if (io.util.isArray(list)) {
                var pos = -1;
                for (var i = 0, l = list.length; l > i; i++) if (list[i] === fn || list[i].listener && list[i].listener === fn) {
                    pos = i;
                    break;
                }
                if (0 > pos) return this;
                list.splice(pos, 1);
                list.length || delete this.$events[name];
            } else (list === fn || list.listener && list.listener === fn) && delete this.$events[name];
        }
        return this;
    };
    EventEmitter.prototype.removeAllListeners = function(name) {
        this.$events && this.$events[name] && (this.$events[name] = null);
        return this;
    };
    EventEmitter.prototype.listeners = function(name) {
        this.$events || (this.$events = {});
        this.$events[name] || (this.$events[name] = []);
        io.util.isArray(this.$events[name]) || (this.$events[name] = [ this.$events[name] ]);
        return this.$events[name];
    };
    EventEmitter.prototype.emit = function(name) {
        if (!this.$events) return false;
        var handler = this.$events[name];
        if (!handler) return false;
        var args = Array.prototype.slice.call(arguments, 1);
        if ("function" == typeof handler) handler.apply(this, args); else {
            if (!io.util.isArray(handler)) return false;
            var listeners = handler.slice();
            for (var i = 0, l = listeners.length; l > i; i++) listeners[i].apply(this, args);
        }
        return true;
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports);