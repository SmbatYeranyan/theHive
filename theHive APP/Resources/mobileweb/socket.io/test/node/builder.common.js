var vm = require("vm"), should = require("should");

exports.env = function() {
    var details = {
        location: {
            port: 8080,
            host: "www.example.org",
            hostname: "www.example.org",
            href: "http://www.example.org/example/",
            pathname: "/example/",
            protocol: "http:",
            search: "",
            hash: ""
        },
        console: {
            log: function() {},
            info: function() {},
            warn: function() {},
            error: function() {}
        },
        navigator: {
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.27 (KHTML, like Gecko) Chrome/12.0.716.0 Safari/534.27",
            appName: "socket.io",
            platform: process.platform,
            appVersion: process.version
        },
        name: "socket.io",
        innerWidth: 1024,
        innerHeight: 768,
        length: 1,
        outerWidth: 1024,
        outerHeight: 768,
        pageXOffset: 0,
        pageYOffset: 0,
        screenX: 0,
        screenY: 0,
        screenLeft: 0,
        screenTop: 0,
        scrollX: 0,
        scrollY: 0,
        scrollTop: 0,
        scrollLeft: 0,
        screen: {
            width: 0,
            height: 0
        }
    };
    details.window = details.self = details.contentWindow = details;
    details.Image = details.scrollTo = details.scrollBy = details.scroll = details.resizeTo = details.resizeBy = details.prompt = details.print = details.open = details.moveTo = details.moveBy = details.focus = details.createPopup = details.confirm = details.close = details.blur = details.alert = details.clearTimeout = details.clearInterval = details.setInterval = details.setTimeout = details.XMLHttpRequest = details.getComputedStyle = details.trigger = details.dispatchEvent = details.removeEventListener = details.addEventListener = function() {};
    details.frames = [ details ];
    details.document = details;
    details.document.domain = details.location.href;
    return details;
};

exports.execute = function(contents) {
    var env = exports.env(), script = vm.createScript(contents);
    script.runInNewContext(env);
    return env;
};