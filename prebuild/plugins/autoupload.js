UE.plugin.register('autoupload', function () {
    function sendAndInsertFile(file, editor) {
        var me = editor;
        var fieldName;
        var urlPrefix;
        var maxSize;
        var allowFiles;
        var actionUrl;
        var loadingHtml;
        var errorHandler;
        var successHandler;
        var filetype = /image\/\w+/i.test(file.type) ? 'image' : 'file';
        var loadingId = 'loading_' + (+new Date()).toString(36);
        fieldName = me.getOpt(filetype + 'FieldName');
        urlPrefix = me.getOpt(filetype + 'UrlPrefix');
        maxSize = me.getOpt(filetype + 'MaxSize');
        allowFiles = me.getOpt(filetype + 'AllowFiles');
        actionUrl = me.getActionUrl(me.getOpt(filetype + 'ActionName'));
        errorHandler = function (title) {
            var loader = me.document.getElementById(loadingId);
            loader && domUtils.remove(loader);
            me.fireEvent('showmessage', {
                id: loadingId,
                content: title,
                type: 'error',
                timeout: 4000
            });
        };
        if (filetype == 'image') {
            loadingHtml = '<img class="loadingclass" id="' + loadingId + '" src="' +
                me.options.themePath + me.options.theme +
                '/images/spacer.gif" title="' + (me.getLang('autoupload.loading') || '') + '" >';
            successHandler = function (data) {
                var link = urlPrefix + data.url;
                var loader = me.document.getElementById(loadingId);
                if (loader) {
                    loader.setAttribute('src', link);
                    loader.setAttribute('_src', link);
                    loader.setAttribute('title', data.title || '');
                    loader.setAttribute('alt', data.original || '');
                    loader.removeAttribute('id');
                    domUtils.removeClasses(loader, 'loadingclass');
                }
            };
        }
        else {
            loadingHtml = '<p>' +
                '<img class="loadingclass" id="' + loadingId + '" src="' +
                me.options.themePath + me.options.theme +
                '/images/spacer.gif" title="' + (me.getLang('autoupload.loading') || '') + '" >' +
                '</p>';
            successHandler = function (data) {
                var link = urlPrefix + data.url;
                var loader = me.document.getElementById(loadingId);
                var rng = me.selection.getRange();
                var bk = rng.createBookmark();
                rng.selectNode(loader).select();
                me.execCommand('insertfile', { url: link });
                rng.moveToBookmark(bk).select();
            };
        }
        me.execCommand('inserthtml', loadingHtml);
        if (!me.getOpt(filetype + 'ActionName')) {
            errorHandler(me.getLang('autoupload.errorLoadConfig'));
            return;
        }
        if (file.size > maxSize) {
            errorHandler(me.getLang('autoupload.exceedSizeError'));
            return;
        }
        var fileext = file.name ? file.name.substr(file.name.lastIndexOf('.')) : '';
        if ((fileext && filetype != 'image') || (allowFiles && (allowFiles.join('') + '.').indexOf(fileext.toLowerCase() + '.') == -1)) {
            errorHandler(me.getLang('autoupload.exceedTypeError'));
            return;
        }
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        var params = utils.serializeParam(me.queryCommandValue('serverparam')) || '';
        var url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?' : '&') + params);
        fd.append(fieldName, file, file.name || ('blob.' + file.type.substr('image/'.length)));
        fd.append('type', 'ajax');
        xhr.open('post', url, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.addEventListener('load', function (e) {
            try {
                var json = (new Function('return ' + utils.trim(e.target.response)))();
                if (json.state == 'SUCCESS' && json.url) {
                    successHandler(json);
                }
                else {
                    errorHandler(json.state);
                }
            }
            catch (er) {
                errorHandler(me.getLang('autoupload.loadError'));
            }
        });
        xhr.send(fd);
    }
    function getPasteImage(e) {
        return e.clipboardData && e.clipboardData.items && e.clipboardData.items.length == 1 && /^image\//.test(e.clipboardData.items[0].type) ? e.clipboardData.items : null;
    }
    function getDropImage(e) {
        return e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : null;
    }
    return {
        outputRule: function (root) {
            utils.each(root.getNodesByTagName('img'), function (n) {
                if (/\b(loaderrorclass)|(bloaderrorclass)\b/.test(n.getAttr('class'))) {
                    n.parentNode.removeChild(n);
                }
            });
            utils.each(root.getNodesByTagName('p'), function (n) {
                if (/\bloadpara\b/.test(n.getAttr('class'))) {
                    n.parentNode.removeChild(n);
                }
            });
        },
        bindEvents: {
            ready: function (e) {
                var me = this;
                if (window.FormData && window.FileReader) {
                    domUtils.on(me.body, 'paste drop', function (e) {
                        var hasImg = false;
                        var items;
                        items = e.type == 'paste' ? getPasteImage(e) : getDropImage(e);
                        if (items) {
                            var len = items.length;
                            var file;
                            while (len--) {
                                file = items[len];
                                if (file.getAsFile)
                                    file = file.getAsFile();
                                if (file && file.size > 0) {
                                    sendAndInsertFile(file, me);
                                    hasImg = true;
                                }
                            }
                            hasImg && e.preventDefault();
                        }
                    });
                    domUtils.on(me.body, 'dragover', function (e) {
                        if (e.dataTransfer.types[0] == 'Files') {
                            e.preventDefault();
                        }
                    });
                    utils.cssRule('loading', '.loadingclass{display:inline-block;cursor:default;background: url(\'' +
                        this.options.themePath +
                        this.options.theme + '/images/loading.gif\') no-repeat center center transparent;border:1px solid #cccccc;margin-left:1px;height: 22px;width: 22px;}\n' +
                        '.loaderrorclass{display:inline-block;cursor:default;background: url(\'' +
                        this.options.themePath +
                        this.options.theme + '/images/loaderror.png\') no-repeat center center transparent;border:1px solid #cccccc;margin-right:1px;height: 22px;width: 22px;' +
                        '}', this.document);
                }
            }
        }
    };
});
