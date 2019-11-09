/// import core
/// commands 悬浮工具栏
/// commandsName  AutoFloat,autoFloatEnabled
/// commandsTitle  悬浮工具栏
/**
 *  modified by chengchao01
 */
UE.plugins.autofloat = function () {
  var me = this;
  var lang = me.getLang();
  me.setOpt({
    topOffset: 0
  });
  var optsAutoFloatEnabled = me.options.autoFloatEnabled !== false;
  var topOffset = me.options.topOffset;

  // 如果不固定toolbar的位置，则直接退出
  if (!optsAutoFloatEnabled) {
    return;
  }
  var uiUtils = UE.ui.uiUtils;

  function checkHasUI () {
    if (!UE.ui) {
      alert(lang.autofloatMsg);
      return 0;
    }
    return 1;
  }
  var	bakCssText;
  var placeHolder = document.createElement('div');
  var toolbarBox; var orgTop;
  var getPosition;
  var flag = true; // ie7模式下需要偏移
  function setFloating () {
    var toobarBoxPos = domUtils.getXY(toolbarBox);
    var origalFloat = domUtils.getComputedStyle(toolbarBox, 'position');
    var origalLeft = domUtils.getComputedStyle(toolbarBox, 'left');
    toolbarBox.style.width = toolbarBox.offsetWidth + 'px';
    toolbarBox.style.zIndex = me.options.zIndex * 1 + 1;
    toolbarBox.parentNode.insertBefore(placeHolder, toolbarBox);

    if (toolbarBox.style.position != 'fixed') {
      toolbarBox.style.position = 'fixed';
      toolbarBox.style.top = topOffset + 'px';
      ((origalFloat == 'absolute' || origalFloat == 'relative') && parseFloat(origalLeft)) && (toolbarBox.style.left = toobarBoxPos.x + 'px');
    }
  }
  function unsetFloating () {
    flag = true;
    if (placeHolder.parentNode) {
      placeHolder.parentNode.removeChild(placeHolder);
    }

    toolbarBox.style.cssText = bakCssText;
  }

  function updateFloating () {
    var rect3 = getPosition(me.container);
    var offset = me.options.toolbarTopOffset || 0;
    if (rect3.top < 0 && rect3.bottom - toolbarBox.offsetHeight > offset) {
      setFloating();
    } else {
      unsetFloating();
    }
  }
  var defer_updateFloating = utils.defer(function () {
    updateFloating();
  }, 100, true);

  me.addListener('destroy', function () {
    domUtils.un(window, ['scroll', 'resize'], updateFloating);
    me.removeListener('keydown', defer_updateFloating);
  });

  me.addListener('ready', function () {
    if (checkHasUI(me)) {
      // 加载了ui组件，但在new时，没有加载ui，导致编辑器实例上没有ui类，所以这里做判断
      if (!me.ui) {
        return;
      }
      getPosition = uiUtils.getClientRect;
      toolbarBox = me.ui.getDom('toolbarbox');
      orgTop = getPosition(toolbarBox).top;
      bakCssText = toolbarBox.style.cssText;
      placeHolder.style.height = toolbarBox.offsetHeight + 'px';
      domUtils.on(window, ['scroll', 'resize'], updateFloating);
      me.addListener('keydown', defer_updateFloating);

      me.addListener('beforefullscreenchange', function (t, enabled) {
        if (enabled) {
          unsetFloating();
        }
      });
      me.addListener('fullscreenchanged', function (t, enabled) {
        if (!enabled) {
          updateFloating();
        }
      });
      me.addListener('sourcemodechanged', function (t, enabled) {
        setTimeout(function () {
          updateFloating();
        }, 0);
      });
      me.addListener('clearDoc', function () {
        setTimeout(function () {
          updateFloating();
        }, 0);
      });
    }
  });
};
