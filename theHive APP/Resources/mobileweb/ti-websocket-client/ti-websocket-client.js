var SHA1 = function() {
    var exports = {};
    var SHA1 = function() {
        function strfhex32(i32) {
            i32 &= 4294967295;
            0 > i32 && (i32 += 4294967296);
            var hex = Number(i32).toString(16);
            8 > hex.length && (hex = "00000000".substr(0, 8 - hex.length) + hex);
            return hex;
        }
        function padding_size(nbits) {
            var n = nbits + 1 + 64;
            return 512 * Math.ceil(n / 512) / 32;
        }
        function word_array(m) {
            var nchar = m.length;
            var size = padding_size(8 * nchar);
            var words = new Array(size);
            var i;
            for (i = 0, j = 0; nchar > i; ) words[j++] = (255 & m.charCodeAt(i++)) << 24 | (255 & m.charCodeAt(i++)) << 16 | (255 & m.charCodeAt(i++)) << 8 | 255 & m.charCodeAt(i++);
            while (size > j) words[j++] = 0;
            return words;
        }
        function write_nbits(words, length, nbits) {
            if (nbits > 4294967295) {
                var lo = 4294967295 & nbits;
                0 > lo && (lo += 4294967296);
                words[length - 1] = lo;
                words[length - 2] = (nbits - lo) / 4294967296;
            } else {
                words[length - 1] = nbits;
                words[length - 2] = 0;
            }
            return words;
        }
        function padding(words, nbits) {
            var i = Math.floor(nbits / 32);
            words[i] |= 1 << 32 * (i + 1) - nbits - 1;
            write_nbits(words, padding_size(nbits), nbits);
            return words;
        }
        function digest(words) {
            var i = 0, t = 0;
            var H = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
            while (words.length > i) {
                var W = new Array(80);
                for (t = 0; 16 > t; t++) W[t] = words[i++];
                for (t = 16; 80 > t; t++) {
                    var w = W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16];
                    W[t] = w << 1 | w >>> 31;
                }
                var A = H[0], B = H[1], C = H[2], D = H[3], E = H[4];
                for (t = 0; 80 > t; t++) {
                    var tmp = (A << 5 | A >>> 27) + E + W[t];
                    t >= 0 && 19 >= t ? tmp += (B & C | ~B & D) + 1518500249 : t >= 20 && 39 >= t ? tmp += (B ^ C ^ D) + 1859775393 : t >= 40 && 59 >= t ? tmp += (B & C | B & D | C & D) + 2400959708 : t >= 60 && 79 >= t && (tmp += (B ^ C ^ D) + 3395469782);
                    E = D;
                    D = C;
                    C = B << 30 | B >>> 2;
                    B = A;
                    A = tmp;
                }
                H[0] = 4294967295 & H[0] + A;
                H[1] = 4294967295 & H[1] + B;
                H[2] = 4294967295 & H[2] + C;
                H[3] = 4294967295 & H[3] + D;
                H[4] = 4294967295 & H[4] + E;
                0 > H[0] && (H[0] += 4294967296);
                0 > H[1] && (H[1] += 4294967296);
                0 > H[2] && (H[2] += 4294967296);
                0 > H[3] && (H[3] += 4294967296);
                0 > H[4] && (H[4] += 4294967296);
            }
            return H;
        }
        var Spec;
        Spec = {
            enabled: true,
            equals: function(a, b) {
                var i;
                if (a instanceof Array && b instanceof Array) {
                    if (a.length !== b.length) return false;
                    for (i = 0; a.length > i; i++) if (!Spec.equals(a[i], b[i])) return false;
                    return true;
                }
                if (null !== a && null !== b && "object" == typeof a && "object" == typeof b) {
                    for (i in a) if (a.hasOwnProperty(i) && !Spec.equals(a[i], b[i])) return false;
                    return true;
                }
                return a === b;
            },
            should: function(expection, message) {
                Spec.currentIndicator++;
                if (!expection) {
                    var warning = [ "[Spec failed", Spec.currentTitle ? " (" + Spec.currentTitle + ")] " : "] ", message || Spec.currentMessage + " " + Spec.currentIndicator || "" ].join("");
                    alert(warning);
                    throw warning;
                }
                return !!expection;
            },
            describe: function(title, spec) {
                Spec.currentTitle = title;
                var name;
                for (name in spec) if (spec.hasOwnProperty(name)) {
                    Spec.currentMessage = name;
                    Spec.currentIndicator = 0;
                    spec[name]();
                    Spec.currentIndicator = null;
                }
                Spec.currentMessage = Spec.currentTitle = null;
            },
            Version: "0.1"
        };
        Spec.should.equal = function(a, b, message) {
            return Spec.should(Spec.equals(a, b), message);
        };
        Spec.should.not = function(a, message) {
            return Spec.should(!a, message);
        };
        Spec.should.not.equal = function(a, b, message) {
            return Spec.should(!Spec.equals(a, b), message);
        };
        Spec.enabled || (Spec.describe = function() {});
        Spec.describe("Spec object", {
            should: function() {
                Spec.should(true);
                Spec.should(1);
            },
            "should.not": function() {
                Spec.should.not(false);
                Spec.should.not(0);
            },
            "should.equal": function() {
                Spec.should.equal(null, null);
                Spec.should.equal("", "");
                Spec.should.equal(12345, 12345);
                Spec.should.equal([ 0, 1, 2 ], [ 0, 1, 2 ]);
                Spec.should.equal([ 0, 1, [ 0, 1, 2 ] ], [ 0, 1, [ 0, 1, 2 ] ]);
                Spec.should.equal({}, {});
                Spec.should.equal({
                    x: 1
                }, {
                    x: 1
                });
                Spec.should.equal({
                    x: [ 1 ]
                }, {
                    x: [ 1 ]
                });
            },
            "should.not.equal": function() {
                Spec.should.not.equal([ 1, 2, 3 ], [ 1, 2, 3, 4 ]);
                Spec.should.not.equal({
                    x: 1
                }, [ 1, 2, 3, 4 ]);
            }
        });
        Spec.describe("sha1", {
            strfhex32: function() {
                Spec.should.equal(strfhex32(0), "00000000");
                Spec.should.equal(strfhex32(291), "00000123");
                Spec.should.equal(strfhex32(4294967295), "ffffffff");
            }
        });
        Spec.describe("sha1", {
            padding_size: function() {
                Spec.should.equal(padding_size(0), 16);
                Spec.should.equal(padding_size(1), 16);
                Spec.should.equal(padding_size(447), 16);
                Spec.should.equal(padding_size(448), 32);
            }
        });
        Spec.describe("sha1", {
            word_array: function() {
                Spec.should.equal(word_array(""), [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
                Spec.should.equal(word_array("1234")[0], 825373492);
            }
        });
        Spec.describe("sha1", {
            write_nbits: function() {
                Spec.should.equal(write_nbits([ 0, 0 ], 2, 1), [ 0, 1 ]);
                Spec.should.equal(write_nbits([ 0, 0 ], 2, 4294967295), [ 0, 4294967295 ]);
                Spec.should.equal(write_nbits([ 0, 0 ], 2, 4294967296), [ 1, 0 ]);
                Spec.should.equal(write_nbits([ 0, 0 ], 2, 8589934591), [ 1, 4294967295 ]);
                Spec.should.equal(write_nbits([ 0, 0 ], 2, 1249835483136), [ 291, 0 ]);
                Spec.should.equal(write_nbits([ 0, 0 ], 2, 1252717883154), [ 291, 2882400018 ]);
            }
        });
        var SHA1 = function(message) {
            this.message = message;
        };
        _base64_keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        SHA1.prototype = {
            digest: function() {
                var nbits = 8 * this.message.length;
                var words = padding(word_array(this.message), nbits);
                return digest(words);
            },
            base64digest: function() {
                var hex = this.hexdigest();
                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;
                while (hex.length > i) {
                    chr1 = parseInt(hex.substring(i, i + 2), 16);
                    chr2 = parseInt(hex.substring(i + 2, i + 4), 16);
                    chr3 = parseInt(hex.substring(i + 4, i + 6), 16);
                    enc1 = chr1 >> 2;
                    enc2 = (3 & chr1) << 4 | chr2 >> 4;
                    enc3 = (15 & chr2) << 2 | chr3 >> 6;
                    enc4 = 63 & chr3;
                    isNaN(chr2) ? enc3 = enc4 = 64 : isNaN(chr3) && (enc4 = 64);
                    output = output + _base64_keyStr.charAt(enc1) + _base64_keyStr.charAt(enc2) + _base64_keyStr.charAt(enc3) + _base64_keyStr.charAt(enc4);
                    i += 6;
                }
                return output;
            },
            hexdigest: function() {
                var digest = this.digest();
                var i;
                for (i = 0; digest.length > i; i++) digest[i] = strfhex32(digest[i]);
                return digest.join("");
            }
        };
        Spec.describe("sha1", {
            "SHA1#hexdigest": function() {
                Spec.should.equal(new SHA1("").hexdigest(), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
                Spec.should.equal(new SHA1("1").hexdigest(), "356a192b7913b04c54574d18c28d46e6395428ab");
                Spec.should.equal(new SHA1("Hello.").hexdigest(), "9b56d519ccd9e1e5b2a725e186184cdc68de0731");
                Spec.should.equal(new SHA1("9b56d519ccd9e1e5b2a725e186184cdc68de0731").hexdigest(), "f042dc98a62cbad68dbe21f11bbc1e9d416d2bf6");
                Spec.should.equal(new SHA1("MD5abZRVSXZVRcasdfasdddddddddddddddds+BNRJFSLKJFN+SEONBBJFJXLKCJFSE)RUNVXDLILKVJRN)#NVFJ)WVFWRW#)NVS$Q=$dddddddddddddWV;no9wurJFSE)RUNVXDLILKVJRN)#NVFJ)WVFWRW#)NVS$Q=$dddddddddddddWV;no9wurJFSE)RUNVXDLILKVJRN)#NVFJ)WVFWRW#)NVS$Q=$dddddddddddddWV;no9wurJFSE)RUNVXDLILKVJRN)#NVFJ)WVFWRW#)NVS$Q=$dddddddddddddWV;no9wuraddddddasdfasdfd").hexdigest(), "662dbf4ebc9cdb4224766e87634e5ba9e6de672b");
            }
        });
        return SHA1;
    }();
    exports.SHA1 = SHA1;
    return exports;
}().SHA1;

var Utils = function() {
    var exports = {};
    exports.read_byte = function(buffer, position) {
        var data = Ti.Codec.decodeNumber({
            source: buffer,
            position: position || 0,
            type: Ti.Codec.TYPE_BYTE,
            byteOrder: Ti.Codec.BIG_ENDIAN
        });
        0 > data && (data += 256);
        return data;
    };
    exports.read_2byte = function(buffer, position) {
        var data = Ti.Codec.decodeNumber({
            source: buffer,
            position: position || 0,
            type: Ti.Codec.TYPE_SHORT,
            byteOrder: Ti.Codec.BIG_ENDIAN
        });
        0 > data && (data += 65536);
        return data;
    };
    exports.read_8byte = function(buffer, position) {
        var data = Ti.Codec.decodeNumber({
            source: buffer,
            position: position || 0,
            type: Ti.Codec.TYPE_LONG,
            byteOrder: Ti.Codec.BIG_ENDIAN
        });
        0 > data && (data += 0x10000000000000000);
        return data;
    };
    exports.byte_length = function(str) {
        var buffer = Ti.createBuffer({
            length: 65536
        });
        var length = Ti.Codec.encodeString({
            source: str,
            dest: buffer
        });
        return length;
    };
    exports.trim = function(str) {
        return String(str).replace(/^\s+|\s+$/g, "");
    };
    return exports;
}();

var events = function() {
    function EventEmitter() {}
    var exports = {};
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
    return exports;
}();

var debug = function(str) {
    Ti.API.debug(str);
};

var CONNECTING = 0;

var OPEN = 1;

var CLOSING = 2;

var CLOSED = 3;

var BUFFER_SIZE = 65536;

var CLOSING_TIMEOUT = 1e3;

var WebSocket = function(url, protocols, origin, extensions) {
    this.url = url;
    if (!this._parse_url()) throw "Wrong url scheme for WebSocket: " + this.url;
    this.origin = origin || String.format("http://%s:%s/", this._host, this._port);
    this.protocols = protocols;
    this.extensions = extensions;
    this.readyState = CONNECTING;
    this._masking_disabled = false;
    this._headers = [];
    this._pong_received = false;
    this._readBuffer = "";
    this._socketReadBuffer = void 0;
    this._closingTimer = void 0;
    this._handshake = void 0;
    this._socket = void 0;
    this._fragmentSize = BUFFER_SIZE;
    this._connect();
};

exports.WebSocket = WebSocket;

WebSocket.prototype = new events.EventEmitter();

WebSocket.prototype.onopen = function() {};

WebSocket.prototype.onmessage = function() {};

WebSocket.prototype.onerror = function() {};

WebSocket.prototype.onclose = function() {};

WebSocket.prototype._parse_url = function() {
    var parsed = this.url.match(/^([a-z]+):\/\/([\w.]+)(:(\d+)|)(.*)/i);
    if (!parsed || "ws" !== parsed[1]) return false;
    this._host = parsed[2];
    this._port = parsed[4] || 80;
    this._path = parsed[5];
    return true;
};

var make_handshake_key = function() {
    var i, key = "";
    for (i = 0; 16 > i; ++i) key += String.fromCharCode(255 * Math.random() + 1);
    return Utils.trim(Ti.Utils.base64encode(key));
};

var make_handshake = function(host, path, origin, protocols, extensions, handshake) {
    str = "GET " + path + " HTTP/1.1\r\n";
    str += "Host: " + host + "\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n";
    str += "Sec-WebSocket-Key: " + handshake + "\r\n";
    str += "Origin: " + origin + "\r\n";
    str += "Sec-WebSocket-Origin: " + origin + "\r\n";
    str += "Sec-WebSocket-Version: 7\r\n";
    protocols && protocols.length > 0 && (str += "Sec-WebSocket-Protocol: " + protocols.join(",") + "\r\n");
    extensions && extensions.length > 0 && (str += "Sec-WebSocket-Extensions: " + extensions.join(",") + "\r\n");
    return str + "\r\n";
};

WebSocket.prototype._send_handshake = function() {
    this._handshake = make_handshake_key();
    var handshake = make_handshake(this._host, this._path, this.origin, this.protocols, this.extensions, this._handshake);
    return this._socket.write(Ti.createBuffer({
        value: handshake
    })) > 0;
};

WebSocket.prototype._read_http_headers = function() {
    var string = "";
    var buffer = Ti.createBuffer({
        length: BUFFER_SIZE
    });
    var counter = 10;
    while (true) {
        var bytesRead = this._socket.read(buffer);
        if (bytesRead > 0) {
            var lastStringLen = string.length;
            string += Ti.Codec.decodeString({
                source: buffer,
                charset: Ti.Codec.CHARSET_ASCII
            });
            var eoh = string.match(/\r\n\r\n/);
            if (eoh) {
                var offset = eoh.index + 4 - lastStringLen;
                string = string.substring(0, offset - 2);
                this.buffer = Ti.createBuffer({
                    length: BUFFER_SIZE
                });
                this.bufferSize = bytesRead - offset;
                this.buffer.copy(buffer, 0, offset, this.bufferSize);
                break;
            }
        } else {
            debug("read_http_headers: timeout");
            --counter;
            if (0 > counter) return false;
        }
        buffer.clear();
    }
    buffer.clear();
    this.headers = string.split("\r\n");
    return true;
};

var extract_headers = function(headers) {
    var result = {};
    headers.forEach(function(line) {
        var index = line.indexOf(":");
        if (index > 0) {
            var key = Utils.trim(line.slice(0, index));
            var value = Utils.trim(line.slice(index + 1));
            result[key] = value;
        }
    });
    return result;
};

var handshake_reponse = function(handshake) {
    return new SHA1(handshake + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").base64digest();
};

WebSocket.prototype._check_handshake_response = function() {
    var version = this.headers.shift();
    if ("HTTP/1.1 101 Switching Protocols" !== version) {
        debug("mismatch protocol version");
        return false;
    }
    var h = extract_headers(this.headers);
    if (!h.Upgrade || !h.Connection || !h["Sec-WebSocket-Accept"]) return false;
    if ("websocket" !== h.Upgrade.toLowerCase() || "upgrade" !== h.Connection.toLowerCase() || h["Sec-WebSocket-Accept"] !== handshake_reponse(this._handshake)) return false;
    this.readyState = OPEN;
    return true;
};

WebSocket.prototype._create_frame = function(opcode, d, last_frame) {
    "undefined" == typeof last_frame && (last_frame = true);
    if (false === last_frame && opcode >= 8 && 15 >= opcode) return false;
    var data = d || "";
    var length = Utils.byte_length(data);
    var header_length = 2;
    var mask_size = 6;
    length > 125 && BUFFER_SIZE >= length ? header_length += 2 : length > BUFFER_SIZE && (header_length += 8);
    this._masking_disabled || (header_length += 4);
    var out = Ti.createBuffer({
        length: length + header_length + mask_size
    });
    var outIndex = 0;
    var byte1 = opcode;
    last_frame && (byte1 = 128 | byte1);
    Ti.Codec.encodeNumber({
        source: byte1,
        dest: out,
        position: outIndex++,
        type: Ti.Codec.TYPE_BYTE
    });
    if (125 >= length) {
        var byte2 = length;
        this._masking_disabled || (byte2 = 128 | byte2);
        Ti.Codec.encodeNumber({
            source: byte2,
            dest: out,
            position: outIndex++,
            type: Ti.Codec.TYPE_BYTE
        });
    } else {
        Ti.Codec.encodeNumber({
            source: 255,
            dest: out,
            position: outIndex++,
            type: Ti.Codec.TYPE_BYTE
        });
        Ti.Codec.encodeNumber({
            source: length,
            dest: out,
            position: outIndex,
            type: Ti.Codec.TYPE_LONG,
            byteOrder: Ti.Codec.BIG_ENDIAN
        });
        outIndex += 8;
    }
    outIndex = this._mask_payload(out, outIndex, data);
    out.length = outIndex;
    return out;
};

WebSocket.prototype._mask_payload = function(out, outIndex, payload) {
    if (!this._masking_disabled) {
        var i, masking_key = [];
        for (i = 0; 4 > i; ++i) {
            var key = 255 & Math.floor(255 * Math.random());
            masking_key.push(key);
            Ti.Codec.encodeNumber({
                source: key,
                dest: out,
                position: outIndex++,
                type: Ti.Codec.TYPE_BYTE
            });
        }
        var buffer = Ti.createBuffer({
            value: payload
        });
        var string = Ti.Codec.decodeString({
            source: buffer,
            charset: Ti.Codec.CHARSET_ASCII
        });
        var length = buffer.length;
        length > out.length && (out.length = length);
        for (i = 0; length > i; ++i) Ti.Codec.encodeNumber({
            source: string.charCodeAt(i) ^ masking_key[i % 4],
            dest: buffer,
            position: i,
            type: Ti.Codec.TYPE_BYTE
        });
        out.copy(buffer, outIndex, 0, length);
        return outIndex + length;
    }
    var len = Ti.Codec.encodeString({
        source: payload,
        dest: out,
        destPosition: outIndex
    });
    return len + outIndex;
};

var parse_frame = function(buffer, size) {
    if (3 > size) return void 0;
    var byte1 = Utils.read_byte(buffer, 0);
    var fin = !!(128 & byte1);
    var opcode = 15 & byte1;
    var byte2 = Utils.read_byte(buffer, 1);
    var len = 127 & byte2;
    var offset = 2;
    switch (len) {
      case 126:
        len = Utils.read_2byte(buffer, offset);
        offset += 2;
        break;

      case 127:
        len = Utils.read_8byte(buffer, offset);
        offset += 8;
    }
    if (len + offset > size) return void 0;
    var string = Ti.Codec.decodeString({
        source: buffer,
        position: offset,
        length: len,
        charset: Ti.Codec.CHARSET_UTF8
    });
    return {
        fin: fin,
        opcode: opcode,
        payload: string,
        size: len + offset
    };
};

WebSocket.prototype.send = function(data) {
    if (data && this.readyState === OPEN) {
        var buffer = Ti.createBuffer({
            value: data
        });
        var string = Ti.Codec.decodeString({
            source: buffer,
            charset: Ti.Codec.CHARSET_UTF8
        });
        var frame = null;
        var stringLength = string.length;
        if (BUFFER_SIZE > stringLength) {
            frame = this._create_frame(1, string);
            if (this._socket.write(frame) > 0) return true;
            return false;
        }
        var offset = 0;
        var limit = this._fragmentSize;
        var fragment = null;
        var isFirstFragment = true;
        var opcode = 1;
        var frames = [];
        while (stringLength > offset) {
            if (offset + limit > stringLength) break;
            fragment = string.substring(offset, limit - offset);
            opcode = 128;
            if (isFirstFragment) {
                opcode = 1;
                isFirstFragment = false;
            }
            frame = this._create_frame(opcode, fragment, false);
            frames.push(frame);
            offset += limit;
        }
        fragment = string.substring(offset, stringLength);
        frame = this._create_frame(1, fragment, true);
        frames.push(frame);
        while (frames.length > 0) {
            frame = frames.shift();
            if (1 > this._socket.write(frame)) return false;
        }
        return false;
    }
    return false;
};

WebSocket.prototype._socket_close = function() {
    this._closingTimer && clearTimeout(this._closingTimer);
    this._closingTimer = void 0;
    this._readBuffer = "";
    this._socketReadBuffer = void 0;
    var ev;
    if (this.readyState === CLOSING) {
        this.readyState = CLOSED;
        this._socket.close();
        ev = {
            code: 1e3,
            wasClean: true,
            reason: ""
        };
        this.emit("close", ev);
        this.onclose(ev);
    } else if (this.readyState !== CLOSED) {
        this._socket.close();
        this.readyState = CLOSED;
        ev = {
            advice: "reconnect"
        };
        this.emit("error", ev);
        this.onerror(ev);
    }
    this._socket = void 0;
};

WebSocket.prototype._read_buffer = function(callback) {
    var self = this;
    var frame = parse_frame(this.buffer, this.bufferSize);
    if ("undefined" == typeof frame) return callback();
    if (frame.size < this.bufferSize) {
        var nextBuffer = Ti.createBuffer({
            length: BUFFER_SIZE
        });
        this.bufferSize - frame.size > 0 && nextBuffer.copy(this.buffer, 0, frame.size, this.bufferSize - frame.size);
        this.buffer.clear();
        this.buffer = nextBuffer;
        this.bufferSize -= frame.size;
    } else {
        this.buffer.clear();
        this.bufferSize = 0;
    }
    switch (frame.opcode) {
      case 0:
      case 1:
      case 2:
        if (frame.fin) {
            this.emit("message", {
                data: this._readBuffer + frame.payload
            });
            this.onmessage({
                data: this._readBuffer + frame.payload
            });
            this._readBuffer = "";
        } else this._readBuffer += frame.payload;
        break;

      case 8:
        if (this.readyState === CLOSING) this._socket_close(); else {
            this.readyState = CLOSING;
            this._socket.write(this._create_frame(8));
            this._closingTimer = setTimeout(function() {
                self._socket_close();
            }, CLOSING_TIMEOUT);
        }
        break;

      case 9:
        this._socket.write(this._create_frame(10, frame.payload));
        break;

      case 10:
        this._pong_received = true;
    }
    return callback();
};

WebSocket.prototype._read_request = function(e, callback) {
    var bytesProcessed = e.bytesProcessed;
    if ("undefined" == typeof this.buffer) {
        this.buffer = this._socketReadBuffer.clone();
        this.bufferSize = bytesProcessed;
    } else {
        this.buffer.copy(this._socketReadBuffer, this.bufferSize, 0, bytesProcessed);
        this.bufferSize += bytesProcessed;
        this.buffer.length += bytesProcessed;
        this._socketReadBuffer.clear();
    }
    return this._read_buffer(callback);
};

WebSocket.prototype._read_callback = function() {
    var self = this;
    var streamReadCallback = function(evt) {
        if (evt.bytesProcessed > 0) return self._read_request(evt, function() {
            return setTimeout(nextTick, 0);
        });
        return setTimeout(nextTick, 100);
    };
    var nextTick = function() {
        if (self.bufferSize > 0) return self._read_buffer(function(readSuccess) {
            if (readSuccess) return setTimeout(nextTick, 0);
            self._socketReadBuffer.clear();
            return Ti.Stream.read(self._socket, self._socketReadBuffer, streamReadCallback);
        });
        if (null == self._socket) return;
        self._socketReadBuffer.clear();
        return Ti.Stream.read(self._socket, self._socketReadBuffer, streamReadCallback);
    };
    return setTimeout(nextTick, 0);
};

WebSocket.prototype._error = function(code, reason) {
    this.buffer && this.buffer.clear();
    this.buffer = void 0;
    this.bufferSize = 0;
    this.readyState = CLOSED;
    if (this._socket) {
        try {
            this._socket.close();
        } catch (e) {}
        this._socket = void 0;
    }
    var ev = {
        wasClean: true,
        code: "undefined" == typeof code ? 1e3 : code,
        advice: "reconnect",
        reason: reason
    };
    this.emit("error", ev);
    this.onerror(ev);
};

WebSocket.prototype._raise_protocol_error = function(reason) {
    this._error(1002, reason);
};

WebSocket.prototype.close = function(code, message) {
    if (this.readyState === OPEN) {
        this.readyState = CLOSING;
        var buffer = Ti.createBuffer({
            length: BUFFER_SIZE
        });
        Ti.Codec.encodeNumber({
            source: code || 1e3,
            dest: buffer,
            position: 0,
            type: Ti.Codec.TYPE_SHORT,
            byteOrder: Ti.Codec.BIG_ENDIAN
        });
        if (message) {
            var length = Ti.Codec.encodeString({
                source: message,
                dest: buffer,
                destPosition: 2
            });
            buffer.length = 2 + length;
        } else buffer.length = 2;
        var payload = Ti.Codec.decodeString({
            source: buffer,
            charset: Ti.Codec.CHARSET_ASCII
        });
        this._socket.write(this._create_frame(8, payload));
        var self = this;
        this._closingTimer = setTimeout(function() {
            self._socket_close();
        }, CLOSING_TIMEOUT);
    }
};

WebSocket.prototype._connect = function() {
    if (this.readyState === OPEN || this.readyState === CLOSING) return false;
    var self = this;
    this._socket = Ti.Network.Socket.createTCP({
        host: this._host,
        port: this._port,
        mode: Ti.Network.READ_WRITE_MODE,
        connected: function() {
            var result;
            result = self._send_handshake();
            if (!result) return self._raise_protocol_error("send handshake");
            result = self._read_http_headers();
            if (!result) return self._raise_protocol_error("parse http header");
            result = self._check_handshake_response();
            if (!result) return self._raise_protocol_error("wrong handshake");
            self._readBuffer = "";
            self._socketReadBuffer = Ti.createBuffer({
                length: BUFFER_SIZE
            });
            self.readyState = OPEN;
            self.emit("open");
            self.onopen();
            self._read_callback();
        },
        closed: function() {
            self._socket_close();
            self.buffer && self.buffer.clear();
            self.buffer = void 0;
            self.bufferSize = 0;
        },
        error: function(e) {
            var reason;
            "undefined" != typeof e && (reason = e.error);
            self._error(1e3, reason);
        }
    });
    this._socket.connect();
};