UE.parse.register('vedio', function(utils) {
  var video = this.root.getElementsByTagName('video'),
    audio = this.root.getElementsByTagName('audio');

  document.createElement('video');
  document.createElement('audio');
  if (video.length || audio.length) {
    var sourcePath = utils.removeLastbs(this.rootPath),
      jsurl = 'https://cdn.jsdelivr.net/npm/video.js@4.3.0/video.js',
      cssurl = 'https://cdn.jsdelivr.net/npm/video.js@4.3.0/video-js.min.css',
      swfUrl = 'https://cdn.jsdelivr.net/npm/video.js@4.3.0/video-js.swf';

    if (window.videojs) {
      videojs.autoSetup();
    } else {
      utils.loadFile(document, {
        id: 'video_css',
        tag: 'link',
        rel: 'stylesheet',
        type: 'text/css',
        href: cssurl
      });
      utils.loadFile(
        document,
        {
          id: 'video_js',
          src: jsurl,
          tag: 'script',
          type: 'text/javascript'
        },
        function() {
          videojs.options.flash.swf = swfUrl;
          videojs.autoSetup();
        }
      );
    }
  }
});
