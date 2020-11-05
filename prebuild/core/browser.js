var browser = UE.browser = (function () {
    var browser = {
        ie: !!document.documentMode,
        edge: !!window.StyleMedia,
        webkit: navigator.userAgent.indexOf(' AppleWebKit/') > -1,
        gecko: typeof window.InstallTrigger !== 'undefined',
        mac: navigator.userAgent.indexOf('Macintosh') > -1,
        quirks: document.compatMode === 'BackCompat'
    };
    var version = 0;
    if (browser.gecko) {
        if (/\s+rv:\d+\.\d+/.test(navigator.userAgent)) {
            var rv0 = navigator.userAgent.match(/\s+rv:(\d+\.\d+)/);
            var rv1 = rv0[1].split('.');
            rv1[0] && (version += rv1[0] * 10000);
            rv1[1] && (version += rv1[1] * 100);
            rv1[2] && (version += rv1[2] * 1);
        }
    }
    if (/\s+Chrome\/(\d+\.\d)/i.test(navigator.userAgent)) {
        browser.chrome = +RegExp.$1;
    }
    if (browser.webkit) {
        version = parseFloat(navigator.userAgent.match(/\s+AppleWebKit\/(\d+)/i)[1]);
    }
    browser.version = version;
    if (browser.edge || !(browser.chrome || browser.gecko || browser.webkit || browser.mac)) {
        throw new Error('unsupport browser: ' + navigator.userAgent);
    }
    return browser;
}());
var ie = false;
var webkit = browser.webkit;
var gecko = browser.gecko;
