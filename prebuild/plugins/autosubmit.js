UE.plugin.register('autosubmit', function () {
    return {
        shortcutkey: {
            autosubmit: 'ctrl+13'
        },
        commands: {
            autosubmit: {
                execCommand: function () {
                    var me = this;
                    var form = domUtils.findParentByTagName(me.iframe, 'form', false);
                    if (form) {
                        if (me.fireEvent('beforesubmit') === false) {
                            return;
                        }
                        me.sync();
                        form.submit();
                    }
                }
            }
        }
    };
});
