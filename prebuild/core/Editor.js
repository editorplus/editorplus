(function () {
    var uid = 0;
    var _selectionChangeTimer;
    function setValue(form, editor) {
        var textarea;
        if (editor.textarea) {
            if (utils.isString(editor.textarea)) {
                for (var i = 0, ti, tis = domUtils.getElementsByTagName(form, 'textarea'); ti = tis[i++];) {
                    if (ti.id == 'ueditor_textarea_' + editor.options.textarea) {
                        textarea = ti;
                        break;
                    }
                }
            }
            else {
                textarea = editor.textarea;
            }
        }
        if (!textarea) {
            form.appendChild(textarea = domUtils.createElement(document, 'textarea', {
                name: editor.options.textarea,
                id: 'ueditor_textarea_' + editor.options.textarea,
                style: 'display:none'
            }));
            editor.textarea = textarea;
        }
        !textarea.getAttribute('name') && textarea.setAttribute('name', editor.options.textarea);
        textarea.value = editor.hasContents()
            ? (editor.options.allHtmlEnabled ? editor.getAllHtml() : editor.getContent(null, null, true))
            : '';
    }
    function loadPlugins(me) {
        for (var pi in UE.plugins) {
            UE.plugins[pi].call(me);
        }
    }
    function checkCurLang(I18N) {
        for (var lang in I18N) {
            return lang;
        }
    }
    function langReadied(me) {
        me.langIsReady = true;
        me.fireEvent('langReady');
    }
    var Editor = UE.Editor = function (options) {
        var me = this;
        me.uid = uid++;
        EventBase.call(me);
        me.commands = {};
        me.options = utils.extend(utils.clone(options || {}), UEDITOR_CONFIG, true);
        me.shortcutkeys = {};
        me.inputRules = [];
        me.outputRules = [];
        me.setOpt(Editor.defaultOptions(me));
        me.loadServerConfig();
        if (!utils.isEmptyObject(UE.I18N)) {
            me.options.lang = checkCurLang(UE.I18N);
            UE.plugin.load(me);
            langReadied(me);
        }
        else {
            utils.loadFile(document, {
                src: me.options.langPath + me.options.lang + '/' + me.options.lang + '.js',
                tag: 'script',
                type: 'text/javascript',
                defer: 'defer'
            }, function () {
                UE.plugin.load(me);
                langReadied(me);
            });
        }
        UE.instants['ueditorInstant' + me.uid] = me;
    };
    Editor.prototype = {
        registerCommand: function (name, obj) {
            this.commands[name] = obj;
        },
        ready: function (fn) {
            var me = this;
            if (fn) {
                me.isReady ? fn.apply(me) : me.addListener('ready', fn);
            }
        },
        setOpt: function (key, val) {
            var obj = {};
            if (utils.isString(key)) {
                obj[key] = val;
            }
            else {
                obj = key;
            }
            utils.extend(this.options, obj, true);
        },
        getOpt: function (key) {
            return this.options[key];
        },
        destroy: function () {
            var me = this;
            me.fireEvent('destroy');
            var container = me.container.parentNode;
            var textarea = me.textarea;
            if (!textarea) {
                textarea = document.createElement('textarea');
                container.parentNode.insertBefore(textarea, container);
            }
            else {
                textarea.style.display = '';
            }
            if (_.isObject(me.iframe) && me.iframe.offsetWidth && me.iframe.offsetHeight) {
                textarea.style.width = me.iframe.offsetWidth + 'px';
                textarea.style.height = me.iframe.offsetHeight + 'px';
            }
            textarea.value = '';
            textarea.id = me.key;
            container.innerHTML = '';
            domUtils.remove(container);
            var key = me.key;
            for (var p in me) {
                if (me.hasOwnProperty(p)) {
                    delete this[p];
                }
            }
            UE.delEditor(key);
        },
        render: function (container) {
            var me = this;
            var options = me.options;
            var getStyleValue = function (attr) {
                return parseInt(domUtils.getComputedStyle(container, attr));
            };
            if (utils.isString(container)) {
                container = document.getElementById(container);
            }
            if (container) {
                if (options.initialFrameWidth) {
                    options.minFrameWidth = options.initialFrameWidth;
                }
                else {
                    options.minFrameWidth = options.initialFrameWidth = container.offsetWidth;
                }
                if (options.initialFrameHeight) {
                    options.minFrameHeight = options.initialFrameHeight;
                }
                else {
                    options.initialFrameHeight = options.minFrameHeight = container.offsetHeight;
                }
                container.style.width = /%$/.test(options.initialFrameWidth) ? '100%' : options.initialFrameWidth -
                    getStyleValue('padding-left') - getStyleValue('padding-right') + 'px';
                container.style.height = /%$/.test(options.initialFrameHeight) ? '100%' : options.initialFrameHeight -
                    getStyleValue('padding-top') - getStyleValue('padding-bottom') + 'px';
                container.style.zIndex = options.zIndex;
                var html = '<!DOCTYPE html>' +
                    '<html xmlns=\'http://www.w3.org/1999/xhtml\' class=\'view\' ><head>' +
                    '<style type=\'text/css\'>' +
                    '.view{padding:0;word-wrap:break-word;cursor:text;height:90%;}\n' +
                    'body{margin:8px;font-family:sans-serif;font-size:16px;}' +
                    'p{margin:5px 0;}</style>' +
                    (options.iframeCssUrl ? '<link rel=\'stylesheet\' type=\'text/css\' href=\'' + utils.unhtml(options.iframeCssUrl) + '\'/>' : '') +
                    (options.initialStyle ? '<style>' + options.initialStyle + '</style>' : '') +
                    '</head><body class=\'view\' ></body>' +
                    '<script type=\'text/javascript\'  id=\'_initialScript\'>' +
                    'setTimeout(function(){editor = window.parent.UE.instants[\'ueditorInstant' + me.uid + '\'];editor._setup(document);},0);' +
                    'var _tmpScript = document.getElementById(\'_initialScript\');_tmpScript.parentNode.removeChild(_tmpScript);</script></html>';
                container.appendChild(domUtils.createElement(document, 'iframe', {
                    id: 'ueditor_' + me.uid,
                    width: '100%',
                    height: '100%',
                    frameborder: '0',
                    src: 'javascript:void(function(){document.open();' + (options.customDomain && document.domain != location.hostname ? 'document.domain="' + document.domain + '";' : '') +
                        'document.write("' + html + '");document.close();}())'
                }));
                container.style.overflow = 'hidden';
                setTimeout(function () {
                    if (/%$/.test(options.initialFrameWidth)) {
                        options.minFrameWidth = options.initialFrameWidth = container.offsetWidth;
                    }
                    if (/%$/.test(options.initialFrameHeight)) {
                        options.minFrameHeight = options.initialFrameHeight = container.offsetHeight;
                        container.style.height = options.initialFrameHeight + 'px';
                    }
                });
            }
        },
        _setup: function (doc) {
            var me = this;
            var options = me.options;
            doc.body.contentEditable = true;
            doc.body.spellcheck = false;
            me.document = doc;
            me.window = doc.defaultView || doc.parentWindow;
            me.iframe = me.window.frameElement;
            me.body = doc.body;
            me.selection = new dom.Selection(doc);
            var geckoSel;
            if (browser.gecko && (geckoSel = this.selection.getNative())) {
                geckoSel.removeAllRanges();
            }
            this._initEvents();
            for (var form = this.iframe.parentNode; !domUtils.isBody(form); form = form.parentNode) {
                if (form.tagName == 'FORM') {
                    me.form = form;
                    if (me.options.autoSyncData) {
                        domUtils.on(me.window, 'blur', function () {
                            setValue(form, me);
                        });
                    }
                    else {
                        domUtils.on(form, 'submit', function () {
                            setValue(this, me);
                        });
                    }
                    break;
                }
            }
            if (options.initialContent) {
                if (options.autoClearinitialContent) {
                    var oldExecCommand = me.execCommand;
                    me.execCommand = function () {
                        me.fireEvent('firstBeforeExecCommand');
                        return oldExecCommand.apply(me, arguments);
                    };
                    this._setDefaultContent(options.initialContent);
                }
                else {
                    this.setContent(options.initialContent, false, true);
                }
            }
            if (domUtils.isEmptyNode(me.body)) {
                me.body.innerHTML = '<p><br/></p>';
            }
            if (options.focus) {
                setTimeout(function () {
                    me.focus(me.options.focusInEnd);
                    !me.options.autoClearinitialContent && me._selectionChange();
                }, 0);
            }
            if (!me.container) {
                me.container = this.iframe.parentNode;
            }
            if (options.fullscreen && me.ui) {
                me.ui.setFullScreen(true);
            }
            try {
                me.document.execCommand('2D-position', false, false);
            }
            catch (e) {
            }
            try {
                me.document.execCommand('enableInlineTableEditing', false, false);
            }
            catch (e) {
            }
            try {
                me.document.execCommand('enableObjectResizing', false, false);
            }
            catch (e) {
            }
            me._bindshortcutKeys();
            me.isReady = 1;
            me.fireEvent('ready');
            options.onready && options.onready.call(me);
            domUtils.on(me.window, ['blur', 'focus'], function (e) {
                if (e.type == 'blur') {
                    me._bakRange = me.selection.getRange();
                    try {
                        me._bakNativeRange = me.selection.getNative().getRangeAt(0);
                        me.selection.getNative().removeAllRanges();
                    }
                    catch (e) {
                        me._bakNativeRange = null;
                    }
                }
                else {
                    try {
                        me._bakRange && me._bakRange.select();
                    }
                    catch (e) {
                    }
                }
            });
            if (browser.gecko && browser.version <= 10902) {
                me.body.contentEditable = false;
                setTimeout(function () {
                    me.body.contentEditable = true;
                }, 100);
                setInterval(function () {
                    me.body.style.height = me.iframe.offsetHeight - 20 + 'px';
                }, 100);
            }
            !options.isShow && me.setHide();
            options.readonly && me.setDisabled();
        },
        sync: function (formId) {
            var me = this;
            var form = formId ? document.getElementById(formId)
                : domUtils.findParent(me.iframe.parentNode, function (node) {
                    return node.tagName == 'FORM';
                }, true);
            form && setValue(form, me);
        },
        setHeight: function (height, notSetHeight) {
            if (height !== parseInt(this.iframe.parentNode.style.height)) {
                this.iframe.parentNode.style.height = height + 'px';
            }
            !notSetHeight && (this.options.minFrameHeight = this.options.initialFrameHeight = height);
            this.body.style.height = height + 'px';
            !notSetHeight && this.trigger('setHeight');
        },
        addshortcutkey: function (cmd, keys) {
            var obj = {};
            if (keys) {
                obj[cmd] = keys;
            }
            else {
                obj = cmd;
            }
            utils.extend(this.shortcutkeys, obj);
        },
        _bindshortcutKeys: function () {
            var me = this;
            var shortcutkeys = this.shortcutkeys;
            me.addListener('keydown', function (type, e) {
                var keyCode = e.keyCode || e.which;
                for (var i in shortcutkeys) {
                    var tmp = shortcutkeys[i].split(',');
                    for (var t = 0, ti; ti = tmp[t++];) {
                        ti = ti.split(':');
                        var key = ti[0];
                        var param = ti[1];
                        if (/^(ctrl)(\+shift)?\+(\d+)$/.test(key.toLowerCase()) || /^(\d+)$/.test(key)) {
                            if (((RegExp.$1 == 'ctrl' ? (e.ctrlKey || e.metaKey) : 0) &&
                                (RegExp.$2 != '' ? e[RegExp.$2.slice(1) + 'Key'] : 1) &&
                                keyCode == RegExp.$3) ||
                                keyCode == RegExp.$1) {
                                if (me.queryCommandState(i, param) != -1) {
                                    me.execCommand(i, param);
                                }
                                domUtils.preventDefault(e);
                            }
                        }
                    }
                }
            });
        },
        getContent: function (cmd, fn, notSetCursor, ignoreBlank, formatter) {
            var me = this;
            if (cmd && utils.isFunction(cmd)) {
                fn = cmd;
                cmd = '';
            }
            if (fn ? !fn() : !this.hasContents()) {
                return '';
            }
            me.fireEvent('beforegetcontent');
            var root = UE.htmlparser(me.body.innerHTML, ignoreBlank);
            me.filterOutputRule(root);
            me.fireEvent('aftergetcontent', cmd, root);
            return root.toHtml(formatter);
        },
        getAllHtml: function () {
            var me = this;
            var headHtml = [];
            me.fireEvent('getAllHtml', headHtml);
            return '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>' +
                (me.document.getElementsByTagName('head')[0].innerHTML) + headHtml.join('\n') + '</head>' +
                '<body>' + me.getContent(null, null, true) + '</body></html>';
        },
        getPlainTxt: function () {
            var reg = new RegExp(domUtils.fillChar, 'g');
            var html = this.body.innerHTML.replace(/[\n\r]/g, '');
            html = html.replace(/<(p|div)[^>]*>(<br\/?>|&nbsp;)<\/\1>/gi, '\n')
                .replace(/<br\/?>/gi, '\n')
                .replace(/<[^>/]+>/g, '')
                .replace(/(\n)?<\/([^>]+)>/g, function (a, b, c) {
                return dtd.$block[c] ? '\n' : b || '';
            });
            return html.replace(reg, '').replace(/\u00a0/g, ' ').replace(/&nbsp;/g, ' ');
        },
        getContentTxt: function () {
            var reg = new RegExp(domUtils.fillChar, 'g');
            return this.body.textContent.replace(reg, '').replace(/\u00a0/g, ' ');
        },
        setContent: function (html, isAppendTo, notFireSelectionchange) {
            var me = this;
            me.fireEvent('beforesetcontent', html);
            var root = UE.htmlparser(html);
            me.filterInputRule(root);
            html = root.toHtml();
            me.body.innerHTML = (isAppendTo ? me.body.innerHTML : '') + html;
            function isCdataDiv(node) {
                return node.tagName == 'DIV' && node.getAttribute('cdata_tag');
            }
            if (me.options.enterTag == 'p') {
                var child = this.body.firstChild;
                var tmpNode;
                if (!child || child.nodeType == 1 &&
                    (dtd.$cdata[child.tagName] || isCdataDiv(child) ||
                        domUtils.isCustomeNode(child)) &&
                    child === this.body.lastChild) {
                    this.body.innerHTML = '<p><br/></p>' + this.body.innerHTML;
                }
                else {
                    var p = me.document.createElement('p');
                    while (child) {
                        while (child && (child.nodeType == 3 || child.nodeType == 1 && dtd.p[child.tagName] && !dtd.$cdata[child.tagName])) {
                            tmpNode = child.nextSibling;
                            p.appendChild(child);
                            child = tmpNode;
                        }
                        if (p.firstChild) {
                            if (!child) {
                                me.body.appendChild(p);
                                break;
                            }
                            else {
                                child.parentNode.insertBefore(p, child);
                                p = me.document.createElement('p');
                            }
                        }
                        child = child.nextSibling;
                    }
                }
            }
            me.fireEvent('aftersetcontent');
            me.fireEvent('contentchange');
            !notFireSelectionchange && me._selectionChange();
            me._bakRange = me._bakIERange = me._bakNativeRange = null;
            var geckoSel;
            if (browser.gecko && (geckoSel = this.selection.getNative())) {
                geckoSel.removeAllRanges();
            }
            if (me.options.autoSyncData) {
                me.form && setValue(me.form, me);
            }
        },
        focus: function (toEnd) {
            try {
                var me = this;
                var rng = me.selection.getRange();
                if (toEnd) {
                    var node = me.body.lastChild;
                    if (node && node.nodeType == 1 && !dtd.$empty[node.tagName]) {
                        if (domUtils.isEmptyBlock(node)) {
                            rng.setStartAtFirst(node);
                        }
                        else {
                            rng.setStartAtLast(node);
                        }
                        rng.collapse(true);
                    }
                    rng.setCursor(true);
                }
                else {
                    if (!rng.collapsed && domUtils.isBody(rng.startContainer) && rng.startOffset == 0) {
                        var node = me.body.firstChild;
                        if (node && node.nodeType == 1 && !dtd.$empty[node.tagName]) {
                            rng.setStartAtFirst(node).collapse(true);
                        }
                    }
                    rng.select(true);
                }
                this.fireEvent('focus selectionchange');
            }
            catch (e) {
            }
        },
        isFocus: function () {
            return this.selection.isFocus();
        },
        blur: function () {
            var sel = this.selection.getNative();
            sel.removeAllRanges();
        },
        _initEvents: function () {
            var me = this;
            var doc = me.document;
            var win = me.window;
            me._proxyDomEvent = utils.bind(me._proxyDomEvent, me);
            domUtils.on(doc, ['click', 'contextmenu', 'mousedown', 'keydown', 'keyup', 'keypress', 'mouseup', 'mouseover', 'mouseout', 'selectstart'], me._proxyDomEvent);
            domUtils.on(win, ['focus', 'blur'], me._proxyDomEvent);
            domUtils.on(me.body, 'drop', function (e) {
                if (browser.gecko && e.stopPropagation) {
                    e.stopPropagation();
                }
                me.fireEvent('contentchange');
            });
            domUtils.on(doc, ['mouseup', 'keydown'], function (evt) {
                if (evt.type == 'keydown' && (evt.ctrlKey || evt.metaKey || evt.shiftKey || evt.altKey)) {
                    return;
                }
                if (evt.button == 2)
                    return;
                me._selectionChange(250, evt);
            });
        },
        _proxyDomEvent: function (evt) {
            if (this.fireEvent('before' + evt.type.replace(/^on/, '').toLowerCase()) === false) {
                return false;
            }
            if (this.fireEvent(evt.type.replace(/^on/, ''), evt) === false) {
                return false;
            }
            return this.fireEvent('after' + evt.type.replace(/^on/, '').toLowerCase());
        },
        _selectionChange: function (delay, evt) {
            var me = this;
            var hackForMouseUp = false;
            var mouseX, mouseY;
            clearTimeout(_selectionChangeTimer);
            _selectionChangeTimer = setTimeout(function () {
                if (!me.selection || !me.selection.getNative()) {
                    return;
                }
                var ieRange;
                if (hackForMouseUp && me.selection.getNative().type == 'None') {
                    ieRange = me.document.body.createTextRange();
                    try {
                        ieRange.moveToPoint(mouseX, mouseY);
                    }
                    catch (ex) {
                        ieRange = null;
                    }
                }
                var bakGetIERange;
                if (ieRange) {
                    bakGetIERange = me.selection.getIERange;
                    me.selection.getIERange = function () {
                        return ieRange;
                    };
                }
                me.selection.cache();
                if (bakGetIERange) {
                    me.selection.getIERange = bakGetIERange;
                }
                if (me.selection._cachedRange && me.selection._cachedStartElement) {
                    me.fireEvent('beforeselectionchange');
                    me.fireEvent('selectionchange', !!evt);
                    me.fireEvent('afterselectionchange');
                    me.selection.clear();
                }
            }, delay || 50);
        },
        _callCmdFn: function (fnName, args) {
            var cmdName = args[0].toLowerCase();
            var cmd;
            var cmdFn;
            cmd = this.commands[cmdName] || UE.commands[cmdName];
            cmdFn = cmd && cmd[fnName];
            if ((!cmd || !cmdFn) && fnName == 'queryCommandState') {
                return 0;
            }
            else if (cmdFn) {
                return cmdFn.apply(this, args);
            }
        },
        execCommand: function (cmdName) {
            cmdName = cmdName.toLowerCase();
            var me = this;
            var result;
            var cmd = me.commands[cmdName] || UE.commands[cmdName];
            if (!cmd || !cmd.execCommand) {
                return null;
            }
            if (!cmd.notNeedUndo && !me.__hasEnterExecCommand) {
                me.__hasEnterExecCommand = true;
                if (me.queryCommandState.apply(me, arguments) != -1) {
                    me.fireEvent('saveScene');
                    me.fireEvent.apply(me, ['beforeexeccommand', cmdName].concat(arguments));
                    result = this._callCmdFn('execCommand', arguments);
                    me.fireEvent.apply(me, ['afterexeccommand', cmdName].concat(arguments));
                    me.fireEvent('saveScene');
                }
                me.__hasEnterExecCommand = false;
            }
            else {
                result = this._callCmdFn('execCommand', arguments);
                (!me.__hasEnterExecCommand && !cmd.ignoreContentChange && !me._ignoreContentChange) && me.fireEvent('contentchange');
            }
            (!me.__hasEnterExecCommand && !cmd.ignoreContentChange && !me._ignoreContentChange) && me._selectionChange();
            return result;
        },
        queryCommandState: function (cmdName) {
            return this._callCmdFn('queryCommandState', arguments);
        },
        queryCommandValue: function (cmdName) {
            return this._callCmdFn('queryCommandValue', arguments);
        },
        hasContents: function (tags) {
            if (tags) {
                for (var i = 0, ci; ci = tags[i++];) {
                    if (this.document.getElementsByTagName(ci).length > 0) {
                        return true;
                    }
                }
            }
            if (!domUtils.isEmptyBlock(this.body)) {
                return true;
            }
            tags = ['div'];
            for (i = 0; ci = tags[i++];) {
                var nodes = domUtils.getElementsByTagName(this.document, ci);
                for (var n = 0, cn; cn = nodes[n++];) {
                    if (domUtils.isCustomeNode(cn)) {
                        return true;
                    }
                }
            }
            return false;
        },
        reset: function () {
            this.fireEvent('reset');
        },
        setEnabled: function () {
            var me = this;
            var range;
            if (me.body.contentEditable == 'false') {
                me.body.contentEditable = true;
                range = me.selection.getRange();
                try {
                    range.moveToBookmark(me.lastBk);
                    delete me.lastBk;
                }
                catch (e) {
                    range.setStartAtFirst(me.body).collapse(true);
                }
                range.select(true);
                if (me.bkqueryCommandState) {
                    me.queryCommandState = me.bkqueryCommandState;
                    delete me.bkqueryCommandState;
                }
                if (me.bkqueryCommandValue) {
                    me.queryCommandValue = me.bkqueryCommandValue;
                    delete me.bkqueryCommandValue;
                }
                me.fireEvent('selectionchange');
            }
        },
        enable: function () {
            return this.setEnabled();
        },
        setDisabled: function (except) {
            var me = this;
            except = except ? utils.isArray(except) ? except : [except] : [];
            if (me.body.contentEditable == 'true') {
                if (!me.lastBk) {
                    me.lastBk = me.selection.getRange().createBookmark(true);
                }
                me.body.contentEditable = false;
                me.bkqueryCommandState = me.queryCommandState;
                me.bkqueryCommandValue = me.queryCommandValue;
                me.queryCommandState = function (type) {
                    if (utils.indexOf(except, type) != -1) {
                        return me.bkqueryCommandState.apply(me, arguments);
                    }
                    return -1;
                };
                me.queryCommandValue = function (type) {
                    if (utils.indexOf(except, type) != -1) {
                        return me.bkqueryCommandValue.apply(me, arguments);
                    }
                    return null;
                };
                me.fireEvent('selectionchange');
            }
        },
        disable: function (except) {
            return this.setDisabled(except);
        },
        _setDefaultContent: (function () {
            function clear() {
                var me = this;
                if (me.document.getElementById('initContent')) {
                    me.body.innerHTML = '<p><br/></p>';
                    me.removeListener('firstBeforeExecCommand focus', clear);
                    setTimeout(function () {
                        me.focus();
                        me._selectionChange();
                    }, 0);
                }
            }
            return function (cont) {
                var me = this;
                me.body.innerHTML = '<p id="initContent">' + cont + '</p>';
                me.addListener('firstBeforeExecCommand focus', clear);
            };
        }()),
        setShow: function () {
            var me = this;
            var range = me.selection.getRange();
            if (me.container.style.display == 'none') {
                try {
                    range.moveToBookmark(me.lastBk);
                    delete me.lastBk;
                }
                catch (e) {
                    range.setStartAtFirst(me.body).collapse(true);
                }
                setTimeout(function () {
                    range.select(true);
                }, 100);
                me.container.style.display = '';
            }
        },
        show: function () {
            return this.setShow();
        },
        setHide: function () {
            var me = this;
            if (!me.lastBk) {
                me.lastBk = me.selection.getRange().createBookmark(true);
            }
            me.container.style.display = 'none';
        },
        hide: function () {
            return this.setHide();
        },
        getLang: function (path) {
            var lang = 'zh-cn';
            if (_.isObject(this.options) && this.options.lang) {
                lang = UE.I18N[this.options.lang];
            }
            if (!lang) {
                throw Error('not import language file');
            }
            path = (path || '').split('.');
            for (var i = 0, ci; ci = path[i++];) {
                lang = lang[ci];
                if (!lang)
                    break;
            }
            return lang;
        },
        getContentLength: function (ingoneHtml, tagNames) {
            var count = this.getContent(false, false, true).length;
            if (ingoneHtml) {
                tagNames = (tagNames || []).concat(['hr', 'img', 'iframe']);
                count = this.getContentTxt().replace(/[\t\r\n]+/g, '').length;
                for (var i = 0, ci; ci = tagNames[i++];) {
                    count += this.document.getElementsByTagName(ci).length;
                }
            }
            return count;
        },
        addInputRule: function (rule) {
            this.inputRules.push(rule);
        },
        filterInputRule: function (root) {
            for (var i = 0, ci; ci = this.inputRules[i++];) {
                ci.call(this, root);
            }
        },
        addOutputRule: function (rule) {
            this.outputRules.push(rule);
        },
        filterOutputRule: function (root) {
            for (var i = 0, ci; ci = this.outputRules[i++];) {
                ci.call(this, root);
            }
        },
        getActionUrl: function (action) {
            var actionName = this.getOpt(action) || action;
            var imageUrl = this.getOpt('imageUrl');
            var serverUrl = this.getOpt('serverUrl');
            if (!serverUrl && imageUrl) {
                serverUrl = imageUrl.replace(/^(.*[\/]).+([\.].+)$/, '$1controller$2');
            }
            if (serverUrl) {
                serverUrl = serverUrl + (serverUrl.indexOf('?') == -1 ? '?' : '&') + 'action=' + (actionName || '');
                return utils.formatUrl(serverUrl);
            }
            else {
                return '';
            }
        }
    };
    utils.inherits(Editor, EventBase);
})();
