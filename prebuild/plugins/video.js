UE.plugins.video = function () {
    var me = this;
    function creatInsertStr(url, width, height, id, align, classname, type) {
        url = utils.unhtmlForUrl(url);
        align = utils.unhtml(align);
        classname = utils.unhtml(classname);
        width = parseInt(width, 10) || 0;
        height = parseInt(height, 10) || 0;
        var str;
        switch (type) {
            case 'image':
                str = '<img ' + (id ? 'id="' + id + '"' : '') + ' width="' + width + '" height="' + height + '" _url="' + url + '" class="' + classname.replace(/\bvideo-js\b/, '') + '"' +
                    ' src="' + me.options.UEDITOR_HOME_URL + 'themes/default/images/spacer.gif" style="background:url(' + me.options.UEDITOR_HOME_URL + 'themes/default/images/videologo.gif) no-repeat center center; border:1px solid gray;' + (align ? 'float:' + align + ';' : '') + '" />';
                break;
            case 'embed':
                str = '<embed type="application/x-shockwave-flash" class="' + classname + '" pluginspage="https://www.macromedia.com/go/getflashplayer"' +
                    ' src="' + utils.html(url) + '" width="' + width + '" height="' + height + '"' + (align ? ' style="float:' + align + '"' : '') +
                    ' wmode="transparent" play="true" loop="false" menu="false" allowscriptaccess="never" allowfullscreen="true" >';
                break;
            case 'video':
                var ext = url.substr(url.lastIndexOf('.') + 1);
                if (ext == 'ogv')
                    ext = 'ogg';
                str = '<video' + (id ? ' id="' + id + '"' : '') + ' class="' + classname + ' video-js" ' + (align ? ' style="float:' + align + '"' : '') +
                    ' controls preload="none" width="' + width + '" height="' + height + '" src="' + url + '" data-setup="{}">' +
                    '<source src="' + url + '" type="video/' + ext + '" /></video>';
                break;
        }
        return str;
    }
    function switchImgAndVideo(root, img2video) {
        utils.each(root.getNodesByTagName(img2video ? 'img' : 'embed video'), function (node) {
            var className = node.getAttr('class');
            if (className && className.indexOf('edui-faked-video') != -1) {
                var html = creatInsertStr(img2video ? node.getAttr('_url') : node.getAttr('src'), node.getAttr('width'), node.getAttr('height'), null, node.getStyle('float') || '', className, img2video ? 'embed' : 'image');
                node.parentNode.replaceChild(UE.uNode.createElement(html), node);
            }
            if (className && className.indexOf('edui-upload-video') != -1) {
                var html = creatInsertStr(img2video ? node.getAttr('_url') : node.getAttr('src'), node.getAttr('width'), node.getAttr('height'), null, node.getStyle('float') || '', className, img2video ? 'video' : 'image');
                node.parentNode.replaceChild(UE.uNode.createElement(html), node);
            }
        });
    }
    me.addOutputRule(function (root) {
        switchImgAndVideo(root, true);
    });
    me.addInputRule(function (root) {
        switchImgAndVideo(root);
    });
    me.commands.insertvideo = {
        execCommand: function (cmd, videoObjs, type) {
            videoObjs = utils.isArray(videoObjs) ? videoObjs : [videoObjs];
            var html = [];
            var id = 'tmpVedio';
            var cl;
            for (var i = 0, vi, len = videoObjs.length; i < len; i++) {
                vi = videoObjs[i];
                cl = (type == 'upload' ? 'edui-upload-video video-js vjs-default-skin' : 'edui-faked-video');
                html.push(creatInsertStr(vi.url, vi.width || 420, vi.height || 280, id + i, null, cl, 'image'));
            }
            me.execCommand('inserthtml', html.join(''), true);
            var rng = this.selection.getRange();
            for (var i = 0, len = videoObjs.length; i < len; i++) {
                var img = this.document.getElementById('tmpVedio' + i);
                domUtils.removeAttributes(img, 'id');
                rng.selectNode(img).select();
                me.execCommand('imagefloat', videoObjs[i].align);
            }
        },
        queryCommandState: function () {
            var img = me.selection.getRange().getClosedNode();
            var flag = img && (img.className == 'edui-faked-video' || img.className.indexOf('edui-upload-video') != -1);
            return flag ? 1 : 0;
        }
    };
};
