UE.plugins.elementpath = function () {
    var currentLevel;
    var tagNames;
    var me = this;
    me.setOpt('elementPathEnabled', true);
    if (!me.options.elementPathEnabled) {
        return;
    }
    me.commands.elementpath = {
        execCommand: function (cmdName, level) {
            var start = tagNames[level];
            var range = me.selection.getRange();
            currentLevel = level * 1;
            range.selectNode(start).select();
        },
        queryCommandValue: function () {
            var parents = [].concat(this.selection.getStartElementPath()).reverse();
            var names = [];
            tagNames = parents;
            for (var i = 0, ci; ci = parents[i]; i++) {
                if (ci.nodeType == 3) {
                    continue;
                }
                var name = ci.tagName.toLowerCase();
                if (name == 'img' && ci.getAttribute('anchorname')) {
                    name = 'anchor';
                }
                names[i] = name;
                if (currentLevel == i) {
                    currentLevel = -1;
                    break;
                }
            }
            return names;
        }
    };
};
