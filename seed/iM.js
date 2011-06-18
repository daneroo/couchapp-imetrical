
var util=require('util');

exports.rangeStepDo = function(lo,hi,step,cb){
    for (var i = lo; i < hi; i+=step) cb(i);
}


exports.deltaEncode = function(values){
    // [x,y,z,a,b,c] -> [x,y-x,z-y]
    var prev=null
    this.rangeStepDo(0,values.length,1,function(i){
        var w = values[i]
        var d = (w==null) ? null : (prev!=null ? w-prev : w);
        prev=w;
        values[i]=d;
    });
}

// convert [{w,s},{w,s}] (to {w:s,w:s}) to {s,[w,w,w,w]}
// should we inject startStr,grain ?
exports.rawToCanonical = function(json,startStr,grain,verbose){
    data = JSON.parse(json);

    // should test that data is an [] array
    var stampToWatt={};

    startOfDay = Date.parse(startStr)/1000;
    data.forEach(function(v, idx, array) { 
        if (verbose) console.log('--'+util.inspect(v, false, null));
        d = Date.parse(v['stamp'])/1000 - startOfDay;
        w = v['watt'];
        stampToWatt[d]=w;
        if (verbose) console.log('++'+util.inspect([d,w], false, null));
    });
    
    var values = [];
    this.rangeStepDo(0,86400,grain,function(i){
        //console.log("-=-= "+i+" : "+stampToWatt[i]);
        values.push(stampToWatt[i]);
        delete stampToWatt[i];        
    });
    if (verbose && Object.keys(stampToWatt).length>0){
        console.log("Unused values in stampToWatt");
    }
    return values;
}


    
    
    