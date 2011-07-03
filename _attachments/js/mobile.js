$.log = function(m) {
    if (window && window.console && window.console.log) {
        window.console.log(arguments.length == 1 ? m : arguments);
    }
};

$(document).bind("mobileinit", function(){
    $.log("mobileinit");

    /*
    $('#notexist').live('pagebeforecreate',function(event){
        $.log('This page was just inserted into the dom!');
    });
    $('#minisite-step1').live('pagecreate',function(event){
        $.log('This page was just enhanced by jQuery Mobile!');
    });
    */
});
