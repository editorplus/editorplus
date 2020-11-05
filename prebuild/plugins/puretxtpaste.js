UE.plugins.pasteplain = function () {
    var me = this;
    me.setOpt({
        pasteplain: false,
        filterTxtRules: (function () {
            function transP(node) {
                node.tagName = 'p';
                node.setStyle();
            }
            function removeNode(node) {
                node.parentNode.removeChild(node, true);
            }
            return {
                '-': 'script style object iframe embed input select',
                p: { $: {} },
                br: { $: {} },
                div: function (node) {
                    var tmpNode;
                    var p = UE.uNode.createElement('p');
                    while (tmpNode = node.firstChild()) {
                        if (tmpNode.type == 'text' || !UE.dom.dtd.$block[tmpNode.tagName]) {
                            p.appendChild(tmpNode);
                        }
                        else {
                            if (p.firstChild()) {
                                node.parentNode.insertBefore(p, node);
                                p = UE.uNode.createElement('p');
                            }
                            else {
                                node.parentNode.insertBefore(tmpNode, node);
                            }
                        }
                    }
                    if (p.firstChild()) {
                        node.parentNode.insertBefore(p, node);
                    }
                    node.parentNode.removeChild(node);
                },
                ol: removeNode,
                ul: removeNode,
                dl: removeNode,
                dt: removeNode,
                dd: removeNode,
                li: removeNode,
                caption: transP,
                th: transP,
                tr: transP,
                h1: transP,
                h2: transP,
                h3: transP,
                h4: transP,
                h5: transP,
                h6: transP,
                td: function (node) {
                    var txt = !!node.innerText();
                    if (txt) {
                        node.parentNode.insertAfter(UE.uNode.createText(' &nbsp; &nbsp;'), node);
                    }
                    node.parentNode.removeChild(node, node.innerText());
                }
            };
        }())
    });
    var pasteplain = me.options.pasteplain;
    me.commands.pasteplain = {
        queryCommandState: function () {
            return pasteplain ? 1 : 0;
        },
        execCommand: function () {
            pasteplain = !pasteplain | 0;
        },
        notNeedUndo: 1
    };
};
