UE.ajax = (function () {
    var fnStr = 'XMLHttpRequest()';
    try {
        new ActiveXObject('Msxml2.XMLHTTP');
        fnStr = 'ActiveXObject(\'Msxml2.XMLHTTP\')';
    }
    catch (e) {
        try {
            new ActiveXObject('Microsoft.XMLHTTP');
            fnStr = 'ActiveXObject(\'Microsoft.XMLHTTP\')';
        }
        catch (e) {
        }
    }
    var creatAjaxRequest = new Function('return new ' + fnStr);
    function json2str(json) {
        var strArr = [];
        for (var i in json) {
            if (i == 'method' || i == 'timeout' || i == 'async' || i == 'dataType' || i == 'callback')
                continue;
            if (json[i] == undefined || json[i] == null)
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
    }
    function doAjax(url, ajaxOptions) {
        var xhr = creatAjaxRequest();
        var timeIsOut = false;
        var defaultAjaxOptions = {
            method: 'POST',
            timeout: 5000,
            async: true,
            data: {},
            onsuccess: function () {
            },
            onerror: function () {
            }
        };
        if (typeof url === 'object') {
            ajaxOptions = url;
            url = ajaxOptions.url;
        }
        if (!xhr || !url)
            return;
        var ajaxOpts = ajaxOptions ? utils.extend(defaultAjaxOptions, ajaxOptions) : defaultAjaxOptions;
        var submitStr = json2str(ajaxOpts);
        if (!utils.isEmptyObject(ajaxOpts.data)) {
            submitStr += (submitStr ? '&' : '') + json2str(ajaxOpts.data);
        }
        var timerID = setTimeout(function () {
            if (xhr.readyState != 4) {
                timeIsOut = true;
                xhr.abort();
                clearTimeout(timerID);
            }
        }, ajaxOpts.timeout);
        var method = ajaxOpts.method.toUpperCase();
        var str = url + (url.indexOf('?') == -1 ? '?' : '&') + (method == 'POST' ? '' : submitStr + '&noCache=' + +new Date());
        xhr.open(method, str, ajaxOpts.async);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (!timeIsOut && xhr.status == 200) {
                    ajaxOpts.onsuccess(xhr);
                }
                else {
                    ajaxOpts.onerror(xhr);
                }
            }
        };
        if (method == 'POST') {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(submitStr);
        }
        else {
            xhr.send(null);
        }
    }
    function doJsonp(url, opts) {
        var successhandler = opts.onsuccess || function () {
        };
        var scr = document.createElement('SCRIPT');
        var options = opts || {};
        var charset = options.charset;
        var callbackField = options.jsonp || 'callback';
        var callbackFnName;
        var timeOut = options.timeOut || 0;
        var timer;
        var reg = new RegExp('(\\?|&)' + callbackField + '=([^&]*)');
        var matches;
        if (utils.isFunction(successhandler)) {
            callbackFnName = 'bd__editor__' + Math.floor(Math.random() * 2147483648).toString(36);
            window[callbackFnName] = getCallBack(0);
        }
        else if (utils.isString(successhandler)) {
            callbackFnName = successhandler;
        }
        else {
            if (matches = reg.exec(url)) {
                callbackFnName = matches[2];
            }
        }
        url = url.replace(reg, '\x241' + callbackField + '=' + callbackFnName);
        if (url.search(reg) < 0) {
            url += (url.indexOf('?') < 0 ? '?' : '&') + callbackField + '=' + callbackFnName;
        }
        var queryStr = json2str(opts);
        if (!utils.isEmptyObject(opts.data)) {
            queryStr += (queryStr ? '&' : '') + json2str(opts.data);
        }
        if (queryStr) {
            url = url.replace(/\?/, '?' + queryStr + '&');
        }
        scr.onerror = getCallBack(1);
        if (timeOut) {
            timer = setTimeout(getCallBack(1), timeOut);
        }
        createScriptTag(scr, url, charset);
        function createScriptTag(scr, url, charset) {
            scr.setAttribute('type', 'text/javascript');
            scr.setAttribute('defer', 'defer');
            charset && scr.setAttribute('charset', charset);
            scr.setAttribute('src', url);
            document.getElementsByTagName('head')[0].appendChild(scr);
        }
        function getCallBack(onTimeOut) {
            return function () {
                try {
                    if (onTimeOut) {
                        options.onerror && options.onerror();
                    }
                    else {
                        try {
                            clearTimeout(timer);
                            successhandler.apply(window, arguments);
                        }
                        catch (e) {
                        }
                    }
                }
                catch (exception) {
                    options.onerror && options.onerror.call(window, exception);
                }
                finally {
                    options.oncomplete && options.oncomplete.apply(window, arguments);
                    scr.parentNode && scr.parentNode.removeChild(scr);
                    window[callbackFnName] = null;
                    try {
                        delete window[callbackFnName];
                    }
                    catch (e) {
                    }
                }
            };
        }
    }
    return {
        request: function (url, opts) {
            if (opts && opts.dataType == 'jsonp') {
                doJsonp(url, opts);
            }
            else {
                doAjax(url, opts);
            }
        },
        getJSONP: function (url, data, fn) {
            var opts = {
                data: data,
                oncomplete: fn
            };
            doJsonp(url, opts);
        }
    };
}());
