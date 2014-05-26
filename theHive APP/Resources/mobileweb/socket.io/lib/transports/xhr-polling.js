(function(exports, io, global) {
    function XHRPolling() {
        io.Transport.XHR.apply(this, arguments);
    }
    function empty() {}
    exports["xhr-polling"] = XHRPolling;
    io.util.inherit(XHRPolling, io.Transport.XHR);
    io.util.merge(XHRPolling, io.Transport.XHR);
    XHRPolling.prototype.name = "xhr-polling";
    XHRPolling.prototype.open = function() {
        var self = this;
        io.Transport.XHR.prototype.open.call(self);
        return false;
    };
    XHRPolling.prototype.get = function() {
        function stateChange() {
            if (4 == this.readyState) {
                this.onreadystatechange = empty;
                if (200 == this.status) {
                    self.onData(this.responseText);
                    self.get();
                } else self.onClose();
            }
        }
        function onload() {
            this.onload = empty;
            this.onerror = empty;
            self.onData(this.responseText);
            self.get();
        }
        function onerror() {
            self.onClose();
        }
        if (!this.open) return;
        var self = this;
        this.xhr = this.request();
        if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
            this.xhr.onload = onload;
            this.xhr.onerror = onerror;
        } else this.xhr.onreadystatechange = stateChange;
        this.xhr.send(null);
    };
    XHRPolling.prototype.onClose = function() {
        io.Transport.XHR.prototype.onClose.call(this);
        if (this.xhr) {
            this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
            try {
                this.xhr.abort();
            } catch (e) {}
            this.xhr = null;
        }
    };
    XHRPolling.prototype.ready = function(socket, fn) {
        var self = this;
        io.util.defer(function() {
            fn.call(self);
        });
    };
    io.transports.push("xhr-polling");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);