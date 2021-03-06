UE.plugins.rowspacing = function () {
    var me = this;
    me.setOpt({
        rowspacingtop: ['5', '10', '15', '20', '25'],
        rowspacingbottom: ['5', '10', '15', '20', '25']
    });
    me.commands.rowspacing = {
        execCommand: function (cmdName, value, dir) {
            this.execCommand('paragraph', 'p', { style: 'margin-' + dir + ':' + value + 'px' });
            return true;
        },
        queryCommandValue: function (cmdName, dir) {
            var pN = domUtils.filterNodeList(this.selection.getStartElementPath(), function (node) { return domUtils.isBlockElm(node); });
            var value;
            if (pN) {
                value = domUtils.getComputedStyle(pN, 'margin-' + dir).replace(/[^\d]/g, '');
                return !value ? 0 : value;
            }
            return 0;
        }
    };
};
