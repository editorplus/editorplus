(function () {
    var guid = 0;
    var fillChar = domUtils.fillChar;
    var fillData;
    function updateCollapse(range) {
        range.collapsed =
            range.startContainer && range.endContainer &&
                range.startContainer === range.endContainer &&
                range.startOffset == range.endOffset;
    }
    function selectOneNode(rng) {
        return !rng.collapsed && rng.startContainer.nodeType == 1 && rng.startContainer === rng.endContainer && rng.endOffset - rng.startOffset == 1;
    }
    function setEndPoint(toStart, node, offset, range) {
        if (node.nodeType == 1 && (dtd.$empty[node.tagName] || dtd.$nonChild[node.tagName])) {
            offset = domUtils.getNodeIndex(node) + (toStart ? 0 : 1);
            node = node.parentNode;
        }
        if (toStart) {
            range.startContainer = node;
            range.startOffset = offset;
            if (!range.endContainer) {
                range.collapse(true);
            }
        }
        else {
            range.endContainer = node;
            range.endOffset = offset;
            if (!range.startContainer) {
                range.collapse(false);
            }
        }
        updateCollapse(range);
        return range;
    }
    function execContentsAction(range, action) {
        var start = range.startContainer;
        var end = range.endContainer;
        var startOffset = range.startOffset;
        var endOffset = range.endOffset;
        var doc = range.document;
        var frag = doc.createDocumentFragment();
        var tmpStart;
        var tmpEnd;
        if (start.nodeType == 1) {
            start = start.childNodes[startOffset] || (tmpStart = start.appendChild(doc.createTextNode('')));
        }
        if (end.nodeType == 1) {
            end = end.childNodes[endOffset] || (tmpEnd = end.appendChild(doc.createTextNode('')));
        }
        if (start === end && start.nodeType == 3) {
            frag.appendChild(doc.createTextNode(start.substringData(startOffset, endOffset - startOffset)));
            if (action) {
                start.deleteData(startOffset, endOffset - startOffset);
                range.collapse(true);
            }
            return frag;
        }
        var current;
        var currentLevel;
        var clone = frag;
        var startParents = domUtils.findParents(start, true);
        var endParents = domUtils.findParents(end, true);
        for (var i = 0; startParents[i] == endParents[i];) {
            i++;
        }
        for (var j = i, si; si = startParents[j]; j++) {
            current = si.nextSibling;
            if (si == start) {
                if (!tmpStart) {
                    if (range.startContainer.nodeType == 3) {
                        clone.appendChild(doc.createTextNode(start.nodeValue.slice(startOffset)));
                        if (action) {
                            start.deleteData(startOffset, start.nodeValue.length - startOffset);
                        }
                    }
                    else {
                        clone.appendChild(!action ? start.cloneNode(true) : start);
                    }
                }
            }
            else {
                currentLevel = si.cloneNode(false);
                clone.appendChild(currentLevel);
            }
            while (current) {
                if (current === end || current === endParents[j]) {
                    break;
                }
                si = current.nextSibling;
                clone.appendChild(!action ? current.cloneNode(true) : current);
                current = si;
            }
            clone = currentLevel;
        }
        clone = frag;
        if (!startParents[i]) {
            clone.appendChild(startParents[i - 1].cloneNode(false));
            clone = clone.firstChild;
        }
        for (var j = i, ei; ei = endParents[j]; j++) {
            current = ei.previousSibling;
            if (ei == end) {
                if (!tmpEnd && range.endContainer.nodeType == 3) {
                    clone.appendChild(doc.createTextNode(end.substringData(0, endOffset)));
                    if (action) {
                        end.deleteData(0, endOffset);
                    }
                }
            }
            else {
                currentLevel = ei.cloneNode(false);
                clone.appendChild(currentLevel);
            }
            if (j != i || !startParents[i]) {
                while (current) {
                    if (current === start) {
                        break;
                    }
                    ei = current.previousSibling;
                    clone.insertBefore(!action ? current.cloneNode(true) : current, clone.firstChild);
                    current = ei;
                }
            }
            clone = currentLevel;
        }
        if (action) {
            range.setStartBefore(!endParents[i] ? endParents[i - 1] : !startParents[i] ? startParents[i - 1] : endParents[i]).collapse(true);
        }
        tmpStart && domUtils.remove(tmpStart);
        tmpEnd && domUtils.remove(tmpEnd);
        return frag;
    }
    var Range = dom.Range = function (document) {
        var me = this;
        me.startContainer =
            me.startOffset =
                me.endContainer =
                    me.endOffset = null;
        me.document = document;
        me.collapsed = true;
    };
    function removeFillData(doc, excludeNode) {
        try {
            if (fillData && domUtils.inDoc(fillData, doc)) {
                if (!fillData.nodeValue.replace(fillCharReg, '').length) {
                    var tmpNode = fillData.parentNode;
                    domUtils.remove(fillData);
                    while (tmpNode && domUtils.isEmptyInlineElement(tmpNode) &&
                        (browser.safari ? !(domUtils.getPosition(tmpNode, excludeNode) & domUtils.POSITION_CONTAINS) : !tmpNode.contains(excludeNode))) {
                        fillData = tmpNode.parentNode;
                        domUtils.remove(tmpNode);
                        tmpNode = fillData;
                    }
                }
                else {
                    fillData.nodeValue = fillData.nodeValue.replace(fillCharReg, '');
                }
            }
        }
        catch (e) {
        }
    }
    function mergeSibling(node, dir) {
        var tmpNode;
        node = node[dir];
        while (node && domUtils.isFillChar(node)) {
            tmpNode = node[dir];
            domUtils.remove(node);
            node = tmpNode;
        }
    }
    Range.prototype = {
        cloneContents: function () {
            return this.collapsed ? null : execContentsAction(this, 0);
        },
        deleteContents: function () {
            var txt;
            if (!this.collapsed) {
                execContentsAction(this, 1);
            }
            if (browser.webkit) {
                txt = this.startContainer;
                if (txt.nodeType == 3 && !txt.nodeValue.length) {
                    this.setStartBefore(txt).collapse(true);
                    domUtils.remove(txt);
                }
            }
            return this;
        },
        extractContents: function () {
            return this.collapsed ? null : execContentsAction(this, 2);
        },
        setStart: function (node, offset) {
            return setEndPoint(true, node, offset, this);
        },
        setEnd: function (node, offset) {
            return setEndPoint(false, node, offset, this);
        },
        setStartAfter: function (node) {
            return this.setStart(node.parentNode, domUtils.getNodeIndex(node) + 1);
        },
        setStartBefore: function (node) {
            return this.setStart(node.parentNode, domUtils.getNodeIndex(node));
        },
        setEndAfter: function (node) {
            return this.setEnd(node.parentNode, domUtils.getNodeIndex(node) + 1);
        },
        setEndBefore: function (node) {
            return this.setEnd(node.parentNode, domUtils.getNodeIndex(node));
        },
        setStartAtFirst: function (node) {
            return this.setStart(node, 0);
        },
        setStartAtLast: function (node) {
            return this.setStart(node, node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length);
        },
        setEndAtFirst: function (node) {
            return this.setEnd(node, 0);
        },
        setEndAtLast: function (node) {
            return this.setEnd(node, node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length);
        },
        selectNode: function (node) {
            return this.setStartBefore(node).setEndAfter(node);
        },
        selectNodeContents: function (node) {
            return this.setStart(node, 0).setEndAtLast(node);
        },
        cloneRange: function () {
            var me = this;
            return new Range(me.document).setStart(me.startContainer, me.startOffset).setEnd(me.endContainer, me.endOffset);
        },
        collapse: function (toStart) {
            var me = this;
            if (toStart) {
                me.endContainer = me.startContainer;
                me.endOffset = me.startOffset;
            }
            else {
                me.startContainer = me.endContainer;
                me.startOffset = me.endOffset;
            }
            me.collapsed = true;
            return me;
        },
        shrinkBoundary: function (ignoreEnd) {
            var me = this;
            var child;
            var collapsed = me.collapsed;
            function check(node) {
                return node.nodeType == 1 && !domUtils.isBookmarkNode(node) && !dtd.$empty[node.tagName] && !dtd.$nonChild[node.tagName];
            }
            while (me.startContainer.nodeType == 1 &&
                (child = me.startContainer.childNodes[me.startOffset]) &&
                check(child)) {
                me.setStart(child, 0);
            }
            if (collapsed) {
                return me.collapse(true);
            }
            if (!ignoreEnd) {
                while (me.endContainer.nodeType == 1 &&
                    me.endOffset > 0 &&
                    (child = me.endContainer.childNodes[me.endOffset - 1]) &&
                    check(child)) {
                    me.setEnd(child, child.childNodes.length);
                }
            }
            return me;
        },
        getCommonAncestor: function (includeSelf, ignoreTextNode) {
            var me = this;
            var start = me.startContainer;
            var end = me.endContainer;
            if (start === end) {
                if (includeSelf && selectOneNode(this)) {
                    start = start.childNodes[me.startOffset];
                    if (start.nodeType == 1) {
                        return start;
                    }
                }
                return ignoreTextNode && start.nodeType == 3 ? start.parentNode : start;
            }
            return domUtils.getCommonAncestor(start, end);
        },
        trimBoundary: function (ignoreEnd) {
            this.txtToElmBoundary();
            var start = this.startContainer;
            var offset = this.startOffset;
            var collapsed = this.collapsed;
            var end = this.endContainer;
            if (start.nodeType == 3) {
                if (offset == 0) {
                    this.setStartBefore(start);
                }
                else {
                    if (offset >= start.nodeValue.length) {
                        this.setStartAfter(start);
                    }
                    else {
                        var textNode = domUtils.split(start, offset);
                        if (start === end) {
                            this.setEnd(textNode, this.endOffset - offset);
                        }
                        else if (start.parentNode === end) {
                            this.endOffset += 1;
                        }
                        this.setStartBefore(textNode);
                    }
                }
                if (collapsed) {
                    return this.collapse(true);
                }
            }
            if (!ignoreEnd) {
                offset = this.endOffset;
                end = this.endContainer;
                if (end.nodeType == 3) {
                    if (offset == 0) {
                        this.setEndBefore(end);
                    }
                    else {
                        offset < end.nodeValue.length && domUtils.split(end, offset);
                        this.setEndAfter(end);
                    }
                }
            }
            return this;
        },
        txtToElmBoundary: function (ignoreCollapsed) {
            function adjust(r, c) {
                var container = r[c + 'Container'];
                var offset = r[c + 'Offset'];
                if (container.nodeType == 3) {
                    if (!offset) {
                        r['set' + c.replace(/(\w)/, function (a) {
                            return a.toUpperCase();
                        }) + 'Before'](container);
                    }
                    else if (offset >= container.nodeValue.length) {
                        r['set' + c.replace(/(\w)/, function (a) {
                            return a.toUpperCase();
                        }) + 'After'](container);
                    }
                }
            }
            if (ignoreCollapsed || !this.collapsed) {
                adjust(this, 'start');
                adjust(this, 'end');
            }
            return this;
        },
        insertNode: function (node) {
            var first = node;
            var length = 1;
            if (node.nodeType == 11) {
                first = node.firstChild;
                length = node.childNodes.length;
            }
            this.trimBoundary(true);
            var start = this.startContainer;
            var offset = this.startOffset;
            var nextNode = start.childNodes[offset];
            if (nextNode) {
                start.insertBefore(node, nextNode);
            }
            else {
                start.appendChild(node);
            }
            if (first.parentNode === this.endContainer) {
                this.endOffset = this.endOffset + length;
            }
            return this.setStartBefore(first);
        },
        setCursor: function (toEnd, noFillData) {
            return this.collapse(!toEnd).select(noFillData);
        },
        createBookmark: function (serialize, same) {
            var endNode;
            var startNode = this.document.createElement('span');
            startNode.style.cssText = 'display:none;line-height:0px;';
            startNode.appendChild(this.document.createTextNode('\u200D'));
            startNode.id = '_baidu_bookmark_start_' + (same ? '' : guid++);
            if (!this.collapsed) {
                endNode = startNode.cloneNode(true);
                endNode.id = '_baidu_bookmark_end_' + (same ? '' : guid++);
            }
            this.insertNode(startNode);
            if (endNode) {
                this.collapse().insertNode(endNode).setEndBefore(endNode);
            }
            this.setStartAfter(startNode);
            return {
                start: serialize ? startNode.id : startNode,
                end: endNode ? serialize ? endNode.id : endNode : null,
                id: serialize
            };
        },
        moveToBookmark: function (bookmark) {
            var start = bookmark.id ? this.document.getElementById(bookmark.start) : bookmark.start;
            var end = bookmark.end && bookmark.id ? this.document.getElementById(bookmark.end) : bookmark.end;
            this.setStartBefore(start);
            domUtils.remove(start);
            if (end) {
                this.setEndBefore(end);
                domUtils.remove(end);
            }
            else {
                this.collapse(true);
            }
            return this;
        },
        enlarge: function (toBlock, stopFn) {
            var isBody = domUtils.isBody;
            var pre;
            var node;
            var tmp = this.document.createTextNode('');
            if (toBlock) {
                node = this.startContainer;
                if (node.nodeType == 1) {
                    if (node.childNodes[this.startOffset]) {
                        pre = node = node.childNodes[this.startOffset];
                    }
                    else {
                        node.appendChild(tmp);
                        pre = node = tmp;
                    }
                }
                else {
                    pre = node;
                }
                while (1) {
                    if (domUtils.isBlockElm(node)) {
                        node = pre;
                        while ((pre = node.previousSibling) && !domUtils.isBlockElm(pre)) {
                            node = pre;
                        }
                        this.setStartBefore(node);
                        break;
                    }
                    pre = node;
                    node = node.parentNode;
                }
                node = this.endContainer;
                if (node.nodeType == 1) {
                    if (pre = node.childNodes[this.endOffset]) {
                        node.insertBefore(tmp, pre);
                    }
                    else {
                        node.appendChild(tmp);
                    }
                    pre = node = tmp;
                }
                else {
                    pre = node;
                }
                while (1) {
                    if (domUtils.isBlockElm(node)) {
                        node = pre;
                        while ((pre = node.nextSibling) && !domUtils.isBlockElm(pre)) {
                            node = pre;
                        }
                        this.setEndAfter(node);
                        break;
                    }
                    pre = node;
                    node = node.parentNode;
                }
                if (tmp.parentNode === this.endContainer) {
                    this.endOffset--;
                }
                domUtils.remove(tmp);
            }
            if (!this.collapsed) {
                while (this.startOffset == 0) {
                    if (stopFn && stopFn(this.startContainer)) {
                        break;
                    }
                    if (isBody(this.startContainer)) {
                        break;
                    }
                    this.setStartBefore(this.startContainer);
                }
                while (this.endOffset == (this.endContainer.nodeType == 1 ? this.endContainer.childNodes.length : this.endContainer.nodeValue.length)) {
                    if (stopFn && stopFn(this.endContainer)) {
                        break;
                    }
                    if (isBody(this.endContainer)) {
                        break;
                    }
                    this.setEndAfter(this.endContainer);
                }
            }
            return this;
        },
        enlargeToBlockElm: function (ignoreEnd) {
            while (!domUtils.isBlockElm(this.startContainer)) {
                this.setStartBefore(this.startContainer);
            }
            if (!ignoreEnd) {
                while (!domUtils.isBlockElm(this.endContainer)) {
                    this.setEndAfter(this.endContainer);
                }
            }
            return this;
        },
        adjustmentBoundary: function () {
            if (!this.collapsed) {
                while (!domUtils.isBody(this.startContainer) &&
                    this.startOffset == this.startContainer[this.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length &&
                    this.startContainer[this.startContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length) {
                    this.setStartAfter(this.startContainer);
                }
                while (!domUtils.isBody(this.endContainer) && !this.endOffset &&
                    this.endContainer[this.endContainer.nodeType == 3 ? 'nodeValue' : 'childNodes'].length) {
                    this.setEndBefore(this.endContainer);
                }
            }
            return this;
        },
        applyInlineStyle: function (tagName, attrs, list) {
            if (this.collapsed)
                return this;
            this.trimBoundary().enlarge(false, function (node) {
                return node.nodeType == 1 && domUtils.isBlockElm(node);
            }).adjustmentBoundary();
            var bookmark = this.createBookmark();
            var end = bookmark.end;
            var filterFn = function (node) {
                return node.nodeType == 1 ? node.tagName.toLowerCase() != 'br' : !domUtils.isWhitespace(node);
            };
            var current = domUtils.getNextDomNode(bookmark.start, false, filterFn);
            var node;
            var pre;
            var range = this.cloneRange();
            while (current && (domUtils.getPosition(current, end) & domUtils.POSITION_PRECEDING)) {
                if (current.nodeType == 3 || dtd[tagName][current.tagName]) {
                    range.setStartBefore(current);
                    node = current;
                    while (node && (node.nodeType == 3 || dtd[tagName][node.tagName]) && node !== end) {
                        pre = node;
                        node = domUtils.getNextDomNode(node, node.nodeType == 1, null, function (parent) {
                            return dtd[tagName][parent.tagName];
                        });
                    }
                    var frag = range.setEndAfter(pre).extractContents();
                    var elm;
                    if (list && list.length > 0) {
                        var level, top;
                        top = level = list[0].cloneNode(false);
                        for (var i = 1, ci; ci = list[i++];) {
                            level.appendChild(ci.cloneNode(false));
                            level = level.firstChild;
                        }
                        elm = level;
                    }
                    else {
                        elm = range.document.createElement(tagName);
                    }
                    if (attrs) {
                        domUtils.setAttributes(elm, attrs);
                    }
                    elm.appendChild(frag);
                    range.insertNode(list ? top : elm);
                    var aNode;
                    if (tagName == 'span' && attrs.style && /text\-decoration/.test(attrs.style) && (aNode = domUtils.findParentByTagName(elm, 'a', true))) {
                        domUtils.setAttributes(aNode, attrs);
                        domUtils.remove(elm, true);
                        elm = aNode;
                    }
                    else {
                        domUtils.mergeSibling(elm);
                        domUtils.clearEmptySibling(elm);
                    }
                    domUtils.mergeChild(elm, attrs);
                    current = domUtils.getNextDomNode(elm, false, filterFn);
                    domUtils.mergeToParent(elm);
                    if (node === end) {
                        break;
                    }
                }
                else {
                    current = domUtils.getNextDomNode(current, true, filterFn);
                }
            }
            return this.moveToBookmark(bookmark);
        },
        removeInlineStyle: function (tagNames) {
            if (this.collapsed)
                return this;
            tagNames = utils.isArray(tagNames) ? tagNames : [tagNames];
            this.shrinkBoundary().adjustmentBoundary();
            var start = this.startContainer;
            var end = this.endContainer;
            while (1) {
                if (start.nodeType == 1) {
                    if (utils.indexOf(tagNames, start.tagName.toLowerCase()) > -1) {
                        break;
                    }
                    if (start.tagName.toLowerCase() == 'body') {
                        start = null;
                        break;
                    }
                }
                start = start.parentNode;
            }
            while (1) {
                if (end.nodeType == 1) {
                    if (utils.indexOf(tagNames, end.tagName.toLowerCase()) > -1) {
                        break;
                    }
                    if (end.tagName.toLowerCase() == 'body') {
                        end = null;
                        break;
                    }
                }
                end = end.parentNode;
            }
            var bookmark = this.createBookmark();
            var frag;
            var tmpRange;
            if (start) {
                tmpRange = this.cloneRange().setEndBefore(bookmark.start).setStartBefore(start);
                frag = tmpRange.extractContents();
                tmpRange.insertNode(frag);
                domUtils.clearEmptySibling(start, true);
                start.parentNode.insertBefore(bookmark.start, start);
            }
            if (end) {
                tmpRange = this.cloneRange().setStartAfter(bookmark.end).setEndAfter(end);
                frag = tmpRange.extractContents();
                tmpRange.insertNode(frag);
                domUtils.clearEmptySibling(end, false, true);
                end.parentNode.insertBefore(bookmark.end, end.nextSibling);
            }
            var current = domUtils.getNextDomNode(bookmark.start, false, function (node) {
                return node.nodeType == 1;
            });
            var next;
            while (current && current !== bookmark.end) {
                next = domUtils.getNextDomNode(current, true, function (node) {
                    return node.nodeType == 1;
                });
                if (utils.indexOf(tagNames, current.tagName.toLowerCase()) > -1) {
                    domUtils.remove(current, true);
                }
                current = next;
            }
            return this.moveToBookmark(bookmark);
        },
        getClosedNode: function () {
            var node;
            if (!this.collapsed) {
                var range = this.cloneRange().adjustmentBoundary().shrinkBoundary();
                if (selectOneNode(range)) {
                    var child = range.startContainer.childNodes[range.startOffset];
                    if (child && child.nodeType == 1 && (dtd.$empty[child.tagName] || dtd.$nonChild[child.tagName])) {
                        node = child;
                    }
                }
            }
            return node;
        },
        select: function (notInsertFillData) {
            function checkOffset(rng) {
                function check(node, offset, dir) {
                    if (node.nodeType == 3 && node.nodeValue.length < offset) {
                        rng[dir + 'Offset'] = node.nodeValue.length;
                    }
                }
                check(rng.startContainer, rng.startOffset, 'start');
                check(rng.endContainer, rng.endOffset, 'end');
            }
            var win = domUtils.getWindow(this.document);
            var sel = win.getSelection();
            var txtNode;
            browser.gecko ? this.document.body.focus() : win.focus();
            if (sel) {
                sel.removeAllRanges();
                if (this.collapsed && !notInsertFillData) {
                    var start = this.startContainer;
                    var child = start;
                    if (start.nodeType == 1) {
                        child = start.childNodes[this.startOffset];
                    }
                    if (!(start.nodeType == 3 && this.startOffset) &&
                        (child
                            ? (!child.previousSibling || child.previousSibling.nodeType != 3)
                            : (!start.lastChild || start.lastChild.nodeType != 3))) {
                        txtNode = this.document.createTextNode(fillChar);
                        this.insertNode(txtNode);
                        removeFillData(this.document, txtNode);
                        mergeSibling(txtNode, 'previousSibling');
                        mergeSibling(txtNode, 'nextSibling');
                        fillData = txtNode;
                        this.setStart(txtNode, browser.webkit ? 1 : 0).collapse(true);
                    }
                }
                var nativeRange = this.document.createRange();
                checkOffset(this);
                nativeRange.setStart(this.startContainer, this.startOffset);
                nativeRange.setEnd(this.endContainer, this.endOffset);
                sel.addRange(nativeRange);
            }
            return this;
        },
        scrollToView: function (win, offset) {
            win = win ? window : domUtils.getWindow(this.document);
            var me = this;
            var span = me.document.createElement('span');
            span.innerHTML = '&nbsp;';
            me.cloneRange().insertNode(span);
            domUtils.scrollToView(span, win, offset);
            domUtils.remove(span);
            return me;
        },
        inFillChar: function () {
            var start = this.startContainer;
            if (this.collapsed && start.nodeType == 3 &&
                start.nodeValue.replace(new RegExp('^' + domUtils.fillChar), '').length + 1 == start.nodeValue.length) {
                return true;
            }
            return false;
        },
        createAddress: function (ignoreEnd, ignoreTxt) {
            var addr = {};
            var me = this;
            function getAddress(isStart) {
                var node = isStart ? me.startContainer : me.endContainer;
                var parents = domUtils.findParents(node, true, function (node) {
                    return !domUtils.isBody(node);
                });
                var addrs = [];
                for (var i = 0, ci; ci = parents[i++];) {
                    addrs.push(domUtils.getNodeIndex(ci, ignoreTxt));
                }
                var firstIndex = 0;
                if (ignoreTxt) {
                    if (node.nodeType == 3) {
                        var tmpNode = node.previousSibling;
                        while (tmpNode && tmpNode.nodeType == 3) {
                            firstIndex += tmpNode.nodeValue.replace(fillCharReg, '').length;
                            tmpNode = tmpNode.previousSibling;
                        }
                        firstIndex += (isStart ? me.startOffset : me.endOffset);
                    }
                    else {
                        node = node.childNodes[isStart ? me.startOffset : me.endOffset];
                        if (node) {
                            firstIndex = domUtils.getNodeIndex(node, ignoreTxt);
                        }
                        else {
                            node = isStart ? me.startContainer : me.endContainer;
                            var first = node.firstChild;
                            while (first) {
                                if (domUtils.isFillChar(first)) {
                                    first = first.nextSibling;
                                    continue;
                                }
                                firstIndex++;
                                if (first.nodeType == 3) {
                                    while (first && first.nodeType == 3) {
                                        first = first.nextSibling;
                                    }
                                }
                                else {
                                    first = first.nextSibling;
                                }
                            }
                        }
                    }
                }
                else {
                    firstIndex = isStart ? domUtils.isFillChar(node) ? 0 : me.startOffset : me.endOffset;
                }
                if (firstIndex < 0) {
                    firstIndex = 0;
                }
                addrs.push(firstIndex);
                return addrs;
            }
            addr.startAddress = getAddress(true);
            if (!ignoreEnd) {
                addr.endAddress = me.collapsed ? [].concat(addr.startAddress) : getAddress();
            }
            return addr;
        },
        moveToAddress: function (addr, ignoreEnd) {
            var me = this;
            function getNode(address, isStart) {
                var tmpNode = me.document.body;
                var parentNode;
                var offset;
                for (var i = 0, ci, l = address.length; i < l; i++) {
                    ci = address[i];
                    parentNode = tmpNode;
                    tmpNode = tmpNode.childNodes[ci];
                    if (!tmpNode) {
                        offset = ci;
                        break;
                    }
                }
                if (isStart) {
                    if (tmpNode) {
                        me.setStartBefore(tmpNode);
                    }
                    else {
                        me.setStart(parentNode, offset);
                    }
                }
                else {
                    if (tmpNode) {
                        me.setEndBefore(tmpNode);
                    }
                    else {
                        me.setEnd(parentNode, offset);
                    }
                }
            }
            getNode(addr.startAddress, true);
            !ignoreEnd && addr.endAddress && getNode(addr.endAddress);
            return me;
        },
        equals: function (rng) {
            for (var p in this) {
                if (this.hasOwnProperty(p)) {
                    if (this[p] !== rng[p]) {
                        return false;
                    }
                }
            }
            return true;
        },
        traversal: function (doFn, filterFn) {
            if (this.collapsed) {
                return this;
            }
            var bookmark = this.createBookmark();
            var end = bookmark.end;
            var current = domUtils.getNextDomNode(bookmark.start, false, filterFn);
            while (current && current !== end && (domUtils.getPosition(current, end) & domUtils.POSITION_PRECEDING)) {
                var tmpNode = domUtils.getNextDomNode(current, false, filterFn);
                doFn(current);
                current = tmpNode;
            }
            return this.moveToBookmark(bookmark);
        }
    };
})();
