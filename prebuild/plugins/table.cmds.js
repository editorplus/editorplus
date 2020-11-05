(function () {
    var UT = UE.UETable;
    var getTableItemsByRange = function (editor) {
        return UT.getTableItemsByRange(editor);
    };
    var getUETableBySelected = function (editor) {
        return UT.getUETableBySelected(editor);
    };
    var getDefaultValue = function (editor, table) {
        return UT.getDefaultValue(editor, table);
    };
    var getUETable = function (tdOrTable) {
        return UT.getUETable(tdOrTable);
    };
    UE.commands.inserttable = {
        queryCommandState: function () {
            return getTableItemsByRange(this).table ? -1 : 0;
        },
        execCommand: function (cmd, opt) {
            function createTable(opt, tdWidth) {
                var html = [];
                var rowsNum = opt.numRows;
                var colsNum = opt.numCols;
                for (var r = 0; r < rowsNum; r++) {
                    html.push('<tr' + (r == 0 ? ' class="firstRow"' : '') + '>');
                    for (var c = 0; c < colsNum; c++) {
                        html.push('<td width="' + tdWidth + '"  vAlign="' + opt.tdvalign + '" ><br/></td>');
                    }
                    html.push('</tr>');
                }
                return '<table><tbody>' + html.join('') + '</tbody></table>';
            }
            if (!opt) {
                opt = utils.extend({}, {
                    numCols: this.options.defaultCols,
                    numRows: this.options.defaultRows,
                    tdvalign: this.options.tdvalign
                });
            }
            var me = this;
            var range = this.selection.getRange();
            var start = range.startContainer;
            var firstParentBlock = domUtils.findParent(start, function (node) {
                return domUtils.isBlockElm(node);
            }, true) || me.body;
            var defaultValue = getDefaultValue(me);
            var tableWidth = firstParentBlock.offsetWidth;
            var tdWidth = Math.floor(tableWidth / opt.numCols - defaultValue.tdPadding * 2 - defaultValue.tdBorder);
            !opt.tdvalign && (opt.tdvalign = me.options.tdvalign);
            me.execCommand('inserthtml', createTable(opt, tdWidth));
        }
    };
    UE.commands.insertparagraphbeforetable = {
        queryCommandState: function () {
            return getTableItemsByRange(this).cell ? 0 : -1;
        },
        execCommand: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                var p = this.document.createElement('p');
                p.innerHTML = '<br />';
                table.parentNode.insertBefore(p, table);
                this.selection.getRange().setStart(p, 0).setCursor();
            }
        }
    };
    UE.commands.deletetable = {
        queryCommandState: function () {
            var rng = this.selection.getRange();
            return domUtils.findParentByTagName(rng.startContainer, 'table', true) ? 0 : -1;
        },
        execCommand: function (cmd, table) {
            var rng = this.selection.getRange();
            table = table || domUtils.findParentByTagName(rng.startContainer, 'table', true);
            if (table) {
                var next = table.nextSibling;
                if (!next) {
                    next = domUtils.createElement(this.document, 'p', {
                        innerHTML: '<br/>'
                    });
                    table.parentNode.insertBefore(next, table);
                }
                domUtils.remove(table);
                rng = this.selection.getRange();
                if (next.nodeType == 3) {
                    rng.setStartBefore(next);
                }
                else {
                    rng.setStart(next, 0);
                }
                rng.setCursor(false, true);
                this.fireEvent('tablehasdeleted');
            }
        }
    };
    UE.commands.cellalign = {
        queryCommandState: function () {
            return getSelectedArr(this).length ? 0 : -1;
        },
        execCommand: function (cmd, align) {
            var selectedTds = getSelectedArr(this);
            if (selectedTds.length) {
                for (var i = 0, ci; ci = selectedTds[i++];) {
                    ci.setAttribute('align', align);
                }
            }
        }
    };
    UE.commands.cellvalign = {
        queryCommandState: function () {
            return getSelectedArr(this).length ? 0 : -1;
        },
        execCommand: function (cmd, valign) {
            var selectedTds = getSelectedArr(this);
            if (selectedTds.length) {
                for (var i = 0, ci; ci = selectedTds[i++];) {
                    ci.setAttribute('vAlign', valign);
                }
            }
        }
    };
    UE.commands.insertcaption = {
        queryCommandState: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                return table.getElementsByTagName('caption').length == 0 ? 1 : -1;
            }
            return -1;
        },
        execCommand: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                var caption = this.document.createElement('caption');
                caption.innerHTML = '<br/>';
                table.insertBefore(caption, table.firstChild);
                var range = this.selection.getRange();
                range.setStart(caption, 0).setCursor();
            }
        }
    };
    UE.commands.deletecaption = {
        queryCommandState: function () {
            var rng = this.selection.getRange();
            var table = domUtils.findParentByTagName(rng.startContainer, 'table');
            if (table) {
                return table.getElementsByTagName('caption').length == 0 ? -1 : 1;
            }
            return -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var table = domUtils.findParentByTagName(rng.startContainer, 'table');
            if (table) {
                domUtils.remove(table.getElementsByTagName('caption')[0]);
                var range = this.selection.getRange();
                range.setStart(table.rows[0].cells[0], 0).setCursor();
            }
        }
    };
    UE.commands.inserttitle = {
        queryCommandState: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                var firstRow = table.rows[0];
                return firstRow.cells[firstRow.cells.length - 1].tagName.toLowerCase() != 'th' ? 0 : -1;
            }
            return -1;
        },
        execCommand: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                getUETable(table).insertRow(0, 'th');
            }
            var th = table.getElementsByTagName('th')[0];
            this.selection.getRange().setStart(th, 0).setCursor(false, true);
        }
    };
    UE.commands.deletetitle = {
        queryCommandState: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                var firstRow = table.rows[0];
                return firstRow.cells[firstRow.cells.length - 1].tagName.toLowerCase() == 'th' ? 0 : -1;
            }
            return -1;
        },
        execCommand: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                domUtils.remove(table.rows[0]);
            }
            var td = table.getElementsByTagName('td')[0];
            this.selection.getRange().setStart(td, 0).setCursor(false, true);
        }
    };
    UE.commands.inserttitlecol = {
        queryCommandState: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                var lastRow = table.rows[table.rows.length - 1];
                return lastRow.getElementsByTagName('th').length ? -1 : 0;
            }
            return -1;
        },
        execCommand: function (cmd) {
            var table = getTableItemsByRange(this).table;
            if (table) {
                getUETable(table).insertCol(0, 'th');
            }
            resetTdWidth(table, this);
            var th = table.getElementsByTagName('th')[0];
            this.selection.getRange().setStart(th, 0).setCursor(false, true);
        }
    };
    UE.commands.deletetitlecol = {
        queryCommandState: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                var lastRow = table.rows[table.rows.length - 1];
                return lastRow.getElementsByTagName('th').length ? 0 : -1;
            }
            return -1;
        },
        execCommand: function () {
            var table = getTableItemsByRange(this).table;
            if (table) {
                for (var i = 0; i < table.rows.length; i++) {
                    domUtils.remove(table.rows[i].children[0]);
                }
            }
            resetTdWidth(table, this);
            var td = table.getElementsByTagName('td')[0];
            this.selection.getRange().setStart(td, 0).setCursor(false, true);
        }
    };
    UE.commands.mergeright = {
        queryCommandState: function (cmd) {
            var tableItems = getTableItemsByRange(this);
            var table = tableItems.table;
            var cell = tableItems.cell;
            if (!table || !cell)
                return -1;
            var ut = getUETable(table);
            if (ut.selectedTds.length)
                return -1;
            var cellInfo = ut.getCellInfo(cell);
            var rightColIndex = cellInfo.colIndex + cellInfo.colSpan;
            if (rightColIndex >= ut.colsNum)
                return -1;
            var rightCellInfo = ut.indexTable[cellInfo.rowIndex][rightColIndex];
            var rightCell = table.rows[rightCellInfo.rowIndex].cells[rightCellInfo.cellIndex];
            if (!rightCell || cell.tagName != rightCell.tagName)
                return -1;
            return (rightCellInfo.rowIndex == cellInfo.rowIndex && rightCellInfo.rowSpan == cellInfo.rowSpan) ? 0 : -1;
        },
        execCommand: function (cmd) {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            ut.mergeRight(cell);
            rng.moveToBookmark(bk).select();
        }
    };
    UE.commands.mergedown = {
        queryCommandState: function (cmd) {
            var tableItems = getTableItemsByRange(this);
            var table = tableItems.table;
            var cell = tableItems.cell;
            if (!table || !cell)
                return -1;
            var ut = getUETable(table);
            if (ut.selectedTds.length)
                return -1;
            var cellInfo = ut.getCellInfo(cell);
            var downRowIndex = cellInfo.rowIndex + cellInfo.rowSpan;
            if (downRowIndex >= ut.rowsNum)
                return -1;
            var downCellInfo = ut.indexTable[downRowIndex][cellInfo.colIndex];
            var downCell = table.rows[downCellInfo.rowIndex].cells[downCellInfo.cellIndex];
            if (!downCell || cell.tagName != downCell.tagName)
                return -1;
            return (downCellInfo.colIndex == cellInfo.colIndex && downCellInfo.colSpan == cellInfo.colSpan) ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            ut.mergeDown(cell);
            rng.moveToBookmark(bk).select();
        }
    };
    UE.commands.mergecells = {
        queryCommandState: function () {
            return getUETableBySelected(this) ? 0 : -1;
        },
        execCommand: function () {
            var ut = getUETableBySelected(this);
            if (ut && ut.selectedTds.length) {
                var cell = ut.selectedTds[0];
                ut.mergeRange();
                var rng = this.selection.getRange();
                if (domUtils.isEmptyBlock(cell)) {
                    rng.setStart(cell, 0).collapse(true);
                }
                else {
                    rng.selectNodeContents(cell);
                }
                rng.select();
            }
        }
    };
    UE.commands.insertrow = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            return cell && (cell.tagName == 'TD' || (cell.tagName == 'TH' && tableItems.tr !== tableItems.table.rows[0])) &&
                getUETable(tableItems.table).rowsNum < this.options.maxRowNum ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            var table = tableItems.table;
            var ut = getUETable(table);
            var cellInfo = ut.getCellInfo(cell);
            if (!ut.selectedTds.length) {
                ut.insertRow(cellInfo.rowIndex, cell);
            }
            else {
                var range = ut.cellsRange;
                for (var i = 0, len = range.endRowIndex - range.beginRowIndex + 1; i < len; i++) {
                    ut.insertRow(range.beginRowIndex, cell);
                }
            }
            rng.moveToBookmark(bk).select();
            if (table.getAttribute('interlaced') === 'enabled')
                this.fireEvent('interlacetable', table);
        }
    };
    UE.commands.insertrownext = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            return cell && (cell.tagName == 'TD') && getUETable(tableItems.table).rowsNum < this.options.maxRowNum ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            var table = tableItems.table;
            var ut = getUETable(table);
            var cellInfo = ut.getCellInfo(cell);
            if (!ut.selectedTds.length) {
                ut.insertRow(cellInfo.rowIndex + cellInfo.rowSpan, cell);
            }
            else {
                var range = ut.cellsRange;
                for (var i = 0, len = range.endRowIndex - range.beginRowIndex + 1; i < len; i++) {
                    ut.insertRow(range.endRowIndex + 1, cell);
                }
            }
            rng.moveToBookmark(bk).select();
            if (table.getAttribute('interlaced') === 'enabled')
                this.fireEvent('interlacetable', table);
        }
    };
    UE.commands.deleterow = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            return tableItems.cell ? 0 : -1;
        },
        execCommand: function () {
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            var cellsRange = ut.cellsRange;
            var cellInfo = ut.getCellInfo(cell);
            var preCell = ut.getVSideCell(cell);
            var nextCell = ut.getVSideCell(cell, true);
            var rng = this.selection.getRange();
            if (utils.isEmptyObject(cellsRange)) {
                ut.deleteRow(cellInfo.rowIndex);
            }
            else {
                for (var i = cellsRange.beginRowIndex; i < cellsRange.endRowIndex + 1; i++) {
                    ut.deleteRow(cellsRange.beginRowIndex);
                }
            }
            var table = ut.table;
            if (!table.getElementsByTagName('td').length) {
                var nextSibling = table.nextSibling;
                domUtils.remove(table);
                if (nextSibling) {
                    rng.setStart(nextSibling, 0).setCursor(false, true);
                }
            }
            else {
                if (cellInfo.rowSpan == 1 || cellInfo.rowSpan == cellsRange.endRowIndex - cellsRange.beginRowIndex + 1) {
                    if (nextCell || preCell)
                        rng.selectNodeContents(nextCell || preCell).setCursor(false, true);
                }
                else {
                    var newCell = ut.getCell(cellInfo.rowIndex, ut.indexTable[cellInfo.rowIndex][cellInfo.colIndex].cellIndex);
                    if (newCell)
                        rng.selectNodeContents(newCell).setCursor(false, true);
                }
            }
            if (table.getAttribute('interlaced') === 'enabled')
                this.fireEvent('interlacetable', table);
        }
    };
    UE.commands.insertcol = {
        queryCommandState: function (cmd) {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            return cell && (cell.tagName == 'TD' || (cell.tagName == 'TH' && cell !== tableItems.tr.cells[0])) &&
                getUETable(tableItems.table).colsNum < this.options.maxColNum ? 0 : -1;
        },
        execCommand: function (cmd) {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            if (this.queryCommandState(cmd) == -1)
                return;
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            var cellInfo = ut.getCellInfo(cell);
            if (!ut.selectedTds.length) {
                ut.insertCol(cellInfo.colIndex, cell);
            }
            else {
                var range = ut.cellsRange;
                for (var i = 0, len = range.endColIndex - range.beginColIndex + 1; i < len; i++) {
                    ut.insertCol(range.beginColIndex, cell);
                }
            }
            rng.moveToBookmark(bk).select(true);
        }
    };
    UE.commands.insertcolnext = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            return cell && getUETable(tableItems.table).colsNum < this.options.maxColNum ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            var cellInfo = ut.getCellInfo(cell);
            if (!ut.selectedTds.length) {
                ut.insertCol(cellInfo.colIndex + cellInfo.colSpan, cell);
            }
            else {
                var range = ut.cellsRange;
                for (var i = 0, len = range.endColIndex - range.beginColIndex + 1; i < len; i++) {
                    ut.insertCol(range.endColIndex + 1, cell);
                }
            }
            rng.moveToBookmark(bk).select();
        }
    };
    UE.commands.deletecol = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            return tableItems.cell ? 0 : -1;
        },
        execCommand: function () {
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            var range = ut.cellsRange;
            var cellInfo = ut.getCellInfo(cell);
            var preCell = ut.getHSideCell(cell);
            var nextCell = ut.getHSideCell(cell, true);
            if (utils.isEmptyObject(range)) {
                ut.deleteCol(cellInfo.colIndex);
            }
            else {
                for (var i = range.beginColIndex; i < range.endColIndex + 1; i++) {
                    ut.deleteCol(range.beginColIndex);
                }
            }
            var table = ut.table;
            var rng = this.selection.getRange();
            if (!table.getElementsByTagName('td').length) {
                var nextSibling = table.nextSibling;
                domUtils.remove(table);
                if (nextSibling) {
                    rng.setStart(nextSibling, 0).setCursor(false, true);
                }
            }
            else {
                if (domUtils.inDoc(cell, this.document)) {
                    rng.setStart(cell, 0).setCursor(false, true);
                }
                else {
                    if (nextCell && domUtils.inDoc(nextCell, this.document)) {
                        rng.selectNodeContents(nextCell).setCursor(false, true);
                    }
                    else {
                        if (preCell && domUtils.inDoc(preCell, this.document)) {
                            rng.selectNodeContents(preCell).setCursor(true, true);
                        }
                    }
                }
            }
        }
    };
    UE.commands.splittocells = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            if (!cell)
                return -1;
            var ut = getUETable(tableItems.table);
            if (ut.selectedTds.length > 0)
                return -1;
            return cell && (cell.colSpan > 1 || cell.rowSpan > 1) ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            ut.splitToCells(cell);
            rng.moveToBookmark(bk).select();
        }
    };
    UE.commands.splittorows = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            if (!cell)
                return -1;
            var ut = getUETable(tableItems.table);
            if (ut.selectedTds.length > 0)
                return -1;
            return cell && cell.rowSpan > 1 ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            ut.splitToRows(cell);
            rng.moveToBookmark(bk).select();
        }
    };
    UE.commands.splittocols = {
        queryCommandState: function () {
            var tableItems = getTableItemsByRange(this);
            var cell = tableItems.cell;
            if (!cell)
                return -1;
            var ut = getUETable(tableItems.table);
            if (ut.selectedTds.length > 0)
                return -1;
            return cell && cell.colSpan > 1 ? 0 : -1;
        },
        execCommand: function () {
            var rng = this.selection.getRange();
            var bk = rng.createBookmark(true);
            var cell = getTableItemsByRange(this).cell;
            var ut = getUETable(cell);
            ut.splitToCols(cell);
            rng.moveToBookmark(bk).select();
        }
    };
    UE.commands.adaptbytext =
        UE.commands.adaptbywindow = {
            queryCommandState: function () {
                return getTableItemsByRange(this).table ? 0 : -1;
            },
            execCommand: function (cmd) {
                var tableItems = getTableItemsByRange(this);
                var table = tableItems.table;
                if (table) {
                    if (cmd == 'adaptbywindow') {
                        resetTdWidth(table, this);
                    }
                    else {
                        var cells = domUtils.getElementsByTagName(table, 'td th');
                        utils.each(cells, function (cell) {
                            cell.removeAttribute('width');
                        });
                        table.removeAttribute('width');
                    }
                }
            }
        };
    UE.commands.averagedistributecol = {
        queryCommandState: function () {
            var ut = getUETableBySelected(this);
            if (!ut)
                return -1;
            return ut.isFullRow() || ut.isFullCol() ? 0 : -1;
        },
        execCommand: function (cmd) {
            var me = this;
            var ut = getUETableBySelected(me);
            function getAverageWidth() {
                var tb = ut.table;
                var averageWidth;
                var sumWidth = 0;
                var colsNum = 0;
                var tbAttr = getDefaultValue(me, tb);
                if (ut.isFullRow()) {
                    sumWidth = tb.offsetWidth;
                    colsNum = ut.colsNum;
                }
                else {
                    var begin = ut.cellsRange.beginColIndex;
                    var end = ut.cellsRange.endColIndex;
                    var node;
                    for (var i = begin; i <= end;) {
                        node = ut.selectedTds[i];
                        sumWidth += node.offsetWidth;
                        i += node.colSpan;
                        colsNum += 1;
                    }
                }
                averageWidth = Math.ceil(sumWidth / colsNum) - tbAttr.tdBorder * 2 - tbAttr.tdPadding * 2;
                return averageWidth;
            }
            function setAverageWidth(averageWidth) {
                utils.each(domUtils.getElementsByTagName(ut.table, 'th'), function (node) {
                    node.setAttribute('width', '');
                });
                var cells = ut.isFullRow() ? domUtils.getElementsByTagName(ut.table, 'td') : ut.selectedTds;
                utils.each(cells, function (node) {
                    if (node.colSpan == 1) {
                        node.setAttribute('width', averageWidth);
                    }
                });
            }
            if (ut && ut.selectedTds.length) {
                setAverageWidth(getAverageWidth());
            }
        }
    };
    UE.commands.averagedistributerow = {
        queryCommandState: function () {
            var ut = getUETableBySelected(this);
            if (!ut)
                return -1;
            if (ut.selectedTds && /th/ig.test(ut.selectedTds[0].tagName))
                return -1;
            return ut.isFullRow() || ut.isFullCol() ? 0 : -1;
        },
        execCommand: function (cmd) {
            var me = this;
            var ut = getUETableBySelected(me);
            function getAverageHeight() {
                var averageHeight;
                var rowNum;
                var sumHeight = 0;
                var tb = ut.table;
                var tbAttr = getDefaultValue(me, tb);
                var tdpadding = parseInt(domUtils.getComputedStyle(tb.getElementsByTagName('td')[0], 'padding-top'));
                if (ut.isFullCol()) {
                    var captionArr = domUtils.getElementsByTagName(tb, 'caption');
                    var thArr = domUtils.getElementsByTagName(tb, 'th');
                    var captionHeight;
                    var thHeight;
                    if (captionArr.length > 0) {
                        captionHeight = captionArr[0].offsetHeight;
                    }
                    if (thArr.length > 0) {
                        thHeight = thArr[0].offsetHeight;
                    }
                    sumHeight = tb.offsetHeight - (captionHeight || 0) - (thHeight || 0);
                    rowNum = thArr.length == 0 ? ut.rowsNum : (ut.rowsNum - 1);
                }
                else {
                    var begin = ut.cellsRange.beginRowIndex;
                    var end = ut.cellsRange.endRowIndex;
                    var count = 0;
                    var trs = domUtils.getElementsByTagName(tb, 'tr');
                    for (var i = begin; i <= end; i++) {
                        sumHeight += trs[i].offsetHeight;
                        count += 1;
                    }
                    rowNum = count;
                }
                averageHeight = Math.ceil(sumHeight / rowNum) - tbAttr.tdBorder * 2 - tdpadding * 2;
                return averageHeight;
            }
            function setAverageHeight(averageHeight) {
                var cells = ut.isFullCol() ? domUtils.getElementsByTagName(ut.table, 'td') : ut.selectedTds;
                utils.each(cells, function (node) {
                    if (node.rowSpan == 1) {
                        node.setAttribute('height', averageHeight);
                    }
                });
            }
            if (ut && ut.selectedTds.length) {
                setAverageHeight(getAverageHeight());
            }
        }
    };
    UE.commands.cellalignment = {
        queryCommandState: function () {
            return getTableItemsByRange(this).table ? 0 : -1;
        },
        execCommand: function (cmd, data) {
            var me = this;
            var ut = getUETableBySelected(me);
            if (!ut) {
                var start = me.selection.getStart();
                var cell = start && domUtils.findParentByTagName(start, ['td', 'th', 'caption'], true);
                if (!/caption/ig.test(cell.tagName)) {
                    domUtils.setAttributes(cell, data);
                }
                else {
                    cell.style.textAlign = data.align;
                    cell.style.verticalAlign = data.vAlign;
                }
                me.selection.getRange().setCursor(true);
            }
            else {
                utils.each(ut.selectedTds, function (cell) {
                    domUtils.setAttributes(cell, data);
                });
            }
        },
        queryCommandValue: function (cmd) {
            var activeMenuCell = getTableItemsByRange(this).cell;
            if (!activeMenuCell) {
                activeMenuCell = getSelectedArr(this)[0];
            }
            if (!activeMenuCell) {
                return null;
            }
            else {
                var cells = UE.UETable.getUETable(activeMenuCell).selectedTds;
                !cells.length && (cells = activeMenuCell);
                return UE.UETable.getTableCellAlignState(cells);
            }
        }
    };
    UE.commands.tablealignment = {
        queryCommandState: function () {
            return getTableItemsByRange(this).table ? 0 : -1;
        },
        execCommand: function (cmd, value) {
            var me = this;
            var start = me.selection.getStart();
            var table = start && domUtils.findParentByTagName(start, ['table'], true);
            if (table) {
                table.setAttribute('align', value);
            }
        }
    };
    UE.commands.edittable = {
        queryCommandState: function () {
            return getTableItemsByRange(this).table ? 0 : -1;
        },
        execCommand: function (cmd, color) {
            var rng = this.selection.getRange();
            var table = domUtils.findParentByTagName(rng.startContainer, 'table');
            if (table) {
                var arr = domUtils.getElementsByTagName(table, 'td').concat(domUtils.getElementsByTagName(table, 'th'), domUtils.getElementsByTagName(table, 'caption'));
                utils.each(arr, function (node) {
                    node.style.borderColor = color;
                });
            }
        }
    };
    UE.commands.edittd = {
        queryCommandState: function () {
            return getTableItemsByRange(this).table ? 0 : -1;
        },
        execCommand: function (cmd, bkColor) {
            var me = this;
            var ut = getUETableBySelected(me);
            if (!ut) {
                var start = me.selection.getStart();
                var cell = start && domUtils.findParentByTagName(start, ['td', 'th', 'caption'], true);
                if (cell) {
                    cell.style.backgroundColor = bkColor;
                }
            }
            else {
                utils.each(ut.selectedTds, function (cell) {
                    cell.style.backgroundColor = bkColor;
                });
            }
        }
    };
    UE.commands.settablebackground = {
        queryCommandState: function () {
            return getSelectedArr(this).length > 1 ? 0 : -1;
        },
        execCommand: function (cmd, value) {
            var cells, ut;
            cells = getSelectedArr(this);
            ut = getUETable(cells[0]);
            ut.setBackground(cells, value);
        }
    };
    UE.commands.cleartablebackground = {
        queryCommandState: function () {
            var cells = getSelectedArr(this);
            if (!cells.length)
                return -1;
            for (var i = 0, cell; cell = cells[i++];) {
                if (cell.style.backgroundColor !== '')
                    return 0;
            }
            return -1;
        },
        execCommand: function () {
            var cells = getSelectedArr(this);
            var ut = getUETable(cells[0]);
            ut.removeBackground(cells);
        }
    };
    UE.commands.interlacetable = UE.commands.uninterlacetable = {
        queryCommandState: function (cmd) {
            var table = getTableItemsByRange(this).table;
            if (!table)
                return -1;
            var interlaced = table.getAttribute('interlaced');
            if (cmd == 'interlacetable') {
                return (interlaced === 'enabled') ? -1 : 0;
            }
            else {
                return (!interlaced || interlaced === 'disabled') ? -1 : 0;
            }
        },
        execCommand: function (cmd, classList) {
            var table = getTableItemsByRange(this).table;
            if (cmd == 'interlacetable') {
                table.setAttribute('interlaced', 'enabled');
                this.fireEvent('interlacetable', table, classList);
            }
            else {
                table.setAttribute('interlaced', 'disabled');
                this.fireEvent('uninterlacetable', table);
            }
        }
    };
    UE.commands.setbordervisible = {
        queryCommandState: function (cmd) {
            var table = getTableItemsByRange(this).table;
            if (!table)
                return -1;
            return 0;
        },
        execCommand: function () {
            var table = getTableItemsByRange(this).table;
            utils.each(domUtils.getElementsByTagName(table, 'td'), function (td) {
                td.style.borderWidth = '1px';
                td.style.borderStyle = 'solid';
            });
        }
    };
    function resetTdWidth(table, editor) {
        var tds = domUtils.getElementsByTagName(table, 'td th');
        utils.each(tds, function (td) {
            td.removeAttribute('width');
        });
        table.setAttribute('width', getTableWidth(editor, true, getDefaultValue(editor, table)));
        var tdsWidths = [];
        setTimeout(function () {
            utils.each(tds, function (td) {
                (td.colSpan == 1) && tdsWidths.push(td.offsetWidth);
            });
            utils.each(tds, function (td, i) {
                (td.colSpan == 1) && td.setAttribute('width', tdsWidths[i] + '');
            });
        }, 0);
    }
    function getTableWidth(editor, needIEHack, defaultValue) {
        var body = editor.body;
        return body.offsetWidth - (needIEHack ? parseInt(domUtils.getComputedStyle(body, 'margin-left'), 10) * 2 : 0) - defaultValue.tableBorder * 2 - (editor.options.offsetWidth || 0);
    }
    function getSelectedArr(editor) {
        var cell = getTableItemsByRange(editor).cell;
        if (cell) {
            var ut = getUETable(cell);
            return ut.selectedTds.length ? ut.selectedTds : [cell];
        }
        else {
            return [];
        }
    }
})();
