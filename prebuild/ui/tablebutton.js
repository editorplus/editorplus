(function () {
    var utils = baidu.editor.utils;
    var Popup = baidu.editor.ui.Popup;
    var TablePicker = baidu.editor.ui.TablePicker;
    var SplitButton = baidu.editor.ui.SplitButton;
    var TableButton = baidu.editor.ui.TableButton = function (options) {
        this.initOptions(options);
        this.initTableButton();
    };
    TableButton.prototype = {
        initTableButton: function () {
            var me = this;
            this.popup = new Popup({
                content: new TablePicker({
                    editor: me.editor,
                    onpicktable: function (t, numCols, numRows) {
                        me._onPickTable(numCols, numRows);
                    }
                }),
                editor: me.editor
            });
            this.initSplitButton();
        },
        _onPickTable: function (numCols, numRows) {
            if (this.fireEvent('picktable', numCols, numRows) !== false) {
                this.popup.hide();
            }
        }
    };
    utils.inherits(TableButton, SplitButton);
})();
