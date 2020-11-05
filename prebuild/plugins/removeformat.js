UE.plugins.removeformat = function () {
    var me = this;
    me.setOpt({
        removeFormatTags: 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var',
        removeFormatAttributes: 'class,style,lang,width,height,align,hspace,valign'
    });
    me.commands.removeformat = {
        execCommand: function (cmdName, tags, style, attrs, notIncludeA) {
            var tagReg = new RegExp('^(?:' + (tags || this.options.removeFormatTags).replace(/,/g, '|') + ')$', 'i');
            var removeFormatAttributes = style ? [] : (attrs || this.options.removeFormatAttributes).split(',');
            var range = new dom.Range(this.document);
            var bookmark;
            var node;
            var parent;
            var filter = function (node) {
                return node.nodeType == 1;
            };
            function isRedundantSpan(node) {
                if (node.nodeType == 3 || node.tagName.toLowerCase() != 'span') {
                    return 0;
                }
                return !node.attributes.length;
            }
            function doRemove(range) {
                var bookmark1 = range.createBookmark();
                if (range.collapsed) {
                    range.enlarge(true);
                }
                if (!notIncludeA) {
                    var aNode = domUtils.findParentByTagName(range.startContainer, 'a', true);
                    if (aNode) {
                        range.setStartBefore(aNode);
                    }
                    aNode = domUtils.findParentByTagName(range.endContainer, 'a', true);
                    if (aNode) {
                        range.setEndAfter(aNode);
                    }
                }
                bookmark = range.createBookmark();
                node = bookmark.start;
                while ((parent = node.parentNode) && !domUtils.isBlockElm(parent)) {
                    domUtils.breakParent(node, parent);
                    domUtils.clearEmptySibling(node);
                }
                if (bookmark.end) {
                    node = bookmark.end;
                    while ((parent = node.parentNode) && !domUtils.isBlockElm(parent)) {
                        domUtils.breakParent(node, parent);
                        domUtils.clearEmptySibling(node);
                    }
                    var current = domUtils.getNextDomNode(bookmark.start, false, filter);
                    var next;
                    while (current) {
                        if (current == bookmark.end) {
                            break;
                        }
                        next = domUtils.getNextDomNode(current, true, filter);
                        if (!dtd.$empty[current.tagName.toLowerCase()] && !domUtils.isBookmarkNode(current)) {
                            if (tagReg.test(current.tagName)) {
                                if (style) {
                                    domUtils.removeStyle(current, style);
                                    if (isRedundantSpan(current) && style != 'text-decoration') {
                                        domUtils.remove(current, true);
                                    }
                                }
                                else {
                                    domUtils.remove(current, true);
                                }
                            }
                            else {
                                if (!dtd.$tableContent[current.tagName] && !dtd.$list[current.tagName]) {
                                    domUtils.removeAttributes(current, removeFormatAttributes);
                                    if (isRedundantSpan(current)) {
                                        domUtils.remove(current, true);
                                    }
                                }
                            }
                        }
                        current = next;
                    }
                }
                var pN = bookmark.start.parentNode;
                if (domUtils.isBlockElm(pN) && !dtd.$tableContent[pN.tagName] && !dtd.$list[pN.tagName]) {
                    domUtils.removeAttributes(pN, removeFormatAttributes);
                }
                pN = bookmark.end.parentNode;
                if (bookmark.end && domUtils.isBlockElm(pN) && !dtd.$tableContent[pN.tagName] && !dtd.$list[pN.tagName]) {
                    domUtils.removeAttributes(pN, removeFormatAttributes);
                }
                range.moveToBookmark(bookmark).moveToBookmark(bookmark1);
                var node = range.startContainer;
                var tmp;
                var collapsed = range.collapsed;
                while (node.nodeType == 1 && domUtils.isEmptyNode(node) && dtd.$removeEmpty[node.tagName]) {
                    tmp = node.parentNode;
                    range.setStartBefore(node);
                    if (range.startContainer === range.endContainer) {
                        range.endOffset--;
                    }
                    domUtils.remove(node);
                    node = tmp;
                }
                if (!collapsed) {
                    node = range.endContainer;
                    while (node.nodeType == 1 && domUtils.isEmptyNode(node) && dtd.$removeEmpty[node.tagName]) {
                        tmp = node.parentNode;
                        range.setEndBefore(node);
                        domUtils.remove(node);
                        node = tmp;
                    }
                }
            }
            range = this.selection.getRange();
            doRemove(range);
            range.select();
        }
    };
};
