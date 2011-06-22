var sys=require('sys');
var util=require('util');
var _  = require('underscore');
_.mixin(require('underscore.string'));
// move this to entropy
_.mixin({
  rangeDo :   function(start, stop, step, iterator, context) {
      // rangeDo([start],stop,[step],iterator,[context])
      arguments = _.toArray(arguments);
      if (!_.detect(arguments,_.isFunction)) return;
      if (_.isFunction(_.last(arguments))){
          iterator=arguments.pop();
          context=undefined;
      } else {
          context=arguments.pop();
          iterator=arguments.pop();
      }
      if (arguments.length <= 1) {
          stop = start || 0;
          start = 0;
      }
      step = arguments[2] || 1;
      for (var i = start; i < stop; i+=step) {
          iterator.call(context, i);
      }
      return context;
  }
});

require.paths.unshift('.');
var entropy=require('entropy');
var tf=require('sprintf-0.7-beta1');

if (false){
    var cb=function(i){ console.log('iteration: %d',i);};
    var cbc=function(i){ this.msg+="+"; console.log('iteration: %d : %s',i,this.msg);};
    _.rangeDo(0,5,2);
    _.rangeDo(0,5,2,cb);
    _.rangeDo(5,2,cb);
    _.rangeDo(5,cb);
    _.rangeDo(0,5,2,cbc,{msg:"ctx"});
    _.rangeDo(5,2,cbc,{msg:"ctx"});
    _.rangeDo(5,cbc,{msg:"ctx"});
    r = _.rangeDo(5,cbc,{msg:"ctx"});
    console.log('out: %j',r);
    process.exit(0);
}
var mod3 = function(b){
    return b%3==0?1:0
}
var randUniform = function(b){
    return (Math.random()>.5)?1:0;
}
var randMoreOnes = function(b){
    return (Math.random()>.001)?1:0;
}    

if (false){
    var length=33;
    var enc = new entropy.ArithmeticCoder();
    _.rangeDo(length,function(b){
        var bit = randUniform(b);//randUniform(b);//mod3(b);
        enc.setBit(bit);
        console.log("enc: %d -> %s",bit,enc.toBitStream(false));
    });
    enc.setBitFlush();

    var encodedByteArray = enc.mFile.slice(0); 
    console.log("-------------------------------");
    console.log("encoded:  %s",enc.toBitStream());
    console.log("-------------------------------");
    var dec = new entropy.ArithmeticCoder(encodedByteArray);
    dec.setFile(encodedByteArray);
    _.rangeDo(length,function(i){
        var bit = dec.getBit();
        // === b%3==0?1:0
        console.log("dec: %d <- %s",bit,dec.toBitStream(true));
    });
}

if (true){
    var length=100000;
    // Binary Model - non adaptive
    var methods={'mod3':mod3,'randUniform':randUniform,'randMoreOnes':randMoreOnes};
    var histos=[[66667,33333,1],[50000,50000,1],[100,99900,1]];
    _(methods).each(function(method,m){
        _(histos).each(function(histo,h){
            var mTotal = _.reduce(histo, function(sum, v){ return sum + v; }, 0);
            var mCumCount = histo.slice(0);
            //console.log(" Code Source: %s using Model: %j, total:%d",m,histo,mTotal);

            var genData = [];
            _.rangeDo(length,function(b){
                genData.push(method(b));
            });

            var obeservedEntropyBps = entropy.H(genData);

            //Encoding
            var enc = new entropy.ArithmeticCoder();

            _.each(genData,function(symbol){
                var low_count=0;
                for (var j = 0; j < symbol; j++) {
                    low_count += mCumCount[j];
                }
                enc.encode(low_count, low_count + mCumCount[symbol], mTotal);
                // update model => adaptive encoding model
                //mCumCount[symbol]++;
                //mTotal++;        
            });
            // write escape symbol ($ in docs) for termination
            enc.encode(mTotal - 1, mTotal, mTotal);
            enc.encodeFinish();
            var encodedByteArray = enc.mFile.slice(0); 

            // Decoding
            var dec = new entropy.ArithmeticCoder(encodedByteArray);
            dec.setFile(encodedByteArray.slice(0));
            dec.decodeStart();
            //console.log(" +dec.mBuffer:  %s",dec.mBuffer.toString(2));  
            var recoveredData=[];
            while (true) {
                //if (recoveredData.length%10000==0) console.log("       ---------------------");
                
                // get value
                var value = dec.decodeTarget(mTotal);
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
                // adapt decoder
                dec.decode( low_count, low_count + mCumCount[symbol] );
                // update model
                //mCumCount[symbol]++;
                //mTotal++;

            }
            //util.debug("decoded end-of-stream symbol");
            //console.log("orig   : %j ...",genData.slice(0,30));
            //console.log("decoded: %j ...",recoveredData.slice(0,30));
            //console.log("encoded: %j ...",encodedByteArray.slice(0,20));    
            console.log(
                tf.sprintf("compression: %5.2f:1 bits/s: %.4f >= %.4f = H   Source: %15s, Model: %s total:%d",
                length/8/encodedByteArray.length,
                encodedByteArray.length*8.0/length,
                obeservedEntropyBps,
                m,
                JSON.stringify(mCumCount),
                mTotal
            ));
        });
    });
    console.log("------------------------------");

}



