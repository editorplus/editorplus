UE.commands.indent = {
    execCommand: function () {
        var me = this;
        var value = me.queryCommandState('indent') ? '0em' : (me.options.indentValue || '2em');
        me.execCommand('Paragraph', 'p', { style: 'text-indent:' + value });
    },
    queryCommandState: function () {
        var pN = domUtils.filterNodeList(this.selection.getStartElementPath(), 'p h1 h2 h3 h4 h5 h6');
        return pN && pN.style.textIndent && parseInt(pN.style.textIndent) ? 1 : 0;
    }
};
