/// import core
/// import plugins/undo.js
/// commands 设置回车标签p或br
/// commandsName  EnterKey
/// commandsTitle  设置回车标签p或br
/**
 * @description 处理回车
 * @author zhanyi
 */
UE.plugins.enterkey = function () {
  var hTag;
  var me = this;
  var tag = me.options.enterTag;
  me.addListener('keyup', function (type, evt) {
    var keyCode = evt.keyCode || evt.which;
    if (keyCode == 13) {
      var range = me.selection.getRange();
      var start = range.startContainer;
      var doSave;

      // 修正在h1-h6里边回车后不能嵌套p的问题

      if (/h\d/i.test(hTag)) {
        if (browser.gecko) {
          var h = domUtils.findParentByTagName(start, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'caption', 'table'], true);
          if (!h) {
            me.document.execCommand('formatBlock', false, '<p>');
            doSave = 1;
          }
        } else {
          // chrome remove div
          if (start.nodeType == 1) {
            var tmp = me.document.createTextNode(''); var div;
            range.insertNode(tmp);
            div = domUtils.findParentByTagName(tmp, 'div', true);
            if (div) {
              var p = me.document.createElement('p');
              while (div.firstChild) {
                p.appendChild(div.firstChild);
              }
              div.parentNode.insertBefore(p, div);
              domUtils.remove(div);
              range.setStartBefore(tmp).setCursor();
              doSave = 1;
            }
            domUtils.remove(tmp);
          }
        }

        if (me.undoManger && doSave) {
          me.undoManger.save();
        }
      }
    }
  });

  me.addListener('keydown', function (type, evt) {
    var keyCode = evt.keyCode || evt.which;
    if (keyCode == 13) { // 回车
      if (me.fireEvent('beforeenterkeydown')) {
        domUtils.preventDefault(evt);
        return;
      }
      me.fireEvent('saveScene', true, true);
      hTag = '';

      var range = me.selection.getRange();

      if (!range.collapsed) {
        // 跨td不能删
        var start = range.startContainer;
        var end = range.endContainer;
        var startTd = domUtils.findParentByTagName(start, 'td', true);
        var endTd = domUtils.findParentByTagName(end, 'td', true);
        if (startTd && endTd && startTd !== endTd || !startTd && endTd || startTd && !endTd) {
          evt.preventDefault ? evt.preventDefault() : (evt.returnValue = false);
          return;
        }
      }
      if (tag == 'p') {
        start = domUtils.findParentByTagName(range.startContainer, ['ol', 'ul', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'caption'], true);

        if (!start) {
          me.document.execCommand('formatBlock', false, '<p>');

          if (browser.gecko) {
            range = me.selection.getRange();
            start = domUtils.findParentByTagName(range.startContainer, 'p', true);
            start && domUtils.removeDirtyAttr(start);
          }
        } else {
          hTag = start.tagName;
          start.tagName.toLowerCase() == 'p' && browser.gecko && domUtils.removeDirtyAttr(start);
        }
      } else {
        evt.preventDefault ? evt.preventDefault() : (evt.returnValue = false);

        if (!range.collapsed) {
          range.deleteContents();
          start = range.startContainer;
          if (start.nodeType == 1 && (start = start.childNodes[range.startOffset])) {
            while (start.nodeType == 1) {
              if (dtd.$empty[start.tagName]) {
                range.setStartBefore(start).setCursor();
                if (me.undoManger) {
                  me.undoManger.save();
                }
                return false;
              }
              if (!start.firstChild) {
                var br = range.document.createElement('br');
                start.appendChild(br);
                range.setStart(start, 0).setCursor();
                if (me.undoManger) {
                  me.undoManger.save();
                }
                return false;
              }
              start = start.firstChild;
            }
            if (start === range.startContainer.childNodes[range.startOffset]) {
              br = range.document.createElement('br');
              range.insertNode(br).setCursor();
            } else {
              range.setStart(start, 0).setCursor();
            }
          } else {
            br = range.document.createElement('br');
            range.insertNode(br).setStartAfter(br).setCursor();
          }
        } else {
          br = range.document.createElement('br');
          range.insertNode(br);
          var parent = br.parentNode;
          if (parent.lastChild === br) {
            br.parentNode.insertBefore(br.cloneNode(true), br);
            range.setStartBefore(br);
          } else {
            range.setStartAfter(br);
          }
          range.setCursor();
        }
      }
    }
  });
};
