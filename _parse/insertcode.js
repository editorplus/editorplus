UE.parse.register('insertcode', function (utils) {
  var pres = this.root.getElementsByTagName('pre');
  if (pres.length) {
    if (typeof XRegExp == "undefined") {
      var jsurl, cssurl;
      if (this.rootPath !== undefined) {
        jsurl = 'https://cdn.jsdelivr.net/npm/editorplus-thirdparty@2.0.0/SyntaxHighlighter/shCore.js';
        cssurl = 'https://cdn.jsdelivr.net/npm/editorplus-thirdparty@2.0.0/SyntaxHighlighter/shCoreDefault.css';
      } else {
        jsurl = this.highlightJsUrl;
        cssurl = this.highlightCssUrl;
      }
      utils.loadFile(document, {
        id: "syntaxhighlighter_css",
        tag: "link",
        rel: "stylesheet",
        type: "text/css",
        href: cssurl
      });
      utils.loadFile(document, {
        id: "syntaxhighlighter_js",
        src: jsurl,
        tag: "script",
        type: "text/javascript",
        defer: "defer"
      }, function () {
        utils.each(pres, function (pi) {
          if (pi && /brush/i.test(pi.className)) {
            SyntaxHighlighter.highlight(pi);
          }
        });
      });
    } else {
      utils.each(pres, function (pi) {
        if (pi && /brush/i.test(pi.className)) {
          SyntaxHighlighter.highlight(pi);
        }
      });
    }
  }

});
