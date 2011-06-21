var sys=require('sys');
var http=require('http');
var util=require('util');
require.paths.unshift('.')
var iM=require('iM');
var entropy=require('entropy');
var tf=require('sprintf-0.7-beta1');

if (true){
    var length=100;
    var mod3 = function(b){
        return b%3==0?1:0
    }
    var randUniform = function(b){
        return (Math.random()>.5)?1:0;
    }
    var randMoreOnes = function(b){
        return (Math.random()>.125)?1:0;
    }
    var mostlyOnes = function(length){
        var v=[];
        for (var b=0;b<length;b++){
            v.push( randMoreOnes(b));
        }
        return v;
    }
    
        
    if (false){

        var enc = new entropy.ArithmeticCoder();
        for (var b=0;b<length;b++){
            var bit = randMoreOnes(b);//randUniform(b);//mod3(b);
            enc.setBit(bit);
            console.log("enc: %d -> %s",bit,enc.toBitStream(false));
        }
        enc.setBitFlush();

        var encodedByteArray = enc.mFile.slice(0); 
        console.log("-------------------------------");
        console.log("encoded:  %s",enc.toBitStream());
        console.log("-------------------------------");
        var dec = new entropy.ArithmeticCoder(encodedByteArray);
        dec.setFile(encodedByteArray);
        for (var b=0;b<length;b++){
            var bit = dec.getBit();
            // === b%3==0?1:0
            console.log("dec: %d <- %s",bit,dec.toBitStream(true));
        }
    }
    
    if (true){
        // Binary Model - non adaptive
        var enc = new entropy.ArithmeticCoder();
        var genData = mostlyOnes(length);
        
        var mTotal = 1001; // 0,1,2==EOF
        var mCumCount = [125,875,1];
        for (var b=0;b<length;b++){
            var symbol = genData[b];
            var low_count=0;
            for (var j = 0; j < symbol; j++) {
                low_count += mCumCount[j];
            }
            //console.log("  mCumCount:%j mTotal:%j",mCumCount, mTotal);
            //console.log("encoded symbol:%d [%d,%d]/%d",symbol,low_count, low_count + mCumCount[symbol], mTotal);
            enc.encode(low_count, low_count + mCumCount[symbol], mTotal);
            // update model => adaptive encoding model
            //mCumCount[symbol]++;
            //mTotal++;        
        }
        // write escape symbol ($ in docs) for termination
        enc.encode(mTotal - 1, mTotal, mTotal);
        enc.encodeFinish();
        var encodedByteArray = enc.mFile.slice(0); 
        
        //console.log("encoded: %j",encodedByteArray);

        //process.exit(0);

        var dec = new entropy.ArithmeticCoder(encodedByteArray);
        dec.setFile(encodedByteArray);
        //console.log("decode start:  %s",dec.toBitStream(true));        
        //console.log(" -dec.mBuffer:  %s",dec.mBuffer.toString(2));        
        dec.decodeStart();
        //console.log(" +dec.mBuffer:  %s",dec.mBuffer.toString(2));  
        var recoveredData=[];
        while (true) {
            var value = dec.decodeTarget(mTotal);
            //console.log("decoded value: %d",value);


            var low_count=0;
            var symbol=0;
            // determine symbol
            for(symbol=0; low_count + mCumCount[symbol] <= value; symbol++ ) {
                low_count += mCumCount[symbol];
            }

            // Write symbol, if it was not terminator
            if (symbol < 2) {
                //mTarget.WriteByte((byte)symbol);
                //util.debug(tf.sprintf("decoded symbol: %d  (value=%d)",symbol,value));
                recoveredData.push(symbol);
            } else {
                //util.debug(tf.sprintf("decoded end-of-stream symbol (value=%d)",value));
                break;
            }

            //process.exit(0);
            // adapt decoder
            dec.decode( low_count, low_count + mCumCount[symbol] );
            // update model
            //mCumCount[symbol]++;
            //mTotal++;

        }
        //util.debug("decoded end-of-stream symbol");
    }
    console.log("------------------------------");
    console.log("orig   : %j",genData);
    console.log("decoded: %j",recoveredData);
    process.exit(0);
}
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
  var h = H(canonical.values)/8;
  var lbound = h*canonical.values.length/8;
  console.log(tf.sprintf("%22s %10s %8d %8d %7.2f %7.2f %7.2f %7.0f",startStr,name,canonical.values.length,canonicalJSON.length,ratio,bps,h,lbound));
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