var sys=require('sys');
var util=require('util');
var _  = require('underscore');
_.mixin(require('underscore.string'));
require.paths.unshift('.');
var entropy=require('entropy');
_.mixin(require('underscore.rangeDo'));

var mod3 = function(b){
    return b%3==0?1:0
}
var randUniform = function(b){
    return (Math.random()>.5)?1:0;
}
var randMoreOnes = function(b){
    return (Math.random()>.001)?1:0;
}    

var length=33;
var enc = new entropy.ArithmeticCoder();

//for (var b=0;b<length;b++){
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

//for (var b=0;b<length;b++){
_.rangeDo(length,function(i){
    var bit = dec.getBit();
    // === b%3==0?1:0
    console.log("dec: %d <- %s",bit,dec.toBitStream(true));
});

