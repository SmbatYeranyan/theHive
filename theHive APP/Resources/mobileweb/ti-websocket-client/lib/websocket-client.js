var SHA1 = require("sha1").SHA1;

var Utils = require("utils");

var events = require("events");

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