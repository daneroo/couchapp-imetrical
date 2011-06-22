// Underscore.rangeDo
// (c) 2011 Daniel Lauzon 
// Underscore.rangeDo is freely distributable under the terms of the MIT license.
// borrowsed structure from underscore.string

// except this required dependancy does not go here!
var _  = require('underscore');
(function(){
    // ------------------------- Baseline setup ---------------------------------

    // Establish the root object, "window" in the browser, or "global" on the server.
    var root = this;
    var _r = {
        rangeDo :   function(start, stop, step, iterator, context) {
            // rangeDo([start],stop,[step],iterator,[context])
            arguments = _.toArray(arguments);
            if (!_.detect(arguments,_.isFunction)) return;
            if (_.isFunction(_.last(arguments))){
                iterator=arguments.pop();
                context=undefined;
            } else {
                context=arguments.pop();
                iterator=arguments.pop();
            }
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;
            for (var i = start; i < stop; i+=step) {
                iterator.call(context, i);
            }
            return context;
        }
    };

    // Aliases
    _r.rangeEach  = _r.rangeDo;

    // CommonJS module is defined
    if (typeof window === 'undefined' && typeof module !== 'undefined') {
        // Export module
        module.exports = _r;

    // Integrate with Underscore.js
    } else if (typeof root._ !== 'undefined') {
        root._.mixin(_r);
    // Or define it
    } else {
        root._ = _r;
    }

}());
