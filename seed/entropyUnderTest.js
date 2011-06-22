var sys=require('sys');
var util=require('util');
var _  = require('underscore');
_.mixin(require('underscore.string'));
require.paths.unshift('.');
var entropy=require('entropy');
_.mixin(require('underscore.rangeDo'));

var mod3 = function(b){
    return b%3==0?1:0
}
var randUniform = function(b){
    return (Math.random()>.5)?1:0;
}
var randMoreOnes = function(b){
    return (Math.random()>.001)?1:0;
}    

if (true){
    var length=100000;
    // Binary Model - non adaptive
    var methods={'mod3':mod3,'randUniform':randUniform,'randMoreOnes':randMoreOnes};
    var histos=[[66667,33333,1],[50000,50000,1],[100,99900,1]];
    _(methods).each(function(method,m){
        var genData = [];
        _.rangeDo(length,function(b){
            genData.push(method(b));
        });
        var obeservedEntropyBps = entropy.H(genData);
        genData=[];
        
        _(histos).each(function(histo,h){

            //Encoding
            var encodedByteArray = entropy.myEncoder(method,histo,length);
            // Decoding
            var recoveredData = entropy.myDecoder(encodedByteArray,histo,length);

            //util.debug("decoded end-of-stream symbol");
            //console.log("orig   : %j ...",genData.slice(0,30));
            //console.log("decoded: %j ...",recoveredData.slice(0,30));
            //console.log("encoded: %j ...",encodedByteArray.slice(0,20));    
            console.log(
                _.sprintf("compression: %5.2f:1 bits/s: %.4f >= %.4f = H   Source: %15s, Model: %s",
                length/8/encodedByteArray.length,
                encodedByteArray.length*8.0/length,
                obeservedEntropyBps,
                m,
                JSON.stringify(histo)
            ));
        });
    });
    console.log("------------------------------");

}



