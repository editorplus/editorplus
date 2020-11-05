(function () {
    var utils = baidu.editor.utils;
    var Popup = baidu.editor.ui.Popup;
    var AutoTypeSetPicker = baidu.editor.ui.AutoTypeSetPicker;
    var SplitButton = baidu.editor.ui.SplitButton;
    var AutoTypeSetButton = baidu.editor.ui.AutoTypeSetButton = function (options) {
        this.initOptions(options);
        this.initAutoTypeSetButton();
    };
    function getPara(me) {
        var opt = {};
        var cont = me.getDom();
        var editorId = me.editor.uid;
        var inputType = null;
        var attrName = null;
        var ipts = domUtils.getElementsByTagName(cont, 'input');
        for (var i = ipts.length - 1, ipt; ipt = ipts[i--];) {
            inputType = ipt.getAttribute('type');
            if (inputType == 'checkbox') {
                attrName = ipt.getAttribute('name');
                opt[attrName] && delete opt[attrName];
                if (ipt.checked) {
                    var attrValue = document.getElementById(attrName + 'Value' + editorId);
                    if (attrValue) {
                        if (/input/ig.test(attrValue.tagName)) {
                            opt[attrName] = attrValue.value;
                        }
                        else {
                            var iptChilds = attrValue.getElementsByTagName('input');
                            for (var j = iptChilds.length - 1, iptchild; iptchild = iptChilds[j--];) {
                                if (iptchild.checked) {
                                    opt[attrName] = iptchild.value;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        opt[attrName] = true;
                    }
                }
                else {
                    opt[attrName] = false;
                }
            }
            else {
                opt[ipt.getAttribute('value')] = ipt.checked;
            }
        }
        var selects = domUtils.getElementsByTagName(cont, 'select');
        for (var i = 0, si; si = selects[i++];) {
            var attr = si.getAttribute('name');
            opt[attr] = opt[attr] ? si.value : '';
        }
        utils.extend(me.editor.options.autotypeset, opt);
        me.editor.setPreferences('autotypeset', opt);
    }
    AutoTypeSetButton.prototype = {
        initAutoTypeSetButton: function () {
            var me = this;
            this.popup = new Popup({
                content: new AutoTypeSetPicker({ editor: me.editor }),
                editor: me.editor,
                hide: function () {
                    if (!this._hidden && this.getDom()) {
                        getPara(this);
                        this.getDom().style.display = 'none';
                        this._hidden = true;
                        this.fireEvent('hide');
                    }
                }
            });
            var flag = 0;
            this.popup.addListener('postRenderAfter', function () {
                var popupUI = this;
                if (flag)
                    return;
                var cont = this.getDom();
                var btn = cont.getElementsByTagName('button')[0];
                btn.onclick = function () {
                    getPara(popupUI);
                    me.editor.execCommand('autotypeset');
                    popupUI.hide();
                };
                domUtils.on(cont, 'click', function (e) {
                    var target = e.target || e.srcElement;
                    var editorId = me.editor.uid;
                    if (target && target.tagName == 'INPUT') {
                        if (target.name == 'imageBlockLine' || target.name == 'textAlign' || target.name == 'symbolConver') {
                            var checked = target.checked;
                            var radioTd = document.getElementById(target.name + 'Value' + editorId);
                            var radios = radioTd.getElementsByTagName('input');
                            var defalutSelect = {
                                imageBlockLine: 'none',
                                textAlign: 'left',
                                symbolConver: 'tobdc'
                            };
                            for (var i = 0; i < radios.length; i++) {
                                if (checked) {
                                    if (radios[i].value == defalutSelect[target.name]) {
                                        radios[i].checked = 'checked';
                                    }
                                }
                                else {
                                    radios[i].checked = false;
                                }
                            }
                        }
                        if (target.name == ('imageBlockLineValue' + editorId) || target.name == ('textAlignValue' + editorId) || target.name == 'bdc') {
                            var checkboxs = target.parentNode.previousSibling.getElementsByTagName('input');
                            checkboxs && (checkboxs[0].checked = true);
                        }
                        getPara(popupUI);
                    }
                });
                flag = 1;
            });
            this.initSplitButton();
        }
    };
    utils.inherits(AutoTypeSetButton, SplitButton);
})();
