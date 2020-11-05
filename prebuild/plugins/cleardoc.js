UE.commands.cleardoc = {
    execCommand: function (cmdName) {
        var me = this;
        var enterTag = me.options.enterTag;
        var range = me.selection.getRange();
        if (enterTag == 'br') {
            me.body.innerHTML = '<br/>';
            range.setStart(me.body, 0).setCursor();
        }
        else {
            me.body.innerHTML = '<p><br/></p>';
            range.setStart(me.body.firstChild, 0).setCursor(false, true);
        }
        setTimeout(function () {
            me.fireEvent('clearDoc');
        }, 0);
    }
};
