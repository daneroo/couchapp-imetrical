var cradle = require('cradle');

var db = new(cradle.Connection)().database('imetrical');
// http://daniel:pokpok@127.0.0.1:5984/imetrical
var connection = new(cradle.Connection)('http://127.0.0.1', 5984, {
    auth: { username: 'daniel', password: 'pokpok' }
});
var db = connection.database('imetrical');

function _report(name,err,rsp){
    if (err) {
        console.log('%s err: %j',name,err);
    } else {
        console.log('%s: %j',name,rsp);
    }
}
function report(name,then){
     return function(err,rsp){
         _report(name,err,rsp);
         if (then) then();
     };
}

function createSaveAndGet(){
    db.create(function(err,rsp){
        report('create')(err,rsp);
        if (0) db.save('coco', {
            name: 'coco',
            role: 'kiki',
            stamp: new Date()
        },function(err,rsp){
            report('save')(err,rsp);
            db.saveAttachment( 
                rsp.id, 
                rsp.rev, 
                'my.json',
                'application/json', 
                JSON.stringify({some:'stuff',to:'attach'}),
                function( err, rsp ){
                    report('saveAttachment')(err,rsp);
                    if (err) return;
                    db.get('coco',report('one'));
                    db.all(report('all'));            
                }
            );
        });
    });
}

db.exists(function(err,exists){
    report('exists')(err,exists);
    if (err) return;
    if (exists){
        db.destroy(function(err,rsp){
            report('destroy')(err,rsp);
            if (err) return;
            createSaveAndGet();
        });
    } else {
        createSaveAndGet();
    }
});

