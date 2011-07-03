google.load('visualization', '1', {packages: ['corechart']});

function create_page(page_id) {
    // make sure it does not exist already
    if ($("#"+page_id).length>0){
        $.log('skipping page: '+page_id+' already exists');
        return;
    } else {
        $.log('creating page: '+page_id);
    }
    var nupage = gen_page(page_id,'<h1>EkoForms!</h1>', 'Loading ' + page_id + ' text...<br><a href="#ekohome">return to home screen</a>');
    $('body').append(nupage.elt);   
    // do we call page() on 
    nupage.elt.page();

    $.log('done creating page: '+page_id);
    getQuest(page_id,function(quest){
        $.log('starting quest render');
    });
}

$.couch.app(function(app) {
  //$("#account").evently("account", app);
  //$("#profile").evently("profile", app);
  //$.evently.connect("#account","#profile", ["loggedIn","loggedOut"]);
  //$("#items").evently("items", app);
  $('#prev').live('click',function(){getChart('prev',app);});
  $('#next').live('click',function(){getChart('next',app);});
  $('#zoom').live('click',function(){zoomChart(app);});
  $('#chart').live('swipeleft', function (event, ui) {getChart('next',app); });
  $('#chart').live('swiperight', function (event, ui) {getChart('prev',app); });
  getChart('prev',app);
});

$(document).ready(function() {
  $.log("jQuery ready");
  $.template( 'pageTmpl', $('#pageTmpl') );
  $.template( 'footerTmpl', $('#footerTmpl') );
  $.template( 'navbarItmTmpl', $('#navbarItmTmpl') );

  $.template( 'homeTmpl', $('#homeTmpl') );

  $.tmpl( 'homeTmpl',null).appendTo('body');
  $.tmpl( 'pageTmpl', [
    { id : 'about', header:'About' },
    { id : 'metrics', header:'Metrics' },
    { id : 'favs', header:'Favorites' },
    { id : 'help', header:'Help' }  
  ]).appendTo( "body" );
  
  //events : 'tap taphold swipe swiperight swipeleft'
  $('#chart').live('swiperight swipeleft touchmove touchstart touchend', function (event, ui) {
    $('#log').html($('<div>'+JSON.stringify(event.type)+'</div>'));
  });

  
});

