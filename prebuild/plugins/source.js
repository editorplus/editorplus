(function () {
    var sourceEditors = {
        textarea: function (editor, holder) {
            var textarea = holder.ownerDocument.createElement('textarea');
            textarea.style.cssText = 'position:absolute;resize:none;width:100%;height:100%;border:0;padding:0;margin:0;overflow-y:auto;';
            holder.appendChild(textarea);
            return {
                setContent: function (content) {
                    textarea.value = content;
                },
                getContent: function () {
                    return textarea.value;
                },
                select: function () {
                    var range;
                    textarea.setSelectionRange(0, 0);
                    textarea.focus();
                },
                dispose: function () {
                    holder.removeChild(textarea);
                    holder.onresize = null;
                    textarea = null;
                    holder = null;
                }
            };
        },
        codemirror: function (editor, holder) {
            var codeEditor = window.CodeMirror(holder, {
                mode: 'text/html',
                tabMode: 'indent',
                lineNumbers: true,
                lineWrapping: true
            });
            var dom = codeEditor.getWrapperElement();
            dom.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;font-family:consolas,"Courier new",monospace;font-size:13px;';
            codeEditor.getScrollerElement().style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';
            codeEditor.refresh();
            return {
                getCodeMirror: function () {
                    return codeEditor;
                },
                setContent: function (content) {
                    codeEditor.setValue(content);
                },
                getContent: function () {
                    return codeEditor.getValue();
                },
                select: function () {
                    codeEditor.focus();
                },
                dispose: function () {
                    holder.removeChild(dom);
                    dom = null;
                    codeEditor = null;
                }
            };
        }
    };
    UE.plugins.source = function () {
        var me = this;
        var opt = this.options;
        var sourceMode = false;
        var sourceEditor;
        var orgSetContent;
        opt.sourceEditor = (opt.sourceEditor || 'codemirror');
        me.setOpt({
            sourceEditorFirst: false
        });
        function createSourceEditor(holder) {
            return sourceEditors[opt.sourceEditor == 'codemirror' && window.CodeMirror ? 'codemirror' : 'textarea'](me, holder);
        }
        var bakCssText;
        var oldGetContent, bakAddress;
        me.commands.source = {
            execCommand: function () {
                sourceMode = !sourceMode;
                if (sourceMode) {
                    bakAddress = me.selection.getRange().createAddress(false, true);
                    me.undoManger && me.undoManger.save(true);
                    if (browser.gecko) {
                        me.body.contentEditable = false;
                    }
                    bakCssText = me.iframe.style.cssText;
                    me.iframe.style.cssText += 'position:absolute;left:-32768px;top:-32768px;';
                    me.fireEvent('beforegetcontent');
                    var root = UE.htmlparser(me.body.innerHTML);
                    me.filterOutputRule(root);
                    root.traversal(function (node) {
                        if (node.type == 'element') {
                            switch (node.tagName) {
                                case 'td':
                                case 'th':
                                case 'caption':
                                    if (node.children && node.children.length == 1) {
                                        if (node.firstChild().tagName == 'br') {
                                            node.removeChild(node.firstChild());
                                        }
                                    }
                                    break;
                                case 'pre':
                                    node.innerText(node.innerText().replace(/&nbsp;/g, ' '));
                            }
                        }
                    });
                    me.fireEvent('aftergetcontent');
                    var content = root.toHtml(true);
                    sourceEditor = createSourceEditor(me.iframe.parentNode);
                    sourceEditor.setContent(content);
                    orgSetContent = me.setContent;
                    me.setContent = function (html) {
                        var root = UE.htmlparser(html);
                        me.filterInputRule(root);
                        html = root.toHtml();
                        sourceEditor.setContent(html);
                    };
                    setTimeout(function () {
                        sourceEditor.select();
                        me.addListener('fullscreenchanged', function () {
                            try {
                                sourceEditor.getCodeMirror().refresh();
                            }
                            catch (e) { }
                        });
                    });
                    oldGetContent = me.getContent;
                    me.getContent = function () {
                        return sourceEditor.getContent() || '<p><br/></p>';
                    };
                }
                else {
                    me.iframe.style.cssText = bakCssText;
                    var cont = sourceEditor.getContent() || '<p><br/></p>';
                    cont = cont.replace(new RegExp('[\\r\\t\\n ]*<\/?(\\w+)\\s*(?:[^>]*)>', 'g'), function (a, b) {
                        if (b && !dtd.$inlineWithA[b.toLowerCase()]) {
                            return a.replace(/(^[\n\r\t ]*)|([\n\r\t ]*$)/g, '');
                        }
                        return a.replace(/(^[\n\r\t]*)|([\n\r\t]*$)/g, '');
                    });
                    me.setContent = orgSetContent;
                    me.setContent(cont);
                    sourceEditor.dispose();
                    sourceEditor = null;
                    me.getContent = oldGetContent;
                    var first = me.body.firstChild;
                    if (!first) {
                        me.body.innerHTML = '<p><br/></p>';
                        first = me.body.firstChild;
                    }
                    me.undoManger && me.undoManger.save(true);
                    if (browser.gecko) {
                        var input = document.createElement('input');
                        input.style.cssText = 'position:absolute;left:0;top:-32768px';
                        document.body.appendChild(input);
                        me.body.contentEditable = false;
                        setTimeout(function () {
                            domUtils.setViewportOffset(input, { left: -32768, top: 0 });
                            input.focus();
                            setTimeout(function () {
                                me.body.contentEditable = true;
                                me.selection.getRange().moveToAddress(bakAddress).select(true);
                                domUtils.remove(input);
                            });
                        });
                    }
                    else {
                        try {
                            me.selection.getRange().moveToAddress(bakAddress).select(true);
                        }
                        catch (e) { }
                    }
                }
                this.fireEvent('sourcemodechanged', sourceMode);
            },
            queryCommandState: function () {
                return sourceMode | 0;
            },
            notNeedUndo: 1
        };
        var oldQueryCommandState = me.queryCommandState;
        me.queryCommandState = function (cmdName) {
            cmdName = cmdName.toLowerCase();
            if (sourceMode) {
                return cmdName in {
                    source: 1,
                    fullscreen: 1
                } ? 1 : -1;
            }
            return oldQueryCommandState.apply(this, arguments);
        };
        if (opt.sourceEditor == 'codemirror') {
            me.addListener('ready', function () {
                utils.loadFile(document, {
                    src: opt.codeMirrorJsUrl || 'https://unpkg.com/editorplus-thirdparty@2.0.0/codemirror/codemirror.js',
                    tag: 'script',
                    type: 'text/javascript',
                    defer: 'defer'
                }, function () {
                    if (opt.sourceEditorFirst) {
                        setTimeout(function () {
                            me.execCommand('source');
                        }, 0);
                    }
                });
                utils.loadFile(document, {
                    tag: 'link',
                    rel: 'stylesheet',
                    type: 'text/css',
                    href: opt.codeMirrorCssUrl || 'https://unpkg.com/editorplus-thirdparty@2.0.0/codemirror/codemirror.css'
                });
            });
        }
    };
})();
