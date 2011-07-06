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
var saveDay = function(signalT60,signalRL){
    var db = new(cradle.Connection)().database('imetrical');
    var key =  _.sprintf("daniel.%s",signalT60.stamp);
    /*var RL = {
        stamp : signal.stamp,
        T : signal.T,
        Q: signal.Q,
        values : signal.values,
    };*/
    // remove values from canonical
    db.save(key, signalT60,function(err,rsp){
        console.log('saved %j',[err,rsp]);
        db.saveAttachment( 
            rsp.id, 
            rsp.rev, 
            'RL.json',
            'application/json', 
            JSON.stringify(signalRL),
            function( err, rsp ){
                console.log('saveAttachment %j',[err,rsp]);
                if (err) return;
            }
        );
    });
}

function resample(values,T){// subsample by T
  var subsampled=[];
  for (var i=0;i<values.length;i+=T){
    var sum=null;
    for (var j=0;j<T;j++){
      if (values[i+j]!==null){
        if (sum===null){sum=0;}
        sum+=values[i+j];
      }
    }
    var avg = (sum===null)?null:Math.round(sum/T);
    subsampled.push(avg);
  }
  return subsampled;
}

function metrics(signal){
  return {size:JSON.stringify(signal).length, sha1sum:sha1sum(signal.values)};
}

var processRawDay = function(json,T,startStr){
    //console.log('json:'+json);
    var data = JSON.parse(json);
        
    console.log(_.sprintf("%22s %10s %8s %8s %7s %7s %7s %7s %7s",'date','method','samples','size','ratio','Bps','H(x)','<bound','<ac+h'));
    console.log(_.sprintf("%22s %10s %8d %8d %7.2f %7.2f",startStr,'raw',data.length,json.length,1.0,json.length/86400/T));
    var values = iM.rawToCanonical(json,startStr,T,false);
    var signal = {
        stamp : startStr,
        T : T,
        Q: 10,
        values : values
    };
    var valuesT60 = resample(values,60);
    var signalT60 = {
        stamp : startStr,
        T : 60,
        Q: 1,
        values : valuesT60,
        metrics:{
          raw:{size:json.length,sha1sum:sha1sum(json)}
        }
    };
    
    signalT60.metrics.Q01=metrics(signal);

    // Q10
    var Q = 10; // value quantization
    iM.rangeStepDo(0,values.length,1,function(i){
        values[i] = (values[i]===null)?null:Math.round(values[i]/Q);        
    });
    signalT60.metrics.Q10=metrics(signal);

    // Delta
    iM.deltaEncode(values);
    signalT60.metrics.DLT=metrics(signal);

    // Runlength
    values = iM.rlEncode(values);
    signal.values = values;
    
    signalT60.metrics.RL=metrics(signal);

    saveDay(signalT60,signal);
}

function doADay(offset,maxoffset) {
    var day = new Date();
    day.setUTCDate(day.getUTCDate()-offset);
    // Month+1 Really ?
    var dayStr = _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
    var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
    var T=1;
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
            processRawDay(responseBody,T,dayStr+'T00:00:00Z');
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
