(function () {
    var block = domUtils.isBlockElm;
    var getObj = function (editor) {
        return domUtils.filterNodeList(editor.selection.getStartElementPath(), function (n) { return n && n.nodeType == 1 && n.getAttribute('dir'); });
    };
    var doDirectionality = function (range, editor, forward) {
        var bookmark;
        var filterFn = function (node) {
            return node.nodeType == 1 ? !domUtils.isBookmarkNode(node) : !domUtils.isWhitespace(node);
        };
        var obj = getObj(editor);
        if (obj && range.collapsed) {
            obj.setAttribute('dir', forward);
            return range;
        }
        bookmark = range.createBookmark();
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
                var common = tmpRange.getCommonAncestor();
                if (!domUtils.isBody(common) && block(common)) {
                    common.setAttribute('dir', forward);
                    current = common;
                }
                else {
                    var p = range.document.createElement('p');
                    p.setAttribute('dir', forward);
                    var frag = tmpRange.extractContents();
                    p.appendChild(frag);
                    tmpRange.insertNode(p);
                    current = p;
                }
                current = domUtils.getNextDomNode(current, false, filterFn);
            }
            else {
                current = domUtils.getNextDomNode(current, true, filterFn);
            }
        }
        return range.moveToBookmark(bookmark2).moveToBookmark(bookmark);
    };
    UE.commands.directionality = {
        execCommand: function (cmdName, forward) {
            var range = this.selection.getRange();
            if (range.collapsed) {
                var txt = this.document.createTextNode('d');
                range.insertNode(txt);
            }
            doDirectionality(range, this, forward);
            if (txt) {
                range.setStartBefore(txt).collapse(true);
                domUtils.remove(txt);
            }
            range.select();
            return true;
        },
        queryCommandValue: function () {
            var node = getObj(this);
            return node ? node.getAttribute('dir') : 'ltr';
        }
    };
})();
