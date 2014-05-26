(function(exports, io) {
    var parser = exports.parser = {};
    var packets = parser.packets = [ "disconnect", "connect", "heartbeat", "message", "json", "event", "ack", "error", "noop" ];
    var reasons = parser.reasons = [ "transport not supported", "client not handshaken", "unauthorized" ];
    var advice = parser.advice = [ "reconnect" ];
    var JSON = io.JSON, indexOf = io.util.indexOf;
    parser.encodePacket = function(packet) {
        var type = indexOf(packets, packet.type), id = packet.id || "", endpoint = packet.endpoint || "", ack = packet.ack, data = null;
        switch (packet.type) {
          case "error":
            var reason = packet.reason ? indexOf(reasons, packet.reason) : "", adv = packet.advice ? indexOf(advice, packet.advice) : "";
            ("" !== reason || "" !== adv) && (data = reason + ("" !== adv ? "+" + adv : ""));
            break;

          case "message":
            "" !== packet.data && (data = packet.data);
            break;

          case "event":
            var ev = {
                name: packet.name
            };
            packet.args && packet.args.length && (ev.args = packet.args);
            data = JSON.stringify(ev);
            break;

          case "json":
            data = JSON.stringify(packet.data);
            break;

          case "connect":
            packet.qs && (data = packet.qs);
            break;

          case "ack":
            data = packet.ackId + (packet.args && packet.args.length ? "+" + JSON.stringify(packet.args) : "");
        }
        var encoded = [ type, id + ("data" == ack ? "+" : ""), endpoint ];
        null !== data && void 0 !== data && encoded.push(data);
        return encoded.join(":");
    };
    parser.encodePayload = function(packets) {
        var decoded = "";
        if (1 == packets.length) return packets[0];
        for (var i = 0, l = packets.length; l > i; i++) {
            var packet = packets[i];
            decoded += "�" + packet.length + "�" + packets[i];
        }
        return decoded;
    };
    var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;
    parser.decodePacket = function(data) {
        var pieces = data.match(regexp);
        if (!pieces) return {};
        var id = pieces[2] || "", data = pieces[5] || "", packet = {
            type: packets[pieces[1]],
            endpoint: pieces[4] || ""
        };
        if (id) {
            packet.id = id;
            packet.ack = pieces[3] ? "data" : true;
        }
        switch (packet.type) {
          case "error":
            var pieces = data.split("+");
            packet.reason = reasons[pieces[0]] || "";
            packet.advice = advice[pieces[1]] || "";
            break;

          case "message":
            packet.data = data || "";
            break;

          case "event":
            try {
                var opts = JSON.parse(data);
                packet.name = opts.name;
                packet.args = opts.args;
            } catch (e) {}
            packet.args = packet.args || [];
            break;

          case "json":
            try {
                packet.data = JSON.parse(data);
            } catch (e) {}
            break;

          case "connect":
            packet.qs = data || "";
            break;

          case "ack":
            var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
            if (pieces) {
                packet.ackId = pieces[1];
                packet.args = [];
                if (pieces[3]) try {
                    packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
                } catch (e) {}
            }
            break;

          case "disconnect":
          case "heartbeat":        }
        return packet;
    };
    parser.decodePayload = function(data) {
        if ("�" == data.charAt(0)) {
            var ret = [];
            for (var i = 1, length = ""; data.length > i; i++) if ("�" == data.charAt(i)) {
                ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
                i += Number(length) + 1;
                length = "";
            } else length += data.charAt(i);
            return ret;
        }
        return [ parser.decodePacket(data) ];
    };
})("undefined" != typeof io ? io : module.exports, "undefined" != typeof io ? io : module.parent.exports);