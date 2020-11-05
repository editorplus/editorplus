var EventBase = UE.EventBase = function () {
};
EventBase.prototype = {
    addListener: function (types, listener) {
        types = utils.trim(types).split(/\s+/);
        for (var i = 0, ti; ti = types[i++];) {
            getListener(this, ti, true).push(listener);
        }
    },
    on: function (types, listener) {
        return this.addListener(types, listener);
    },
    off: function (types, listener) {
        return this.removeListener(types, listener);
    },
    trigger: function () {
        return this.fireEvent.apply(this, arguments);
    },
    removeListener: function (types, listener) {
        types = utils.trim(types).split(/\s+/);
        for (var i = 0, ti; ti = types[i++];) {
            utils.removeItem(getListener(this, ti) || [], listener);
        }
    },
    fireEvent: function () {
        var types = arguments[0];
        types = utils.trim(types).split(' ');
        for (var i = 0, ti; ti = types[i++];) {
            var listeners = getListener(this, ti);
            var r;
            var t;
            var k;
            if (listeners) {
                k = listeners.length;
                while (k--) {
                    if (!listeners[k])
                        continue;
                    t = listeners[k].apply(this, arguments);
                    if (t === true) {
                        return t;
                    }
                    if (t !== undefined) {
                        r = t;
                    }
                }
            }
            if (t = this['on' + ti.toLowerCase()]) {
                r = t.apply(this, arguments);
            }
        }
        return r;
    }
};
function getListener(obj, type, force) {
    var allListeners;
    type = type.toLowerCase();
    return ((allListeners = (obj.__allListeners || force && (obj.__allListeners = {}))) &&
        (allListeners[type] || force && (allListeners[type] = [])));
}
