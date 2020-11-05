(function () {
    var utils = baidu.editor.utils;
    var UIBase = baidu.editor.ui.UIBase;
    var Separator = baidu.editor.ui.Separator = function (options) {
        this.initOptions(options);
        this.initSeparator();
    };
    Separator.prototype = {
        uiName: 'separator',
        initSeparator: function () {
            this.initUIBase();
        },
        getHtmlTpl: function () {
            return '<div id="##" class="edui-box %%"></div>';
        }
    };
    utils.inherits(Separator, UIBase);
})();
