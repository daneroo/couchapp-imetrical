
function couchapp_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script src="'+scripts[i]+'"><\/script>')
  };
};

couchapp_load([
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
  "/_utils/script/jquery.js",
  "/_utils/script/jquery.couch.js",
  "vendor/couchapp/jquery.couch.app.js",
  "vendor/couchapp/jquery.couch.app.util.js",
  "vendor/couchapp/jquery.mustache.js",
  "vendor/couchapp/jquery.evently.js",
  "http://www.google.com/jsapi",
  "http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.6/underscore-min.js",
  "http://cdnjs.cloudflare.com/ajax/libs/underscore.string/1.1.4/underscore.string.min.js",
  //"http://dygraphs.com/dygraph-combined.js", //http://dygraphs.com/
  "http://dygraphs.com/dygraph-dev.js",
  "js/imetrical.js"
]);
