function(head, req) {
  // workinh\g through examples in sofa...
  var ddoc = this;
  var List = require("vendor/couchapp/lib/list");
  var path = require("vendor/couchapp/lib/path").init(req);

  var tzpathPath = path.list('timezone','power',{descending:true, limit:30, format:'json'});

  provides("json", function() {
    var str = JSON.stringify([head,tzpathPath]);
    return str+'\ncoco as json\n'; 
  });
}