UE.commands.inserthtml = {
    execCommand: function (command, html, notNeedFilter) {
        var me = this;
        var range;
        var div;
        if (!html) {
            return;
        }
        if (me.fireEvent('beforeinserthtml', html) === true) {
            return;
        }
        range = me.selection.getRange();
        div = range.document.createElement('div');
        div.style.display = 'inline';
        if (!notNeedFilter) {
            var root = UE.htmlparser(html);
            if (me.options.filterRules) {
                UE.filterNode(root, me.options.filterRules);
            }
            me.filterInputRule(root);
            html = root.toHtml();
        }
        div.innerHTML = utils.trim(html);
        if (!range.collapsed) {
            var tmpNode = range.startContainer;
            if (domUtils.isFillChar(tmpNode)) {
                range.setStartBefore(tmpNode);
            }
            tmpNode = range.endContainer;
            if (domUtils.isFillChar(tmpNode)) {
                range.setEndAfter(tmpNode);
            }
            range.txtToElmBoundary();
            if (range.endContainer && range.endContainer.nodeType == 1) {
                tmpNode = range.endContainer.childNodes[range.endOffset];
                if (tmpNode && domUtils.isBr(tmpNode)) {
                    range.setEndAfter(tmpNode);
                }
            }
            if (range.startOffset == 0) {
                tmpNode = range.startContainer;
                if (domUtils.isBoundaryNode(tmpNode, 'firstChild')) {
                    tmpNode = range.endContainer;
                    if (range.endOffset == (tmpNode.nodeType == 3 ? tmpNode.nodeValue.length : tmpNode.childNodes.length) && domUtils.isBoundaryNode(tmpNode, 'lastChild')) {
                        me.body.innerHTML = '<p><br/></p>';
                        range.setStart(me.body.firstChild, 0).collapse(true);
                    }
                }
            }
            !range.collapsed && range.deleteContents();
            if (range.startContainer.nodeType == 1) {
                var child = range.startContainer.childNodes[range.startOffset];
                var pre;
                if (child && domUtils.isBlockElm(child) && (pre = child.previousSibling) && domUtils.isBlockElm(pre)) {
                    range.setEnd(pre, pre.childNodes.length).collapse();
                    while (child.firstChild) {
                        pre.appendChild(child.firstChild);
                    }
                    domUtils.remove(child);
                }
            }
        }
        var child;
        var parent;
        var pre;
        var tmp;
        var hadBreak = 0;
        var nextNode;
        if (range.inFillChar()) {
            child = range.startContainer;
            if (domUtils.isFillChar(child)) {
                range.setStartBefore(child).collapse(true);
                domUtils.remove(child);
            }
            else if (domUtils.isFillChar(child, true)) {
                child.nodeValue = child.nodeValue.replace(fillCharReg, '');
                range.startOffset--;
                range.collapsed && range.collapse(true);
            }
        }
        var li = domUtils.findParentByTagName(range.startContainer, 'li', true);
        if (li) {
            var next, last;
            while (child = div.firstChild) {
                while (child && (child.nodeType == 3 || !domUtils.isBlockElm(child) || child.tagName == 'HR')) {
                    next = child.nextSibling;
                    range.insertNode(child).collapse();
                    last = child;
                    child = next;
                }
                if (child) {
                    if (/^(ol|ul)$/i.test(child.tagName)) {
                        while (child.firstChild) {
                            last = child.firstChild;
                            domUtils.insertAfter(li, child.firstChild);
                            li = li.nextSibling;
                        }
                        domUtils.remove(child);
                    }
                    else {
                        var tmpLi;
                        next = child.nextSibling;
                        tmpLi = me.document.createElement('li');
                        domUtils.insertAfter(li, tmpLi);
                        tmpLi.appendChild(child);
                        last = child;
                        child = next;
                        li = tmpLi;
                    }
                }
            }
            li = domUtils.findParentByTagName(range.startContainer, 'li', true);
            if (domUtils.isEmptyBlock(li)) {
                domUtils.remove(li);
            }
            if (last) {
                range.setStartAfter(last).collapse(true).select(true);
            }
        }
        else {
            while (child = div.firstChild) {
                if (hadBreak) {
                    var p = me.document.createElement('p');
                    while (child && (child.nodeType == 3 || !dtd.$block[child.tagName])) {
                        nextNode = child.nextSibling;
                        p.appendChild(child);
                        child = nextNode;
                    }
                    if (p.firstChild) {
                        child = p;
                    }
                }
                range.insertNode(child);
                nextNode = child.nextSibling;
                if (!hadBreak && child.nodeType == domUtils.NODE_ELEMENT && domUtils.isBlockElm(child)) {
                    parent = domUtils.findParent(child, function (node) { return domUtils.isBlockElm(node); });
                    if (parent && parent.tagName.toLowerCase() != 'body' && !(dtd[parent.tagName][child.nodeName] && child.parentNode === parent)) {
                        if (!dtd[parent.tagName][child.nodeName]) {
                            pre = parent;
                        }
                        else {
                            tmp = child.parentNode;
                            while (tmp !== parent) {
                                pre = tmp;
                                tmp = tmp.parentNode;
                            }
                        }
                        domUtils.breakParent(child, pre || tmp);
                        var pre = child.previousSibling;
                        domUtils.trimWhiteTextNode(pre);
                        if (!pre.childNodes.length) {
                            domUtils.remove(pre);
                        }
                        if ((next = child.nextSibling) &&
                            domUtils.isBlockElm(next) &&
                            next.lastChild &&
                            !domUtils.isBr(next.lastChild)) {
                            next.appendChild(me.document.createElement('br'));
                        }
                        hadBreak = 1;
                    }
                }
                var next = child.nextSibling;
                if (!div.firstChild && next && domUtils.isBlockElm(next)) {
                    range.setStart(next, 0).collapse(true);
                    break;
                }
                range.setEndAfter(child).collapse();
            }
            child = range.startContainer;
            if (nextNode && domUtils.isBr(nextNode)) {
                domUtils.remove(nextNode);
            }
            if (domUtils.isBlockElm(child) && domUtils.isEmptyNode(child)) {
                if (nextNode = child.nextSibling) {
                    domUtils.remove(child);
                    if (nextNode.nodeType == 1 && dtd.$block[nextNode.tagName]) {
                        range.setStart(nextNode, 0).collapse(true).shrinkBoundary();
                    }
                }
                else {
                    try {
                        child.innerHTML = '<br/>';
                    }
                    catch (e) {
                        range.setStartBefore(child);
                        domUtils.remove(child);
                    }
                }
            }
            try {
                range.select(true);
            }
            catch (e) { }
        }
        setTimeout(function () {
            range = me.selection.getRange();
            range.scrollToView(me.autoHeightEnabled, me.autoHeightEnabled ? domUtils.getXY(me.iframe).y : 0);
            me.fireEvent('afterinserthtml', html);
        }, 200);
    }
};
