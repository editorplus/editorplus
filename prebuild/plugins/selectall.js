UE.plugins.selectall = function () {
    var me = this;
    me.commands.selectall = {
        execCommand: function () {
            var me = this;
            var body = me.body;
            var range = me.selection.getRange();
            range.selectNodeContents(body);
            if (domUtils.isEmptyBlock(body)) {
                range.collapse(true);
            }
            range.select(true);
        },
        notNeedUndo: 1
    };
    me.addshortcutkey({
        selectAll: 'ctrl+65'
    });
};
