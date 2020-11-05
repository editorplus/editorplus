UE.commands.insertparagraph = {
    execCommand: function (cmdName, front) {
        var me = this;
        var range = me.selection.getRange();
        var start = range.startContainer;
        var tmpNode;
        while (start) {
            if (domUtils.isBody(start)) {
                break;
            }
            tmpNode = start;
            start = start.parentNode;
        }
        if (tmpNode) {
            var p = me.document.createElement('p');
            if (front) {
                tmpNode.parentNode.insertBefore(p, tmpNode);
            }
            else {
                tmpNode.parentNode.insertBefore(p, tmpNode.nextSibling);
            }
            domUtils.fillNode(me.document, p);
            range.setStart(p, 0).setCursor(false, true);
        }
    }
};
