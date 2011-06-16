var sys=require('sys');
var http=require('http');
var util=require('util');

console.log("Hello couch");
sys.puts("iMetrical")
util.log("iMetrical-couch seed");

//var baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
var grain=1

var options = {
    host: '192.168.5.2',
    port: 80,
    //path: '/iMetrical/getJSONForDay.php?day='+d_d+'&table='+table
    path: '/iMetrical/getJSONForDay.php?offset='+1+'&table='+table
};

var rangeStepDo = function(lo,hi,step,cb){
    for (var i = lo; i < hi; i+=step) cb(i);
}
var handleData = function(json){
    //console.log('json:'+json);
    data = JSON.parse(json);
    startStr = data[0]['stamp'];

    //console.log(util.inspect(data, false, null));
    // should test that data is an [] array
    var stampToWatt={};

    // assume first stamp is ok
    startOfDay = Date.parse(startStr)/1000;
    data.forEach(function(v, idx, array) { 
        //console.log('--'+util.inspect(v, false, null));
        d = Date.parse(v['stamp'])/1000 - startOfDay;
        w = v['watt'];
        stampToWatt[d]=w;
        //console.log('++'+util.inspect([d,w], false, null));
    });
    var canonical = {
      "stamp" : startStr,
      "grain" : grain,
      "values" : []
    }
    rangeStepDo(0,86400,grain,function(i){
        //console.log("-=-= "+i+" : "+stampToWatt[i]);
        canonical.values.push(stampToWatt[i]);
        delete stampToWatt[i];        
    });
    if (Object.keys(stampToWatt).length>0){
        console.log("Unused values in stampToWatt");
    }
    canonicalJSON = JSON.stringify(canonical);
    console.log("%s  %d -> %d",startStr,json.length,canonicalJSON.length);
}

util.log(JSON.stringify(options))
http.get(options, function(res) {
    var responseBody = '';
    console.log("Got response: " + res.statusCode);

    res.addListener('data', function(chunk) {
        responseBody += chunk;
    });
    res.addListener('end', function() {
        console.log('All data has been read.');
        handleData(responseBody);
    });
}).on('error', function(e) {
    console.log("Got error: " + e.message);
});