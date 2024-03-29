UE.plugin.register('copy', function () {
    var me = this;
    function initZeroClipboard() {
        ZeroClipboard.config({
            debug: false,
            swfPath: 'https://unpkg.com/editorplus-thirdparty@2.0.0/zeroclipboard/ZeroClipboard.swf'
        });
        var client = me.zeroclipboard = new ZeroClipboard();
        client.on('copy', function (e) {
            var client = e.client;
            var rng = me.selection.getRange();
            var div = document.createElement('div');
            div.appendChild(rng.cloneContents());
            client.setText(div.innerText || div.textContent);
            client.setHtml(div.innerHTML);
            rng.select();
        });
        client.on('mouseover mouseout', function (e) {
            var target = e.target;
            if (e.type == 'mouseover') {
                domUtils.addClass(target, 'edui-state-hover');
            }
            else if (e.type == 'mouseout') {
                domUtils.removeClasses(target, 'edui-state-hover');
            }
        });
        client.on('wrongflash noflash', function () {
            ZeroClipboard.destroy();
        });
    }
    return {
        bindEvents: {
            ready: function () {
                if (window.ZeroClipboard) {
                    initZeroClipboard();
                }
                else {
                    utils.loadFile(document, {
                        src: 'https://unpkg.com/editorplus-thirdparty@2.0.0/zeroclipboard/ZeroClipboard.js',
                        tag: 'script',
                        type: 'text/javascript',
                        defer: 'defer'
                    }, function () {
                        initZeroClipboard();
                    });
                }
            }
        },
        commands: {
            copy: {
                execCommand: function (cmd) {
                    if (!me.document.execCommand('copy')) {
                        alert(me.getLang('copymsg'));
                    }
                }
            }
        }
    };
});
