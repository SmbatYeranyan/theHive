(function(exports, nativeJSON) {
    "use strict";
    function f(n) {
        return 10 > n ? "0" + n : n;
    }
    function date(d) {
        return isFinite(d.valueOf()) ? d.getUTCFullYear() + "-" + f(d.getUTCMonth() + 1) + "-" + f(d.getUTCDate()) + "T" + f(d.getUTCHours()) + ":" + f(d.getUTCMinutes()) + ":" + f(d.getUTCSeconds()) + "Z" : null;
    }
    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return "string" == typeof c ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        var i, k, v, length, partial, mind = gap, value = holder[key];
        value instanceof Date && (value = date(key));
        "function" == typeof rep && (value = rep.call(holder, key, value));
        switch (typeof value) {
          case "string":
            return quote(value);

          case "number":
            return isFinite(value) ? String(value) : "null";

          case "boolean":
          case "null":
            return String(value);

          case "object":
            if (!value) return "null";
            gap += indent;
            partial = [];
            if ("[object Array]" === Object.prototype.toString.apply(value)) {
                length = value.length;
                for (i = 0; length > i; i += 1) partial[i] = str(i, value) || "null";
                v = 0 === partial.length ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            if (rep && "object" == typeof rep) {
                length = rep.length;
                for (i = 0; length > i; i += 1) if ("string" == typeof rep[i]) {
                    k = rep[i];
                    v = str(k, value);
                    v && partial.push(quote(k) + (gap ? ": " : ":") + v);
                }
            } else for (k in value) if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = str(k, value);
                v && partial.push(quote(k) + (gap ? ": " : ":") + v);
            }
            v = 0 === partial.length ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }
    if (nativeJSON && nativeJSON.parse) return exports.JSON = {
        parse: nativeJSON.parse,
        stringify: nativeJSON.stringify
    };
    var JSON = exports.JSON = {};
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
        "\b": "\\b",
        "	": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\"
    }, rep;
    JSON.stringify = function(value, replacer, space) {
        var i;
        gap = "";
        indent = "";
        if ("number" == typeof space) for (i = 0; space > i; i += 1) indent += " "; else "string" == typeof space && (indent = space);
        rep = replacer;
        if (replacer && "function" != typeof replacer && ("object" != typeof replacer || "number" != typeof replacer.length)) throw new Error("JSON.stringify");
        return str("", {
            "": value
        });
    };
    JSON.parse = function(text, reviver) {
        function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && "object" == typeof value) for (k in value) if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = walk(value, k);
                void 0 !== v ? value[k] = v : delete value[k];
            }
            return reviver.call(holder, key, value);
        }
        var j;
        text = String(text);
        cx.lastIndex = 0;
        cx.test(text) && (text = text.replace(cx, function(a) {
            return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }));
        if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
            j = eval("(" + text + ")");
            return "function" == typeof reviver ? walk({
                "": j
            }, "") : j;
        }
        throw new SyntaxError("JSON.parse");
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof JSON ? JSON : void 0);