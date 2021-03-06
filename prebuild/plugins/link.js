UE.plugins.link = function () {
    function optimize(range) {
        var start = range.startContainer;
        var end = range.endContainer;
        if (start = domUtils.findParentByTagName(start, 'a', true)) {
            range.setStartBefore(start);
        }
        if (end = domUtils.findParentByTagName(end, 'a', true)) {
            range.setEndAfter(end);
        }
    }
    UE.commands.unlink = {
        execCommand: function () {
            var range = this.selection.getRange();
            var bookmark;
            if (range.collapsed && !domUtils.findParentByTagName(range.startContainer, 'a', true)) {
                return;
            }
            bookmark = range.createBookmark();
            optimize(range);
            range.removeInlineStyle('a').moveToBookmark(bookmark).select();
        },
        queryCommandState: function () {
            return !this.highlight && this.queryCommandValue('link') ? 0 : -1;
        }
    };
    function doLink(range, opt, me) {
        var rngClone = range.cloneRange();
        var link = me.queryCommandValue('link');
        optimize(range = range.adjustmentBoundary());
        var start = range.startContainer;
        if (start.nodeType == 1 && link) {
            start = start.childNodes[range.startOffset];
            if (start && start.nodeType == 1 && start.tagName == 'A' && /^(?:https?|ftp|file)\s*:\s*\/\//.test(start.textContent)) {
                start.textContent = utils.html(opt.textValue || opt.href);
            }
        }
        if (!rngClone.collapsed || link) {
            range.removeInlineStyle('a');
            rngClone = range.cloneRange();
        }
        if (rngClone.collapsed) {
            var a = range.document.createElement('a');
            var text = '';
            if (opt.textValue) {
                text = utils.html(opt.textValue);
                delete opt.textValue;
            }
            else {
                text = utils.html(opt.href);
            }
            domUtils.setAttributes(a, opt);
            start = domUtils.findParentByTagName(rngClone.startContainer, 'a', true);
            if (start && domUtils.isInNodeEndBoundary(rngClone, start)) {
                range.setStartAfter(start).collapse(true);
            }
            a.textContent = text;
            range.insertNode(a).selectNode(a);
        }
        else {
            range.applyInlineStyle('a', opt);
        }
    }
    UE.commands.link = {
        execCommand: function (cmdName, opt) {
            var range;
            opt._href && (opt._href = utils.unhtml(opt._href, /[<">]/g));
            opt.href && (opt.href = utils.unhtml(opt.href, /[<">]/g));
            opt.textValue && (opt.textValue = utils.unhtml(opt.textValue, /[<">]/g));
            doLink(range = this.selection.getRange(), opt, this);
            range.collapse().select(true);
        },
        queryCommandValue: function () {
            var range = this.selection.getRange();
            var node;
            if (range.collapsed) {
                node = range.startContainer;
                node = node.nodeType == 1 ? node : node.parentNode;
                if (node && (node = domUtils.findParentByTagName(node, 'a', true)) && !domUtils.isInNodeEndBoundary(range, node)) {
                    return node;
                }
            }
            else {
                range.shrinkBoundary();
                var start = range.startContainer.nodeType == 3 || !range.startContainer.childNodes[range.startOffset] ? range.startContainer : range.startContainer.childNodes[range.startOffset];
                var end = range.endContainer.nodeType == 3 || range.endOffset == 0 ? range.endContainer : range.endContainer.childNodes[range.endOffset - 1];
                var common = range.getCommonAncestor();
                node = domUtils.findParentByTagName(common, 'a', true);
                if (!node && common.nodeType == 1) {
                    var as = common.getElementsByTagName('a');
                    var ps;
                    var pe;
                    for (var i = 0, ci; ci = as[i++];) {
                        ps = domUtils.getPosition(ci, start), pe = domUtils.getPosition(ci, end);
                        if ((ps & domUtils.POSITION_FOLLOWING || ps & domUtils.POSITION_CONTAINS) &&
                            (pe & domUtils.POSITION_PRECEDING || pe & domUtils.POSITION_CONTAINS)) {
                            node = ci;
                            break;
                        }
                    }
                }
                return node;
            }
        },
        queryCommandState: function () {
            var img = this.selection.getRange().getClosedNode();
            var flag = img && (img.className == 'edui-faked-video' || img.className.indexOf('edui-upload-video') != -1);
            return flag ? -1 : 0;
        }
    };
};
