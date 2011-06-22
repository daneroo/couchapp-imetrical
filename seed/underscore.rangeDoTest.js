var _  = require('underscore');
//_.mixin(require('underscore.string'));
require.paths.unshift('.');
_.mixin(require('underscore.rangeDo'));


// callback w/o context
var cb=function(i){ console.log('iteration: %d',i);};

// callback w/context
var cbc=function(i){ this.msg+="+"; console.log('iteration: %d : %s',i,this.msg);};

_.rangeDo(0,5,2);
_.rangeDo(0,5,2,cb);
_.rangeDo(5,2,cb);
_.rangeDo(5,cb);
_.rangeDo(0,5,2,cbc,{msg:"ctx"});
_.rangeDo(5,2,cbc,{msg:"ctx"});
_.rangeDo(5,cbc,{msg:"ctx"});

// test context as accumulator
r = _.rangeDo(5,cbc,{msg:"ctx"});
console.log('out: %j',r);
