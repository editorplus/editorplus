(function () {
    var utils = baidu.editor.utils;
    var Popup = baidu.editor.ui.Popup;
    var Stateful = baidu.editor.ui.Stateful;
    var UIBase = baidu.editor.ui.UIBase;
    var CellAlignPicker = baidu.editor.ui.CellAlignPicker = function (options) {
        this.initOptions(options);
        this.initSelected();
        this.initCellAlignPicker();
    };
    CellAlignPicker.prototype = {
        initSelected: function () {
            var status = {
                valign: {
                    top: 0,
                    middle: 1,
                    bottom: 2
                },
                align: {
                    left: 0,
                    center: 1,
                    right: 2
                },
                count: 3
            };
            var result = -1;
            if (this.selected) {
                this.selectedIndex = status.valign[this.selected.valign] * status.count + status.align[this.selected.align];
            }
        },
        initCellAlignPicker: function () {
            this.initUIBase();
            this.Stateful_init();
        },
        getHtmlTpl: function () {
            var alignType = ['left', 'center', 'right'];
            var COUNT = 9;
            var tempClassName = null;
            var tempIndex = -1;
            var tmpl = [];
            for (var i = 0; i < COUNT; i++) {
                tempClassName = this.selectedIndex === i ? ' class="edui-cellalign-selected" ' : '';
                tempIndex = i % 3;
                tempIndex === 0 && tmpl.push('<tr>');
                tmpl.push('<td index="' + i + '" ' + tempClassName + ' stateful><div class="edui-icon edui-' + alignType[tempIndex] + '"></div></td>');
                tempIndex === 2 && tmpl.push('</tr>');
            }
            return '<div id="##" class="edui-cellalignpicker %%">' +
                '<div class="edui-cellalignpicker-body">' +
                '<table onclick="$$._onClick(event);">' +
                tmpl.join('') +
                '</table>' +
                '</div>' +
                '</div>';
        },
        getStateDom: function () {
            return this.target;
        },
        _onClick: function (evt) {
            var target = evt.target || evt.srcElement;
            if (/icon/.test(target.className)) {
                this.items[target.parentNode.getAttribute('index')].onclick();
                Popup.postHide(evt);
            }
        },
        _UIBase_render: UIBase.prototype.render
    };
    utils.inherits(CellAlignPicker, UIBase);
    utils.extend(CellAlignPicker.prototype, Stateful, true);
})();
