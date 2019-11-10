'use strict';

module.exports = function (grunt) {
  var pkgJson = grunt.file.readJSON('package.json');
  var releasedir = 'dist/';
  var banner = '/*!\n * name: ' + pkgJson.name + '\n * version: ' + pkgJson.version + '\n * build: <%= new Date() %>\n */\n\n';

  grunt.initConfig({
    pkg: pkgJson,
    concat: {
      js: {
        options: {
          banner: banner + '(function(){\n\n',
          footer: '\n\n})();\n',
          process: function (src, s) {
            var filename = s.substr(s.indexOf('/') + 1);
            return '// ' + filename + '\n' + src.replace('/_css/', '/css/') + '\n';
          }
        },
        src: [
          'built/editor.js',
          'built/core/browser.js',
          'built/core/utils.js',
          'built/core/EventBase.js',
          'built/core/dtd.js',
          'built/core/domUtils.js',
          'built/core/Range.js',
          'built/core/Selection.js',
          'built/core/Editor.js',
          'built/core/Editor.defaultoptions.js',
          'built/core/loadconfig.js',
          'built/core/ajax.js',
          'built/core/filterword.js',
          'built/core/node.js',
          'built/core/htmlparser.js',
          'built/core/filternode.js',
          'built/core/plugin.js',
          'built/core/keymap.js',
          'built/core/localstorage.js',
          'built/plugins/defaultfilter.js',
          'built/plugins/inserthtml.js',
          'built/plugins/autotypeset.js',
          'built/plugins/autosubmit.js',
          'built/plugins/background.js',
          'built/plugins/image.js',
          'built/plugins/justify.js',
          'built/plugins/font.js',
          'built/plugins/link.js',
          'built/plugins/iframe.js',
          'built/plugins/removeformat.js',
          'built/plugins/blockquote.js',
          'built/plugins/convertcase.js',
          'built/plugins/indent.js',
          'built/plugins/print.js',
          'built/plugins/selectall.js',
          'built/plugins/paragraph.js',
          'built/plugins/directionality.js',
          'built/plugins/horizontal.js',
          'built/plugins/time.js',
          'built/plugins/rowspacing.js',
          'built/plugins/lineheight.js',
          'built/plugins/insertcode.js',
          'built/plugins/cleardoc.js',
          'built/plugins/anchor.js',
          'built/plugins/wordcount.js',
          'built/plugins/pagebreak.js',
          'built/plugins/dragdrop.js',
          'built/plugins/undo.js',
          'built/plugins/copy.js',
          'built/plugins/paste.js',
          'built/plugins/puretxtpaste.js',
          'built/plugins/list.js',
          'built/plugins/source.js',
          'built/plugins/enterkey.js',
          'built/plugins/keystrokes.js',
          'built/plugins/fiximgclick.js',
          'built/plugins/autolink.js',
          'built/plugins/autoheight.js',
          'built/plugins/autofloat.js',
          'built/plugins/video.js',
          'built/plugins/table.core.js',
          'built/plugins/table.cmds.js',
          'built/plugins/table.action.js',
          'built/plugins/table.sort.js',
          'built/plugins/contextmenu.js',
          'built/plugins/shortcutmenu.js',
          'built/plugins/basestyle.js',
          'built/plugins/elementpath.js',
          'built/plugins/formatmatch.js',
          'built/plugins/searchreplace.js',
          'built/plugins/customstyle.js',
          'built/plugins/catchremoteimage.js',
          'built/plugins/insertparagraph.js',
          'built/plugins/template.js',
          'built/plugins/autoupload.js',
          'built/plugins/autosave.js',
          'built/plugins/charts.js',
          'built/plugins/section.js',
          'built/plugins/simpleupload.js',
          'built/plugins/serverparam.js',
          'built/plugins/insertfile.js',
          'built/plugins/xssFilter.js',
          'built/ui/ui.js',
          'built/ui/uiutils.js',
          'built/ui/uibase.js',
          'built/ui/separator.js',
          'built/ui/mask.js',
          'built/ui/popup.js',
          'built/ui/colorpicker.js',
          'built/ui/tablepicker.js',
          'built/ui/stateful.js',
          'built/ui/button.js',
          'built/ui/splitbutton.js',
          'built/ui/colorbutton.js',
          'built/ui/tablebutton.js',
          'built/ui/autotypesetpicker.js',
          'built/ui/autotypesetbutton.js',
          'built/ui/cellalignpicker.js',
          'built/ui/pastepicker.js',
          'built/ui/toolbar.js',
          'built/ui/menu.js',
          'built/ui/combox.js',
          'built/ui/dialog.js',
          'built/ui/menubutton.js',
          'built/ui/multiMenu.js',
          'built/ui/shortcutmenu.js',
          'built/ui/breakline.js',
          'built/ui/message.js',
          'built/adapter/editorui.js',
          'built/adapter/editor.js',
          'built/adapter/message.js',
          'built/adapter/autosave.js'
        ],
        dest: releasedir + 'editorplus.all.js'
      }
    },
    uglify: {
      options: {
        banner: banner
      },
      dest: {
        src: releasedir + 'editorplus.all.js',
        dest: releasedir + 'editorplus.all.min.js'
      }
    },
    copy: {
      base: {
        files: [
          {
            src: [
              'dialogs/**'
            ],
            dest: releasedir
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', 'build editor', function () {
    grunt.task.run([
      'concat',
      'uglify',
      'copy:base'
    ]);
  });
};
