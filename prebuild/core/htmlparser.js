var htmlparser = UE.htmlparser = function (htmlstr, ignoreBlank) {
    var re_tag = /<(?:(?:\/([^>]+)>)|(?:!--([\S|\s]*?)-->)|(?:([^\s\/<>]+)\s*((?:(?:"[^"]*")|(?:'[^']*')|[^"'<>])*)\/?>))/g;
    var re_attr = /([\w\-:.]+)(?:(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s>]+)))|(?=\s|$))/g;
    var allowEmptyTags = {
        b: 1,
        code: 1,
        i: 1,
        u: 1,
        strike: 1,
        s: 1,
        tt: 1,
        strong: 1,
        q: 1,
        samp: 1,
        em: 1,
        span: 1,
        sub: 1,
        img: 1,
        sup: 1,
        font: 1,
        big: 1,
        small: 1,
        iframe: 1,
        a: 1,
        br: 1,
        pre: 1
    };
    htmlstr = htmlstr.replace(new RegExp(domUtils.fillChar, 'g'), '');
    if (!ignoreBlank) {
        htmlstr = htmlstr.replace(new RegExp('[\\r\\t\\n' + (ignoreBlank ? '' : ' ') + ']*<\/?(\\w+)\\s*(?:[^>]*)>[\\r\\t\\n' + (ignoreBlank ? '' : ' ') + ']*', 'g'), function (a, b) {
            if (b && allowEmptyTags[b.toLowerCase()]) {
                return a.replace(/(^[\n\r]+)|([\n\r]+$)/g, '');
            }
            return a.replace(new RegExp('^[\\r\\n' + (ignoreBlank ? '' : ' ') + ']+'), '').replace(new RegExp('[\\r\\n' + (ignoreBlank ? '' : ' ') + ']+$'), '');
        });
    }
    var notTransAttrs = {
        href: 1,
        src: 1
    };
    var uNode = UE.uNode;
    var needParentNode = {
        td: 'tr',
        tr: ['tbody', 'thead', 'tfoot'],
        tbody: 'table',
        th: 'tr',
        thead: 'table',
        tfoot: 'table',
        caption: 'table',
        li: ['ul', 'ol'],
        dt: 'dl',
        dd: 'dl',
        option: 'select'
    };
    var needChild = {
        ol: 'li',
        ul: 'li'
    };
    function text(parent, data) {
        if (needChild[parent.tagName]) {
            var tmpNode = uNode.createElement(needChild[parent.tagName]);
            parent.appendChild(tmpNode);
            tmpNode.appendChild(uNode.createText(data));
            parent = tmpNode;
        }
        else {
            parent.appendChild(uNode.createText(data));
        }
    }
    function element(parent, tagName, htmlattr) {
        var needParentTag;
        if (needParentTag = needParentNode[tagName]) {
            var tmpParent = parent;
            var hasParent;
            while (tmpParent.type != 'root') {
                if (utils.isArray(needParentTag) ? utils.indexOf(needParentTag, tmpParent.tagName) != -1 : needParentTag == tmpParent.tagName) {
                    parent = tmpParent;
                    hasParent = true;
                    break;
                }
                tmpParent = tmpParent.parentNode;
            }
            if (!hasParent) {
                parent = element(parent, utils.isArray(needParentTag) ? needParentTag[0] : needParentTag);
            }
        }
        var elm = new uNode({
            parentNode: parent,
            type: 'element',
            tagName: tagName.toLowerCase(),
            children: dtd.$empty[tagName] ? null : []
        });
        if (htmlattr) {
            var attrs = {};
            var match;
            while (match = re_attr.exec(htmlattr)) {
                attrs[match[1].toLowerCase()] = notTransAttrs[match[1].toLowerCase()] ? (match[2] || match[3] || match[4]) : utils.unhtml(match[2] || match[3] || match[4]);
            }
            elm.attrs = attrs;
        }
        parent.children.push(elm);
        return dtd.$empty[tagName] ? parent : elm;
    }
    function comment(parent, data) {
        parent.children.push(new uNode({
            type: 'comment',
            data: data,
            parentNode: parent
        }));
    }
    var match;
    var currentIndex = 0;
    var nextIndex = 0;
    var root = new uNode({
        type: 'root',
        children: []
    });
    var currentParent = root;
    while (match = re_tag.exec(htmlstr)) {
        currentIndex = match.index;
        try {
            if (currentIndex > nextIndex) {
                text(currentParent, htmlstr.slice(nextIndex, currentIndex));
            }
            if (match[3]) {
                if (dtd.$cdata[currentParent.tagName]) {
                    text(currentParent, match[0]);
                }
                else {
                    currentParent = element(currentParent, match[3].toLowerCase(), match[4]);
                }
            }
            else if (match[1]) {
                if (currentParent.type != 'root') {
                    if (dtd.$cdata[currentParent.tagName] && !dtd.$cdata[match[1]]) {
                        text(currentParent, match[0]);
                    }
                    else {
                        var tmpParent = currentParent;
                        while (currentParent.type == 'element' && currentParent.tagName != match[1].toLowerCase()) {
                            currentParent = currentParent.parentNode;
                            if (currentParent.type == 'root') {
                                currentParent = tmpParent;
                                throw 'break';
                            }
                        }
                        currentParent = currentParent.parentNode;
                    }
                }
            }
            else if (match[2]) {
                comment(currentParent, match[2]);
            }
        }
        catch (e) {
        }
        nextIndex = re_tag.lastIndex;
    }
    if (nextIndex < htmlstr.length) {
        text(currentParent, htmlstr.slice(nextIndex));
    }
    return root;
};
