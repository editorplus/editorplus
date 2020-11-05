UE.Editor.defaultOptions = function (editor) {
    var _url = editor.options.UEDITOR_HOME_URL;
    return {
        isShow: true,
        initialContent: '',
        initialStyle: '',
        autoClearinitialContent: false,
        iframeCssUrl: _url + 'themes/iframe.css',
        textarea: 'editorValue',
        focus: false,
        focusInEnd: true,
        autoClearEmptyNode: true,
        fullscreen: false,
        readonly: false,
        zIndex: 999,
        imagePopup: true,
        enterTag: 'p',
        customDomain: false,
        lang: 'zh-cn',
        langPath: _url + 'lang/',
        theme: 'default',
        themePath: _url + 'themes/',
        allHtmlEnabled: false,
        scaleEnabled: false,
        tableNativeEditInFF: false,
        autoSyncData: true,
        fileNameFormat: '{time}{rand:6}'
    };
};
