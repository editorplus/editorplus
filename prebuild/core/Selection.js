(function () {
    function getBoundaryInformation(range, start) {
        var getIndex = domUtils.getNodeIndex;
        range = range.duplicate();
        range.collapse(start);
        var parent = range.parentElement();
        if (!parent.hasChildNodes()) {
            return { container: parent, offset: 0 };
        }
        var siblings = parent.children;
        var child;
        var testRange = range.duplicate();
        var startIndex = 0;
        var endIndex = siblings.length - 1;
        var index = -1;
        var distance;
        while (startIndex <= endIndex) {
            index = Math.floor((startIndex + endIndex) / 2);
            child = siblings[index];
            testRange.moveToElementText(child);
            var position = testRange.compareEndPoints('StartToStart', range);
            if (position > 0) {
                endIndex = index - 1;
            }
            else if (position < 0) {
                startIndex = index + 1;
            }
            else {
                return { container: parent, offset: getIndex(child) };
            }
        }
        if (index == -1) {
            testRange.moveToElementText(parent);
            testRange.setEndPoint('StartToStart', range);
            distance = testRange.text.replace(/(\r\n|\r)/g, '\n').length;
            siblings = parent.childNodes;
            if (!distance) {
                child = siblings[siblings.length - 1];
                return { container: child, offset: child.nodeValue.length };
            }
            var i = siblings.length;
            while (distance > 0) {
                distance -= siblings[--i].nodeValue.length;
            }
            return { container: siblings[i], offset: -distance };
        }
        testRange.collapse(position > 0);
        testRange.setEndPoint(position > 0 ? 'StartToStart' : 'EndToStart', range);
        distance = testRange.text.replace(/(\r\n|\r)/g, '\n').length;
        if (!distance) {
            return dtd.$empty[child.tagName] || dtd.$nonChild[child.tagName]
                ? { container: parent, offset: getIndex(child) + (position > 0 ? 0 : 1) }
                : { container: child, offset: position > 0 ? 0 : child.childNodes.length };
        }
        while (distance > 0) {
            try {
                var pre = child;
                child = child[position > 0 ? 'previousSibling' : 'nextSibling'];
                distance -= child.nodeValue.length;
            }
            catch (e) {
                return { container: parent, offset: getIndex(pre) };
            }
        }
        return { container: child, offset: position > 0 ? -distance : child.nodeValue.length + distance };
    }
    function transformIERangeToRange(ieRange, range) {
        if (ieRange.item) {
            range.selectNode(ieRange.item(0));
        }
        else {
            var bi = getBoundaryInformation(ieRange, true);
            range.setStart(bi.container, bi.offset);
            if (ieRange.compareEndPoints('StartToEnd', ieRange) != 0) {
                bi = getBoundaryInformation(ieRange, false);
                range.setEnd(bi.container, bi.offset);
            }
        }
        return range;
    }
    function _getIERange(sel) {
        var ieRange;
        try {
            ieRange = sel.getNative().createRange();
        }
        catch (e) {
            return null;
        }
        var el = ieRange.item ? ieRange.item(0) : ieRange.parentElement();
        if ((el.ownerDocument || el) === sel.document) {
            return ieRange;
        }
        return null;
    }
    var Selection = dom.Selection = function (doc) {
        var me = this;
        var iframe;
        me.document = doc;
        iframe = doc = null;
    };
    Selection.prototype = {
        rangeInBody: function (rng, txtRange) {
            var node = txtRange ? rng.item ? rng.item() : rng.parentElement() : rng.startContainer;
            return node === this.document.body || domUtils.inDoc(node, this.document);
        },
        getNative: function () {
            var doc = this.document;
            try {
                return !doc ? null : false ? doc.selection : domUtils.getWindow(doc).getSelection();
            }
            catch (e) {
                return null;
            }
        },
        getIERange: function () {
            var ieRange = _getIERange(this);
            if (!ieRange) {
                if (this._bakIERange) {
                    return this._bakIERange;
                }
            }
            return ieRange;
        },
        cache: function () {
            this.clear();
            this._cachedRange = this.getRange();
            this._cachedStartElement = this.getStart();
            this._cachedStartElementPath = this.getStartElementPath();
        },
        getStartElementPath: function () {
            if (this._cachedStartElementPath) {
                return this._cachedStartElementPath;
            }
            var start = this.getStart();
            if (start) {
                return domUtils.findParents(start, true, null, true);
            }
            return [];
        },
        clear: function () {
            this._cachedStartElementPath = this._cachedRange = this._cachedStartElement = null;
        },
        isFocus: function () {
            try {
                return !!this.getNative().rangeCount;
            }
            catch (e) {
                return false;
            }
        },
        getRange: function () {
            var me = this;
            function optimze(range) {
                var child = me.document.body.firstChild;
                var collapsed = range.collapsed;
                while (child && child.firstChild) {
                    range.setStart(child, 0);
                    child = child.firstChild;
                }
                if (!range.startContainer) {
                    range.setStart(me.document.body, 0);
                }
                if (collapsed) {
                    range.collapse(true);
                }
            }
            if (me._cachedRange != null) {
                return this._cachedRange;
            }
            var range = new baidu.editor.dom.Range(me.document);
            var sel = me.getNative();
            if (sel && sel.rangeCount) {
                var firstRange = sel.getRangeAt(0);
                var lastRange = sel.getRangeAt(sel.rangeCount - 1);
                range.setStart(firstRange.startContainer, firstRange.startOffset).setEnd(lastRange.endContainer, lastRange.endOffset);
                if (range.collapsed && domUtils.isBody(range.startContainer) && !range.startOffset) {
                    optimze(range);
                }
            }
            else {
                if (this._bakRange && domUtils.inDoc(this._bakRange.startContainer, this.document)) {
                    return this._bakRange;
                }
                optimze(range);
            }
            return this._bakRange = range;
        },
        getStart: function () {
            if (this._cachedStartElement) {
                return this._cachedStartElement;
            }
            var range = this.getRange();
            var tmpRange;
            var start;
            var tmp;
            var parent;
            range.shrinkBoundary();
            start = range.startContainer;
            if (start.nodeType == 1 && start.hasChildNodes()) {
                start = start.childNodes[Math.min(start.childNodes.length - 1, range.startOffset)];
            }
            if (start.nodeType == 3) {
                return start.parentNode;
            }
            return start;
        },
        getText: function () {
            var nativeSel, nativeRange;
            if (this.isFocus() && (nativeSel = this.getNative())) {
                nativeRange = nativeSel.getRangeAt(0);
                return nativeRange.toString();
            }
            return '';
        },
        clearRange: function () {
            this.getNative().removeAllRanges();
        }
    };
})();
