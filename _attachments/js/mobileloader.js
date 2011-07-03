//http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js

function dashboard_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script type="text/javascript" src="'+scripts[i]+'"><\/script>')
  };
};

/* TODO 
  find the base url for all local script... abolute / for now
  use protocol relative urls for 'local' scripts
  http://paulirish.com/2010/the-protocol-relative-url/
*/  
dashboard_load([
  // json2
  "http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.js",

  // jquery - jquery mobile
  "http://code.jquery.com/jquery-1.5.min.js",
  "js/mobile.js", // before mobile, for mobileinit
  "http://code.jquery.com/mobile/1.0b1/jquery.mobile-1.0b1.min.js",

  // couchapp basics
  "/_utils/script/jquery.couch.js",
  "vendor/couchapp/jquery.couch.app.js",
  "vendor/couchapp/jquery.couch.app.util.js",

  // jQ Templates
  "http://ajax.aspnetcdn.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js",

  // _underscore.js
  "http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.1.6/underscore-min.js",
  "http://cdnjs.cloudflare.com/ajax/libs/underscore.string/1.1.4/underscore.string.min.js",

  // google visualisation
  "http://www.google.com/jsapi",
  //"http://dygraphs.com/dygraph-combined.js", //http://dygraphs.com/
  "http://dygraphs.com/dygraph-dev.js",
  
  "js/imetrical.js",
  "js/couchmobile.js"
  ]);
