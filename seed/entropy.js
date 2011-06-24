/*
  http://www.bodden.de/legacy/arithmetic-coding/
  C# implementation by Sina Momken, adapted from
  Eric Bodden's C++ implemtation
*/
var _  = require('underscore');  //dependency for underscore.string
_.mixin(require('underscore.string')); // for toBitStream
var iM=require('iM');

// We export only the constructor after it is declared (at end of file)
// Constructor
var ArithmeticCoder = function() {
  this.mFile = [];    
  this.mBitBuffer = 0;
  this.mBitCount = 0;

  this.mLow = 0;
  this.mHigh = 0x7FFFFFFF; // just work with least significant 31 bits
  this.mScale = 0;
  this.mStep = 0;

  this.mBuffer = 0;
}

// properties and methods
ArithmeticCoder.prototype = {
    // Constants
    g_FirstQuarter : 0x20000000,
    g_Half : 0x40000000,
    g_ThirdQuarter : 0x60000000,
    /*
    protected byte mBitBuffer;
    protected byte mBitCount;
    protected FileStream mFile;
    protected uint mLow;
    protected uint mHigh;
    protected uint mStep;
    protected uint mScale;
    protected uint mBuffer;    
    */
    setFile: function(byteArray) {
        this.mFile = byteArray;
    },
    encode: function(low_count, high_count, total) {
        // total < 2^29
        // partition number space into single steps
        this.mStep = Math.floor((this.mHigh - this.mLow + 1) / total); // interval open at the top => +1
        // update upper bound
        this.mHigh = this.mLow + this.mStep * high_count - 1; // interval open at the top => -1
        // update lower bound
        this.mLow = this.mLow + this.mStep * low_count;
        // Output and Expand, Subdivide in ModelOrder0.Encode
        while ((this.mHigh < this.g_Half) || (this.mLow >= this.g_Half)) {
            if (this.mHigh < this.g_Half) {
                this.setBit(0);
                this.mLow = this.mLow * 2;
                this.mHigh = this.mHigh * 2 + 1;
                // Reseting recalls set by follow actions
                for (; this.mScale > 0; this.mScale--) {
                    this.setBit(1);
                }
            } else if(this.mLow >= this.g_Half){
                this.setBit(1);
                this.mLow = (this.mLow - this.g_Half) * 2;
                this.mHigh = (this.mHigh - this.g_Half) * 2 + 1;

                // Reseting recalls set by follow actions
                for (; this.mScale > 0; this.mScale--){
                    this.setBit(0);
                }
            }
        }
        // Set an recall to be applied later
        while ( (this.g_FirstQuarter <= this.mLow) && (this.mHigh < this.g_ThirdQuarter) ) {
            // keep necessary mappings in mind
            this.mScale++;
            this.mLow = (this.mLow - this.g_FirstQuarter) * 2;
            this.mHigh = (this.mHigh - this.g_FirstQuarter) * 2 + 1;
        }
    },
    encodeFinish: function() {
        // There are two possibilities of how mLow and mHigh can be distributed,
        // which means that two bits are enough to distinguish them.
        if (this.mLow < this.g_FirstQuarter) { // mLow < FirstQuarter < Half <= mHigh
            this.setBit(0);
            for (var i = 0; i < this.mScale + 1; i++) // Reseting recalls in mind
                this.setBit(1);
        } else { // mLow < Half < ThirdQuarter <= mHigh
            this.setBit(1); // zeros added automatically by the decoder; no need to send them
        }
        // empty the output buffer
        this.setBitFlush();
    },
    decodeStart: function() {
        // empty the output buffer
        for (var i = 0; i < 31; i++) { // just use the 31 least significant bits
            this.mBuffer = (this.mBuffer << 1) | this.getBit();
        }
    },
    // convenience for decodeTarget+decode
    decodeSymbol: function(total,mCumCount){
        // get value
        var value = this.decodeTarget(total);
        var low_count=0;
        var symbol=0;
        // determine symbol
        var zz=0;
        for(symbol=0; (zz = low_count + mCumCount[symbol]) <= value; symbol++ ) {
            //low_count += mCumCount[symbol];
            low_count = zz;
        }
        // adapt decoder
        this.decode( low_count, low_count + mCumCount[symbol] );
        return symbol;
    },
    // converts raw stored data to original value
    decodeTarget: function(total) {// total < 2^29
        //console.log("decodeTarget: %j",[this.mStep,this.mLow,this.mHigh,total,this.mBuffer]);
        // split number space into single steps
        this.mStep = Math.floor((this.mHigh - this.mLow + 1) / total);
        // return current value
        return Math.floor((this.mBuffer - this.mLow) / this.mStep);
    },
    decode: function(low_count, high_count){
        //console.log("-decode: %j",[low_count,high_count,this.mStep,this.mLow,this.mHigh,this.mBuffer]);
        // update upper bound
        //console.log("-decode:update Hi %j",[this.mHigh, this.mLow + high_count * this.mStep - 1]);
        this.mHigh = this.mLow + high_count * this.mStep - 1;

        // update lower bound
        //console.log("-decode:update Lo %j",[this.mLow , this.mLow + low_count * this.mStep]);
        this.mLow = this.mLow + low_count * this.mStep;

        // Output and Expand, Subdivide in ModelOrder0.Decode, to get synced with Encoder
        while ((this.mHigh < this.g_Half) || (this.mLow >= this.g_Half)) {
            if (this.mHigh < this.g_Half) {
                this.mLow = this.mLow * 2;
                this.mHigh = this.mHigh * 2 + 1;
                this.mBuffer = this.mBuffer * 2 + this.getBit();
            } else if (this.mLow >= this.g_Half) {
                this.mLow = (this.mLow - this.g_Half) * 2;
                this.mHigh = (this.mHigh - this.g_Half) * 2 + 1;
                this.mBuffer = (this.mBuffer - this.g_Half) * 2 + this.getBit();
            }
            this.mScale = 0;
        }

        // Set an recall to be applied later
        while ((this.g_FirstQuarter <= this.mLow) && (this.mHigh < this.g_ThirdQuarter)) {
            this.mScale++;
            this.mLow = (this.mLow - this.g_FirstQuarter) * 2;
            this.mHigh = (this.mHigh - this.g_FirstQuarter) * 2 + 1;
            this.mBuffer = (this.mBuffer - this.g_FirstQuarter) * 2 + this.getBit();
        }
        //console.log("+decode: %j",[low_count,high_count,this.mStep,this.mLow,this.mHigh,this.mBuffer]);
    },
    setBit: function(bit) {
        // add bit to the buffer
        this.mBitBuffer = ( (this.mBitBuffer << 1) | bit );
        this.mBitCount++;
        if (this.mBitCount == 8) {// buffer full
            // write
            this.mFile.push(this.mBitBuffer);
            this.mBitBuffer=0;
            this.mBitCount = 0;
        }        
    },
    setBitFlush: function(){
        // fill buffer with 0 up to the next byte
        while (this.mBitCount != 0) {
            this.setBit(0);
        }
    },
    getBit: function(){
        if ( this.mBitCount == 0) { // buffer empty
            var readInt =  this.mFile.shift(); // not pop() as one might think!
            if (readInt === undefined) { // EOF = Is file read completely?
                this.mBitBuffer = 0;
            } else{
                this.mBitBuffer = readInt; // append zeros
            }
            this.mBitCount = 8;
        }
        // extract bit from buffer (always read high bit...)
        var bit = this.mBitBuffer >>> 7;
        //console.log("got bit: %d",bit);
        this.mBitBuffer = ( this.mBitBuffer << 1 ) & 0xff;
        this.mBitCount--;

        return bit;
    },
    toBitStream : function(isReading){
        var bits =[];
        for (var i=0;i<this.mFile.length;i++){
            bits.push(_.sprintf("%08b",this.mFile[i]));
        }
        if (this.mBitCount>0){
            var fmt = '%0'+this.mBitCount+'b';
            if (isReading){
                bits.unshift(_.sprintf(fmt,this.mBitBuffer>>(8-this.mBitCount)));
            } else {
                bits.push(_.sprintf(fmt,this.mBitBuffer));
            }
        }
        return bits.join(' ');
    }
};

exports.H = function(values){
    histo={};
    iM.rangeStepDo(0,values.length,1,function(i){
        v = values[i];
        if (histo[v]===undefined) histo[v]=0;
        (histo[v]++);
    });
    return this.Hhisto(histo);
}
exports.Hhisto = function(histo){
    var total=0;
    for (var h in histo) { 
        total+=histo[h];
    }
    var summplogp=0;
    for (var k in histo) { 
        if (histo[k]>0){
            var p = histo[k]*1.0/total;
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

var myIsFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
};

// there are three dependancies on _underscore reduce,isFunction and transitively my rangeDo  
exports.myEncoder=function(functionOrArray,histo,length){
    var enc = new this.ArithmeticCoder();
    //var mTotal = _.reduce(histo, function(sum, v){ return sum + v; }, 0);
    var mTotal = 0;
    for (var h=0;h<histo.length;h++){
        mTotal += histo[h];
    }
    var mCumCount = histo.slice(0);
    
    var getSymbol = function(b){
        //var symbol = (_.isFunction(functionOrArray)) ? functionOrArray(b) : functionOrArray[b];
        var symbol = (myIsFunction(functionOrArray)) ? functionOrArray(b) : functionOrArray[b];
        return symbol;
    }
    var encodeOneSymbol = function(b) {
        var symbol = getSymbol(b);
        var low_count=0;
        for (var j = 0; j < symbol; j++) {
            low_count += mCumCount[j];
        }
        enc.encode(low_count, low_count + mCumCount[symbol], mTotal);
        // update model => adaptive encoding model
        //mCumCount[symbol]++;
        //mTotal++;        
    }
    
    // this is a dependancy on _underscore
    //_.rangeDo(length,encodeOneSymbol);
    for (var b=0;b<length;b++){
        encodeOneSymbol(b);
    }
    
    // write end-of-stream-symbol (mTotal-1)
    // This is not quite right... assumes too much
    enc.encode(mTotal - 1, mTotal, mTotal);
    enc.encodeFinish();
    var encodedByteArray = enc.mFile.slice(0); 
    
    return encodedByteArray;
}

// there is one dependancies on _underscore: _.reduce
exports.myDecoder = function(encodedByteArray,histo){
    var dec = new this.ArithmeticCoder(encodedByteArray);
    dec.setFile(encodedByteArray.slice(0));
    dec.decodeStart();
    //console.log(" +dec.mBuffer:  %s",dec.mBuffer.toString(2));  
    var recoveredData=[];

    //var mTotal = _.reduce(histo, function(sum, v){ return sum + v; }, 0);
    var mTotal = 0;
    for (var h=0;h<histo.length;h++){
        mTotal += histo[h];
    }
    var mCumCount = histo.slice(0);
    
    while (true) {
        //if (recoveredData.length%10000==0) console.log("       ---------------------",recoveredData.length);
        // get next symbol:
        var symbol = dec.decodeSymbol(mTotal,mCumCount);
        // Write symbol, if it was not terminator
        if (symbol < mCumCount.length-1) {
            //mTarget.WriteByte((byte)symbol);
            recoveredData.push(symbol);
        } else {
            break;
        }
        // update model
        //mCumCount[symbol]++;
        //mTotal++;

    }
    return recoveredData;
    
}

// require export
exports.ArithmeticCoder = ArithmeticCoder;

