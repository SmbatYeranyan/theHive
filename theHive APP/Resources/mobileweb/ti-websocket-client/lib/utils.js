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