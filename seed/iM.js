
var util=require('util');

exports.rangeStepDo = function(lo,hi,step,cb){
    for (var i = lo; i < hi; i+=step) cb(i);
}


exports.deltaEncode = function(values){
    // [x,y,z,a,b,c] -> [x,y-x,z-y]
    var previous=null;
    this.rangeStepDo(0,values.length,1,function(i){
        var w = values[i];
        var d = (w===null) ? null : ( (previous===null) ? w : (w-previous) );
        previous=w;
        values[i]=d;
    });
}

function appendShorter(encoded,rl,run,verbose){
    if (JSON.stringify([rl]).length<JSON.stringify(run).length){
        if (verbose) {
            console.log("  --RLE %j > %j",run,[rl]);
        }
        encoded.push(rl);
    } else {
        if (verbose) {
            console.log("  ++ORG %j < %j",run,[rl]);
            console.log("  appending %j to %j",run,encoded);
        }
        //encoded.concat(run);
				for (var r=0;r<run.length;r++) encoded.push(run[r]);
        if (verbose) {
            console.log("  gives %j",encoded);
        }
    }
}

exports.rlEncode = function(values,verbose){
    // [0,0,x,y,...] -> [[2,0],x,y,..]
    var head=-99999999; // impossible
    var encoded = [];
    var rl=[0,head];
    var run=[];
    this.rangeStepDo(0,values.length,1,function(i){
        var v = values[i];
        if (v==head) {
            rl[0]+=1;
            run.push(head);
        } else {
            //flush
            if (rl[0]>0){
                appendShorter(encoded,rl,run,verbose);
            }
            if (verbose) {
                console.log("Encoded %j",encoded);
            }
            head=v;
            rl=[1,head];
            run=[v];
        }
    });
    //flush last time
    if (rl[0]>0){
        appendShorter(encoded,rl,run,verbose);
    }
    if (verbose) {
        console.log("Encoded %j",encoded);
        console.log("----------------");
    }
    return encoded;
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
        w = parseInt(v['watt'],10);
        stampToWatt[d]=w;
        if (verbose) console.log('++'+util.inspect([d,w], false, null));
    });
    
    var values = [];
    this.rangeStepDo(0,86400,grain,function(i){
        //console.log("-=-= "+i+" : "+stampToWatt[i]);
        var w = stampToWatt[i];
        w = (w===undefined)?null:w;
        values.push(w);
        delete stampToWatt[i];        
    });
    if (verbose && Object.keys(stampToWatt).length>0){
        console.log("Unused values in stampToWatt");
    }
    return values;
}


    
    
    