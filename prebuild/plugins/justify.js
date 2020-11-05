UE.plugins.justify = function () {
    var me = this;
    var block = domUtils.isBlockElm;
    var defaultValue = {
        left: 1,
        right: 1,
        center: 1,
        justify: 1
    };
    var doJustify = function (range, style) {
        var bookmark = range.createBookmark();
        var filterFn = function (node) {
            return node.nodeType == 1 ? node.tagName.toLowerCase() != 'br' && !domUtils.isBookmarkNode(node) : !domUtils.isWhitespace(node);
        };
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
                    domUtils.setStyles(common, utils.isString(style) ? { 'text-align': style } : style);
                    current = common;
                }
                else {
                    var p = range.document.createElement('p');
                    domUtils.setStyles(p, utils.isString(style) ? { 'text-align': style } : style);
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
    UE.commands.justify = {
        execCommand: function (cmdName, align) {
            var range = this.selection.getRange();
            var txt;
            if (range.collapsed) {
                txt = this.document.createTextNode('p');
                range.insertNode(txt);
            }
            doJustify(range, align);
            if (txt) {
                range.setStartBefore(txt).collapse(true);
                domUtils.remove(txt);
            }
            range.select();
            return true;
        },
        queryCommandValue: function () {
            var startNode = this.selection.getStart();
            var value = domUtils.getComputedStyle(startNode, 'text-align');
            return defaultValue[value] ? value : 'left';
        },
        queryCommandState: function () {
            var start = this.selection.getStart();
            var cell = start && domUtils.findParentByTagName(start, ['td', 'th', 'caption'], true);
            return cell ? -1 : 0;
        }
    };
};
