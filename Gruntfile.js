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
          'prebuild/editor.js',
          'prebuild/core/browser.js',
          'prebuild/core/utils.js',
          'prebuild/core/EventBase.js',
          'prebuild/core/dtd.js',
          'prebuild/core/domUtils.js',
          'prebuild/core/Range.js',
          'prebuild/core/Selection.js',
          'prebuild/core/Editor.js',
          'prebuild/core/Editor.defaultoptions.js',
          'prebuild/core/loadconfig.js',
          'prebuild/core/ajax.js',
          'prebuild/core/filterword.js',
          'prebuild/core/node.js',
          'prebuild/core/htmlparser.js',
          'prebuild/core/filternode.js',
          'prebuild/core/plugin.js',
          'prebuild/core/keymap.js',
          'prebuild/core/localstorage.js',
          'prebuild/plugins/defaultfilter.js',
          'prebuild/plugins/inserthtml.js',
          'prebuild/plugins/autotypeset.js',
          'prebuild/plugins/autosubmit.js',
          'prebuild/plugins/background.js',
          'prebuild/plugins/image.js',
          'prebuild/plugins/justify.js',
          'prebuild/plugins/font.js',
          'prebuild/plugins/link.js',
          'prebuild/plugins/iframe.js',
          'prebuild/plugins/removeformat.js',
          'prebuild/plugins/blockquote.js',
          'prebuild/plugins/convertcase.js',
          'prebuild/plugins/indent.js',
          'prebuild/plugins/print.js',
          'prebuild/plugins/selectall.js',
          'prebuild/plugins/paragraph.js',
          'prebuild/plugins/directionality.js',
          'prebuild/plugins/horizontal.js',
          'prebuild/plugins/time.js',
          'prebuild/plugins/rowspacing.js',
          'prebuild/plugins/lineheight.js',
          'prebuild/plugins/insertcode.js',
          'prebuild/plugins/cleardoc.js',
          'prebuild/plugins/anchor.js',
          'prebuild/plugins/wordcount.js',
          'prebuild/plugins/pagebreak.js',
          'prebuild/plugins/dragdrop.js',
          'prebuild/plugins/undo.js',
          'prebuild/plugins/copy.js',
          'prebuild/plugins/paste.js',
          'prebuild/plugins/puretxtpaste.js',
          'prebuild/plugins/list.js',
          'prebuild/plugins/source.js',
          'prebuild/plugins/enterkey.js',
          'prebuild/plugins/keystrokes.js',
          'prebuild/plugins/fiximgclick.js',
          'prebuild/plugins/autolink.js',
          'prebuild/plugins/autoheight.js',
          'prebuild/plugins/autofloat.js',
          'prebuild/plugins/video.js',
          'prebuild/plugins/table.core.js',
          'prebuild/plugins/table.cmds.js',
          'prebuild/plugins/table.action.js',
          'prebuild/plugins/table.sort.js',
          'prebuild/plugins/contextmenu.js',
          'prebuild/plugins/shortcutmenu.js',
          'prebuild/plugins/basestyle.js',
          'prebuild/plugins/elementpath.js',
          'prebuild/plugins/formatmatch.js',
          'prebuild/plugins/searchreplace.js',
          'prebuild/plugins/customstyle.js',
          'prebuild/plugins/catchremoteimage.js',
          'prebuild/plugins/insertparagraph.js',
          'prebuild/plugins/template.js',
          'prebuild/plugins/autoupload.js',
          'prebuild/plugins/autosave.js',
          'prebuild/plugins/charts.js',
          'prebuild/plugins/section.js',
          'prebuild/plugins/simpleupload.js',
          'prebuild/plugins/serverparam.js',
          'prebuild/plugins/insertfile.js',
          'prebuild/plugins/xssFilter.js',
          'prebuild/ui/ui.js',
          'prebuild/ui/uiutils.js',
          'prebuild/ui/uibase.js',
          'prebuild/ui/separator.js',
          'prebuild/ui/mask.js',
          'prebuild/ui/popup.js',
          'prebuild/ui/colorpicker.js',
          'prebuild/ui/tablepicker.js',
          'prebuild/ui/stateful.js',
          'prebuild/ui/button.js',
          'prebuild/ui/splitbutton.js',
          'prebuild/ui/colorbutton.js',
          'prebuild/ui/tablebutton.js',
          'prebuild/ui/autotypesetpicker.js',
          'prebuild/ui/autotypesetbutton.js',
          'prebuild/ui/cellalignpicker.js',
          'prebuild/ui/pastepicker.js',
          'prebuild/ui/toolbar.js',
          'prebuild/ui/menu.js',
          'prebuild/ui/combox.js',
          'prebuild/ui/dialog.js',
          'prebuild/ui/menubutton.js',
          'prebuild/ui/multiMenu.js',
          'prebuild/ui/shortcutmenu.js',
          'prebuild/ui/breakline.js',
          'prebuild/ui/message.js',
          'prebuild/adapter/editorui.js',
          'prebuild/adapter/editor.js',
          'prebuild/adapter/message.js',
          'prebuild/adapter/autosave.js'
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
