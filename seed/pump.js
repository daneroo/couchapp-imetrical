var http=require('http');
var crypto = require('crypto');
var _  = require('underscore');
_.mixin(require('underscore.string'));
var cradle = require('cradle');
require.paths.unshift('.')
var iM=require('iM');

function sha1sum(s){
  // if not a string, turn into json first
  if (!_.isString(s) && !_.isNull(s)){
    s = JSON.stringify(s);
  }
  return crypto.createHash('sha1').update(s).digest('hex');
}

// put values 'RL' into it own attachment
var saveDay = function(canonical){
    var db = new(cradle.Connection)().database('imetrical');
    var key =  _.sprintf("daniel.%s",canonical.stamp);
    var RL = {
        stamp : canonical.stamp,
        grain : canonical.grain,
        Q: canonical.Q,
        values : canonical.values,
    };
    // remove values from canonical
    canonical.values=[];
    db.save(key, canonical,function(err,rsp){
        console.log('saved %j',[err,rsp]);
        db.saveAttachment( 
            rsp.id, 
            rsp.rev, 
            'RL.json',
            'application/json', 
            JSON.stringify(RL),
            function( err, rsp ){
                console.log('saveAttachment %j',[err,rsp]);
                if (err) return;
            }
        );
    });
}

function metrics(canonical){
  return {size:JSON.stringify(canonical).length, sha1sum:sha1sum(canonical.values)};
}

var handleData = function(json,grain,startStr){
    //console.log('json:'+json);
    var data = JSON.parse(json);
        
    var Q = 10; // value quantization
    console.log(_.sprintf("%22s %10s %8s %8s %7s %7s %7s %7s %7s",'date','method','samples','size','ratio','Bps','H(x)','<bound','<ac+h'));
    console.log(_.sprintf("%22s %10s %8d %8d %7.2f %7.2f",startStr,'raw',data.length,json.length,1.0,json.length/86400/grain));
    var values = iM.rawToCanonical(json,startStr,grain,false);
    var canonical = {
        stamp : startStr,
        grain : grain,
        Q: Q,
        values : values,
        metrics:{
          raw:{size:json.length,sha1sum:sha1sum(json)}
        }
    };
    canonical.metrics.Q01=metrics(canonical);

    // Q10
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = (values[i]===null)?null:Math.round(values[i]/Q);        
    });
    canonical.metrics.Q10=metrics(canonical);

    // Delta
    iM.deltaEncode(values);
    canonical.metrics.DLT=metrics(canonical);

    // Runlength
    values = iM.rlEncode(values);
    canonical.values = values;
    canonical.metrics.RL=metrics(canonical);

    saveDay(canonical);
}

function doADay(offset,maxoffset) {
    var day = new Date();
    day.setUTCDate(day.getUTCDate()-offset);
    // Month+1 Really ?
    var dayStr = _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
    var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
    var grain=1;
    var options = {
        host: '192.168.5.2',
        port: 80,
        //path: '/iMetrical/getJSONForDay.php?day='+d_d+'&table='+table
        path: '/iMetrical/getJSONForDay.php?offset='+offset+'&table='+table
    };
    console.log('--- fetch offset %d --- %s ---',offset,dayStr);
    http.get(options, function(res) {
        var responseBody = '';
        //console.log("Got response: " + res.statusCode);
        res.addListener('data', function(chunk) {
            responseBody += chunk;
        });
        res.addListener('end', function() {
            handleData(responseBody,grain,dayStr+'T00:00:00Z');
            if (offset<maxoffset-1){
                setTimeout(function(){doADay(offset+1,maxoffset);},1);
            }
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });

}

doADay(1,1080);
//doADay(366,731);
//doADay(731,1080);
//doADay(1,20);//doADay(1,10);//doADay(10,20);
