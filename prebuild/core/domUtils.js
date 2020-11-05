function getDomNode(node, start, ltr, startFromChild, fn, guard) {
    var tmpNode = startFromChild && node[start];
    var parent;
    !tmpNode && (tmpNode = node[ltr]);
    while (!tmpNode && (parent = (parent || node).parentNode)) {
        if (parent.tagName == 'BODY' || guard && !guard(parent)) {
            return null;
        }
        tmpNode = parent[ltr];
    }
    if (tmpNode && fn && !fn(tmpNode)) {
        return getDomNode(tmpNode, start, ltr, false, fn);
    }
    return tmpNode;
}
var attrFix = {
    tabindex: 'tabIndex',
    readonly: 'readOnly'
};
var styleBlock = utils.listToMap([
    '-webkit-box', '-moz-box', 'block',
    'list-item', 'table', 'table-row-group',
    'table-header-group', 'table-footer-group',
    'table-row', 'table-column-group', 'table-column',
    'table-cell', 'table-caption'
]);
var domUtils = dom.domUtils = {
    NODE_ELEMENT: 1,
    NODE_DOCUMENT: 9,
    NODE_TEXT: 3,
    NODE_COMMENT: 8,
    NODE_DOCUMENT_FRAGMENT: 11,
    POSITION_IDENTICAL: 0,
    POSITION_DISCONNECTED: 1,
    POSITION_FOLLOWING: 2,
    POSITION_PRECEDING: 4,
    POSITION_IS_CONTAINED: 8,
    POSITION_CONTAINS: 16,
    fillChar: '\u200B',
    keys: {
        8: 1, 46: 1,
        16: 1, 17: 1, 18: 1,
        37: 1,
        38: 1,
        39: 1,
        40: 1,
        13: 1
    },
    getPosition: function (nodeA, nodeB) {
        if (nodeA === nodeB) {
            return 0;
        }
        var node;
        var parentsA = [nodeA];
        var parentsB = [nodeB];
        node = nodeA;
        while (node = node.parentNode) {
            if (node === nodeB) {
                return 10;
            }
            parentsA.push(node);
        }
        node = nodeB;
        while (node = node.parentNode) {
            if (node === nodeA) {
                return 20;
            }
            parentsB.push(node);
        }
        parentsA.reverse();
        parentsB.reverse();
        if (parentsA[0] !== parentsB[0]) {
            return 1;
        }
        var i = -1;
        while (i++, parentsA[i] === parentsB[i]) {
        }
        nodeA = parentsA[i];
        nodeB = parentsB[i];
        while (nodeA = nodeA.nextSibling) {
            if (nodeA === nodeB) {
                return 4;
            }
        }
        return 2;
    },
    getNodeIndex: function (node, ignoreTextNode) {
        var preNode = node;
        var i = 0;
        while (preNode = preNode.previousSibling) {
            if (ignoreTextNode && preNode.nodeType == 3) {
                if (preNode.nodeType != preNode.nextSibling.nodeType) {
                    i++;
                }
                continue;
            }
            i++;
        }
        return i;
    },
    inDoc: function (node, doc) {
        return domUtils.getPosition(node, doc) == 10;
    },
    findParent: function (node, filterFn, includeSelf) {
        if (node && !domUtils.isBody(node)) {
            node = includeSelf ? node : node.parentNode;
            while (node) {
                if (!filterFn || filterFn(node) || domUtils.isBody(node)) {
                    return filterFn && !filterFn(node) && domUtils.isBody(node) ? null : node;
                }
                node = node.parentNode;
            }
        }
        return null;
    },
    findParentByTagName: function (node, tagNames, includeSelf, excludeFn) {
        tagNames = utils.listToMap(utils.isArray(tagNames) ? tagNames : [tagNames]);
        return domUtils.findParent(node, function (node) {
            return tagNames[node.tagName] && !(excludeFn && excludeFn(node));
        }, includeSelf);
    },
    findParents: function (node, includeSelf, filterFn, closerFirst) {
        var parents = includeSelf && (filterFn && filterFn(node) || !filterFn) ? [node] : [];
        while (node = domUtils.findParent(node, filterFn)) {
            parents.push(node);
        }
        return closerFirst ? parents : parents.reverse();
    },
    insertAfter: function (node, newNode) {
        return node.nextSibling ? node.parentNode.insertBefore(newNode, node.nextSibling)
            : node.parentNode.appendChild(newNode);
    },
    remove: function (node, keepChildren) {
        var parent = node.parentNode;
        var child;
        if (parent) {
            if (keepChildren && node.hasChildNodes()) {
                while (child = node.firstChild) {
                    parent.insertBefore(child, node);
                }
            }
            parent.removeChild(node);
        }
        return node;
    },
    getNextDomNode: function (node, startFromChild, filterFn, guard) {
        return getDomNode(node, 'firstChild', 'nextSibling', startFromChild, filterFn, guard);
    },
    getPreDomNode: function (node, startFromChild, filterFn, guard) {
        return getDomNode(node, 'lastChild', 'previousSibling', startFromChild, filterFn, guard);
    },
    isBookmarkNode: function (node) {
        return node.nodeType == 1 && node.id && /^_baidu_bookmark_/i.test(node.id);
    },
    getWindow: function (node) {
        var doc = node.ownerDocument || node;
        return doc.defaultView || doc.parentWindow;
    },
    getCommonAncestor: function (nodeA, nodeB) {
        if (nodeA === nodeB) {
            return nodeA;
        }
        var parentsA = [nodeA];
        var parentsB = [nodeB];
        var parent = nodeA;
        var i = -1;
        while (parent = parent.parentNode) {
            if (parent === nodeB) {
                return parent;
            }
            parentsA.push(parent);
        }
        parent = nodeB;
        while (parent = parent.parentNode) {
            if (parent === nodeA) {
                return parent;
            }
            parentsB.push(parent);
        }
        parentsA.reverse();
        parentsB.reverse();
        while (i++, parentsA[i] === parentsB[i]) {
        }
        return i == 0 ? null : parentsA[i - 1];
    },
    clearEmptySibling: function (node, ignoreNext, ignorePre) {
        function clear(next, dir) {
            var tmpNode;
            while (next && !domUtils.isBookmarkNode(next) && (domUtils.isEmptyInlineElement(next) ||
                !new RegExp('[^\t\n\r' + domUtils.fillChar + ']').test(next.nodeValue))) {
                tmpNode = next[dir];
                domUtils.remove(next);
                next = tmpNode;
            }
        }
        !ignoreNext && clear(node.nextSibling, 'nextSibling');
        !ignorePre && clear(node.previousSibling, 'previousSibling');
    },
    split: function (node, offset) {
        var doc = node.ownerDocument;
        var retval = node.splitText(offset);
        return retval;
    },
    isWhitespace: function (node) {
        return !new RegExp('[^ \t\n\r' + domUtils.fillChar + ']').test(node.nodeValue);
    },
    getXY: function (element) {
        var x = 0;
        var y = 0;
        while (element.offsetParent) {
            y += element.offsetTop;
            x += element.offsetLeft;
            element = element.offsetParent;
        }
        return { x: x, y: y };
    },
    on: function (element, type, handler) {
        var types = utils.isArray(type) ? type : utils.trim(type).split(/\s+/);
        var k = types.length;
        if (k) {
            while (k--) {
                type = types[k];
                if (element.addEventListener) {
                    element.addEventListener(type, handler, false);
                }
                else {
                    if (!handler._d) {
                        handler._d = {
                            els: []
                        };
                    }
                    var key = type + handler.toString();
                    var index = utils.indexOf(handler._d.els, element);
                    if (!handler._d[key] || index == -1) {
                        if (index == -1) {
                            handler._d.els.push(element);
                        }
                        if (!handler._d[key]) {
                            handler._d[key] = function (evt) {
                                return handler.call(evt.srcElement, evt || window.event);
                            };
                        }
                        element.attachEvent('on' + type, handler._d[key]);
                    }
                }
            }
        }
        element = null;
    },
    un: function (element, type, handler) {
        var types = utils.isArray(type) ? type : utils.trim(type).split(/\s+/);
        var k = types.length;
        if (k) {
            while (k--) {
                type = types[k];
                if (element.removeEventListener) {
                    element.removeEventListener(type, handler, false);
                }
                else {
                    var key = type + handler.toString();
                    try {
                        element.detachEvent('on' + type, handler._d ? handler._d[key] : handler);
                    }
                    catch (e) {
                    }
                    if (handler._d && handler._d[key]) {
                        var index = utils.indexOf(handler._d.els, element);
                        if (index != -1) {
                            handler._d.els.splice(index, 1);
                        }
                        handler._d.els.length == 0 && delete handler._d[key];
                    }
                }
            }
        }
    },
    isSameElement: function (nodeA, nodeB) {
        if (nodeA.tagName != nodeB.tagName) {
            return false;
        }
        var thisAttrs = nodeA.attributes;
        var otherAttrs = nodeB.attributes;
        if (thisAttrs.length != otherAttrs.length) {
            return false;
        }
        var attrA;
        var attrB;
        var al = 0;
        var bl = 0;
        for (var i = 0; attrA = thisAttrs[i++];) {
            if (attrA.nodeName == 'style') {
                if (attrA.specified) {
                    al++;
                }
                if (domUtils.isSameStyle(nodeA, nodeB)) {
                    continue;
                }
                else {
                    return false;
                }
            }
            attrB = nodeB.attributes[attrA.nodeName];
            if (!attrB.specified || attrA.nodeValue != attrB.nodeValue) {
                return false;
            }
        }
        return true;
    },
    isSameStyle: function (nodeA, nodeB) {
        var styleA = nodeA.style.cssText.replace(/( ?; ?)/g, ';').replace(/( ?: ?)/g, ':');
        var styleB = nodeB.style.cssText.replace(/( ?; ?)/g, ';').replace(/( ?: ?)/g, ':');
        if (!styleA || !styleB) {
            return styleA == styleB;
        }
        styleA = styleA.split(';');
        styleB = styleB.split(';');
        if (styleA.length != styleB.length) {
            return false;
        }
        for (var i = 0, ci; ci = styleA[i++];) {
            if (utils.indexOf(styleB, ci) == -1) {
                return false;
            }
        }
        return true;
    },
    isBlockElm: function (node) {
        return node.nodeType == 1 && (dtd.$block[node.tagName] || styleBlock[domUtils.getComputedStyle(node, 'display')]) && !dtd.$nonChild[node.tagName];
    },
    isBody: function (node) {
        return node && node.nodeType == 1 && node.tagName.toLowerCase() == 'body';
    },
    breakParent: function (node, parent) {
        var tmpNode;
        var parentClone = node;
        var clone = node;
        var leftNodes;
        var rightNodes;
        do {
            parentClone = parentClone.parentNode;
            if (leftNodes) {
                tmpNode = parentClone.cloneNode(false);
                tmpNode.appendChild(leftNodes);
                leftNodes = tmpNode;
                tmpNode = parentClone.cloneNode(false);
                tmpNode.appendChild(rightNodes);
                rightNodes = tmpNode;
            }
            else {
                leftNodes = parentClone.cloneNode(false);
                rightNodes = leftNodes.cloneNode(false);
            }
            while (tmpNode = clone.previousSibling) {
                leftNodes.insertBefore(tmpNode, leftNodes.firstChild);
            }
            while (tmpNode = clone.nextSibling) {
                rightNodes.appendChild(tmpNode);
            }
            clone = parentClone;
        } while (parent !== parentClone);
        tmpNode = parent.parentNode;
        tmpNode.insertBefore(leftNodes, parent);
        tmpNode.insertBefore(rightNodes, parent);
        tmpNode.insertBefore(node, rightNodes);
        domUtils.remove(parent);
        return node;
    },
    isEmptyInlineElement: function (node) {
        if (node.nodeType != 1 || !dtd.$removeEmpty[node.tagName]) {
            return 0;
        }
        node = node.firstChild;
        while (node) {
            if (domUtils.isBookmarkNode(node)) {
                return 0;
            }
            if (node.nodeType == 1 && !domUtils.isEmptyInlineElement(node) ||
                node.nodeType == 3 && !domUtils.isWhitespace(node)) {
                return 0;
            }
            node = node.nextSibling;
        }
        return 1;
    },
    trimWhiteTextNode: function (node) {
        function remove(dir) {
            var child;
            while ((child = node[dir]) && child.nodeType == 3 && domUtils.isWhitespace(child)) {
                node.removeChild(child);
            }
        }
        remove('firstChild');
        remove('lastChild');
    },
    mergeChild: function (node, tagName, attrs) {
        var list = domUtils.getElementsByTagName(node, node.tagName.toLowerCase());
        for (var i = 0, ci; ci = list[i++];) {
            if (!ci.parentNode || domUtils.isBookmarkNode(ci)) {
                continue;
            }
            if (ci.tagName.toLowerCase() == 'span') {
                if (node === ci.parentNode) {
                    domUtils.trimWhiteTextNode(node);
                    if (node.childNodes.length == 1) {
                        node.style.cssText = ci.style.cssText + ';' + node.style.cssText;
                        domUtils.remove(ci, true);
                        continue;
                    }
                }
                ci.style.cssText = node.style.cssText + ';' + ci.style.cssText;
                if (attrs) {
                    var style = attrs.style;
                    if (style) {
                        style = style.split(';');
                        for (var j = 0, s; s = style[j++];) {
                            ci.style[utils.cssStyleToDomStyle(s.split(':')[0])] = s.split(':')[1];
                        }
                    }
                }
                if (domUtils.isSameStyle(ci, node)) {
                    domUtils.remove(ci, true);
                }
                continue;
            }
            if (domUtils.isSameElement(node, ci)) {
                domUtils.remove(ci, true);
            }
        }
    },
    getElementsByTagName: function (node, name, filter) {
        if (filter && utils.isString(filter)) {
            var className = filter;
            filter = function (node) {
                return domUtils.hasClass(node, className);
            };
        }
        name = utils.trim(name).replace(/[ ]{2,}/g, ' ').split(' ');
        var arr = [];
        for (var n = 0, ni; ni = name[n++];) {
            var list = node.getElementsByTagName(ni);
            for (var i = 0, ci; ci = list[i++];) {
                if (!filter || filter(ci)) {
                    arr.push(ci);
                }
            }
        }
        return arr;
    },
    mergeToParent: function (node) {
        var parent = node.parentNode;
        while (parent && dtd.$removeEmpty[parent.tagName]) {
            if (parent.tagName == node.tagName || parent.tagName == 'A') {
                domUtils.trimWhiteTextNode(parent);
                if (parent.tagName == 'SPAN' && !domUtils.isSameStyle(parent, node) ||
                    (parent.tagName == 'A' && node.tagName == 'SPAN')) {
                    if (parent.childNodes.length > 1 || parent !== node.parentNode) {
                        node.style.cssText = parent.style.cssText + ';' + node.style.cssText;
                        parent = parent.parentNode;
                        continue;
                    }
                    else {
                        parent.style.cssText += ';' + node.style.cssText;
                        if (parent.tagName == 'A') {
                            parent.style.textDecoration = 'underline';
                        }
                    }
                }
                if (parent.tagName != 'A') {
                    parent === node.parentNode && domUtils.remove(node, true);
                    break;
                }
            }
            parent = parent.parentNode;
        }
    },
    mergeSibling: function (node, ignorePre, ignoreNext) {
        function merge(rtl, start, node) {
            var next;
            if ((next = node[rtl]) && !domUtils.isBookmarkNode(next) && next.nodeType == 1 && domUtils.isSameElement(node, next)) {
                while (next.firstChild) {
                    if (start == 'firstChild') {
                        node.insertBefore(next.lastChild, node.firstChild);
                    }
                    else {
                        node.appendChild(next.firstChild);
                    }
                }
                domUtils.remove(next);
            }
        }
        !ignorePre && merge('previousSibling', 'firstChild', node);
        !ignoreNext && merge('nextSibling', 'lastChild', node);
    },
    unSelectable: function (node) {
        node.style.MozUserSelect =
            node.style.webkitUserSelect =
                node.style.msUserSelect =
                    node.style.KhtmlUserSelect = 'none';
    },
    removeAttributes: function (node, attrNames) {
        attrNames = utils.isArray(attrNames) ? attrNames : utils.trim(attrNames).replace(/[ ]{2,}/g, ' ').split(' ');
        for (var i = 0, ci; ci = attrNames[i++];) {
            ci = attrFix[ci] || ci;
            switch (ci) {
                case 'className':
                    node[ci] = '';
                    break;
                case 'style':
                    node.style.cssText = '';
                    var val = node.getAttributeNode('style');
                    val && node.removeAttributeNode(val);
            }
            node.removeAttribute(ci);
        }
    },
    createElement: function (doc, tag, attrs) {
        return domUtils.setAttributes(doc.createElement(tag), attrs);
    },
    setAttributes: function (node, attrs) {
        for (var attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                var value = attrs[attr];
                switch (attr) {
                    case 'class':
                        node.className = value;
                        break;
                    case 'style':
                        node.style.cssText = node.style.cssText + ';' + value;
                        break;
                    case 'innerHTML':
                        node[attr] = value;
                        break;
                    case 'value':
                        node.value = value;
                        break;
                    default:
                        node.setAttribute(attrFix[attr] || attr, value);
                }
            }
        }
        return node;
    },
    getComputedStyle: function (element, styleName) {
        var pros = 'width height top left';
        if (pros.indexOf(styleName) > -1) {
            return element['offset' + styleName.replace(/^\w/, function (s) {
                return s.toUpperCase();
            })] + 'px';
        }
        if (element.nodeType == 3) {
            element = element.parentNode;
        }
        try {
            var value = domUtils.getStyle(element, styleName) ||
                (window.getComputedStyle ? domUtils.getWindow(element).getComputedStyle(element, '').getPropertyValue(styleName)
                    : (element.currentStyle || element.style)[utils.cssStyleToDomStyle(styleName)]);
        }
        catch (e) {
            return '';
        }
        return utils.transUnitToPx(utils.fixColor(styleName, value));
    },
    removeClasses: function (elm, classNames) {
        classNames = utils.isArray(classNames) ? classNames
            : utils.trim(classNames).replace(/[ ]{2,}/g, ' ').split(' ');
        for (var i = 0, ci, cls = elm.className; ci = classNames[i++];) {
            cls = cls.replace(new RegExp('\\b' + ci + '\\b'), '');
        }
        cls = utils.trim(cls).replace(/[ ]{2,}/g, ' ');
        if (cls) {
            elm.className = cls;
        }
        else {
            domUtils.removeAttributes(elm, ['class']);
        }
    },
    addClass: function (elm, classNames) {
        if (!elm)
            return;
        classNames = utils.trim(classNames).replace(/[ ]{2,}/g, ' ').split(' ');
        for (var i = 0, ci, cls = elm.className; ci = classNames[i++];) {
            if (!new RegExp('\\b' + ci + '\\b').test(cls)) {
                cls += ' ' + ci;
            }
        }
        elm.className = utils.trim(cls);
    },
    hasClass: function (element, className) {
        if (utils.isRegExp(className)) {
            return className.test(element.className);
        }
        className = utils.trim(className).replace(/[ ]{2,}/g, ' ').split(' ');
        for (var i = 0, ci, cls = element.className; ci = className[i++];) {
            if (!new RegExp('\\b' + ci + '\\b', 'i').test(cls)) {
                return false;
            }
        }
        return i - 1 == className.length;
    },
    preventDefault: function (evt) {
        evt.preventDefault ? evt.preventDefault() : (evt.returnValue = false);
    },
    removeStyle: function (element, name) {
        if (element.style.removeProperty) {
            element.style.removeProperty(name);
        }
        else {
            element.style.removeAttribute(utils.cssStyleToDomStyle(name));
        }
        if (!element.style.cssText) {
            domUtils.removeAttributes(element, ['style']);
        }
    },
    getStyle: function (element, name) {
        var value = element.style[utils.cssStyleToDomStyle(name)];
        return utils.fixColor(name, value);
    },
    setStyle: function (element, name, value) {
        element.style[utils.cssStyleToDomStyle(name)] = value;
        if (!utils.trim(element.style.cssText)) {
            this.removeAttributes(element, 'style');
        }
    },
    setStyles: function (element, styles) {
        for (var name in styles) {
            if (styles.hasOwnProperty(name)) {
                domUtils.setStyle(element, name, styles[name]);
            }
        }
    },
    removeDirtyAttr: function (node) {
        for (var i = 0, ci, nodes = node.getElementsByTagName('*'); ci = nodes[i++];) {
            ci.removeAttribute('_moz_dirty');
        }
        node.removeAttribute('_moz_dirty');
    },
    getChildCount: function (node, fn) {
        var count = 0;
        var first = node.firstChild;
        fn = fn || function () {
            return 1;
        };
        while (first) {
            if (fn(first)) {
                count++;
            }
            first = first.nextSibling;
        }
        return count;
    },
    isEmptyNode: function (node) {
        return !node.firstChild || domUtils.getChildCount(node, function (node) {
            return !domUtils.isBr(node) && !domUtils.isBookmarkNode(node) && !domUtils.isWhitespace(node);
        }) == 0;
    },
    clearSelectedArr: function (nodes) {
        var node;
        while (node = nodes.pop()) {
            domUtils.removeAttributes(node, ['class']);
        }
    },
    scrollToView: function (node, win, offsetTop) {
        var getViewPaneSize = function () {
            var doc = win.document;
            var mode = doc.compatMode == 'CSS1Compat';
            return {
                width: (mode ? doc.documentElement.clientWidth : doc.body.clientWidth) || 0,
                height: (mode ? doc.documentElement.clientHeight : doc.body.clientHeight) || 0
            };
        };
        var getScrollPosition = function (win) {
            if ('pageXOffset' in win) {
                return {
                    x: win.pageXOffset || 0,
                    y: win.pageYOffset || 0
                };
            }
            else {
                var doc = win.document;
                return {
                    x: doc.documentElement.scrollLeft || doc.body.scrollLeft || 0,
                    y: doc.documentElement.scrollTop || doc.body.scrollTop || 0
                };
            }
        };
        var winHeight = getViewPaneSize().height;
        var offset = winHeight * -1 + offsetTop;
        offset += (node.offsetHeight || 0);
        var elementPosition = domUtils.getXY(node);
        offset += elementPosition.y;
        var currentScroll = getScrollPosition(win).y;
        if (offset > currentScroll || offset < currentScroll - winHeight) {
            win.scrollTo(0, offset + (offset < 0 ? -20 : 20));
        }
    },
    isBr: function (node) {
        return node.nodeType == 1 && node.tagName == 'BR';
    },
    isFillChar: function (node, isInStart) {
        if (node.nodeType != 3) {
            return false;
        }
        var text = node.nodeValue;
        if (isInStart) {
            return new RegExp('^' + domUtils.fillChar).test(text);
        }
        return !text.replace(new RegExp(domUtils.fillChar, 'g'), '').length;
    },
    isStartInblock: function (range) {
        var tmpRange = range.cloneRange();
        var flag = 0;
        var start = tmpRange.startContainer;
        var tmp;
        if (start.nodeType == 1 && start.childNodes[tmpRange.startOffset]) {
            start = start.childNodes[tmpRange.startOffset];
            var pre = start.previousSibling;
            while (pre && domUtils.isFillChar(pre)) {
                start = pre;
                pre = pre.previousSibling;
            }
        }
        if (this.isFillChar(start, true) && tmpRange.startOffset == 1) {
            tmpRange.setStartBefore(start);
            start = tmpRange.startContainer;
        }
        while (start && domUtils.isFillChar(start)) {
            tmp = start;
            start = start.previousSibling;
        }
        if (tmp) {
            tmpRange.setStartBefore(tmp);
            start = tmpRange.startContainer;
        }
        if (start.nodeType == 1 && domUtils.isEmptyNode(start) && tmpRange.startOffset == 1) {
            tmpRange.setStart(start, 0).collapse(true);
        }
        while (!tmpRange.startOffset) {
            start = tmpRange.startContainer;
            if (domUtils.isBlockElm(start) || domUtils.isBody(start)) {
                flag = 1;
                break;
            }
            var pre = tmpRange.startContainer.previousSibling;
            var tmpNode;
            if (!pre) {
                tmpRange.setStartBefore(tmpRange.startContainer);
            }
            else {
                while (pre && domUtils.isFillChar(pre)) {
                    tmpNode = pre;
                    pre = pre.previousSibling;
                }
                if (tmpNode) {
                    tmpRange.setStartBefore(tmpNode);
                }
                else {
                    tmpRange.setStartBefore(tmpRange.startContainer);
                }
            }
        }
        return flag && !domUtils.isBody(tmpRange.startContainer) ? 1 : 0;
    },
    isEmptyBlock: function (node, reg) {
        if (node.nodeType != 1) {
            return 0;
        }
        reg = reg || new RegExp('[ \xa0\t\r\n' + domUtils.fillChar + ']', 'g');
        if (node.textContent.replace(reg, '').length > 0) {
            return 0;
        }
        for (var n in dtd.$isNotEmpty) {
            if (node.getElementsByTagName(n).length) {
                return 0;
            }
        }
        return 1;
    },
    setViewportOffset: function (element, offset) {
        var left = parseInt(element.style.left) | 0;
        var top = parseInt(element.style.top) | 0;
        var rect = element.getBoundingClientRect();
        var offsetLeft = offset.left - rect.left;
        var offsetTop = offset.top - rect.top;
        if (offsetLeft) {
            element.style.left = left + offsetLeft + 'px';
        }
        if (offsetTop) {
            element.style.top = top + offsetTop + 'px';
        }
    },
    fillNode: function (doc, node) {
        var tmpNode = doc.createElement('br');
        node.innerHTML = '';
        node.appendChild(tmpNode);
    },
    moveChild: function (src, tag, dir) {
        while (src.firstChild) {
            if (dir && tag.firstChild) {
                tag.insertBefore(src.lastChild, tag.firstChild);
            }
            else {
                tag.appendChild(src.firstChild);
            }
        }
    },
    hasNoAttributes: function (node) {
        return node.attributes.length === 0;
    },
    isCustomeNode: function (node) {
        return node.nodeType == 1 && node.getAttribute('_ue_custom_node_');
    },
    isTagNode: function (node, tagNames) {
        return node.nodeType == 1 && new RegExp('\\b' + node.tagName + '\\b', 'i').test(tagNames);
    },
    filterNodeList: function (nodelist, filter, forAll) {
        var results = [];
        if (!utils.isFunction(filter)) {
            var str = filter;
            filter = function (n) {
                return utils.indexOf(utils.isArray(str) ? str : str.split(' '), n.tagName.toLowerCase()) != -1;
            };
        }
        utils.each(nodelist, function (n) {
            filter(n) && results.push(n);
        });
        return results.length == 0 ? null : results.length == 1 || !forAll ? results[0] : results;
    },
    isInNodeEndBoundary: function (rng, node) {
        var start = rng.startContainer;
        if (start.nodeType == 3 && rng.startOffset != start.nodeValue.length) {
            return 0;
        }
        if (start.nodeType == 1 && rng.startOffset != start.childNodes.length) {
            return 0;
        }
        while (start !== node) {
            if (start.nextSibling) {
                return 0;
            }
            start = start.parentNode;
        }
        return 1;
    },
    isBoundaryNode: function (node, dir) {
        var tmp;
        while (!domUtils.isBody(node)) {
            tmp = node;
            node = node.parentNode;
            if (tmp !== node[dir]) {
                return false;
            }
        }
        return true;
    },
    fillHtml: '<br/>'
};
var fillCharReg = new RegExp(domUtils.fillChar, 'g');
