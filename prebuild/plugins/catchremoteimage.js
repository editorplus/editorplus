UE.plugins.catchremoteimage = function () {
    var me = this;
    var ajax = UE.ajax;
    if (me.options.catchRemoteImageEnable === false)
        return;
    me.setOpt({
        catchRemoteImageEnable: false
    });
    me.addListener('afterpaste', function () {
        me.fireEvent('catchRemoteImage');
    });
    me.addListener('catchRemoteImage', function () {
        var catcherLocalDomain = me.getOpt('catcherLocalDomain');
        var catcherActionUrl = me.getActionUrl(me.getOpt('catcherActionName'));
        var catcherUrlPrefix = me.getOpt('catcherUrlPrefix');
        var catcherFieldName = me.getOpt('catcherFieldName');
        var remoteImages = [];
        var imgs = domUtils.getElementsByTagName(me.document, 'img');
        var test = function (src, urls) {
            if (src.indexOf(location.host) != -1 || /(^\.)|(^\/)/.test(src)) {
                return true;
            }
            if (urls) {
                for (var j = 0, url; url = urls[j++];) {
                    if (src.indexOf(url) !== -1) {
                        return true;
                    }
                }
            }
            return false;
        };
        for (var i = 0, ci; ci = imgs[i++];) {
            if (ci.getAttribute('word_img')) {
                continue;
            }
            var src = ci.getAttribute('_src') || ci.src || '';
            if (/^(https?|ftp):/i.test(src) && !test(src, catcherLocalDomain)) {
                remoteImages.push(src);
            }
        }
        if (remoteImages.length) {
            catchremoteimage(remoteImages, {
                success: function (r) {
                    try {
                        var info = r.state !== undefined ? r : eval('(' + r.responseText + ')');
                    }
                    catch (e) {
                        return;
                    }
                    var i;
                    var j;
                    var ci;
                    var cj;
                    var oldSrc;
                    var newSrc;
                    var list = info.list;
                    for (i = 0; ci = imgs[i++];) {
                        oldSrc = ci.getAttribute('_src') || ci.src || '';
                        for (j = 0; cj = list[j++];) {
                            if (oldSrc == cj.source && cj.state == 'SUCCESS') {
                                newSrc = catcherUrlPrefix + cj.url;
                                domUtils.setAttributes(ci, {
                                    src: newSrc,
                                    _src: newSrc
                                });
                                break;
                            }
                        }
                    }
                    me.fireEvent('catchremotesuccess');
                    if (_ && _.isFunction(me.options.afterCatchImage)) {
                        me.options.afterCatchImage();
                    }
                },
                error: function () {
                    me.fireEvent('catchremoteerror');
                    if (_ && _.isFunction(me.options.afterCatchImage)) {
                        me.options.afterCatchImage();
                    }
                }
            });
        }
        function catchremoteimage(imgs, callbacks) {
            var params = utils.serializeParam(me.queryCommandValue('serverparam')) || '';
            var url = utils.formatUrl(catcherActionUrl + (catcherActionUrl.indexOf('?') == -1 ? '?' : '&') + params);
            var isJsonp = utils.isCrossDomainUrl(url);
            var opt = {
                method: 'POST',
                dataType: isJsonp ? 'jsonp' : '',
                timeout: 60000,
                onsuccess: callbacks.success,
                onerror: callbacks.error
            };
            opt[catcherFieldName] = imgs;
            if (_ && _.isFunction(me.options.beforeCatchImage)) {
                me.options.beforeCatchImage();
            }
            ajax.request(url, opt);
        }
    });
};
