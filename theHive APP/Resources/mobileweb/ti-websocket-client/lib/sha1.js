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