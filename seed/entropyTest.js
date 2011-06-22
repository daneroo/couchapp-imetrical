var sys=require('sys');
var util=require('util');
var _  = require('underscore');
_.mixin(require('underscore.string'));

require.paths.unshift('.')
var iM=require('iM');
var entropy=require('entropy');

var mod3 = function(b){
    return b%3==0?1:0
}
var randUniform = function(b){
    return (Math.random()>.5)?1:0;
}
var randMoreOnes = function(b){
    return (Math.random()>.001)?1:0;
}    

if (true){
    var length=100000;
    // Binary Model - non adaptive
    var methods={'mod3':mod3,'randUniform':randUniform,'randMoreOnes':randMoreOnes};
    var histos=[[66667,33333,1],[50000,50000,1],[100,99900,1]];
    for (var m in methods){
        // Generate Data
        var genData = [];
        for (var b=0;b<length;b++){
            genData.push(methods[m](b));
        }
        var obeservedEntropyBps = entropy.H(genData);
        genData=[];
        
        for (var h in histos){
            var mTotal = 0; // 0,1,2==EOF
            var mCumCount = histos[h].slice(0);
            for (var s=0;s<mCumCount.length;s++){
                mTotal+=mCumCount[s];
            }
            //console.log("------------------------------");
            //console.log(" Code Source: %s using Model: %j, total:%d",m,mCumCount,mTotal);

            //Encoding
            var enc = new entropy.ArithmeticCoder();

            for (var b=0;b<length;b++){
                var symbol = methods[m](b);//genData[b];
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

            // Decoding
            var dec = new entropy.ArithmeticCoder(encodedByteArray);
            dec.setFile(encodedByteArray.slice(0));
            dec.decodeStart();
            //console.log(" +dec.mBuffer:  %s",dec.mBuffer.toString(2));  
            var recoveredData=[];
            while (true) {
                //if (recoveredData.length%10000==0) console.log("       ---------------------",recoveredData.length);
                var symbol = dec.decodeSymbol(mTotal,mCumCount);

                // Write symbol, if it was not terminator
                if (symbol < 2) {
                    //mTarget.WriteByte((byte)symbol);
                    recoveredData.push(symbol);
                } else {
                    break;
                }
                // update model
                //mCumCount[symbol]++;
                //mTotal++;

            }
            //util.debug("decoded end-of-stream symbol");
            //console.log("orig   : %j ...",genData.slice(0,30));
            //console.log("decoded: %j ...",recoveredData.slice(0,30));
            //console.log("encoded: %j ...",encodedByteArray.slice(0,20));    
            console.log(
                _.sprintf("compression: %5.2f:1 bits/s: %.4f >= %.4f = H   Source: %15s, Model: %s total:%d",
                length/8/encodedByteArray.length,
                encodedByteArray.length*8.0/length,
                obeservedEntropyBps,
                m,
                JSON.stringify(mCumCount),
                mTotal
            ));
        }
    }
    //console.log("------------------------------");

}



