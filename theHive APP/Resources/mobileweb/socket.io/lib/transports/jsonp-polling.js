(function(exports, io, global) {
    function JSONPPolling() {
        io.Transport["xhr-polling"].apply(this, arguments);
        this.index = io.j.length;
        var self = this;
        io.j.push(function(msg) {
            self._(msg);
        });
    }
    var indicator = global.document && "MozAppearance" in global.document.documentElement.style;
    exports["jsonp-polling"] = JSONPPolling;
    io.util.inherit(JSONPPolling, io.Transport["xhr-polling"]);
    JSONPPolling.prototype.name = "jsonp-polling";
    JSONPPolling.prototype.post = function(data) {
        function complete() {
            initIframe();
            self.socket.setBuffer(false);
        }
        function initIframe() {
            self.iframe && self.form.removeChild(self.iframe);
            try {
                iframe = document.createElement('<iframe name="' + self.iframeId + '">');
            } catch (e) {
                iframe = document.createElement("iframe");
                iframe.name = self.iframeId;
            }
            iframe.id = self.iframeId;
            self.form.appendChild(iframe);
            self.iframe = iframe;
        }
        var self = this, query = io.util.query(this.socket.options.query, "t=" + +new Date() + "&i=" + this.index);
        if (!this.form) {
            var iframe, form = document.createElement("form"), area = document.createElement("textarea"), id = this.iframeId = "socketio_iframe_" + this.index;
            form.className = "socketio";
            form.style.position = "absolute";
            form.style.top = "-1000px";
            form.style.left = "-1000px";
            form.target = id;
            form.method = "POST";
            form.setAttribute("accept-charset", "utf-8");
            area.name = "d";
            form.appendChild(area);
            document.body.appendChild(form);
            this.form = form;
            this.area = area;
        }
        this.form.action = this.prepareUrl() + query;
        initIframe();
        this.area.value = io.JSON.stringify(data);
        try {
            this.form.submit();
        } catch (e) {}
        this.iframe.attachEvent ? iframe.onreadystatechange = function() {
            "complete" == self.iframe.readyState && complete();
        } : this.iframe.onload = complete;
        this.socket.setBuffer(true);
    };
    JSONPPolling.prototype.get = function() {
        var self = this, script = document.createElement("script"), query = io.util.query(this.socket.options.query, "t=" + +new Date() + "&i=" + this.index);
        if (this.script) {
            this.script.parentNode.removeChild(this.script);
            this.script = null;
        }
        script.async = true;
        script.src = this.prepareUrl() + query;
        script.onerror = function() {
            self.onClose();
        };
        var insertAt = document.getElementsByTagName("script")[0];
        insertAt.parentNode.insertBefore(script, insertAt);
        this.script = script;
        indicator && setTimeout(function() {
            var iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            document.body.removeChild(iframe);
        }, 100);
    };
    JSONPPolling.prototype._ = function(msg) {
        this.onData(msg);
        this.open && this.get();
        return this;
    };
    JSONPPolling.prototype.ready = function(socket, fn) {
        var self = this;
        if (!indicator) return fn.call(this);
        io.util.load(function() {
            fn.call(self);
        });
    };
    JSONPPolling.check = function() {
        return "document" in global;
    };
    JSONPPolling.xdomainCheck = function() {
        return true;
    };
    io.transports.push("jsonp-polling");
})("undefined" != typeof io ? io.Transport : module.exports, "undefined" != typeof io ? io : module.parent.exports, this);