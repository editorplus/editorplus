var filterNode = UE.filterNode = (function () {
    function filterNode(node, rules) {
        switch (node.type) {
            case 'text':
                break;
            case 'element':
                var val;
                if (val = rules[node.tagName]) {
                    if (val === '-') {
                        node.parentNode.removeChild(node);
                    }
                    else if (utils.isFunction(val)) {
                        var parentNode = node.parentNode;
                        var index = node.getIndex();
                        val(node);
                        if (node.parentNode) {
                            if (node.children) {
                                for (var i = 0, ci; ci = node.children[i];) {
                                    filterNode(ci, rules);
                                    if (ci.parentNode) {
                                        i++;
                                    }
                                }
                            }
                        }
                        else {
                            for (var i = index, ci; ci = parentNode.children[i];) {
                                filterNode(ci, rules);
                                if (ci.parentNode) {
                                    i++;
                                }
                            }
                        }
                    }
                    else {
                        var attrs = val.$;
                        if (attrs && node.attrs) {
                            var tmpAttrs = {};
                            var tmpVal;
                            for (var a in attrs) {
                                tmpVal = node.getAttr(a);
                                if (a == 'style' && utils.isArray(attrs[a])) {
                                    var tmpCssStyle = [];
                                    utils.each(attrs[a], function (v) {
                                        var tmp;
                                        if (tmp = node.getStyle(v)) {
                                            tmpCssStyle.push(v + ':' + tmp);
                                        }
                                    });
                                    tmpVal = tmpCssStyle.join(';');
                                }
                                if (tmpVal) {
                                    tmpAttrs[a] = tmpVal;
                                }
                            }
                            node.attrs = tmpAttrs;
                        }
                        if (node.children) {
                            for (var i = 0, ci; ci = node.children[i];) {
                                filterNode(ci, rules);
                                if (ci.parentNode) {
                                    i++;
                                }
                            }
                        }
                    }
                }
                else {
                    if (dtd.$cdata[node.tagName]) {
                        node.parentNode.removeChild(node);
                    }
                    else {
                        var parentNode = node.parentNode;
                        var index = node.getIndex();
                        node.parentNode.removeChild(node, true);
                        for (var i = index, ci; ci = parentNode.children[i];) {
                            filterNode(ci, rules);
                            if (ci.parentNode) {
                                i++;
                            }
                        }
                    }
                }
                break;
            case 'comment':
                node.parentNode.removeChild(node);
        }
    }
    return function (root, rules) {
        if (utils.isEmptyObject(rules)) {
            return root;
        }
        var val;
        if (val = rules['-']) {
            utils.each(val.split(' '), function (k) {
                rules[k] = '-';
            });
        }
        for (var i = 0, ci; ci = root.children[i];) {
            filterNode(ci, rules);
            if (ci.parentNode) {
                i++;
            }
        }
        return root;
    };
}());
