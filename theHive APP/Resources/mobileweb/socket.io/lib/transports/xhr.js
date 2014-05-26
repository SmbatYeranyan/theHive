(function(exports, io, global) {
    function XHR(socket) {
        if (!socket) return;
        io.Transport.apply(this, arguments);
        this.sendBuffer = [];
    }
    function empty() {}
    exports.XHR = XHR;
    io.util.inherit(XHR, io.Transport);
    XHR.prototype.open = function() {
        this.socket.setBuffer(false);
        this.onOpen();
        this.get();
        this.setCloseTimeout();
        return this;
    };
    XHR.prototype.payload = function(payload) {
        var msgs = [];
        for (var i = 0, l = payload.length; l > i; i++) msgs.push(io.parser.encodePacket(payload[i]));
        this.send(io.parser.encodePayload(msgs));
    };
    XHR.prototype.send = function(data) {
        this.post(data);
        return this;
    };
    XHR.prototype.post = function(data) {
        function stateChange() {
            if (4 == this.readyState) {
                this.onreadystatechange = empty;
                self.posting = false;
                200 == this.status ? self.socket.setBuffer(false) : self.onClose();
            }
        }
        function onload() {
            this.onload = empty;
            self.socket.setBuffer(false);
        }
        var self = this;
        this.socket.setBuffer(true);
        this.sendXHR = this.request("POST");
        global.XDomainRequest && this.sendXHR instanceof XDomainRequest ? this.sendXHR.onload = this.sendXHR.onerror = onload : this.sendXHR.onreadystatechange = stateChange;
        this.sendXHR.send(data);
    };
    XHR.prototype.close = function() {
        this.onClose();
        return this;
    };
    XHR.prototype.request = function(method) {
        var req = io.util.request(this.socket.isXDomain()), query = io.util.query(this.socket.options.query, "t=" + +new Date());
        req.open(method || "GET", this.prepareUrl() + query, true);
        if ("POST" == method) try {
            req.setRequestHeader ? req.setRequestHeader("Content-type", "text/plain;charset=UTF-8") : req.contentType = "text/plain";
        } catch (e) {}
        return req;
    };
    XHR.prototype.scheme = function() {
        return this.socket.options.secure ? "https" : "http";
    };
    XHR.check = function(socket, xdomain) {
        try {
            if (io.util.request(xdomain)) return true;
        } catch (e) {}
        return false;
    };
    XHR.xdomainCheck = function() {
        return XHR.check(null, true);
    };
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);