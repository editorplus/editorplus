UE.plugins.paragraph = function () {
    var me = this;
    var block = domUtils.isBlockElm;
    var notExchange = ['TD', 'LI', 'PRE'];
    var doParagraph = function (range, style, attrs, sourceCmdName) {
        var bookmark = range.createBookmark();
        var filterFn = function (node) {
            return node.nodeType == 1 ? node.tagName.toLowerCase() != 'br' && !domUtils.isBookmarkNode(node) : !domUtils.isWhitespace(node);
        };
        var para;
        range.enlarge(true);
        var bookmark2 = range.createBookmark();
        var current = domUtils.getNextDomNode(bookmark2.start, false, filterFn);
        var tmpRange = range.cloneRange();
        var tmpNode;
        while (current && !(domUtils.getPosition(current, bookmark2.end) & domUtils.POSITION_FOLLOWING)) {
            if (current.nodeType == 3 || !block(current)) {
                tmpRange.setStartBefore(current);
                while (current && current !== bookmark2.end && !block(current)) {
                    tmpNode = current;
                    current = domUtils.getNextDomNode(current, false, null, function (node) {
                        return !block(node);
                    });
                }
                tmpRange.setEndAfter(tmpNode);
                para = range.document.createElement(style);
                if (attrs) {
                    domUtils.setAttributes(para, attrs);
                    if (sourceCmdName && sourceCmdName == 'customstyle' && attrs.style) {
                        para.style.cssText = attrs.style;
                    }
                }
                para.appendChild(tmpRange.extractContents());
                if (domUtils.isEmptyNode(para)) {
                    domUtils.fillChar(range.document, para);
                }
                tmpRange.insertNode(para);
                var parent = para.parentNode;
                if (block(parent) && !domUtils.isBody(para.parentNode) && utils.indexOf(notExchange, parent.tagName) == -1) {
                    if (!(sourceCmdName && sourceCmdName == 'customstyle')) {
                        parent.getAttribute('dir') && para.setAttribute('dir', parent.getAttribute('dir'));
                        parent.style.cssText && (para.style.cssText = parent.style.cssText + ';' + para.style.cssText);
                        parent.style.textAlign && !para.style.textAlign && (para.style.textAlign = parent.style.textAlign);
                        parent.style.textIndent && !para.style.textIndent && (para.style.textIndent = parent.style.textIndent);
                        parent.style.padding && !para.style.padding && (para.style.padding = parent.style.padding);
                    }
                    if (attrs && /h\d/i.test(parent.tagName) && !/h\d/i.test(para.tagName)) {
                        domUtils.setAttributes(parent, attrs);
                        if (sourceCmdName && sourceCmdName == 'customstyle' && attrs.style) {
                            parent.style.cssText = attrs.style;
                        }
                        domUtils.remove(para, true);
                        para = parent;
                    }
                    else {
                        domUtils.remove(para.parentNode, true);
                    }
                }
                if (utils.indexOf(notExchange, parent.tagName) != -1) {
                    current = parent;
                }
                else {
                    current = para;
                }
                current = domUtils.getNextDomNode(current, false, filterFn);
            }
            else {
                current = domUtils.getNextDomNode(current, true, filterFn);
            }
        }
        return range.moveToBookmark(bookmark2).moveToBookmark(bookmark);
    };
    me.setOpt('paragraph', { p: '', h1: '', h2: '', h3: '', h4: '', h5: '', h6: '' });
    me.commands.paragraph = {
        execCommand: function (cmdName, style, attrs, sourceCmdName) {
            var range = this.selection.getRange();
            if (range.collapsed) {
                var txt = this.document.createTextNode('p');
                range.insertNode(txt);
            }
            range = doParagraph(range, style, attrs, sourceCmdName);
            if (txt) {
                range.setStartBefore(txt).collapse(true);
                pN = txt.parentNode;
                domUtils.remove(txt);
                if (domUtils.isBlockElm(pN) && domUtils.isEmptyNode(pN)) {
                    domUtils.fillNode(this.document, pN);
                }
            }
            if (browser.gecko && range.collapsed && range.startContainer.nodeType == 1) {
                var child = range.startContainer.childNodes[range.startOffset];
                if (child && child.nodeType == 1 && child.tagName.toLowerCase() == style) {
                    range.setStart(child, 0).collapse(true);
                }
            }
            range.select();
            return true;
        },
        queryCommandValue: function () {
            var node = domUtils.filterNodeList(this.selection.getStartElementPath(), 'p h1 h2 h3 h4 h5 h6');
            return node ? node.tagName.toLowerCase() : '';
        }
    };
};
