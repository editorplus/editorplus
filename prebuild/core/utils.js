var utils = UE.utils = {
    each: function (obj, iterator, context) {
        if (obj == null)
            return;
        if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === false) {
                    return false;
                }
            }
        }
        else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (iterator.call(context, obj[key], key, obj) === false) {
                        return false;
                    }
                }
            }
        }
    },
    makeInstance: function (obj) {
        var noop = new Function();
        noop.prototype = obj;
        obj = new noop();
        noop.prototype = null;
        return obj;
    },
    extend: function (t, s, b) {
        if (s) {
            for (var k in s) {
                if (!b || !t.hasOwnProperty(k)) {
                    t[k] = s[k];
                }
            }
        }
        return t;
    },
    extend2: function (t) {
        var a = arguments;
        for (var i = 1; i < a.length; i++) {
            var x = a[i];
            for (var k in x) {
                if (!t.hasOwnProperty(k)) {
                    t[k] = x[k];
                }
            }
        }
        return t;
    },
    inherits: function (subClass, superClass) {
        var oldP = subClass.prototype;
        var newP = utils.makeInstance(superClass.prototype);
        utils.extend(newP, oldP, true);
        subClass.prototype = newP;
        return (newP.constructor = subClass);
    },
    bind: function (fn, context) {
        return function () {
            return fn.apply(context, arguments);
        };
    },
    defer: function (fn, delay, exclusion) {
        var timerID;
        return function () {
            if (exclusion) {
                clearTimeout(timerID);
            }
            timerID = setTimeout(fn, delay);
        };
    },
    indexOf: function (array, item, start) {
        var index = -1;
        start = this.isNumber(start) ? start : 0;
        this.each(array, function (v, i) {
            if (i >= start && v === item) {
                index = i;
                return false;
            }
        });
        return index;
    },
    removeItem: function (array, item) {
        for (var i = 0, l = array.length; i < l; i++) {
            if (array[i] === item) {
                array.splice(i, 1);
                i--;
            }
        }
    },
    trim: function (str) {
        return str.replace(/(^[ \t\n\r]+)|([ \t\n\r]+$)/g, '');
    },
    listToMap: function (list) {
        if (!list)
            return {};
        list = utils.isArray(list) ? list : list.split(',');
        for (var i = 0, ci, obj = {}; ci = list[i++];) {
            obj[ci.toUpperCase()] = obj[ci] = 1;
        }
        return obj;
    },
    unhtml: function (str, reg) {
        return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp|#\d+);)?/g, function (a, b) {
            if (b) {
                return a;
            }
            else {
                return {
                    '<': '&lt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    '>': '&gt;',
                    "'": '&#39;'
                }[a];
            }
        }) : '';
    },
    unhtmlForUrl: function (str, reg) {
        return str ? str.replace(reg || /[<">']/g, function (a) {
            return {
                '<': '&lt;',
                '&': '&amp;',
                '"': '&quot;',
                '>': '&gt;',
                "'": '&#39;'
            }[a];
        }) : '';
    },
    html: function (str) {
        return str ? str.replace(/&((g|l|quo)t|amp|#39|nbsp);/g, function (m) {
            return {
                '&lt;': '<',
                '&amp;': '&',
                '&quot;': '"',
                '&gt;': '>',
                '&#39;': "'",
                '&nbsp;': ' '
            }[m];
        }) : '';
    },
    cssStyleToDomStyle: (function () {
        var test = document.createElement('div').style;
        var cache = {
            float: test.cssFloat != undefined ? 'cssFloat' : test.styleFloat != undefined ? 'styleFloat' : 'float'
        };
        return function (cssName) {
            return cache[cssName] || (cache[cssName] = cssName.toLowerCase().replace(/-./g, function (match) {
                return match.charAt(1).toUpperCase();
            }));
        };
    }()),
    loadFile: (function () {
        var tmpList = [];
        function getItem(doc, obj) {
            try {
                for (var i = 0, ci; ci = tmpList[i++];) {
                    if (ci.doc === doc && ci.url == (obj.src || obj.href)) {
                        return ci;
                    }
                }
            }
            catch (e) {
                return null;
            }
        }
        return function (doc, obj, fn) {
            var item = getItem(doc, obj);
            if (item) {
                if (item.ready) {
                    fn && fn();
                }
                else {
                    item.funs.push(fn);
                }
                return;
            }
            tmpList.push({
                doc: doc,
                url: obj.src || obj.href,
                funs: [fn]
            });
            if (!doc.body) {
                var html = [];
                for (var p in obj) {
                    if (p == 'tag')
                        continue;
                    html.push(p + '="' + obj[p] + '"');
                }
                doc.write('<' + obj.tag + ' ' + html.join(' ') + ' ></' + obj.tag + '>');
                return;
            }
            if (obj.id && doc.getElementById(obj.id)) {
                return;
            }
            var element = doc.createElement(obj.tag);
            delete obj.tag;
            for (var p in obj) {
                element.setAttribute(p, obj[p]);
            }
            element.onload = element.onreadystatechange = function () {
                if (!this.readyState || /loaded|complete/.test(this.readyState)) {
                    item = getItem(doc, obj);
                    if (item.funs.length > 0) {
                        item.ready = 1;
                        for (var fi; fi = item.funs.pop();) {
                            fi();
                        }
                    }
                    element.onload = element.onreadystatechange = null;
                }
            };
            element.onerror = function () {
                throw Error('The load ' + (obj.href || obj.src) + ' fails,check the url settings of file ueditor.config.js ');
            };
            doc.getElementsByTagName('head')[0].appendChild(element);
        };
    }()),
    isEmptyObject: function (obj) {
        if (obj == null)
            return true;
        if (this.isArray(obj) || this.isString(obj))
            return obj.length === 0;
        for (var key in obj)
            if (obj.hasOwnProperty(key))
                return false;
        return true;
    },
    fixColor: function (name, value) {
        if (/color/i.test(name) && /rgba?/.test(value)) {
            var array = value.split(',');
            if (array.length > 3) {
                return '';
            }
            value = '#';
            for (var i = 0, color; color = array[i++];) {
                color = parseInt(color.replace(/[^\d]/gi, ''), 10).toString(16);
                value += color.length == 1 ? '0' + color : color;
            }
            value = value.toUpperCase();
        }
        return value;
    },
    optCss: function (val) {
        var padding, margin, border;
        val = val.replace(/(padding|margin|border)\-([^:]+):([^;]+);?/gi, function (str, key, name, val) {
            if (val.split(' ').length == 1) {
                switch (key) {
                    case 'padding':
                        !padding && (padding = {});
                        padding[name] = val;
                        return '';
                    case 'margin':
                        !margin && (margin = {});
                        margin[name] = val;
                        return '';
                    case 'border':
                        return val == 'initial' ? '' : str;
                }
            }
            return str;
        });
        function opt(obj, name) {
            if (!obj) {
                return '';
            }
            var t = obj.top;
            var b = obj.bottom;
            var l = obj.left;
            var r = obj.right;
            var val = '';
            if (!t || !l || !b || !r) {
                for (var p in obj) {
                    val += ';' + name + '-' + p + ':' + obj[p] + ';';
                }
            }
            else {
                val += ';' + name + ':' +
                    (t == b && b == l && l == r ? t
                        : t == b && l == r ? (t + ' ' + l)
                            : l == r ? (t + ' ' + l + ' ' + b) : (t + ' ' + r + ' ' + b + ' ' + l)) + ';';
            }
            return val;
        }
        val += opt(padding, 'padding') + opt(margin, 'margin');
        return val.replace(/^[ \n\r\t;]*|[ \n\r\t]*$/, '').replace(/;([ \n\r\t]+)|\1;/g, ';')
            .replace(/(&((l|g)t|quot|#39))?;{2,}/g, function (a, b) {
            return b ? b + ';;' : ';';
        });
    },
    clone: function (source, target) {
        var tmp;
        target = target || {};
        for (var i in source) {
            if (source.hasOwnProperty(i)) {
                tmp = source[i];
                if (typeof tmp === 'object') {
                    target[i] = utils.isArray(tmp) ? [] : {};
                    utils.clone(source[i], target[i]);
                }
                else {
                    target[i] = tmp;
                }
            }
        }
        return target;
    },
    transUnitToPx: function (val) {
        if (!/(pt|cm)/.test(val)) {
            return val;
        }
        var unit;
        val.replace(/([\d.]+)(\w+)/, function (str, v, u) {
            val = v;
            unit = u;
        });
        switch (unit) {
            case 'cm':
                val = parseFloat(val) * 25;
                break;
            case 'pt':
                val = Math.round(parseFloat(val) * 96 / 72);
        }
        return val + (val ? 'px' : '');
    },
    domReady: (function () {
        var fnArr = [];
        function doReady(doc) {
            doc.isReady = true;
            for (var ci; ci = fnArr.pop(); ci()) {
            }
        }
        return function (onready, win) {
            win = win || window;
            var doc = win.document;
            onready && fnArr.push(onready);
            if (doc.readyState === 'complete') {
                doReady(doc);
            }
            else {
                doc.isReady && doReady(doc);
                doc.addEventListener('DOMContentLoaded', function () {
                    doc.removeEventListener('DOMContentLoaded', arguments.callee, false);
                    doReady(doc);
                }, false);
                win.addEventListener('load', function () {
                    doReady(doc);
                }, false);
            }
        };
    }()),
    cssRule: function (key, style, doc) {
        var head, node;
        if (style === undefined || style && style.nodeType && style.nodeType == 9) {
            doc = style && style.nodeType && style.nodeType == 9 ? style : (doc || document);
            node = doc.getElementById(key);
            return node ? node.innerHTML : undefined;
        }
        doc = doc || document;
        node = doc.getElementById(key);
        if (style === '') {
            if (node) {
                node.parentNode.removeChild(node);
                return true;
            }
            return false;
        }
        if (node) {
            node.innerHTML = style;
        }
        else {
            node = doc.createElement('style');
            node.id = key;
            node.innerHTML = style;
            doc.getElementsByTagName('head')[0].appendChild(node);
        }
    },
    sort: function (array, compareFn) {
        compareFn = compareFn || function (item1, item2) {
            return item1.localeCompare(item2);
        };
        for (var i = 0, len = array.length; i < len; i++) {
            for (var j = i, length = array.length; j < length; j++) {
                if (compareFn(array[i], array[j]) > 0) {
                    var t = array[i];
                    array[i] = array[j];
                    array[j] = t;
                }
            }
        }
        return array;
    },
    serializeParam: function (json) {
        var strArr = [];
        for (var i in json) {
            if (i == 'method' || i == 'timeout' || i == 'async')
                continue;
            if (!((typeof json[i]).toLowerCase() == 'function' || (typeof json[i]).toLowerCase() == 'object')) {
                strArr.push(encodeURIComponent(i) + '=' + encodeURIComponent(json[i]));
            }
            else if (utils.isArray(json[i])) {
                for (var j = 0; j < json[i].length; j++) {
                    strArr.push(encodeURIComponent(i) + '[]=' + encodeURIComponent(json[i][j]));
                }
            }
        }
        return strArr.join('&');
    },
    formatUrl: function (url) {
        var u = url.replace(/&&/g, '&');
        u = u.replace(/\?&/g, '?');
        u = u.replace(/&$/g, '');
        u = u.replace(/&#/g, '#');
        u = u.replace(/&+/g, '&');
        return u;
    },
    isCrossDomainUrl: function (url) {
        var a = document.createElement('a');
        a.href = url;
        return !(a.protocol == location.protocol && a.hostname == location.hostname &&
            (a.port == location.port || (a.port == '80' && location.port == '') || (a.port == '' && location.port == '80')));
    },
    clearEmptyAttrs: function (obj) {
        for (var p in obj) {
            if (obj[p] === '') {
                delete obj[p];
            }
        }
        return obj;
    },
    str2json: function (s) {
        if (!utils.isString(s))
            return null;
        if (window.JSON) {
            return JSON.parse(s);
        }
        else {
            return (new Function('return ' + utils.trim(s || '')))();
        }
    },
    json2str: (function () {
        if (window.JSON) {
            return JSON.stringify;
        }
        else {
            var escapeMap = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };
            function encodeString(source) {
                if (/["\\\x00-\x1f]/.test(source)) {
                    source = source.replace(/["\\\x00-\x1f]/g, function (match) {
                        var c = escapeMap[match];
                        if (c) {
                            return c;
                        }
                        c = match.charCodeAt();
                        return '\\u00' +
                            Math.floor(c / 16).toString(16) +
                            (c % 16).toString(16);
                    });
                }
                return '"' + source + '"';
            }
            function encodeArray(source) {
                var result = ['['];
                var l = source.length;
                var preComma;
                var i;
                var item;
                for (i = 0; i < l; i++) {
                    item = source[i];
                    switch (typeof item) {
                        case 'undefined':
                        case 'function':
                        case 'unknown':
                            break;
                        default:
                            if (preComma) {
                                result.push(',');
                            }
                            result.push(utils.json2str(item));
                            preComma = 1;
                    }
                }
                result.push(']');
                return result.join('');
            }
            function pad(source) {
                return source < 10 ? '0' + source : source;
            }
            function encodeDate(source) {
                return '"' + source.getFullYear() + '-' +
                    pad(source.getMonth() + 1) + '-' +
                    pad(source.getDate()) + 'T' +
                    pad(source.getHours()) + ':' +
                    pad(source.getMinutes()) + ':' +
                    pad(source.getSeconds()) + '"';
            }
            return function (value) {
                switch (typeof value) {
                    case 'undefined':
                        return 'undefined';
                    case 'number':
                        return isFinite(value) ? String(value) : 'null';
                    case 'string':
                        return encodeString(value);
                    case 'boolean':
                        return String(value);
                    default:
                        if (value === null) {
                            return 'null';
                        }
                        else if (utils.isArray(value)) {
                            return encodeArray(value);
                        }
                        else if (utils.isDate(value)) {
                            return encodeDate(value);
                        }
                        else {
                            var result = ['{'];
                            var encode = utils.json2str;
                            var preComma;
                            var item;
                            for (var key in value) {
                                if (Object.prototype.hasOwnProperty.call(value, key)) {
                                    item = value[key];
                                    switch (typeof item) {
                                        case 'undefined':
                                        case 'unknown':
                                        case 'function':
                                            break;
                                        default:
                                            if (preComma) {
                                                result.push(',');
                                            }
                                            preComma = 1;
                                            result.push(encode(key) + ':' + encode(item));
                                    }
                                }
                            }
                            result.push('}');
                            return result.join('');
                        }
                }
            };
        }
    })()
};
utils.each(['String', 'Function', 'Array', 'Number', 'RegExp', 'Object', 'Date'], function (v) {
    UE.utils['is' + v] = function (obj) {
        return Object.prototype.toString.apply(obj) == '[object ' + v + ']';
    };
});
