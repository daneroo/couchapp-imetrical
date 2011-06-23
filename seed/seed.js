var sys=require('sys');
var http=require('http');
var util=require('util');
require.paths.unshift('.')
var iM=require('iM');
var entropy=require('entropy');
var tf=require('sprintf-0.7-beta1');


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
//var baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
var grain=1

var options = {
    host: '192.168.5.2',
    port: 80,
    //path: '/iMetrical/getJSONForDay.php?day='+d_d+'&table='+table
    path: '/iMetrical/getJSONForDay.php?offset='+1+'&table='+table
};

var ACCodingCost = function(values){
    // require entropy
    // histo of values, 
    // map values to symbols (order by histo count desc)
    // make new histo[symbols]
    histoMap={};
    // seed with values, order by values desc, inject into histo
    valuesToSymbol={};
    histo = [];
    symbolValues=[];// 0..|histoMap|
    var encodedByteArray = entropy.myEncoder(symbolValues,histo,length);
    var recoveredData = entropy.myDecoder(encodedByteArray,histo,length);
    return encodedByteArray.length;
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
            //console.log(tf.sprintf("k:%10s p:%10.6f p log p: %10.6f sum:%10.6f",JSON.stringify(k),p,mplogp,sumplogp));
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
  console.log(tf.sprintf("%22s %10s %8d %8d %7.2f %7.2f %7.2f %7.0f",startStr,name,canonical.values.length,canonicalJSON.length,ratio,bps,hB,lboundB));
}


var handleData = function(json){
    //console.log('json:'+json);
    data = JSON.parse(json);
    startStr = data[0]['stamp'];
    console.log(tf.sprintf("%22s %10s %8s %8s %7s %7s %7s %7s",'date','method','samples','size','ratio','Bps','H(x)','<bound'));
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f %7.2f",startStr,'raw',data.length,json.length,1.0,json.length/86400/grain));
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
}

//util.log(JSON.stringify(options))
http.get(options, function(res) {
    var responseBody = '';
    //console.log("Got response: " + res.statusCode);
    res.addListener('data', function(chunk) {
        responseBody += chunk;
    });
    res.addListener('end', function() {
        handleData(responseBody);
    });
}).on('error', function(e) {
    console.log("Got error: " + e.message);
});