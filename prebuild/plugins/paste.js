UE.plugins.paste = function () {
    function getClipboardData(callback) {
        var doc = this.document;
        if (doc.getElementById('baidu_pastebin')) {
            return;
        }
        var range = this.selection.getRange();
        var bk = range.createBookmark();
        var pastebin = doc.createElement('div');
        pastebin.id = 'baidu_pastebin';
        browser.webkit && pastebin.appendChild(doc.createTextNode(domUtils.fillChar + domUtils.fillChar));
        doc.body.appendChild(pastebin);
        bk.start.style.display = '';
        pastebin.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;left:-1000px;white-space:nowrap;top:' +
            domUtils.getXY(bk.start).y + 'px';
        range.selectNodeContents(pastebin).select(true);
        setTimeout(function () {
            if (browser.webkit) {
                for (var i = 0, pastebins = doc.querySelectorAll('#baidu_pastebin'), pi; pi = pastebins[i++];) {
                    if (domUtils.isEmptyNode(pi)) {
                        domUtils.remove(pi);
                    }
                    else {
                        pastebin = pi;
                        break;
                    }
                }
            }
            try {
                pastebin.parentNode.removeChild(pastebin);
            }
            catch (e) {
            }
            range.moveToBookmark(bk).select(true);
            callback(pastebin);
        }, 0);
    }
    var me = this;
    me.setOpt({
        retainOnlyLabelPasted: false
    });
    var txtContent, htmlContent, address;
    function getPureHtml(html) {
        return html.replace(/<(\/?)([\w\-]+)([^>]*)>/gi, function (a, b, tagName, attrs) {
            tagName = tagName.toLowerCase();
            if ({ img: 1 }[tagName]) {
                return a;
            }
            attrs = attrs.replace(/([\w\-]*?)\s*=\s*(("([^"]*)")|('([^']*)')|([^\s>]+))/gi, function (str, atr, val) {
                if ({
                    src: 1,
                    href: 1,
                    name: 1
                }[atr.toLowerCase()]) {
                    return atr + '=' + val + ' ';
                }
                return '';
            });
            if ({
                span: 1,
                div: 1
            }[tagName]) {
                return '';
            }
            else {
                return '<' + b + tagName + ' ' + utils.trim(attrs) + '>';
            }
        });
    }
    function filter(div) {
        var html;
        if (div.firstChild) {
            var nodes = domUtils.getElementsByTagName(div, 'span');
            for (var i = 0, ni; ni = nodes[i++];) {
                if (ni.id == '_baidu_cut_start' || ni.id == '_baidu_cut_end') {
                    domUtils.remove(ni);
                }
            }
            if (browser.webkit) {
                var brs = div.querySelectorAll('div br');
                for (var i = 0, bi; bi = brs[i++];) {
                    var pN = bi.parentNode;
                    if (pN.tagName == 'DIV' && pN.childNodes.length == 1) {
                        pN.innerHTML = '<p><br/></p>';
                        domUtils.remove(pN);
                    }
                }
                var divs = div.querySelectorAll('#baidu_pastebin');
                for (var i = 0, di; di = divs[i++];) {
                    var tmpP = me.document.createElement('p');
                    di.parentNode.insertBefore(tmpP, di);
                    while (di.firstChild) {
                        tmpP.appendChild(di.firstChild);
                    }
                    domUtils.remove(di);
                }
                var metas = div.querySelectorAll('meta');
                for (var i = 0, ci; ci = metas[i++];) {
                    domUtils.remove(ci);
                }
                var brs = div.querySelectorAll('br');
                for (i = 0; ci = brs[i++];) {
                    if (/^apple-/i.test(ci.className)) {
                        domUtils.remove(ci);
                    }
                }
            }
            if (browser.gecko) {
                var dirtyNodes = div.querySelectorAll('[_moz_dirty]');
                for (i = 0; ci = dirtyNodes[i++];) {
                    ci.removeAttribute('_moz_dirty');
                }
            }
            var spans = div.querySelectorAll('span.Apple-style-span');
            for (var i = 0, ci; ci = spans[i++];) {
                domUtils.remove(ci, true);
            }
            html = div.innerHTML;
            html = UE.filterWord(html);
            var root = UE.htmlparser(html);
            if (me.options.filterRules) {
                UE.filterNode(root, me.options.filterRules);
            }
            me.filterInputRule(root);
            if (browser.webkit) {
                var br = root.lastChild();
                if (br && br.type == 'element' && br.tagName == 'br') {
                    root.removeChild(br);
                }
                utils.each(me.body.querySelectorAll('div'), function (node) {
                    if (domUtils.isEmptyBlock(node)) {
                        domUtils.remove(node, true);
                    }
                });
            }
            html = { html: root.toHtml() };
            me.fireEvent('beforepaste', html, root);
            if (!html.html) {
                return;
            }
            root = UE.htmlparser(html.html, true);
            if (me.queryCommandState('pasteplain') === 1) {
                me.execCommand('insertHtml', UE.filterNode(root, me.options.filterTxtRules).toHtml(), true);
            }
            else {
                UE.filterNode(root, me.options.filterTxtRules);
                txtContent = root.toHtml();
                htmlContent = html.html;
                address = me.selection.getRange().createAddress(true);
                me.execCommand('insertHtml', me.getOpt('retainOnlyLabelPasted') === true ? getPureHtml(htmlContent) : htmlContent, true);
            }
            me.fireEvent('afterpaste', html);
        }
    }
    me.addListener('pasteTransfer', function (cmd, plainType) {
        if (address && txtContent && htmlContent && txtContent != htmlContent) {
            var range = me.selection.getRange();
            range.moveToAddress(address, true);
            if (!range.collapsed) {
                while (!domUtils.isBody(range.startContainer)) {
                    var start = range.startContainer;
                    if (start.nodeType == 1) {
                        start = start.childNodes[range.startOffset];
                        if (!start) {
                            range.setStartBefore(range.startContainer);
                            continue;
                        }
                        var pre = start.previousSibling;
                        if (pre && pre.nodeType == 3 && new RegExp('^[\n\r\t ' + domUtils.fillChar + ']*$').test(pre.nodeValue)) {
                            range.setStartBefore(pre);
                        }
                    }
                    if (range.startOffset == 0) {
                        range.setStartBefore(range.startContainer);
                    }
                    else {
                        break;
                    }
                }
                while (!domUtils.isBody(range.endContainer)) {
                    var end = range.endContainer;
                    if (end.nodeType == 1) {
                        end = end.childNodes[range.endOffset];
                        if (!end) {
                            range.setEndAfter(range.endContainer);
                            continue;
                        }
                        var next = end.nextSibling;
                        if (next && next.nodeType == 3 && new RegExp('^[\n\r\t' + domUtils.fillChar + ']*$').test(next.nodeValue)) {
                            range.setEndAfter(next);
                        }
                    }
                    if (range.endOffset == range.endContainer[range.endContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length) {
                        range.setEndAfter(range.endContainer);
                    }
                    else {
                        break;
                    }
                }
            }
            range.deleteContents();
            range.select(true);
            me.__hasEnterExecCommand = true;
            var html = htmlContent;
            if (plainType === 2) {
                html = getPureHtml(html);
            }
            else if (plainType) {
                html = txtContent;
            }
            me.execCommand('inserthtml', html, true);
            me.__hasEnterExecCommand = false;
            var rng = me.selection.getRange();
            while (!domUtils.isBody(rng.startContainer) && !rng.startOffset &&
                rng.startContainer[rng.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length) {
                rng.setStartBefore(rng.startContainer);
            }
            var tmpAddress = rng.createAddress(true);
            address.endAddress = tmpAddress.startAddress;
        }
    });
    me.addListener('ready', function () {
        domUtils.on(me.body, 'cut', function () {
            var range = me.selection.getRange();
            if (!range.collapsed && me.undoManger) {
                me.undoManger.save();
            }
        });
        domUtils.on(me.body, 'paste', function (e) {
            getClipboardData.call(me, function (div) {
                filter(div);
            });
        });
    });
    me.commands.paste = {
        execCommand: function (cmd) {
            alert(me.getLang('pastemsg'));
        }
    };
};
