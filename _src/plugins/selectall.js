/**
 * 全选
 * @file
 * @since 1.2.6.1
 */

/**
 * 选中所有内容
 * @command selectall
 * @method execCommand
 * @param { String } cmd 命令字符串
 * @example
 * ```javascript
 * editor.execCommand( 'selectall' );
 * ```
 */
UE.plugins['selectall'] = function(){
    var me = this;
    me.commands['selectall'] = {
        execCommand : function(){
            //去掉了原生的selectAll,因为会出现报错和当内容为空时，不能出现闭合状态的光标
            var me = this,body = me.body,
                range = me.selection.getRange();
            range.selectNodeContents(body);
            if(domUtils.isEmptyBlock(body)){
                range.collapse(true);
            }
            range.select(true);
        },
        notNeedUndo : 1
    };


    //快捷键
    me.addshortcutkey({
         "selectAll" : "ctrl+65"
    });
};
