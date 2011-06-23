var assert = require('assert');
var crypto = require('crypto');
var _  = require('underscore');
_.mixin(require('underscore.string'));

function sha1(s){
    return crypto.createHash('sha1').update(s).digest('hex');
}
function doOne(s){
    var start=Date.now();
    var h=sha1(s);
    charCodes=[];
    _.each(s,function(c,i){charCodes.push(c.charCodeAt(0))});
    console.log(_.sprintf('%40s <- %s = %s',h,s,JSON.stringify(charCodes)));
}
doOne('Test123');
doOne('A');
doOne(String.fromCharCode(65));
_.each(_.range(0,1024),function(i){
    doOne(String.fromCharCode(i)); 
});
/*var a0 = crypto.createHash('sha1').update('Test123').digest('hex');
assert.equal(a0, '8308651804facb7b9af8ffc53a33a22d6a1c8ac2', 'Test SHA1');
assert.equal(a0, '8308651804facb7b9af8ffc53a33a22d6a1c8ac', 'xxTest SHA1');
*/

function byteToString(bytes){
    var s='';
    _.each(bytes,function(b){s+=String.fromCharCode(b);});
    return s;
}    
function stringToByte(str){
    var b=[];
    _.each(str,function(c){b.push(c.charCodeAt(0))});
    return b;
}
console.log('----------------');
var allBytes=_.range(256);
console.log("-allBytes: %j",allBytes);
console.log('-----to string ---------');
allBytesAsStr = byteToString(allBytes)
console.log("allBytes As JSON str: %j",allBytesAsStr);
console.log('----- back to bytes ---------');
allBytesBack = stringToByte(allBytesAsStr)
console.log("+allBytes: %j",allBytesBack);

// Timing
var algorithms=['md5','sha1', 'sha256', 'sha512'];
console.log('-- timing digest algorithms: %j',algorithms)
var allBytes=_.range(256);
// double the array length 6 time!
_.times(6,function(){allBytes = allBytes.concat(allBytes);})
var json = JSON.stringify(allBytes);
//console.log(json);
_.each(algorithms,function(algo){
    var sig = crypto.createHash(algo).update(json).digest('hex');
    var start = Date.now();
    var iterations=1000;
    for (var it=0;it<iterations;it++){
        sig=crypto.createHash(algo).update(json).digest('hex');
    }
    var diff = (Date.now()-start);
    console.log(_.sprintf("%6s %.0fkB %.4fms : %s",algo,json.length/1024.0,diff/iterations,sig));
});
