//var profiler=require("v8-profiler");
var sys=require('sys');
var util=require('util');
var crypto = require('crypto');
var _  = require('underscore');
_.mixin(require('underscore.string'));
require.paths.unshift('.')
var iM=require('iM');
var entropy=require('entropy');

var mod3 = function(b){
    return b%3==0?1:0
}
var randUniform = function(b){
    return Math.floor(Math.random()*2)%2;
}
var randMoreOnes = function(b){
    return (Math.random()>.001)?1:0;
}    
function sha1sum(s){
    return crypto.createHash('sha1').update(s).digest('hex');
}

// return a model w p[0]=prob0, p[x!=0]= (1-prob0)/(nSymbols-1)
function model(prob0,nSymbols){
    var probOhter = (1-prob0)/(nSymbols-1);
    var probs = [prob0];
    _.times(nSymbols-1,function(){probs.push(probOhter);});
    var histo = _.map(probs,function(p){return Math.ceil(p*100000); });
    histo.push(1);
    return {
      name:_.sprintf("model-%03d-%f",nSymbols,prob0),
      gen: function(){
          return (Math.random()<prob0)?0:(Math.floor(Math.random()*(nSymbols-1))+1);
      },
      histo:histo
    };
}

var models = [];
_.each(_.range(1,4),function(order){
    p0 = 1- (1.0/(1<<order));
    models.push(model(p0,2));
});
console.log(models);
_.each(models,function(m){
    console.log(m);
});
console.log("hello entropy");
var start=Date.now();
var lengths = [10000,100000,120000,140000,160000,180000,200000];
var lengths = [50000];
for (var l in lengths){
    for (var it=0;it<1000;it++){
        var length=lengths[l];

        // Binary Model - non adaptive
        var methods={'mod3':mod3,'randUniform':randUniform,'randMoreOnes':randMoreOnes};
        var histos=[[66667,33333,1],[50000,50000,1],[100,99900,1]];
        //var methods={'zozo':mUni.gen};
        //var histos=[mUni.histo];
        for (var m in methods){
            // Generate Data
            var genData = [];
            for (var b=0;b<length;b++){
                genData.push(methods[m](b));
            }
            var sha1 = sha1sum(JSON.stringify(genData));
            var obeservedEntropyBps = entropy.H(genData);
            //genData=[];

            for (var h in histos){
                histo = histos[h];
                for (var ii=0;ii<5;ii++){
                    var runstart=Date.now();

                    //Encoding
                    //var encodedByteArray = entropy.myEncoder(methods[m],histo,length);
                    var encodedByteArray = entropy.myEncoder(genData,histo,length);
                    
                    // Decoding
                    var recoveredData = entropy.myDecoder(encodedByteArray,histo,length);
                    var sha1r = sha1sum(JSON.stringify(recoveredData));

                    //util.debug("decoded end-of-stream symbol");
                    //console.log("orig   : %j ...",genData.slice(0,30));
                    //console.log("decoded: %j ...",recoveredData.slice(0,30));
                    //console.log("encoded: %j ...",encodedByteArray.slice(0,20));    
                    console.log(
                        _.sprintf("%s%s%s %5.2fs :%7d compression: %5.2f:1 bits/s: %.4f >= %.4f = H   Source: %15s, Model: %s %s...",
                        sha1.substring(0,8),(sha1==sha1r)?"==":"!=",sha1r.substring(0,8),
                        (Date.now()-runstart)/1000.0,
                        length,
                        length/8/encodedByteArray.length,
                        encodedByteArray.length*8.0/length,
                        obeservedEntropyBps,
                        m,
                        JSON.stringify(histo),
                        JSON.stringify(encodedByteArray.slice(0,20))
                    ));
                }
            }
        }
        //console.log("------------------------------");
    }
}

