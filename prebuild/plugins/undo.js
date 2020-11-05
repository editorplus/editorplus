UE.plugins.undo = function () {
    var saveSceneTimer;
    var me = this;
    var maxUndoCount = me.options.maxUndoCount || 20;
    var maxInputCount = me.options.maxInputCount || 20;
    var fillchar = new RegExp(domUtils.fillChar + '|<\/hr>', 'gi');
    var noNeedFillCharTags = {
        ol: 1, ul: 1, table: 1, tbody: 1, tr: 1, body: 1
    };
    var orgState = me.options.autoClearEmptyNode;
    function compareAddr(indexA, indexB) {
        if (indexA.length != indexB.length) {
            return 0;
        }
        for (var i = 0, l = indexA.length; i < l; i++) {
            if (indexA[i] != indexB[i]) {
                return 0;
            }
        }
        return 1;
    }
    function compareRangeAddress(rngAddrA, rngAddrB) {
        if (rngAddrA.collapsed != rngAddrB.collapsed) {
            return 0;
        }
        if (!compareAddr(rngAddrA.startAddress, rngAddrB.startAddress) || !compareAddr(rngAddrA.endAddress, rngAddrB.endAddress)) {
            return 0;
        }
        return 1;
    }
    function UndoManager() {
        this.list = [];
        this.index = 0;
        this.hasUndo = false;
        this.hasRedo = false;
        this.undo = function () {
            if (this.hasUndo) {
                if (!this.list[this.index - 1] && this.list.length == 1) {
                    this.reset();
                    return;
                }
                while (this.list[this.index].content == this.list[this.index - 1].content) {
                    this.index--;
                    if (this.index == 0) {
                        return this.restore(0);
                    }
                }
                this.restore(--this.index);
            }
        };
        this.redo = function () {
            if (this.hasRedo) {
                while (this.list[this.index].content == this.list[this.index + 1].content) {
                    this.index++;
                    if (this.index == this.list.length - 1) {
                        return this.restore(this.index);
                    }
                }
                this.restore(++this.index);
            }
        };
        this.restore = function () {
            var me = this.editor;
            var scene = this.list[this.index];
            var root = UE.htmlparser(scene.content.replace(fillchar, ''));
            me.options.autoClearEmptyNode = false;
            me.filterInputRule(root);
            me.options.autoClearEmptyNode = orgState;
            me.document.body.innerHTML = root.toHtml();
            me.fireEvent('afterscencerestore');
            try {
                var rng = new dom.Range(me.document).moveToAddress(scene.address);
                rng.select(noNeedFillCharTags[rng.startContainer.nodeName.toLowerCase()]);
            }
            catch (e) { }
            this.update();
            this.clearKey();
            me.fireEvent('reset', true);
        };
        this.getScene = function () {
            var me = this.editor;
            var rng = me.selection.getRange();
            var rngAddress = rng.createAddress(false, true);
            me.fireEvent('beforegetscene');
            var root = UE.htmlparser(me.body.innerHTML);
            me.options.autoClearEmptyNode = false;
            me.filterOutputRule(root);
            me.options.autoClearEmptyNode = orgState;
            var cont = root.toHtml();
            me.fireEvent('aftergetscene');
            return {
                address: rngAddress,
                content: cont
            };
        };
        this.save = function (notCompareRange, notSetCursor) {
            clearTimeout(saveSceneTimer);
            var currentScene = this.getScene(notSetCursor);
            var lastScene = this.list[this.index];
            if (lastScene && lastScene.content != currentScene.content) {
                me.trigger('contentchange');
            }
            if (lastScene && lastScene.content == currentScene.content &&
                (notCompareRange ? 1 : compareRangeAddress(lastScene.address, currentScene.address))) {
                return;
            }
            this.list = this.list.slice(0, this.index + 1);
            this.list.push(currentScene);
            if (this.list.length > maxUndoCount) {
                this.list.shift();
            }
            this.index = this.list.length - 1;
            this.clearKey();
            this.update();
        };
        this.update = function () {
            this.hasRedo = !!this.list[this.index + 1];
            this.hasUndo = !!this.list[this.index - 1];
        };
        this.reset = function () {
            this.list = [];
            this.index = 0;
            this.hasUndo = false;
            this.hasRedo = false;
            this.clearKey();
        };
        this.clearKey = function () {
            keycont = 0;
            lastKeyCode = null;
        };
    }
    me.undoManger = new UndoManager();
    me.undoManger.editor = me;
    function saveScene() {
        this.undoManger.save();
    }
    me.addListener('saveScene', function () {
        var args = Array.prototype.splice.call(arguments, 1);
        this.undoManger.save.apply(this.undoManger, args);
    });
    me.addListener('reset', function (type, exclude) {
        if (!exclude) {
            this.undoManger.reset();
        }
    });
    me.commands.redo = me.commands.undo = {
        execCommand: function (cmdName) {
            this.undoManger[cmdName]();
        },
        queryCommandState: function (cmdName) {
            return this.undoManger['has' + (cmdName.toLowerCase() == 'undo' ? 'Undo' : 'Redo')] ? 0 : -1;
        },
        notNeedUndo: 1
    };
    var keys = {
        16: 1, 17: 1, 18: 1,
        37: 1,
        38: 1,
        39: 1,
        40: 1
    };
    var keycont = 0;
    var lastKeyCode;
    var inputType = false;
    me.addListener('ready', function () {
        domUtils.on(this.body, 'compositionstart', function () {
            inputType = true;
        });
        domUtils.on(this.body, 'compositionend', function () {
            inputType = false;
        });
    });
    me.addshortcutkey({
        Undo: 'ctrl+90',
        Redo: 'ctrl+89'
    });
    var isCollapsed = true;
    me.addListener('keydown', function (type, evt) {
        var me = this;
        var keyCode = evt.keyCode || evt.which;
        if (!keys[keyCode] && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && !evt.altKey) {
            if (inputType) {
                return;
            }
            if (!me.selection.getRange().collapsed) {
                me.undoManger.save(false, true);
                isCollapsed = false;
                return;
            }
            if (me.undoManger.list.length == 0) {
                me.undoManger.save(true);
            }
            clearTimeout(saveSceneTimer);
            function save(cont) {
                cont.undoManger.save(false, true);
                cont.fireEvent('selectionchange');
            }
            saveSceneTimer = setTimeout(function () {
                if (inputType) {
                    var interalTimer = setInterval(function () {
                        if (!inputType) {
                            save(me);
                            clearInterval(interalTimer);
                        }
                    }, 300);
                    return;
                }
                save(me);
            }, 200);
            lastKeyCode = keyCode;
            keycont++;
            if (keycont >= maxInputCount) {
                save(me);
            }
        }
    });
    me.addListener('keyup', function (type, evt) {
        var keyCode = evt.keyCode || evt.which;
        if (!keys[keyCode] && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && !evt.altKey) {
            if (inputType) {
                return;
            }
            if (!isCollapsed) {
                this.undoManger.save(false, true);
                isCollapsed = true;
            }
        }
    });
    me.stopCmdUndo = function () {
        me.__hasEnterExecCommand = true;
    };
    me.startCmdUndo = function () {
        me.__hasEnterExecCommand = false;
    };
};
