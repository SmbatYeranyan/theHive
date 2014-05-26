(function(exports, io) {
    function HTMLFile() {
        io.Transport.XHR.apply(this, arguments);
    }
    exports.htmlfile = HTMLFile;
    io.util.inherit(HTMLFile, io.Transport.XHR);
    HTMLFile.prototype.name = "htmlfile";
    HTMLFile.prototype.get = function() {
        this.doc = new ActiveXObject("htmlfile");
        this.doc.open();
        this.doc.write("<html></html>");
        this.doc.close();
        this.doc.parentWindow.s = this;
        var iframeC = this.doc.createElement("div");
        iframeC.className = "socketio";
        this.doc.body.appendChild(iframeC);
        this.iframe = this.doc.createElement("iframe");
        iframeC.appendChild(this.iframe);
        var self = this, query = io.util.query(this.socket.options.query, "t=" + +new Date());
        this.iframe.src = this.prepareUrl() + query;
        io.util.on(window, "unload", function() {
            self.destroy();
        });
    };
    HTMLFile.prototype._ = function(data, doc) {
        this.onData(data);
        try {
            var script = doc.getElementsByTagName("script")[0];
            script.parentNode.removeChild(script);
        } catch (e) {}
    };
    HTMLFile.prototype.destroy = function() {
        if (this.iframe) {
            try {
                this.iframe.src = "about:blank";
            } catch (e) {}
            this.doc = null;
            this.iframe.parentNode.removeChild(this.iframe);
            this.iframe = null;
            CollectGarbage();
        }
    };
    HTMLFile.prototype.close = function() {
        this.destroy();
        return io.Transport.XHR.prototype.close.call(this);
    };
    HTMLFile.check = function() {
        if ("undefined" != typeof window && "ActiveXObject" in window) try {
            var a = new ActiveXObject("htmlfile");
            return a && io.Transport.XHR.check();
        } catch (e) {}
        return false;
    };
    HTMLFile.xdomainCheck = function() {
        return false;
    };
    io.transports.push("htmlfile");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports);