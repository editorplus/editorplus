UE.plugin.register('charts', function () {
    var me = this;
    return {
        bindEvents: {
            chartserror: function () {
            }
        },
        commands: {
            charts: {
                execCommand: function (cmd, data) {
                    var tableNode = domUtils.findParentByTagName(this.selection.getRange().startContainer, 'table', true);
                    var flagText = [];
                    var config = {};
                    if (!tableNode) {
                        return false;
                    }
                    if (!validData(tableNode)) {
                        me.fireEvent('chartserror');
                        return false;
                    }
                    config.title = data.title || '';
                    config.subTitle = data.subTitle || '';
                    config.xTitle = data.xTitle || '';
                    config.yTitle = data.yTitle || '';
                    config.suffix = data.suffix || '';
                    config.tip = data.tip || '';
                    config.dataFormat = data.tableDataFormat || '';
                    config.chartType = data.chartType || 0;
                    for (var key in config) {
                        if (!config.hasOwnProperty(key)) {
                            continue;
                        }
                        flagText.push(key + ':' + config[key]);
                    }
                    tableNode.setAttribute('data-chart', flagText.join(';'));
                    domUtils.addClass(tableNode, 'edui-charts-table');
                },
                queryCommandState: function (cmd, name) {
                    var tableNode = domUtils.findParentByTagName(this.selection.getRange().startContainer, 'table', true);
                    return tableNode && validData(tableNode) ? 0 : -1;
                }
            }
        },
        inputRule: function (root) {
            utils.each(root.getNodesByTagName('table'), function (tableNode) {
                if (tableNode.getAttr('data-chart') !== undefined) {
                    tableNode.setAttr('style');
                }
            });
        },
        outputRule: function (root) {
            utils.each(root.getNodesByTagName('table'), function (tableNode) {
                if (tableNode.getAttr('data-chart') !== undefined) {
                    tableNode.setAttr('style', 'display: none;');
                }
            });
        }
    };
    function validData(table) {
        var firstRows = null;
        var cellCount = 0;
        if (table.rows.length < 2) {
            return false;
        }
        if (table.rows[0].cells.length < 2) {
            return false;
        }
        firstRows = table.rows[0].cells;
        cellCount = firstRows.length;
        for (var i = 0, cell; cell = firstRows[i]; i++) {
            if (cell.tagName.toLowerCase() !== 'th') {
                return false;
            }
        }
        for (var i = 1, row; row = table.rows[i]; i++) {
            if (row.cells.length != cellCount) {
                return false;
            }
            if (row.cells[0].tagName.toLowerCase() !== 'th') {
                return false;
            }
            for (var j = 1, cell; cell = row.cells[j]; j++) {
                var value = utils.trim((cell.innerText || cell.textContent || ''));
                value = value.replace(new RegExp(UE.dom.domUtils.fillChar, 'g'), '').replace(/^\s+|\s+$/g, '');
                if (!/^\d*\.?\d+$/.test(value)) {
                    return false;
                }
            }
        }
        return true;
    }
});
