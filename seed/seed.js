var sys=require('sys');
var http=require('http');

console.log("Hello couch");
sys.puts("iMetrical")

var baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
var table="watt"; // watt,watt_tensec,watt_minute,watt_hour
var grain=1

var options = {
//	uri:baseURI+"?day="+d_d+"&table="+table
	uri:baseURI+"?offset="+1+"&table="+table
//  host: 'www.google.com',
//  port: 80,
//  path: '/index.html'
};

http.get(options, function(res) {
  console.log("Got response: " + res.statusCode);
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});