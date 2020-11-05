UE.commands.time = UE.commands.date = {
    execCommand: function (cmd, format) {
        var date = new Date();
        function formatTime(date, format) {
            var hh = ('0' + date.getHours()).slice(-2);
            var ii = ('0' + date.getMinutes()).slice(-2);
            var ss = ('0' + date.getSeconds()).slice(-2);
            format = format || 'hh:ii:ss';
            return format.replace(/hh/ig, hh).replace(/ii/ig, ii).replace(/ss/ig, ss);
        }
        function formatDate(date, format) {
            var yyyy = ('000' + date.getFullYear()).slice(-4);
            var yy = yyyy.slice(-2);
            var mm = ('0' + (date.getMonth() + 1)).slice(-2);
            var dd = ('0' + date.getDate()).slice(-2);
            format = format || 'yyyy-mm-dd';
            return format.replace(/yyyy/ig, yyyy).replace(/yy/ig, yy).replace(/mm/ig, mm).replace(/dd/ig, dd);
        }
        this.execCommand('insertHtml', cmd == 'time' ? formatTime(date, format) : formatDate(date, format));
    }
};
