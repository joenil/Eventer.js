import {isArray, isObject, isString, isFunction, createMap, each, slice} from './util';

// constructor
function Eventer() {
    this._listeners = createMap();
    if (arguments.length) {
        this.on.apply(this, arguments);
    }
}

// for static usage
Eventer._listeners = createMap();

let baseMethods = {
    offAll() {
        this._listeners = createMap();
    },

    fireAll(data) {
        each(this._listeners, evtName => {
            this.fire(evtName, data);
        });
    }
};

let rawMethods = {
    on(evtName, handler, isOnce) {
        var handlers = this._listeners[evtName],
            isAlreadyOn = false,
            handlerItem = {
                handler: handler,
                isOnce: !!isOnce
            };

        if (handlers) {
            isAlreadyOn = handlers.some(
                item => item.handler === handlerItem.handler
            );
            !isAlreadyOn && handlers.push(handlerItem);
        } else {
            this._listeners[evtName] = [handlerItem];
        }
    },

    one() {
        var args = slice(arguments);
        args.push(true);
        this.on.apply(this, args);
    },

    off(evtName, handler) {
        let index,
            handlers = this._listeners[evtName],
            deleteListener = () => {
                delete this._listeners[evtName];
            };

        if (handler && isArray(handlers)) {
            index = handlers.findIndex(
                item => item.handler === handler
            );

            if (index > -1) {
                handlers.splice(index, 1);
                handlers.length === 0 && deleteListener();
            }
        } else {
            deleteListener();
        }
    },

    fire(evtName, data) {
        var handlers = this._listeners[evtName];

        if (handlers) {
            handlers.forEach(item => {
                var $event = {
                    type: evtName,
                    data: data
                };

                isFunction(item.handler) && item.handler.call(this, $event);

                if (item.isOnce) {
                    this.off(evtName, item.handler);
                }
            });
        }
    }
};

// more sugary
each(rawMethods, (fnName, fn) => {
    baseMethods[fnName] = function(names) {
        let evtsMap,
            extraArgs = slice(arguments, 1),
            splitNames = extraArgs => {
                names.split(' ').forEach(evtName => {
                    var applyArgs = [evtName].concat(extraArgs);
                    fn.apply(this, applyArgs);
                });
            };

        if (isObject(names)) {
            evtsMap = names;
            each(evtsMap, (key, value) => {
                names = key;
                splitNames([value].concat(extraArgs));
            });
        } else if (isString(names)) {
            splitNames(extraArgs);
        }
    };
});

// extend prototype and constructor
each(baseMethods, (fnName, fn) => {
    Eventer.prototype[fnName] = fn;
    Eventer[fnName] = fn;
});

export default Eventer;
