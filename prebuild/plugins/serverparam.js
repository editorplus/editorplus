UE.plugin.register('serverparam', function () {
    var me = this;
    var serverParam = {};
    return {
        commands: {
            serverparam: {
                execCommand: function (cmd, key, value) {
                    if (key === undefined || key === null) {
                        serverParam = {};
                    }
                    else if (utils.isString(key)) {
                        if (value === undefined || value === null) {
                            delete serverParam[key];
                        }
                        else {
                            serverParam[key] = value;
                        }
                    }
                    else if (utils.isObject(key)) {
                        utils.extend(serverParam, key, true);
                    }
                    else if (utils.isFunction(key)) {
                        utils.extend(serverParam, key(), true);
                    }
                },
                queryCommandValue: function () {
                    return serverParam || {};
                }
            }
        }
    };
});
