(function () {
    var UETable = UE.UETable = function (table) {
        this.table = table;
        this.indexTable = [];
        this.selectedTds = [];
        this.cellsRange = {};
        this.update(table);
    };
    UETable.removeSelectedClass = function (cells) {
        utils.each(cells, function (cell) {
            domUtils.removeClasses(cell, 'selectTdClass');
        });
    };
    UETable.addSelectedClass = function (cells) {
        utils.each(cells, function (cell) {
            domUtils.addClass(cell, 'selectTdClass');
        });
    };
    UETable.isEmptyBlock = function (node) {
        var reg = new RegExp(domUtils.fillChar, 'g');
        if (node.textContent.replace(/^\s*$/, '').replace(reg, '').length > 0) {
            return 0;
        }
        for (var i in dtd.$isNotEmpty) {
            if (dtd.$isNotEmpty.hasOwnProperty(i)) {
                if (node.getElementsByTagName(i).length) {
                    return 0;
                }
            }
        }
        return 1;
    };
    UETable.getWidth = function (cell) {
        if (!cell)
            return 0;
        return parseInt(domUtils.getComputedStyle(cell, 'width'), 10);
    };
    UETable.getTableCellAlignState = function (cells) {
        !utils.isArray(cells) && (cells = [cells]);
        var result = {};
        var status = ['align', 'valign'];
        var tempStatus = null;
        var isSame = true;
        utils.each(cells, function (cellNode) {
            utils.each(status, function (currentState) {
                tempStatus = cellNode.getAttribute(currentState);
                if (!result[currentState] && tempStatus) {
                    result[currentState] = tempStatus;
                }
                else if (!result[currentState] || (tempStatus !== result[currentState])) {
                    isSame = false;
                    return false;
                }
            });
            return isSame;
        });
        return isSame ? result : null;
    };
    UETable.getTableItemsByRange = function (editor) {
        var start = editor.selection.getStart();
        if (start && start.id && start.id.indexOf('_baidu_bookmark_start_') === 0 && start.nextSibling) {
            start = start.nextSibling;
        }
        var cell = start && domUtils.findParentByTagName(start, ['td', 'th'], true);
        var tr = cell && cell.parentNode;
        var caption = start && domUtils.findParentByTagName(start, 'caption', true);
        var table = caption ? caption.parentNode : tr && tr.parentNode.parentNode;
        return {
            cell: cell,
            tr: tr,
            table: table,
            caption: caption
        };
    };
    UETable.getUETableBySelected = function (editor) {
        var table = UETable.getTableItemsByRange(editor).table;
        if (table && table.ueTable && table.ueTable.selectedTds.length) {
            return table.ueTable;
        }
        return null;
    };
    UETable.getDefaultValue = function (editor, table) {
        var borderMap = {
            thin: '0px',
            medium: '1px',
            thick: '2px'
        };
        var tableBorder;
        var tdPadding;
        var tdBorder;
        var tmpValue;
        if (!table) {
            table = editor.document.createElement('table');
            table.insertRow(0).insertCell(0).innerHTML = 'xxx';
            editor.body.appendChild(table);
            var td = table.getElementsByTagName('td')[0];
            tmpValue = domUtils.getComputedStyle(table, 'border-left-width');
            tableBorder = parseInt(borderMap[tmpValue] || tmpValue, 10);
            tmpValue = domUtils.getComputedStyle(td, 'padding-left');
            tdPadding = parseInt(borderMap[tmpValue] || tmpValue, 10);
            tmpValue = domUtils.getComputedStyle(td, 'border-left-width');
            tdBorder = parseInt(borderMap[tmpValue] || tmpValue, 10);
            domUtils.remove(table);
            return {
                tableBorder: tableBorder,
                tdPadding: tdPadding,
                tdBorder: tdBorder
            };
        }
        else {
            td = table.getElementsByTagName('td')[0];
            tmpValue = domUtils.getComputedStyle(table, 'border-left-width');
            tableBorder = parseInt(borderMap[tmpValue] || tmpValue, 10);
            tmpValue = domUtils.getComputedStyle(td, 'padding-left');
            tdPadding = parseInt(borderMap[tmpValue] || tmpValue, 10);
            tmpValue = domUtils.getComputedStyle(td, 'border-left-width');
            tdBorder = parseInt(borderMap[tmpValue] || tmpValue, 10);
            return {
                tableBorder: tableBorder,
                tdPadding: tdPadding,
                tdBorder: tdBorder
            };
        }
    };
    UETable.getUETable = function (tdOrTable) {
        var tag = tdOrTable.tagName.toLowerCase();
        tdOrTable = (tag == 'td' || tag == 'th' || tag == 'caption') ? domUtils.findParentByTagName(tdOrTable, 'table', true) : tdOrTable;
        if (!tdOrTable.ueTable) {
            tdOrTable.ueTable = new UETable(tdOrTable);
        }
        return tdOrTable.ueTable;
    };
    UETable.cloneCell = function (cell, ignoreMerge, keepPro) {
        if (!cell || utils.isString(cell)) {
            return this.table.ownerDocument.createElement(cell || 'td');
        }
        var flag = domUtils.hasClass(cell, 'selectTdClass');
        flag && domUtils.removeClasses(cell, 'selectTdClass');
        var tmpCell = cell.cloneNode(true);
        if (ignoreMerge) {
            tmpCell.rowSpan = tmpCell.colSpan = 1;
        }
        !keepPro && domUtils.removeAttributes(tmpCell, 'width height');
        !keepPro && domUtils.removeAttributes(tmpCell, 'style');
        tmpCell.style.borderLeftStyle = '';
        tmpCell.style.borderTopStyle = '';
        tmpCell.style.borderLeftColor = cell.style.borderRightColor;
        tmpCell.style.borderLeftWidth = cell.style.borderRightWidth;
        tmpCell.style.borderTopColor = cell.style.borderBottomColor;
        tmpCell.style.borderTopWidth = cell.style.borderBottomWidth;
        flag && domUtils.addClass(cell, 'selectTdClass');
        return tmpCell;
    };
    UETable.prototype = {
        getMaxRows: function () {
            var rows = this.table.rows;
            var maxLen = 1;
            for (var i = 0, row; row = rows[i]; i++) {
                var currentMax = 1;
                for (var j = 0, cj; cj = row.cells[j++];) {
                    currentMax = Math.max(cj.rowSpan || 1, currentMax);
                }
                maxLen = Math.max(currentMax + i, maxLen);
            }
            return maxLen;
        },
        getMaxCols: function () {
            var rows = this.table.rows;
            var maxLen = 0;
            var cellRows = {};
            for (var i = 0, row; row = rows[i]; i++) {
                var cellsNum = 0;
                for (var j = 0, cj; cj = row.cells[j++];) {
                    cellsNum += (cj.colSpan || 1);
                    if (cj.rowSpan && cj.rowSpan > 1) {
                        for (var k = 1; k < cj.rowSpan; k++) {
                            if (!cellRows['row_' + (i + k)]) {
                                cellRows['row_' + (i + k)] = (cj.colSpan || 1);
                            }
                            else {
                                cellRows['row_' + (i + k)]++;
                            }
                        }
                    }
                }
                cellsNum += cellRows['row_' + i] || 0;
                maxLen = Math.max(cellsNum, maxLen);
            }
            return maxLen;
        },
        getCellColIndex: function (cell) {
        },
        getHSideCell: function (cell, right) {
            try {
                var cellInfo = this.getCellInfo(cell);
                var previewRowIndex;
                var previewColIndex;
                var len = this.selectedTds.length;
                var range = this.cellsRange;
                if ((!right && (!len ? !cellInfo.colIndex : !range.beginColIndex)) || (right && (!len ? (cellInfo.colIndex == (this.colsNum - 1)) : (range.endColIndex == this.colsNum - 1))))
                    return null;
                previewRowIndex = !len ? cellInfo.rowIndex : range.beginRowIndex;
                previewColIndex = !right ? (!len ? (cellInfo.colIndex < 1 ? 0 : (cellInfo.colIndex - 1)) : range.beginColIndex - 1)
                    : (!len ? cellInfo.colIndex + 1 : range.endColIndex + 1);
                return this.getCell(this.indexTable[previewRowIndex][previewColIndex].rowIndex, this.indexTable[previewRowIndex][previewColIndex].cellIndex);
            }
            catch (e) {
                showError(e);
            }
        },
        getTabNextCell: function (cell, preRowIndex) {
            var cellInfo = this.getCellInfo(cell);
            var rowIndex = preRowIndex || cellInfo.rowIndex;
            var colIndex = cellInfo.colIndex + 1 + (cellInfo.colSpan - 1);
            var nextCell;
            try {
                nextCell = this.getCell(this.indexTable[rowIndex][colIndex].rowIndex, this.indexTable[rowIndex][colIndex].cellIndex);
            }
            catch (e) {
                try {
                    rowIndex = rowIndex * 1 + 1;
                    colIndex = 0;
                    nextCell = this.getCell(this.indexTable[rowIndex][colIndex].rowIndex, this.indexTable[rowIndex][colIndex].cellIndex);
                }
                catch (e) {
                }
            }
            return nextCell;
        },
        getVSideCell: function (cell, bottom, ignoreRange) {
            try {
                var cellInfo = this.getCellInfo(cell);
                var nextRowIndex;
                var nextColIndex;
                var len = this.selectedTds.length && !ignoreRange;
                var range = this.cellsRange;
                if ((!bottom && (cellInfo.rowIndex == 0)) || (bottom && (!len ? (cellInfo.rowIndex + cellInfo.rowSpan > this.rowsNum - 1) : (range.endRowIndex == this.rowsNum - 1))))
                    return null;
                nextRowIndex = !bottom ? (!len ? cellInfo.rowIndex - 1 : range.beginRowIndex - 1)
                    : (!len ? (cellInfo.rowIndex + cellInfo.rowSpan) : range.endRowIndex + 1);
                nextColIndex = !len ? cellInfo.colIndex : range.beginColIndex;
                return this.getCell(this.indexTable[nextRowIndex][nextColIndex].rowIndex, this.indexTable[nextRowIndex][nextColIndex].cellIndex);
            }
            catch (e) {
                showError(e);
            }
        },
        getSameEndPosCells: function (cell, xOrY) {
            try {
                var flag = (xOrY.toLowerCase() === 'x');
                var end = domUtils.getXY(cell)[flag ? 'x' : 'y'] + cell['offset' + (flag ? 'Width' : 'Height')];
                var rows = this.table.rows;
                var cells = null;
                var returns = [];
                for (var i = 0; i < this.rowsNum; i++) {
                    cells = rows[i].cells;
                    for (var j = 0, tmpCell; tmpCell = cells[j++];) {
                        var tmpEnd = domUtils.getXY(tmpCell)[flag ? 'x' : 'y'] + tmpCell['offset' + (flag ? 'Width' : 'Height')];
                        if (tmpEnd > end && flag)
                            break;
                        if (cell == tmpCell || end == tmpEnd) {
                            if (tmpCell[flag ? 'colSpan' : 'rowSpan'] == 1) {
                                returns.push(tmpCell);
                            }
                            if (flag)
                                break;
                        }
                    }
                }
                return returns;
            }
            catch (e) {
                showError(e);
            }
        },
        setCellContent: function (cell, content) {
            cell.innerHTML = content || '<br />';
        },
        cloneCell: UETable.cloneCell,
        getSameStartPosXCells: function (cell) {
            try {
                var start = domUtils.getXY(cell).x + cell.offsetWidth;
                var rows = this.table.rows;
                var cells;
                var returns = [];
                for (var i = 0; i < this.rowsNum; i++) {
                    cells = rows[i].cells;
                    for (var j = 0, tmpCell; tmpCell = cells[j++];) {
                        var tmpStart = domUtils.getXY(tmpCell).x;
                        if (tmpStart > start)
                            break;
                        if (tmpStart == start && tmpCell.colSpan == 1) {
                            returns.push(tmpCell);
                            break;
                        }
                    }
                }
                return returns;
            }
            catch (e) {
                showError(e);
            }
        },
        update: function (table) {
            this.table = table || this.table;
            this.selectedTds = [];
            this.cellsRange = {};
            this.indexTable = [];
            var rows = this.table.rows;
            var rowsNum = this.getMaxRows();
            var dNum = rowsNum - rows.length;
            var colsNum = this.getMaxCols();
            while (dNum--) {
                this.table.insertRow(rows.length);
            }
            this.rowsNum = rowsNum;
            this.colsNum = colsNum;
            for (var i = 0, len = rows.length; i < len; i++) {
                this.indexTable[i] = new Array(colsNum);
            }
            for (var rowIndex = 0, row; row = rows[rowIndex]; rowIndex++) {
                for (var cellIndex = 0, cell, cells = row.cells; cell = cells[cellIndex]; cellIndex++) {
                    if (cell.rowSpan > rowsNum) {
                        cell.rowSpan = rowsNum;
                    }
                    var colIndex = cellIndex;
                    var rowSpan = cell.rowSpan || 1;
                    var colSpan = cell.colSpan || 1;
                    while (this.indexTable[rowIndex][colIndex])
                        colIndex++;
                    for (var j = 0; j < rowSpan; j++) {
                        for (var k = 0; k < colSpan; k++) {
                            this.indexTable[rowIndex + j][colIndex + k] = {
                                rowIndex: rowIndex,
                                cellIndex: cellIndex,
                                colIndex: colIndex,
                                rowSpan: rowSpan,
                                colSpan: colSpan
                            };
                        }
                    }
                }
            }
            for (j = 0; j < rowsNum; j++) {
                for (k = 0; k < colsNum; k++) {
                    if (this.indexTable[j][k] === undefined) {
                        row = rows[j];
                        cell = row.cells[row.cells.length - 1];
                        cell = cell ? cell.cloneNode(true) : this.table.ownerDocument.createElement('td');
                        this.setCellContent(cell);
                        if (cell.colSpan !== 1)
                            cell.colSpan = 1;
                        if (cell.rowSpan !== 1)
                            cell.rowSpan = 1;
                        row.appendChild(cell);
                        this.indexTable[j][k] = {
                            rowIndex: j,
                            cellIndex: cell.cellIndex,
                            colIndex: k,
                            rowSpan: 1,
                            colSpan: 1
                        };
                    }
                }
            }
            var tds = domUtils.getElementsByTagName(this.table, 'td');
            var selectTds = [];
            utils.each(tds, function (td) {
                if (domUtils.hasClass(td, 'selectTdClass')) {
                    selectTds.push(td);
                }
            });
            if (selectTds.length) {
                var start = selectTds[0];
                var end = selectTds[selectTds.length - 1];
                var startInfo = this.getCellInfo(start);
                var endInfo = this.getCellInfo(end);
                this.selectedTds = selectTds;
                this.cellsRange = {
                    beginRowIndex: startInfo.rowIndex,
                    beginColIndex: startInfo.colIndex,
                    endRowIndex: endInfo.rowIndex + endInfo.rowSpan - 1,
                    endColIndex: endInfo.colIndex + endInfo.colSpan - 1
                };
            }
            if (!domUtils.hasClass(this.table.rows[0], 'firstRow')) {
                domUtils.addClass(this.table.rows[0], 'firstRow');
                for (var i = 1; i < this.table.rows.length; i++) {
                    domUtils.removeClasses(this.table.rows[i], 'firstRow');
                }
            }
        },
        getCellInfo: function (cell) {
            if (!cell)
                return;
            var cellIndex = cell.cellIndex;
            var rowIndex = cell.parentNode.rowIndex;
            var rowInfo = this.indexTable[rowIndex];
            var numCols = this.colsNum;
            for (var colIndex = cellIndex; colIndex < numCols; colIndex++) {
                var cellInfo = rowInfo[colIndex];
                if (cellInfo.rowIndex === rowIndex && cellInfo.cellIndex === cellIndex) {
                    return cellInfo;
                }
            }
        },
        getCell: function (rowIndex, cellIndex) {
            return rowIndex < this.rowsNum && this.table.rows[rowIndex].cells[cellIndex] || null;
        },
        deleteCell: function (cell, rowIndex) {
            rowIndex = typeof rowIndex === 'number' ? rowIndex : cell.parentNode.rowIndex;
            var row = this.table.rows[rowIndex];
            row.deleteCell(cell.cellIndex);
        },
        getCellsRange: function (cellA, cellB) {
            function checkRange(beginRowIndex, beginColIndex, endRowIndex, endColIndex) {
                var tmpBeginRowIndex = beginRowIndex;
                var tmpBeginColIndex = beginColIndex;
                var tmpEndRowIndex = endRowIndex;
                var tmpEndColIndex = endColIndex;
                var cellInfo;
                var colIndex;
                var rowIndex;
                if (beginRowIndex > 0) {
                    for (colIndex = beginColIndex; colIndex < endColIndex; colIndex++) {
                        cellInfo = me.indexTable[beginRowIndex][colIndex];
                        rowIndex = cellInfo.rowIndex;
                        if (rowIndex < beginRowIndex) {
                            tmpBeginRowIndex = Math.min(rowIndex, tmpBeginRowIndex);
                        }
                    }
                }
                if (endColIndex < me.colsNum) {
                    for (rowIndex = beginRowIndex; rowIndex < endRowIndex; rowIndex++) {
                        cellInfo = me.indexTable[rowIndex][endColIndex];
                        colIndex = cellInfo.colIndex + cellInfo.colSpan - 1;
                        if (colIndex > endColIndex) {
                            tmpEndColIndex = Math.max(colIndex, tmpEndColIndex);
                        }
                    }
                }
                if (endRowIndex < me.rowsNum) {
                    for (colIndex = beginColIndex; colIndex < endColIndex; colIndex++) {
                        cellInfo = me.indexTable[endRowIndex][colIndex];
                        rowIndex = cellInfo.rowIndex + cellInfo.rowSpan - 1;
                        if (rowIndex > endRowIndex) {
                            tmpEndRowIndex = Math.max(rowIndex, tmpEndRowIndex);
                        }
                    }
                }
                if (beginColIndex > 0) {
                    for (rowIndex = beginRowIndex; rowIndex < endRowIndex; rowIndex++) {
                        cellInfo = me.indexTable[rowIndex][beginColIndex];
                        colIndex = cellInfo.colIndex;
                        if (colIndex < beginColIndex) {
                            tmpBeginColIndex = Math.min(cellInfo.colIndex, tmpBeginColIndex);
                        }
                    }
                }
                if (tmpBeginRowIndex != beginRowIndex || tmpBeginColIndex != beginColIndex || tmpEndRowIndex != endRowIndex || tmpEndColIndex != endColIndex) {
                    return checkRange(tmpBeginRowIndex, tmpBeginColIndex, tmpEndRowIndex, tmpEndColIndex);
                }
                else {
                    return {
                        beginRowIndex: beginRowIndex,
                        beginColIndex: beginColIndex,
                        endRowIndex: endRowIndex,
                        endColIndex: endColIndex
                    };
                }
            }
            try {
                var me = this;
                var cellAInfo = me.getCellInfo(cellA);
                if (cellA === cellB) {
                    return {
                        beginRowIndex: cellAInfo.rowIndex,
                        beginColIndex: cellAInfo.colIndex,
                        endRowIndex: cellAInfo.rowIndex + cellAInfo.rowSpan - 1,
                        endColIndex: cellAInfo.colIndex + cellAInfo.colSpan - 1
                    };
                }
                var cellBInfo = me.getCellInfo(cellB);
                var beginRowIndex = Math.min(cellAInfo.rowIndex, cellBInfo.rowIndex);
                var beginColIndex = Math.min(cellAInfo.colIndex, cellBInfo.colIndex);
                var endRowIndex = Math.max(cellAInfo.rowIndex + cellAInfo.rowSpan - 1, cellBInfo.rowIndex + cellBInfo.rowSpan - 1);
                var endColIndex = Math.max(cellAInfo.colIndex + cellAInfo.colSpan - 1, cellBInfo.colIndex + cellBInfo.colSpan - 1);
                return checkRange(beginRowIndex, beginColIndex, endRowIndex, endColIndex);
            }
            catch (e) {
            }
        },
        getCells: function (range) {
            this.clearSelected();
            var beginRowIndex = range.beginRowIndex;
            var beginColIndex = range.beginColIndex;
            var endRowIndex = range.endRowIndex;
            var endColIndex = range.endColIndex;
            var cellInfo;
            var rowIndex;
            var colIndex;
            var tdHash = {};
            var returnTds = [];
            for (var i = beginRowIndex; i <= endRowIndex; i++) {
                for (var j = beginColIndex; j <= endColIndex; j++) {
                    cellInfo = this.indexTable[i][j];
                    rowIndex = cellInfo.rowIndex;
                    colIndex = cellInfo.colIndex;
                    var key = rowIndex + '|' + colIndex;
                    if (tdHash[key])
                        continue;
                    tdHash[key] = 1;
                    if (rowIndex < i || colIndex < j || rowIndex + cellInfo.rowSpan - 1 > endRowIndex || colIndex + cellInfo.colSpan - 1 > endColIndex) {
                        return null;
                    }
                    returnTds.push(this.getCell(rowIndex, cellInfo.cellIndex));
                }
            }
            return returnTds;
        },
        clearSelected: function () {
            UETable.removeSelectedClass(this.selectedTds);
            this.selectedTds = [];
            this.cellsRange = {};
        },
        setSelected: function (range) {
            var cells = this.getCells(range);
            UETable.addSelectedClass(cells);
            this.selectedTds = cells;
            this.cellsRange = range;
        },
        isFullRow: function () {
            var range = this.cellsRange;
            return (range.endColIndex - range.beginColIndex + 1) == this.colsNum;
        },
        isFullCol: function () {
            var range = this.cellsRange;
            var table = this.table;
            var ths = table.getElementsByTagName('th');
            var rows = range.endRowIndex - range.beginRowIndex + 1;
            return !ths.length ? rows == this.rowsNum : rows == this.rowsNum || (rows == this.rowsNum - 1);
        },
        getNextCell: function (cell, bottom, ignoreRange) {
            try {
                var cellInfo = this.getCellInfo(cell);
                var nextRowIndex;
                var nextColIndex;
                var len = this.selectedTds.length && !ignoreRange;
                var range = this.cellsRange;
                if ((!bottom && (cellInfo.rowIndex == 0)) || (bottom && (!len ? (cellInfo.rowIndex + cellInfo.rowSpan > this.rowsNum - 1) : (range.endRowIndex == this.rowsNum - 1))))
                    return null;
                nextRowIndex = !bottom ? (!len ? cellInfo.rowIndex - 1 : range.beginRowIndex - 1)
                    : (!len ? (cellInfo.rowIndex + cellInfo.rowSpan) : range.endRowIndex + 1);
                nextColIndex = !len ? cellInfo.colIndex : range.beginColIndex;
                return this.getCell(this.indexTable[nextRowIndex][nextColIndex].rowIndex, this.indexTable[nextRowIndex][nextColIndex].cellIndex);
            }
            catch (e) {
                showError(e);
            }
        },
        getPreviewCell: function (cell, top) {
            try {
                var cellInfo = this.getCellInfo(cell);
                var previewRowIndex;
                var previewColIndex;
                var len = this.selectedTds.length;
                var range = this.cellsRange;
                if ((!top && (!len ? !cellInfo.colIndex : !range.beginColIndex)) || (top && (!len ? (cellInfo.rowIndex > (this.colsNum - 1)) : (range.endColIndex == this.colsNum - 1))))
                    return null;
                previewRowIndex = !top ? (!len ? cellInfo.rowIndex : range.beginRowIndex)
                    : (!len ? (cellInfo.rowIndex < 1 ? 0 : (cellInfo.rowIndex - 1)) : range.beginRowIndex);
                previewColIndex = !top ? (!len ? (cellInfo.colIndex < 1 ? 0 : (cellInfo.colIndex - 1)) : range.beginColIndex - 1)
                    : (!len ? cellInfo.colIndex : range.endColIndex + 1);
                return this.getCell(this.indexTable[previewRowIndex][previewColIndex].rowIndex, this.indexTable[previewRowIndex][previewColIndex].cellIndex);
            }
            catch (e) {
                showError(e);
            }
        },
        moveContent: function (cellTo, cellFrom) {
            if (UETable.isEmptyBlock(cellFrom))
                return;
            if (UETable.isEmptyBlock(cellTo)) {
                cellTo.innerHTML = cellFrom.innerHTML;
                return;
            }
            var child = cellTo.lastChild;
            if (child.nodeType == 3 || !dtd.$block[child.tagName]) {
                cellTo.appendChild(cellTo.ownerDocument.createElement('br'));
            }
            while (child = cellFrom.firstChild) {
                cellTo.appendChild(child);
            }
        },
        mergeRight: function (cell) {
            var cellInfo = this.getCellInfo(cell);
            var rightColIndex = cellInfo.colIndex + cellInfo.colSpan;
            var rightCellInfo = this.indexTable[cellInfo.rowIndex][rightColIndex];
            var rightCell = this.getCell(rightCellInfo.rowIndex, rightCellInfo.cellIndex);
            cell.colSpan = cellInfo.colSpan + rightCellInfo.colSpan;
            cell.removeAttribute('width');
            this.moveContent(cell, rightCell);
            this.deleteCell(rightCell, rightCellInfo.rowIndex);
            this.update();
        },
        mergeDown: function (cell) {
            var cellInfo = this.getCellInfo(cell);
            var downRowIndex = cellInfo.rowIndex + cellInfo.rowSpan;
            var downCellInfo = this.indexTable[downRowIndex][cellInfo.colIndex];
            var downCell = this.getCell(downCellInfo.rowIndex, downCellInfo.cellIndex);
            cell.rowSpan = cellInfo.rowSpan + downCellInfo.rowSpan;
            cell.removeAttribute('height');
            this.moveContent(cell, downCell);
            this.deleteCell(downCell, downCellInfo.rowIndex);
            this.update();
        },
        mergeRange: function () {
            var range = this.cellsRange;
            var leftTopCell = this.getCell(range.beginRowIndex, this.indexTable[range.beginRowIndex][range.beginColIndex].cellIndex);
            if (leftTopCell.tagName == 'TH' && range.endRowIndex !== range.beginRowIndex) {
                var index = this.indexTable;
                var info = this.getCellInfo(leftTopCell);
                leftTopCell = this.getCell(1, index[1][info.colIndex].cellIndex);
                range = this.getCellsRange(leftTopCell, this.getCell(index[this.rowsNum - 1][info.colIndex].rowIndex, index[this.rowsNum - 1][info.colIndex].cellIndex));
            }
            var cells = this.getCells(range);
            for (var i = 0, ci; ci = cells[i++];) {
                if (ci !== leftTopCell) {
                    this.moveContent(leftTopCell, ci);
                    this.deleteCell(ci);
                }
            }
            leftTopCell.rowSpan = range.endRowIndex - range.beginRowIndex + 1;
            leftTopCell.rowSpan > 1 && leftTopCell.removeAttribute('height');
            leftTopCell.colSpan = range.endColIndex - range.beginColIndex + 1;
            leftTopCell.colSpan > 1 && leftTopCell.removeAttribute('width');
            if (leftTopCell.rowSpan == this.rowsNum && leftTopCell.colSpan != 1) {
                leftTopCell.colSpan = 1;
            }
            if (leftTopCell.colSpan == this.colsNum && leftTopCell.rowSpan != 1) {
                var rowIndex = leftTopCell.parentNode.rowIndex;
                if (this.table.deleteRow) {
                    for (var i = rowIndex + 1, curIndex = rowIndex + 1, len = leftTopCell.rowSpan; i < len; i++) {
                        this.table.deleteRow(curIndex);
                    }
                }
                else {
                    for (var i = 0, len = leftTopCell.rowSpan - 1; i < len; i++) {
                        var row = this.table.rows[rowIndex + 1];
                        row.parentNode.removeChild(row);
                    }
                }
                leftTopCell.rowSpan = 1;
            }
            this.update();
        },
        insertRow: function (rowIndex, sourceCell) {
            var numCols = this.colsNum;
            var table = this.table;
            var row = table.insertRow(rowIndex);
            var cell;
            var isInsertTitle = typeof sourceCell === 'string' && sourceCell.toUpperCase() == 'TH';
            function replaceTdToTh(colIndex, cell, tableRow) {
                if (colIndex == 0) {
                    var tr = tableRow.nextSibling || tableRow.previousSibling;
                    var th = tr.cells[colIndex];
                    if (th.tagName == 'TH') {
                        th = cell.ownerDocument.createElement('th');
                        th.appendChild(cell.firstChild);
                        tableRow.insertBefore(th, cell);
                        domUtils.remove(cell);
                    }
                }
                else {
                    if (cell.tagName == 'TH') {
                        var td = cell.ownerDocument.createElement('td');
                        td.appendChild(cell.firstChild);
                        tableRow.insertBefore(td, cell);
                        domUtils.remove(cell);
                    }
                }
            }
            if (rowIndex == 0 || rowIndex == this.rowsNum) {
                for (var colIndex = 0; colIndex < numCols; colIndex++) {
                    cell = this.cloneCell(sourceCell, true);
                    this.setCellContent(cell);
                    cell.getAttribute('vAlign') && cell.setAttribute('vAlign', cell.getAttribute('vAlign'));
                    row.appendChild(cell);
                    if (!isInsertTitle)
                        replaceTdToTh(colIndex, cell, row);
                }
            }
            else {
                var infoRow = this.indexTable[rowIndex];
                var cellIndex = 0;
                for (colIndex = 0; colIndex < numCols; colIndex++) {
                    var cellInfo = infoRow[colIndex];
                    if (cellInfo.rowIndex < rowIndex) {
                        cell = this.getCell(cellInfo.rowIndex, cellInfo.cellIndex);
                        cell.rowSpan = cellInfo.rowSpan + 1;
                    }
                    else {
                        cell = this.cloneCell(sourceCell, true);
                        this.setCellContent(cell);
                        row.appendChild(cell);
                    }
                    if (!isInsertTitle)
                        replaceTdToTh(colIndex, cell, row);
                }
            }
            this.update();
            return row;
        },
        deleteRow: function (rowIndex) {
            var row = this.table.rows[rowIndex];
            var infoRow = this.indexTable[rowIndex];
            var colsNum = this.colsNum;
            var count = 0;
            for (var colIndex = 0; colIndex < colsNum;) {
                var cellInfo = infoRow[colIndex];
                var cell = this.getCell(cellInfo.rowIndex, cellInfo.cellIndex);
                if (cell.rowSpan > 1) {
                    if (cellInfo.rowIndex == rowIndex) {
                        var clone = cell.cloneNode(true);
                        clone.rowSpan = cell.rowSpan - 1;
                        clone.innerHTML = '';
                        cell.rowSpan = 1;
                        var nextRowIndex = rowIndex + 1;
                        var nextRow = this.table.rows[nextRowIndex];
                        var insertCellIndex;
                        var preMerged = this.getPreviewMergedCellsNum(nextRowIndex, colIndex) - count;
                        if (preMerged < colIndex) {
                            insertCellIndex = colIndex - preMerged - 1;
                            domUtils.insertAfter(nextRow.cells[insertCellIndex], clone);
                        }
                        else {
                            if (nextRow.cells.length)
                                nextRow.insertBefore(clone, nextRow.cells[0]);
                        }
                        count += 1;
                    }
                }
                colIndex += cell.colSpan || 1;
            }
            var deleteTds = [];
            var cacheMap = {};
            for (colIndex = 0; colIndex < colsNum; colIndex++) {
                var tmpRowIndex = infoRow[colIndex].rowIndex;
                var tmpCellIndex = infoRow[colIndex].cellIndex;
                var key = tmpRowIndex + '_' + tmpCellIndex;
                if (cacheMap[key])
                    continue;
                cacheMap[key] = 1;
                cell = this.getCell(tmpRowIndex, tmpCellIndex);
                deleteTds.push(cell);
            }
            var mergeTds = [];
            utils.each(deleteTds, function (td) {
                if (td.rowSpan == 1) {
                    td.parentNode.removeChild(td);
                }
                else {
                    mergeTds.push(td);
                }
            });
            utils.each(mergeTds, function (td) {
                td.rowSpan--;
            });
            row.parentNode.removeChild(row);
            this.update();
        },
        insertCol: function (colIndex, sourceCell, defaultValue) {
            var rowsNum = this.rowsNum;
            var rowIndex = 0;
            var tableRow;
            var cell;
            var backWidth = parseInt((this.table.offsetWidth - (this.colsNum + 1) * 20 - (this.colsNum + 1)) / (this.colsNum + 1), 10);
            var isInsertTitleCol = typeof sourceCell === 'string' && sourceCell.toUpperCase() == 'TH';
            function replaceTdToTh(rowIndex, cell, tableRow) {
                if (rowIndex == 0) {
                    var th = cell.nextSibling || cell.previousSibling;
                    if (th.tagName == 'TH') {
                        th = cell.ownerDocument.createElement('th');
                        th.appendChild(cell.firstChild);
                        tableRow.insertBefore(th, cell);
                        domUtils.remove(cell);
                    }
                }
                else {
                    if (cell.tagName == 'TH') {
                        var td = cell.ownerDocument.createElement('td');
                        td.appendChild(cell.firstChild);
                        tableRow.insertBefore(td, cell);
                        domUtils.remove(cell);
                    }
                }
            }
            var preCell;
            if (colIndex == 0 || colIndex == this.colsNum) {
                for (; rowIndex < rowsNum; rowIndex++) {
                    tableRow = this.table.rows[rowIndex];
                    preCell = tableRow.cells[colIndex == 0 ? colIndex : tableRow.cells.length];
                    cell = this.cloneCell(sourceCell, true);
                    this.setCellContent(cell);
                    cell.setAttribute('vAlign', cell.getAttribute('vAlign'));
                    preCell && cell.setAttribute('width', preCell.getAttribute('width'));
                    if (!colIndex) {
                        tableRow.insertBefore(cell, tableRow.cells[0]);
                    }
                    else {
                        domUtils.insertAfter(tableRow.cells[tableRow.cells.length - 1], cell);
                    }
                    if (!isInsertTitleCol)
                        replaceTdToTh(rowIndex, cell, tableRow);
                }
            }
            else {
                for (; rowIndex < rowsNum; rowIndex++) {
                    var cellInfo = this.indexTable[rowIndex][colIndex];
                    if (cellInfo.colIndex < colIndex) {
                        cell = this.getCell(cellInfo.rowIndex, cellInfo.cellIndex);
                        cell.colSpan = cellInfo.colSpan + 1;
                    }
                    else {
                        tableRow = this.table.rows[rowIndex];
                        preCell = tableRow.cells[cellInfo.cellIndex];
                        cell = this.cloneCell(sourceCell, true);
                        this.setCellContent(cell);
                        cell.setAttribute('vAlign', cell.getAttribute('vAlign'));
                        preCell && cell.setAttribute('width', preCell.getAttribute('width'));
                        preCell ? tableRow.insertBefore(cell, preCell) : tableRow.appendChild(cell);
                    }
                    if (!isInsertTitleCol)
                        replaceTdToTh(rowIndex, cell, tableRow);
                }
            }
            this.update();
            this.updateWidth(backWidth, defaultValue || { tdPadding: 10, tdBorder: 1 });
        },
        updateWidth: function (width, defaultValue) {
            var table = this.table;
            var tmpWidth = UETable.getWidth(table) - defaultValue.tdPadding * 2 - defaultValue.tdBorder + width;
            if (tmpWidth < table.ownerDocument.body.offsetWidth) {
                table.setAttribute('width', tmpWidth);
                return;
            }
            var tds = domUtils.getElementsByTagName(this.table, 'td th');
            utils.each(tds, function (td) {
                td.setAttribute('width', width);
            });
        },
        deleteCol: function (colIndex) {
            var indexTable = this.indexTable;
            var tableRows = this.table.rows;
            var backTableWidth = this.table.getAttribute('width');
            var backTdWidth = 0;
            var rowsNum = this.rowsNum;
            var cacheMap = {};
            for (var rowIndex = 0; rowIndex < rowsNum;) {
                var infoRow = indexTable[rowIndex];
                var cellInfo = infoRow[colIndex];
                var key = cellInfo.rowIndex + '_' + cellInfo.colIndex;
                if (cacheMap[key])
                    continue;
                cacheMap[key] = 1;
                var cell = this.getCell(cellInfo.rowIndex, cellInfo.cellIndex);
                if (!backTdWidth)
                    backTdWidth = cell && parseInt(cell.offsetWidth / cell.colSpan, 10).toFixed(0);
                if (cell.colSpan > 1) {
                    cell.colSpan--;
                }
                else {
                    tableRows[rowIndex].deleteCell(cellInfo.cellIndex);
                }
                rowIndex += cellInfo.rowSpan || 1;
            }
            this.table.setAttribute('width', backTableWidth - backTdWidth);
            this.update();
        },
        splitToCells: function (cell) {
            var me = this;
            var cells = this.splitToRows(cell);
            utils.each(cells, function (cell) {
                me.splitToCols(cell);
            });
        },
        splitToRows: function (cell) {
            var cellInfo = this.getCellInfo(cell);
            var rowIndex = cellInfo.rowIndex;
            var colIndex = cellInfo.colIndex;
            var results = [];
            cell.rowSpan = 1;
            results.push(cell);
            for (var i = rowIndex, endRow = rowIndex + cellInfo.rowSpan; i < endRow; i++) {
                if (i == rowIndex)
                    continue;
                var tableRow = this.table.rows[i];
                var tmpCell = tableRow.insertCell(colIndex - this.getPreviewMergedCellsNum(i, colIndex));
                tmpCell.colSpan = cellInfo.colSpan;
                this.setCellContent(tmpCell);
                tmpCell.setAttribute('vAlign', cell.getAttribute('vAlign'));
                tmpCell.setAttribute('align', cell.getAttribute('align'));
                if (cell.style.cssText) {
                    tmpCell.style.cssText = cell.style.cssText;
                }
                results.push(tmpCell);
            }
            this.update();
            return results;
        },
        getPreviewMergedCellsNum: function (rowIndex, colIndex) {
            var indexRow = this.indexTable[rowIndex];
            var num = 0;
            for (var i = 0; i < colIndex;) {
                var colSpan = indexRow[i].colSpan;
                var tmpRowIndex = indexRow[i].rowIndex;
                num += (colSpan - (tmpRowIndex == rowIndex ? 1 : 0));
                i += colSpan;
            }
            return num;
        },
        splitToCols: function (cell) {
            var backWidth = (cell.offsetWidth / cell.colSpan - 22).toFixed(0);
            var cellInfo = this.getCellInfo(cell);
            var rowIndex = cellInfo.rowIndex;
            var colIndex = cellInfo.colIndex;
            var results = [];
            cell.colSpan = 1;
            cell.setAttribute('width', backWidth);
            results.push(cell);
            for (var j = colIndex, endCol = colIndex + cellInfo.colSpan; j < endCol; j++) {
                if (j == colIndex)
                    continue;
                var tableRow = this.table.rows[rowIndex];
                var tmpCell = tableRow.insertCell(this.indexTable[rowIndex][j].cellIndex + 1);
                tmpCell.rowSpan = cellInfo.rowSpan;
                this.setCellContent(tmpCell);
                tmpCell.setAttribute('vAlign', cell.getAttribute('vAlign'));
                tmpCell.setAttribute('align', cell.getAttribute('align'));
                tmpCell.setAttribute('width', backWidth);
                if (cell.style.cssText) {
                    tmpCell.style.cssText = cell.style.cssText;
                }
                if (cell.tagName == 'TH') {
                    var th = cell.ownerDocument.createElement('th');
                    th.appendChild(tmpCell.firstChild);
                    th.setAttribute('vAlign', cell.getAttribute('vAlign'));
                    th.rowSpan = tmpCell.rowSpan;
                    tableRow.insertBefore(th, tmpCell);
                    domUtils.remove(tmpCell);
                }
                results.push(tmpCell);
            }
            this.update();
            return results;
        },
        isLastCell: function (cell, rowsNum, colsNum) {
            rowsNum = rowsNum || this.rowsNum;
            colsNum = colsNum || this.colsNum;
            var cellInfo = this.getCellInfo(cell);
            return ((cellInfo.rowIndex + cellInfo.rowSpan) == rowsNum) &&
                ((cellInfo.colIndex + cellInfo.colSpan) == colsNum);
        },
        getLastCell: function (cells) {
            cells = cells || this.table.getElementsByTagName('td');
            var firstInfo = this.getCellInfo(cells[0]);
            var me = this;
            var last = cells[0];
            var tr = last.parentNode;
            var cellsNum = 0;
            var cols = 0;
            var rows;
            utils.each(cells, function (cell) {
                if (cell.parentNode == tr)
                    cols += cell.colSpan || 1;
                cellsNum += cell.rowSpan * cell.colSpan || 1;
            });
            rows = cellsNum / cols;
            utils.each(cells, function (cell) {
                if (me.isLastCell(cell, rows, cols)) {
                    last = cell;
                    return false;
                }
            });
            return last;
        },
        selectRow: function (rowIndex) {
            var indexRow = this.indexTable[rowIndex];
            var start = this.getCell(indexRow[0].rowIndex, indexRow[0].cellIndex);
            var end = this.getCell(indexRow[this.colsNum - 1].rowIndex, indexRow[this.colsNum - 1].cellIndex);
            var range = this.getCellsRange(start, end);
            this.setSelected(range);
        },
        selectTable: function () {
            var tds = this.table.getElementsByTagName('td');
            var range = this.getCellsRange(tds[0], tds[tds.length - 1]);
            this.setSelected(range);
        },
        setBackground: function (cells, value) {
            if (typeof value === 'string') {
                utils.each(cells, function (cell) {
                    cell.style.backgroundColor = value;
                });
            }
            else if (typeof value === 'object') {
                value = utils.extend({
                    repeat: true,
                    colorList: ['#ddd', '#fff']
                }, value);
                var rowIndex = this.getCellInfo(cells[0]).rowIndex;
                var count = 0;
                var colors = value.colorList;
                var getColor = function (list, index, repeat) {
                    return list[index] ? list[index] : repeat ? list[index % list.length] : '';
                };
                for (var i = 0, cell; cell = cells[i++];) {
                    var cellInfo = this.getCellInfo(cell);
                    cell.style.backgroundColor = getColor(colors, ((rowIndex + count) == cellInfo.rowIndex) ? count : ++count, value.repeat);
                }
            }
        },
        removeBackground: function (cells) {
            utils.each(cells, function (cell) {
                cell.style.backgroundColor = '';
            });
        }
    };
    function showError(e) {
    }
})();
