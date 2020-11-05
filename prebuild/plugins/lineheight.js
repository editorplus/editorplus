UE.plugins.lineheight = function () {
    var me = this;
    me.setOpt({ lineheight: ['1', '1.5', '1.75', '2', '3', '4', '5'] });
    me.commands.lineheight = {
        execCommand: function (cmdName, value) {
            this.execCommand('paragraph', 'p', { style: 'line-height:' + (value == '1' ? 'normal' : value + 'em') });
            return true;
        },
        queryCommandValue: function () {
            var pN = domUtils.filterNodeList(this.selection.getStartElementPath(), function (node) { return domUtils.isBlockElm(node); });
            if (pN) {
                var value = domUtils.getComputedStyle(pN, 'line-height');
                return value == 'normal' ? 1 : value.replace(/[^\d.]*/ig, '');
            }
        }
    };
};
