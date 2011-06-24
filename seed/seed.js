var sys=require('sys');
var http=require('http');
var util=require('util');
var _  = require('underscore');
_.mixin(require('underscore.string'));
var cradle = require('cradle');
require.paths.unshift('.')
var iM=require('iM');
var entropy=require('entropy');


//console.log("Hello couch");
//sys.puts("iMetrical")
//util.log("iMetrical-couch seed");
if (false){
  //iM.rlEncode([1,2,3,4,5,6,7],true);
  //var v=[1,2,3,3,3,3,null,null,7,5,6,8,6,5,4,null,4,5,null,null,null,null,null];
  var v=[90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,90,null,90,90,90,91,90,90,90,90,90,90];
	console.log("v %j",v);
  //iM.rlEncode(v,false);
	console.log("r %j",v);
  iM.deltaEncode(v)
	console.log("delta %j",v);
  process.exit(0);
}


var ACCodingCost = function(values){
    var verbose=false;

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
    //the EOS Symbols is never actually returned by the decoder.
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
  var hB = H(canonical.values)/8.0;
  var lboundB = hB*canonical.values.length;
  var acCost=0;
  if ('Delta'==name){
      acCost = ACCodingCost(canonical.values);
  }
  console.log(_.sprintf("%22s %10s %8d %8d %7.2f %7.2f %7.2f %7.0f %7d",startStr,name,canonical.values.length,canonicalJSON.length,ratio,bps,hB,lboundB,acCost));
}

var saveDay = function(canonical){
    var db = new(cradle.Connection)().database('imetrical');
    //canonical["_id"] = _.sprintf("daniel.%s",canonical.stamp);
    //console.log("ca: %j",canonical);
    var attach_json = JSON.stringify(canonical);
    var values = canonical.values;
    canonical.values=[];
    console.log('about to save: %j',attach_json.length);
    db.save( _.sprintf("daniel.%s",canonical.stamp), canonical,function(err,rsp){
        console.log('save %j',[err,rsp]);
        db.saveAttachment( 
            rsp.id, 
            rsp.rev, 
            'N10RL.json',
            'application/json', 
            attach_json,
            function( err, rsp ){
                console.log('saveAttachment %j',[err,rsp]);
                if (err) return;
            }
        );
    });
}
var handleData = function(json,grain){
    //console.log('json:'+json);
    data = JSON.parse(json);
    
    // need to get the stamp from elsewhere, to get null output
    if (data.length<1) {
        console.log("no data -- skipping");
        return;
    }
    
    startStr = data[0]['stamp'];
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

    // P3
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = (values[i]===null)?null:values[i]+=3;        
    });
    report(startStr,'D-P3',canonical,json);

    // Runlength
    values = iM.rlEncode(values);
    canonical.values = values;
    report(startStr,'RL',canonical,json);
    saveDay(canonical);
}

function doADay(offset,maxoffset) {

    var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
    var grain=1;
    var options = {
        host: '192.168.5.2',
        port: 80,
        //path: '/iMetrical/getJSONForDay.php?day='+d_d+'&table='+table
        path: '/iMetrical/getJSONForDay.php?offset='+offset+'&table='+table
    };
    console.log('------ fetch offset %d ------',offset);
    http.get(options, function(res) {
        var responseBody = '';
        //console.log("Got response: " + res.statusCode);
        res.addListener('data', function(chunk) {
            responseBody += chunk;
        });
        res.addListener('end', function() {
            handleData(responseBody,grain);
            if (offset<maxoffset-1){
                setTimeout(function(){doADay(offset+1,maxoffset);},1);
            }
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });

}

doADay(1,366);
//doADay(196,366);
//doADay(1,20);//doADay(1,10);//doADay(10,20);
