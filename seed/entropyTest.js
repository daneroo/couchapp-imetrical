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
function modelMoreZeroes(prob0,nSymbols){
    var probOhter = (1-prob0)/(nSymbols-1);
    var probs = [prob0];
    _.times(nSymbols-1,function(){probs.push(probOhter);});
    var histo = _.map(probs,function(p){return Math.ceil(p*10000000); });
    histo.push(1);
    return {
      name:_.sprintf("model-%03d-%f",nSymbols,prob0),
      n:nSymbols,
      gen: function(){
          return (Math.random()<prob0)?0:(Math.floor(Math.random()*(nSymbols-1))+1);
      },
      histo:histo
    };
}
function modelUniform(nSymbols){
    var prob = 1.0/nSymbols;
    var probs=[];
    _.times(nSymbols,function(){probs.push(prob);});
    var histo = _.map(probs,function(p){return Math.ceil(p*10000000); });
    histo.push(1);
    return {
      name:_.sprintf("uni-%03d",nSymbols),
      n:nSymbols,
      gen: function(){
          return Math.floor(Math.random()*nSymbols)%nSymbols;
      },
      histo:histo
    };
}

var models = [];
models.push(modelUniform(2));
models.push(modelUniform(16));
models.push(modelUniform(1024));
_.each(_.range(1,9),function(order){
    p0 = 1- (1.0/(1<<order));
    models.push(modelMoreZeroes(p0,2));
    //models.push(modelMoreZeroes(p0,4));
    models.push(modelMoreZeroes(p0,16));
    //models.push(modelMoreZeroes(p0,256));
    models.push(modelMoreZeroes(p0,1024));
});
console.log("hello entropy");
var start=Date.now();
var lengths = [10000,100000,120000,140000,160000,180000,200000];
var lengths = [100000];
for (var l in lengths){
    for (var it=0;it<1;it++){
        var length=lengths[l];

        _.each(models,function(model){
            // Generate Data
            var genData = [];
            for (var b=0;b<length;b++){
                genData.push(model.gen(b));
            }
            var sha1 = sha1sum(JSON.stringify(genData));
            var obeservedEntropyBps = entropy.H(genData);
            //genData=[];

            histo = model.histo;
            for (var ii=0;ii<1;ii++){
                var runstart=Date.now();

                //Encoding
                //var encodedByteArray = entropy.myEncoder(methods[m],histo,length);
                var encodedByteArray = entropy.myEncoder(genData,histo,length);

                // Decoding
                var recoveredData = entropy.myDecoder(encodedByteArray,histo);
                var sha1r = sha1sum(JSON.stringify(recoveredData));

                console.log(
                    _.sprintf("%s%s%s %5.2fs :%7d compression: %5.2f:1 bits/s: %.4f >= %.4f = H %20s p:%s e:%s...",
                    sha1.substring(0,8),(sha1==sha1r)?"==":"!=",sha1r.substring(0,8),
                    (Date.now()-runstart)/1000.0,
                    length,
                    length*(Math.log(model.n)/Math.LN2)/8/encodedByteArray.length,
                    encodedByteArray.length*8.0/length,
                    obeservedEntropyBps,
                    model.name,
                    JSON.stringify(histo.slice(0,5))+'...',
                    JSON.stringify(encodedByteArray.slice(0,10))
                ));
                var verbose=false;
                if (verbose){
                    console.log("  orig   : %j ...",genData.slice(0,30));
                    console.log("  decoded: %j ...",recoveredData.slice(0,30));
                    //console.log("encoded: %j ...",encodedByteArray.slice(0,20));    
                }
            }
        });
        //console.log("------------------------------");
    }
}

