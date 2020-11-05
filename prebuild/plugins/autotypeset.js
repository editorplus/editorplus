UE.plugins.autotypeset = function () {
    this.setOpt({
        autotypeset: {
            mergeEmptyline: true,
            removeClass: true,
            removeEmptyline: false,
            textAlign: 'left',
            imageBlockLine: 'center',
            pasteFilter: false,
            clearFontSize: false,
            clearFontFamily: false,
            removeEmptyNode: false,
            removeTagNames: utils.extend({ div: 1 }, dtd.$removeEmpty),
            indent: false,
            indentValue: '2em',
            bdc2sb: false,
            tobdc: false
        }
    });
    var me = this;
    var opt = me.options.autotypeset;
    var remainClass = {
        selectTdClass: 1,
        pagebreak: 1,
        anchorclass: 1
    };
    var remainTag = {
        li: 1
    };
    var tags = {
        div: 1,
        p: 1,
        blockquote: 1,
        center: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        span: 1
    };
    var highlightCont;
    if (!opt) {
        return;
    }
    readLocalOpts();
    function isLine(node, notEmpty) {
        if (!node || node.nodeType == 3) {
            return 0;
        }
        if (domUtils.isBr(node)) {
            return 1;
        }
        if (node && node.parentNode && tags[node.tagName.toLowerCase()]) {
            if (highlightCont && highlightCont.contains(node) ||
                node.getAttribute('pagebreak')) {
                return 0;
            }
            return notEmpty ? !domUtils.isEmptyBlock(node) : domUtils.isEmptyBlock(node, new RegExp('[\\s' + domUtils.fillChar +
                ']', 'g'));
        }
    }
    function removeNotAttributeSpan(node) {
        if (!node.style.cssText) {
            domUtils.removeAttributes(node, ['style']);
            if (node.tagName.toLowerCase() == 'span' && domUtils.hasNoAttributes(node)) {
                domUtils.remove(node, true);
            }
        }
    }
    function autotype(type, html) {
        var me = this;
        var cont;
        if (html) {
            if (!opt.pasteFilter) {
                return;
            }
            cont = me.document.createElement('div');
            cont.innerHTML = html.html;
        }
        else {
            cont = me.document.body;
        }
        var nodes = domUtils.getElementsByTagName(cont, '*');
        for (var i = 0, ci; ci = nodes[i++];) {
            if (me.fireEvent('excludeNodeinautotype', ci) === true) {
                continue;
            }
            if (opt.clearFontSize && ci.style.fontSize) {
                domUtils.removeStyle(ci, 'font-size');
                removeNotAttributeSpan(ci);
            }
            if (opt.clearFontFamily && ci.style.fontFamily) {
                domUtils.removeStyle(ci, 'font-family');
                removeNotAttributeSpan(ci);
            }
            if (isLine(ci)) {
                if (opt.mergeEmptyline) {
                    var next = ci.nextSibling;
                    var tmpNode;
                    var isBr = domUtils.isBr(ci);
                    while (isLine(next)) {
                        tmpNode = next;
                        next = tmpNode.nextSibling;
                        if (isBr && (!next || next && !domUtils.isBr(next))) {
                            break;
                        }
                        domUtils.remove(tmpNode);
                    }
                }
                if (opt.removeEmptyline && domUtils.inDoc(ci, cont) && !remainTag[ci.parentNode.tagName.toLowerCase()]) {
                    if (domUtils.isBr(ci)) {
                        next = ci.nextSibling;
                        if (next && !domUtils.isBr(next)) {
                            continue;
                        }
                    }
                    domUtils.remove(ci);
                    continue;
                }
            }
            if (isLine(ci, true) && ci.tagName != 'SPAN') {
                if (opt.indent) {
                    ci.style.textIndent = opt.indentValue;
                }
                if (opt.textAlign) {
                    ci.style.textAlign = opt.textAlign;
                }
            }
            if (opt.removeClass && ci.className && !remainClass[ci.className.toLowerCase()]) {
                if (highlightCont && highlightCont.contains(ci)) {
                    continue;
                }
                domUtils.removeAttributes(ci, ['class']);
            }
            if (opt.imageBlockLine && ci.tagName.toLowerCase() == 'img' && !ci.getAttribute('emotion')) {
                if (html) {
                    var img = ci;
                    switch (opt.imageBlockLine) {
                        case 'left':
                        case 'right':
                        case 'none':
                            var pN = img.parentNode;
                            var tmpNode;
                            var pre;
                            var next;
                            while (dtd.$inline[pN.tagName] || pN.tagName == 'A') {
                                pN = pN.parentNode;
                            }
                            tmpNode = pN;
                            if (tmpNode.tagName == 'P' && domUtils.getStyle(tmpNode, 'text-align') == 'center') {
                                if (!domUtils.isBody(tmpNode) && domUtils.getChildCount(tmpNode, function (node) { return !domUtils.isBr(node) && !domUtils.isWhitespace(node); }) == 1) {
                                    pre = tmpNode.previousSibling;
                                    next = tmpNode.nextSibling;
                                    if (pre && next && pre.nodeType == 1 && next.nodeType == 1 && pre.tagName == next.tagName && domUtils.isBlockElm(pre)) {
                                        pre.appendChild(tmpNode.firstChild);
                                        while (next.firstChild) {
                                            pre.appendChild(next.firstChild);
                                        }
                                        domUtils.remove(tmpNode);
                                        domUtils.remove(next);
                                    }
                                    else {
                                        domUtils.setStyle(tmpNode, 'text-align', '');
                                    }
                                }
                            }
                            domUtils.setStyle(img, 'float', opt.imageBlockLine);
                            break;
                        case 'center':
                            if (me.queryCommandValue('imagefloat') != 'center') {
                                pN = img.parentNode;
                                domUtils.setStyle(img, 'float', 'none');
                                tmpNode = img;
                                while (pN && domUtils.getChildCount(pN, function (node) { return !domUtils.isBr(node) && !domUtils.isWhitespace(node); }) == 1 &&
                                    (dtd.$inline[pN.tagName] || pN.tagName == 'A')) {
                                    tmpNode = pN;
                                    pN = pN.parentNode;
                                }
                                var pNode = me.document.createElement('p');
                                domUtils.setAttributes(pNode, {
                                    style: 'text-align:center'
                                });
                                tmpNode.parentNode.insertBefore(pNode, tmpNode);
                                pNode.appendChild(tmpNode);
                                domUtils.setStyle(tmpNode, 'float', '');
                            }
                    }
                }
                else {
                    var range = me.selection.getRange();
                    range.selectNode(ci).select();
                    me.execCommand('imagefloat', opt.imageBlockLine);
                }
            }
            if (opt.removeEmptyNode) {
                if (opt.removeTagNames[ci.tagName.toLowerCase()] && domUtils.hasNoAttributes(ci) && domUtils.isEmptyBlock(ci)) {
                    domUtils.remove(ci);
                }
            }
        }
        if (opt.tobdc) {
            var root = UE.htmlparser(cont.innerHTML);
            root.traversal(function (node) {
                if (node.type == 'text') {
                    node.data = ToDBC(node.data);
                }
            });
            cont.innerHTML = root.toHtml();
        }
        if (opt.bdc2sb) {
            var root = UE.htmlparser(cont.innerHTML);
            root.traversal(function (node) {
                if (node.type == 'text') {
                    node.data = DBC2SB(node.data);
                }
            });
            cont.innerHTML = root.toHtml();
        }
        if (html) {
            html.html = cont.innerHTML;
        }
    }
    if (opt.pasteFilter) {
        me.addListener('beforepaste', autotype);
    }
    function DBC2SB(str) {
        var result = '';
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (code >= 65281 && code <= 65373) {
                result += String.fromCharCode(str.charCodeAt(i) - 65248);
            }
            else if (code == 12288) {
                result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
            }
            else {
                result += str.charAt(i);
            }
        }
        return result;
    }
    function ToDBC(txtstring) {
        txtstring = utils.html(txtstring);
        var tmp = '';
        var mark = '';
        for (var i = 0; i < txtstring.length; i++) {
            if (txtstring.charCodeAt(i) == 32) {
                tmp = tmp + String.fromCharCode(12288);
            }
            else if (txtstring.charCodeAt(i) < 127) {
                tmp = tmp + String.fromCharCode(txtstring.charCodeAt(i) + 65248);
            }
            else {
                tmp += txtstring.charAt(i);
            }
        }
        return tmp;
    }
    function readLocalOpts() {
        var cookieOpt = me.getPreferences('autotypeset');
        utils.extend(me.options.autotypeset, cookieOpt);
    }
    me.commands.autotypeset = {
        execCommand: function () {
            me.removeListener('beforepaste', autotype);
            if (opt.pasteFilter) {
                me.addListener('beforepaste', autotype);
            }
            autotype.call(me);
        }
    };
};
