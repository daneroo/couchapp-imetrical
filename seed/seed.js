var sys=require('sys');
var http=require('http');
var util=require('util');
var _  = require('underscore');
_.mixin(require('underscore.string'));
var cradle = require('cradle');
require.paths.unshift('.')
var iM=require('iM');
var entropy=require('entropy');


var ACCodingCost = function(canonical){    
    var verbose=false;
    var values = canonical.values;
    

    // histo : count the values into a Map
    var histoMap={};
    _.each(values,function(v){
        if (histoMap[v]===undefined) histoMap[v]=0;
        (histoMap[v]++);        
    });
    //console.log('histoMapCost',JSON.stringify(histoMap).length);
    //console.log('%j',histoMap);
    
    // make the histo into a sortable array
    // Sorting the symbol array is about make the cumulative ditribution count effective
    //  it is all about how the encoder will look this up in the model.
    //  for now we put the probable symbols at the begining.
    var histoToSort = _.map(histoMap,function(count,value){
        // because histoMap's keys are converted to strings, get the int back (if it is an int)
        var asInt = parseInt(value);
        if (!_.isNaN(asInt)) { value=asInt;}
        return {count:count,value:value};
    });
    // now sort it ( by count desc)
    histoToSort = _.sortBy(histoToSort,function(e){return -e.count}); 
    //histoToSort = _.sortBy(histoToSort,function(e){return e.value}); 

    var symbolForValue={};
    var valueForSymbol={};
    var histo=[];
    _.each(histoToSort,function(e,symbol){
        //e.symbol = symbol;
        symbolForValue[e.value]=symbol;
        valueForSymbol[symbol]=e.value;
        histo.push(e.count);
    });

    histo.push(1); // for EOS
    //the EOS Symbol is never actually returned by the decoder.
    //valueForSymbol[histo.length-1]='EOS';
    
    var symbols=[];
    _.each(values,function(v){symbols.push(symbolForValue[v]);});
    var encodedByteArray = entropy.myEncoder(symbols,histo,values.length);
    
    var recoveredSymbols = entropy.myDecoder(encodedByteArray,histo);
    var recoveredValues = [];
    _.each(recoveredSymbols,function(s){recoveredValues.push(valueForSymbol[s]);});
    if (verbose){
        console.log('sorted histo: %j...%j ',histoToSort.slice(0,-6),histoToSort.slice(-3));
        //console.log('v->s',symbolForValue);
        //console.log('v<-s',valueForSymbol);
        //console.log('histo',JSON.stringify(histo.slice(0,30)));
        console.log("- values(%d): %j...%j",values.length,values.slice(0,30),values.slice(-4));
        console.log("- symbol(%d): %j...%j",symbols.length,symbols.slice(0,30),symbols.slice(-4));
        console.log('bytes:',encodedByteArray.length,encodedByteArray.slice(0,10),encodedByteArray.slice(-4));
        console.log("+ symbol(%d): %j...%j",recoveredSymbols.length,recoveredSymbols.slice(0,30),recoveredSymbols.slice(-4));
        console.log("+ values(%d): %j...%j",recoveredValues.length,recoveredValues.slice(0,30),recoveredValues.slice(-4));
    }

    function byteToString(bytes){
        var s='';
        _.each(bytes,function(b){s+=String.fromCharCode(b);});
        return s;
    }    
    var b64 = new Buffer(byteToString(encodedByteArray)).toString('base64')
    canonical.ac={
        histo: histoMap,
        b64: b64,
    };
    canonical.values=[];
    return encodedByteArray.length+JSON.stringify(histoMap).length;
}
var H = function(values){
    histo={};
    iM.rangeStepDo(0,values.length,1,function(i){
        v = values[i];
        if (histo[v]===undefined) histo[v]=0;
        (histo[v]++);
    });
    var nkeys=0; 
    var summplogp=0;
    for (k in histo) { 
        nkeys++;
        if (histo[k]>0){
            var p = histo[k]*1.0/values.length;
            var mplogp = -p*Math.log(p);
            summplogp += mplogp
            //console.log(_.sprintf("k:%10s p:%10.6f p log p: %10.6f sum:%10.6f",JSON.stringify(k),p,mplogp,sumplogp));
        } else {
            // should never happen
            console.log("excluding k:%s histo[k]:%s",k,histo[k]);
        }
    }
    var bitsPerSample = summplogp/Math.LN2;
    //console.log("values has %d symbols with H(x)=%s bits/sample costs:%d bytes",nkeys,bitsPerSample,JSON.stringify(histo).length);
    //console.log(" histo: %j",histo);
    return bitsPerSample;
}
var report = function(startStr,name,canonical,jsonRaw) {
  var canonicalJSON = JSON.stringify(canonical);
  var ratio = Math.round(100*jsonRaw.length/canonicalJSON.length)/100;
  var bps = canonicalJSON.length/86400/canonical.grain;
  var hB=0;lboundB=0;
  if (canonical.values.length>0){
      hB = H(canonical.values)/8.0;
      lboundB = hB*canonical.values.length;
  }
  var acCost=0;
  if (false && 'Delta'==name){
      acCost = ACCodingCost(canonical);
  }
  console.log(_.sprintf("%22s %10s %8d %8d %7.2f %7.2f %7.2f %7.0f %7d",startStr,name,canonical.values.length,canonicalJSON.length,ratio,bps,hB,lboundB,acCost));
}

var handleData = function(json,grain,startStr){
    //console.log('json:'+json);
    var data = JSON.parse(json);
        
    console.log(_.sprintf("%22s %10s %8s %8s %7s %7s %7s %7s %7s",'date','method','samples','size','ratio','Bps','H(x)','<bound','<ac+h'));
    console.log(_.sprintf("%22s %10s %8d %8d %7.2f %7.2f",startStr,'raw',data.length,json.length,1.0,json.length/86400/grain));
    var values = iM.rawToCanonical(json,startStr,grain,false);
    var canonical = {
        "stamp" : startStr,
        "grain" : grain,
        "values" : values
    };
    report(startStr,'canonical',canonical,json);

    // V10
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = (values[i]===null)?null:Math.round(values[i]/10);        
    });
    report(startStr,'V10',canonical,json);
    // Delta
    iM.deltaEncode(values);
    report(startStr,'Delta',canonical,json);

    var doAC=false;
    var doRL=false;
    if (doAC) {
        ACCodingCost(canonical);
        report(startStr,'AC+h',canonical,json);
    } else if (doRL) {
        // P3
        iM.rangeStepDo(0,values.length,1,function(i){
            values[i] = (values[i]===null)?null:values[i]+=3;        
        });
        report(startStr,'D-P3',canonical,json);

        // Runlength
        values = iM.rlEncode(values);
        canonical.values = values;
        report(startStr,'RL',canonical,json);
    }    
}

function RLtoCanonical(rl){
  var canonical = rl;
  var values = canonical.values;
  // un RL
  canonical.values = values = iM.rlDecode(values);
  console.log('+rl  %j..%j',values.slice(0,1000),values.slice(-5));
  // un Delta
  iM.deltaDecode(values);
  console.log('+dlt %j..%j',values.slice(0,1000),values.slice(-5));
  // un Q
  iM.rangeStepDo(0,values.length,1,function(i){
      values[i] = (values[i]===null)?null:(values[i]*canonical.Q);        
  });
  canonical.Q=1;
  console.log('+Q %j..%j',values.slice(0,10),values.slice(-5));
  
  return canonical;
}
function doADay(offset,maxoffset) {
    var day = new Date();
    day.setUTCDate(day.getUTCDate()-offset);
    // Month+1 Really ?
    var dayStr = _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
    console.log('--- fetch offset %d --- %s ---',offset,dayStr);

    var db = new(cradle.Connection)().database('imetrical');
    var stampStr = dayStr+'T00:00:00Z';
    var key =  _.sprintf("daniel.%s",stampStr);
    db.get(key+'/RL.json',function(err,rsp){
      if (err) {
        console.log('error: %j',name,err);
      } else {
        //handleData(responseBody,grain,stampStr);
        var olen = rsp.values.length;
        var canonical = RLtoCanonical(rsp);
        console.log('fetched: %s: %d -> %d',rsp.stamp,olen,canonical.values.length);
        if (offset<maxoffset-1){
            //setTimeout(function(){doADay(offset+1,maxoffset);},1);
        }
      }
    });
}

doADay(1,1080);
//doADay(1,20);//doADay(1,10);//doADay(10,20);
