var sys=require('sys');
var http=require('http');
var util=require('util');
require.paths.unshift('.')
var iM=require('iM');
var tf=require('sprintf-0.7-beta1');

//console.log("Hello couch");
//sys.puts("iMetrical")
//util.log("iMetrical-couch seed");

//var baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
var grain=1

var options = {
    host: '192.168.5.2',
    port: 80,
    //path: '/iMetrical/getJSONForDay.php?day='+d_d+'&table='+table
    path: '/iMetrical/getJSONForDay.php?offset='+1+'&table='+table
};

var handleData = function(json){
    //console.log('json:'+json);
    data = JSON.parse(json);
    startStr = data[0]['stamp'];
    console.log(tf.sprintf("%22s %10s %8s %8s %7s",'date','method','samples','size','ratio'));
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f",startStr,'raw',data.length,json.length,1.0));
    var values = iM.rawToCanonical(json,startStr,grain,false);
    var canonical = {
        "stamp" : startStr,
        "grain" : grain,
        "values" : values
    };
    var canonicalJSON,ratio;
    canonicalJSON = JSON.stringify(canonical);
    ratio = Math.round(100*json.length/canonicalJSON.length)/100;
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f",startStr,'canonical',values.length,canonicalJSON.length,ratio));
    
    // V10
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = Math.round(values[i]/10);        
    });
    canonicalJSON = JSON.stringify(canonical);
    ratio = Math.round(100*json.length/canonicalJSON.length)/100;
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f",startStr,'V10',values.length,canonicalJSON.length,ratio));
    
    // Delta
    iM.deltaEncode(values);
    canonicalJSON = JSON.stringify(canonical);
    ratio = Math.round(100*json.length/canonicalJSON.length)/100;
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f",startStr,'Delta',values.length,canonicalJSON.length,ratio));

    // P3
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = values[i]+=3;        
    });
    canonicalJSON = JSON.stringify(canonical);
    ratio = Math.round(100*json.length/canonicalJSON.length)/100;
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f",startStr,'D-P3',values.length,canonicalJSON.length,ratio));

    // Runlength
    values = iM.rlEncode(values);
    canonical.values = values;
    canonicalJSON = JSON.stringify(canonical);
    ratio = Math.round(100*json.length/canonicalJSON.length)/100;
    console.log(tf.sprintf("%22s %10s %8d %8d %7.2f",startStr,'RL',values.length,canonicalJSON.length,ratio));

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