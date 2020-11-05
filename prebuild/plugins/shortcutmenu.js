UE.plugins.shortcutmenu = function () {
    var me = this;
    var menu;
    var items = me.options.shortcutMenu || [];
    if (!items.length) {
        return;
    }
    me.addListener('contextmenu mouseup', function (type, e) {
        var me = this;
        var customEvt = {
            type: type,
            target: e.target || e.srcElement,
            screenX: e.screenX,
            screenY: e.screenY,
            clientX: e.clientX,
            clientY: e.clientY
        };
        setTimeout(function () {
            var rng = me.selection.getRange();
            if (rng.collapsed === false || type == 'contextmenu') {
                if (!menu) {
                    menu = new baidu.editor.ui.ShortCutMenu({
                        editor: me,
                        items: items,
                        theme: me.options.theme,
                        className: 'edui-shortcutmenu'
                    });
                    menu.render();
                    me.fireEvent('afterrendershortcutmenu', menu);
                }
                menu.show(customEvt, !!UE.plugins.contextmenu);
            }
        });
        if (type == 'contextmenu') {
            domUtils.preventDefault(e);
        }
    });
    me.addListener('keydown', function (type) {
        if (type == 'keydown') {
            menu && !menu.isHidden && menu.hide();
        }
    });
};
