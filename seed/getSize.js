/*
  This uses http.response to get the actual transport size of a json request,
  as a standing for size on disk. It uses compression headers.

  URL='http://imetrical.couchone.com/imetrical/daniel.2011-05-29T00%3A00%3A00Z/Delta.json'
  URL='http://127.0.0.1:5984/imetrical/daniel.2011-05-29T00%3A00%3A00Z/Delta.json'
  curl -s -o /dev/null --write-out "size=%{size_download}\n" $URL
  # size=185513
  curl -s -o /dev/null -H "Accept-Encoding: gzip,deflate" --write-out "size=%{size_download}\n" $URL
  # size=15687
  curl -s -o /dev/null -0 -H "Accept-Encoding: gzip,deflate" --write-out "size=%{size_download}\n" $URL
  # size=15687
*/
var http=require('http');
var _  = require('underscore');
_.mixin(require('underscore.string'));
require.paths.unshift('.')

function getSize(key,attach,useCompressed,cb){
  var path = key;
  if (attach){
    path+='/'+attach;
  }
  var options = {
      host: 'localhost',
      port: 5984,
      path: '/imetrical/'+path,
      method:'HEAD',
      headers:{
      }
  };
  if (useCompressed){
    options.headers["Accept-Encoding"]= "gzip,deflate";    
  }
  var req = http.request(options, function(res) {
      //console.log("http: content-length %j " ,res.headers["content-length"]);
      var size = res.headers["content-length"];
      if (cb) {
        cb(size);
      }
  }).on('error', function(e) {
      console.log("Got error: " + e.message);
  });
  req.end();
}
function doADay(offset,maxoffset) {
    var day = new Date();
    day.setUTCDate(day.getUTCDate()-offset);
    // Month+1 Really ?
    var dayStr = _.sprintf("%4d-%02d-%02d",day.getUTCFullYear(),day.getUTCMonth()+1,day.getUTCDate());
    //console.log('--- fetch offset %d --- %s ---<< %d',offset,dayStr,maxoffset);

    var stampStr = dayStr+'T00:00:00Z';
    var key =  _.sprintf("daniel.%s",stampStr);
    var attach = "RL.json";
    var sizes = {};
    getSize(key,attach,false,function(size){
      sizes.uncompressed=size;
      getSize(key,attach,true,function(size){
        sizes.compressed=size;
        console.log("%s sizes: %j",dayStr,sizes);
        if (offset<maxoffset-1){
          setTimeout(function(){doADay(offset+1,maxoffset);},0);        
        }
      });
    });
    
}

doADay(1,1080);
//doADay(1,20);//doADay(1,10);//doADay(10,20);
