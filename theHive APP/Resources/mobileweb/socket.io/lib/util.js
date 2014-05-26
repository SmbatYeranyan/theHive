(function(exports, global) {
    var util = exports.util = {};
    var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    var parts = [ "source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor" ];
    util.parseUri = function(str) {
        var m = re.exec(str || ""), uri = {}, i = 14;
        while (i--) uri[parts[i]] = m[i] || "";
        return uri;
    };
    util.uniqueUri = function(uri) {
        var protocol = uri.protocol, host = uri.host, port = uri.port;
        if ("document" in global) {
            host = host || document.domain;
            port = port || ("https" == protocol && "https:" !== document.location.protocol ? 443 : document.location.port);
        } else {
            host = host || "localhost";
            port || "https" != protocol || (port = 443);
        }
        return (protocol || "http") + "://" + host + ":" + (port || 80);
    };
    util.query = function(base, addition) {
        var query = util.chunkQuery(base || ""), components = [];
        util.merge(query, util.chunkQuery(addition || ""));
        for (var part in query) query.hasOwnProperty(part) && components.push(part + "=" + query[part]);
        return components.length ? "?" + components.join("&") : "";
    };
    util.chunkQuery = function(qs) {
        var kv, query = {}, params = qs.split("&"), i = 0, l = params.length;
        for (;l > i; ++i) {
            kv = params[i].split("=");
            kv[0] && (query[kv[0]] = kv[1]);
        }
        return query;
    };
    var pageLoaded = false;
    util.load = function(fn) {
        if ("document" in global && "complete" === document.readyState || pageLoaded) return fn();
        util.on(global, "load", fn, false);
    };
    util.on = function(element, event, fn, capture) {
        element.attachEvent ? element.attachEvent("on" + event, fn) : element.addEventListener && element.addEventListener(event, fn, capture);
    };
    util.request = function(xdomain) {
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        return new XMLHttpRequest();
    };
    "undefined" != typeof window && util.load(function() {
        pageLoaded = true;
    });
    util.defer = function(fn) {
        if (!util.ua.webkit || "undefined" != typeof importScripts) return fn();
        util.load(function() {
            setTimeout(fn, 100);
        });
    };
    util.merge = function(target, additional, deep, lastseen) {
        var prop, seen = lastseen || [], depth = "undefined" == typeof deep ? 2 : deep;
        for (prop in additional) if (additional.hasOwnProperty(prop) && 0 > util.indexOf(seen, prop)) if ("object" == typeof target[prop] && depth) util.merge(target[prop], additional[prop], depth - 1, seen); else {
            target[prop] = additional[prop];
            seen.push(additional[prop]);
        }
        return target;
    };
    util.mixin = function(ctor, ctor2) {
        util.merge(ctor.prototype, ctor2.prototype);
    };
    util.inherit = function(ctor, ctor2) {
        function f() {}
        f.prototype = ctor2.prototype;
        ctor.prototype = new f();
    };
    util.isArray = Array.isArray || function(obj) {
        return "[object Array]" === Object.prototype.toString.call(obj);
    };
    util.intersect = function(arr, arr2) {
        var ret = [], longest = arr.length > arr2.length ? arr : arr2, shortest = arr.length > arr2.length ? arr2 : arr;
        for (var i = 0, l = shortest.length; l > i; i++) ~util.indexOf(longest, shortest[i]) && ret.push(shortest[i]);
        return ret;
    };
    util.indexOf = function(arr, o, i) {
        for (var j = arr.length, i = 0 > i ? 0 > i + j ? 0 : i + j : i || 0; j > i && arr[i] !== o; i++) ;
        return i >= j ? -1 : i;
    };
    util.toArray = function(enu) {
        var arr = [];
        for (var i = 0, l = enu.length; l > i; i++) arr.push(enu[i]);
        return arr;
    };
    util.ua = {};
    util.ua.hasCORS = "undefined" != typeof XMLHttpRequest && function() {
        try {
            var a = new XMLHttpRequest();
        } catch (e) {
            return false;
        }
        return void 0 != a.withCredentials;
    }();
    util.ua.webkit = "undefined" != typeof navigator && /webkit/i.test(navigator.userAgent);
})("undefined" != typeof io ? io : module.exports, this);