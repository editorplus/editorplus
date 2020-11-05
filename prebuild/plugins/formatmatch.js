UE.plugins.formatmatch = function () {
    var me = this;
    var list = [];
    var img;
    var flag = 0;
    me.addListener('reset', function () {
        list = [];
        flag = 0;
    });
    function addList(type, evt) {
        if (browser.webkit) {
            var target = evt.target.tagName == 'IMG' ? evt.target : null;
        }
        function addFormat(range) {
            if (text) {
                range.selectNode(text);
            }
            return range.applyInlineStyle(list[list.length - 1].tagName, null, list);
        }
        me.undoManger && me.undoManger.save();
        var range = me.selection.getRange();
        var imgT = target || range.getClosedNode();
        if (img && imgT && imgT.tagName == 'IMG') {
            imgT.style.cssText += ';float:' + (img.style.cssFloat || img.style.styleFloat || 'none') + ';display:' + (img.style.display || 'inline');
            img = null;
        }
        else {
            if (!img) {
                var collapsed = range.collapsed;
                if (collapsed) {
                    var text = me.document.createTextNode('match');
                    range.insertNode(text).select();
                }
                me.__hasEnterExecCommand = true;
                var removeFormatAttributes = me.options.removeFormatAttributes;
                me.options.removeFormatAttributes = '';
                me.execCommand('removeformat');
                me.options.removeFormatAttributes = removeFormatAttributes;
                me.__hasEnterExecCommand = false;
                range = me.selection.getRange();
                if (list.length) {
                    addFormat(range);
                }
                if (text) {
                    range.setStartBefore(text).collapse(true);
                }
                range.select();
                text && domUtils.remove(text);
            }
        }
        me.undoManger && me.undoManger.save();
        me.removeListener('mouseup', addList);
        flag = 0;
    }
    me.commands.formatmatch = {
        execCommand: function (cmdName) {
            if (flag) {
                flag = 0;
                list = [];
                me.removeListener('mouseup', addList);
                return;
            }
            var range = me.selection.getRange();
            img = range.getClosedNode();
            if (!img || img.tagName != 'IMG') {
                range.collapse(true).shrinkBoundary();
                var start = range.startContainer;
                list = domUtils.findParents(start, true, function (node) {
                    return !domUtils.isBlockElm(node) && node.nodeType == 1;
                });
                for (var i = 0, ci; ci = list[i]; i++) {
                    if (ci.tagName == 'A') {
                        list.splice(i, 1);
                        break;
                    }
                }
            }
            me.addListener('mouseup', addList);
            flag = 1;
        },
        queryCommandState: function () {
            return flag;
        },
        notNeedUndo: 1
    };
};
