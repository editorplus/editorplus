UE.plugins.autoheight = function () {
    var me = this;
    me.autoHeightEnabled = me.options.autoHeightEnabled !== false;
    if (!me.autoHeightEnabled) {
        return;
    }
    var bakOverflow;
    var lastHeight = 0;
    var options = me.options;
    var currentHeight;
    var timer;
    function adjustHeight() {
        var me = this;
        clearTimeout(timer);
        if (isFullscreen)
            return;
        if (!me.queryCommandState || me.queryCommandState && me.queryCommandState('source') != 1) {
            timer = setTimeout(function () {
                var node = me.body.lastChild;
                while (node && node.nodeType != 1) {
                    node = node.previousSibling;
                }
                if (node && node.nodeType == 1) {
                    node.style.clear = 'both';
                    currentHeight = Math.max(domUtils.getXY(node).y + node.offsetHeight + 25, Math.max(options.minFrameHeight, options.initialFrameHeight));
                    if (currentHeight != lastHeight) {
                        if (currentHeight !== parseInt(me.iframe.parentNode.style.height)) {
                            me.iframe.parentNode.style.height = currentHeight + 'px';
                        }
                        me.body.style.height = currentHeight + 'px';
                        lastHeight = currentHeight;
                    }
                    domUtils.removeStyle(node, 'clear');
                }
            }, 50);
        }
    }
    var isFullscreen;
    me.addListener('fullscreenchanged', function (cmd, f) {
        isFullscreen = f;
    });
    me.addListener('destroy', function () {
        me.removeListener('contentchange afterinserthtml keyup mouseup', adjustHeight);
    });
    me.enableAutoHeight = function () {
        var me = this;
        if (!me.autoHeightEnabled) {
            return;
        }
        var doc = me.document;
        me.autoHeightEnabled = true;
        bakOverflow = doc.body.style.overflowY;
        doc.body.style.overflowY = 'hidden';
        me.addListener('contentchange afterinserthtml keyup mouseup', adjustHeight);
        setTimeout(function () {
            adjustHeight.call(me);
        }, browser.gecko ? 100 : 0);
        me.fireEvent('autoheightchanged', me.autoHeightEnabled);
    };
    me.disableAutoHeight = function () {
        me.body.style.overflowY = bakOverflow || '';
        me.removeListener('contentchange', adjustHeight);
        me.removeListener('keyup', adjustHeight);
        me.removeListener('mouseup', adjustHeight);
        me.autoHeightEnabled = false;
        me.fireEvent('autoheightchanged', me.autoHeightEnabled);
    };
    me.on('setHeight', function () {
        me.disableAutoHeight();
    });
    me.addListener('ready', function () {
        me.enableAutoHeight();
        var timer;
        domUtils.on(me.document, browser.webkit ? 'dragover' : 'drop', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                adjustHeight.call(me);
            }, 100);
        });
        var lastScrollY;
        window.onscroll = function () {
            if (lastScrollY === null) {
                lastScrollY = this.scrollY;
            }
            else if (this.scrollY == 0 && lastScrollY != 0) {
                me.window.scrollTo(0, 0);
                lastScrollY = null;
            }
        };
    });
};
