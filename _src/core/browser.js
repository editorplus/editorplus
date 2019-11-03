/**
 * 提供浏览器检测的模块
 * @module UE.browser
 */
var browser = UE.browser = function () {
  /**
   * @see https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
   * @type {{
   * quirks: boolean,
   * gecko: boolean,
   * ie: boolean,
   * webkit: boolean,
   * mac: boolean
   * }}
   */
  var browser = {
    ie: !!document.documentMode,
    edge: !!window.StyleMedia,
    webkit: navigator.userAgent.indexOf(' AppleWebKit/') > -1,
    gecko: typeof window.InstallTrigger !== 'undefined',
    mac: navigator.userAgent.indexOf('Macintosh') > -1,
    quirks: document.compatMode === 'BackCompat', // 检测当前浏览器是否处于“怪异模式”下
  };

  /**
   * 浏览器版本号
   */
  var version = 0;

  if (browser.gecko) {
    if (/\s+rv:\d+\.\d+/.test(navigator.userAgent)) {
      var rv0 = navigator.userAgent.match(/\s+rv:(\d+\.\d+)/);
      var rv1 = rv0[1].split('.');
      rv1[0] && (version += rv1[0] * 10000);
      rv1[1] && (version += rv1[1] * 100);
      rv1[2] && (version += rv1[2] * 1);
    }
  }

  if (/\s+Chrome\/(\d+\.\d)/i.test(navigator.userAgent)) {
    browser.chrome = +RegExp["\x241"]; // $1 to number, 返回主版本号
  }

  if (browser.webkit) {
    version = parseFloat(navigator.userAgent.match(/\s+AppleWebKit\/(\d+)/i)[1]);
  }

  /**
   * @property { Number } version 检测当前浏览器版本号
   * @remind
   * <ul>
   *     <li>IE系列返回值为5,6,7,8,9,10等</li>
   *     <li>gecko系列会返回10900，158900等</li>
   *     <li>webkit系列会返回其build号 (如 522等)</li>
   * </ul>
   * @example
   * ```javascript
   * console.log( '当前浏览器版本号是： ' + UE.browser.version );
   * ```
   */
  browser.version = version;

  /**
   * 如果使用了不支持的浏览器，则直接报错
   */
  if (browser.edge || !(browser.chrome || browser.gecko || browser.webkit || browser.mac)) {
    throw new Error('unsupport browser: ' + navigator.userAgent);
  }

  return browser;
}();

// 快捷方式
var ie = false;
var webkit = browser.webkit;
var gecko = browser.gecko;

