function utcs(d){
  if ('number'==typeof(d)){
    d = new Date(d);
  }
  return _.sprintf("%04d-%02d-%02d %02d:%02d:%02d",d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds());
}


var iMChartDate=new Date();
iMChartDate.setUTCDate(iMChartDate.getUTCDate()-1);
iMChartDate.setUTCHours(0);
iMChartDate.setUTCMinutes(0);
iMChartDate.setUTCSeconds(0);
iMChartDate.setUTCMilliseconds(0);

function getChart(whichChart,app){
  if (whichChart=='prev'){
    iMChartDate.setUTCDate(iMChartDate.getUTCDate()-1);
  } else if (whichChart=='next'){
    iMChartDate.setUTCDate(iMChartDate.getUTCDate()+1);
  }
  
  var dayStr = _.sprintf("%4d-%02d-%02d",iMChartDate.getUTCFullYear(),iMChartDate.getUTCMonth()+1,iMChartDate.getUTCDate());
  console.log('whichChart',whichChart,utcs(iMChartDate));
  //var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z/AC.json';
  //var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z/Delta.json';
  //var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z/RL.json';
  var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z';
  console.log('url',url);

  var doRL=false;
  $.getJSON(url, function(signal) {
    // rl decode
    if (doRL){
      var values = signal.values;
      signal.values = values = rlDecode(values);
      //if (true){console.log('+rl ',values.length,values.slice(0,100),values.slice(-5));}

      // Delta decode
      deltaDecode(signal.values);
      //if (true){console.log('+dlt ',values.length,values.slice(0,100),values.slice(-5));}

      // un Q
      for (var i=0;i<signal.values.length;i++){
        signal.values[i] = (signal.values[i]===null)?null:(signal.values[i]*signal.Q);        
      }
      signal.Q=1;
    }
    drawGraph(signal,dayStr);
  });  
}

globalG=null; // this is the last drawn graph! 
function zoomChart(){
  if (globalG){
    var g=globalG.date_graph;
    var xR = g.xAxisRange();
    console.log('-zoom:',utcs(xR[0]),utcs(xR[1]));
    var quarter=Math.round((xR[1]-xR[0])/4);
    if (quarter<5000) return; // notles than 10 seconds visible
    console.log('quarter:',quarter);
    console.log('+zoom:',utcs(xR[0]+quarter),utcs(xR[1]-quarter));    
    g.updateOptions({
      dateWindow: [xR[0]+quarter,xR[1]-quarter]
    });
  }
}


// 1-inverse the alt|shift->Pan -> alt|shift-> Zoom : so the default is panning
// 2- capture the mouseup for zomming callback !
var interactionModel = _.extend({},Dygraph.Interaction.defaultModel, {
  mousedown: function(event, g, context) {
    context.initializeMouseDown(event, g, context);
    if (event.altKey || event.shiftKey) {
      Dygraph.startZoom(event, g, context);
    } else {
      Dygraph.startPan(event, g, context);
    }
  },
  mouseup: function(event, g, context) {
    var wasPanning = context.isPanning; // context.isPanning will be reset by the default mouseup
    Dygraph.defaultInteractionModel.mouseup(event, g, context);
    if (g.dateWindow_ && wasPanning) {
      console.log('intercepted end pan:',utcs(g.dateWindow_[0]),utcs(g.dateWindow_[1]));
      console.log('current chart date: ',utcs(iMChartDate)); 
      
      if (g.dateWindow_[0]<iMChartDate.getTime()){
        // scroll back!
        $('#prev').click();
      } else  if (g.dateWindow_[1]>iMChartDate.getTime()+86400000){
        // scroll forward!
        $('#next').click();
      } 
    }
  },
});

function drawGraph(signal,dayStr){
  var T = signal.T;
  var values = signal.values;
  // safari bug - will not parse iso8601. 2011-07-01T23:45:32Z
  var parseable = signal.stamp.replace(/-/g,'/').replace("T",' ').replace('Z','');
  var stamp = new Date(parseable);
  
  var start = stamp.getTime();
  var data = {
    cols: [
    {id: 'date', label: 'Date', type: 'date'},
    {id: 'power', label: 'Signal', type: 'number'}],
    rows: [/*{c:[{v: new Date("2011/06/21")}, {v: 7}]},*/]
  };
  if (values && values.length>0){
    for (var i=0;i<values.length;i++){
      var value = values[i];
      if (/*value!==null &&*/ i%10==0) {
        data.rows.push({c:[{v: new Date(start+i*T*1000)}, {v: value}]});
      }
    }
  }
  var datatable = new google.visualization.DataTable(data,0.6);
  var options = {
    title: 'Power Consumtion for '+signal.stamp.substring(0,10),
    titleHeight: 32,
    logscale : false,
    showRoller: true,
    rollPeriod: 1,
    interactionModel: interactionModel
  };
  globalG=new Dygraph.GVizChart(document.getElementById('dygraph'));
  globalG.draw(datatable,options);
}


function drawHistoMap(histoMap,dayStr){
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Delta Value');
  data.addColumn('number', 'Count');
  //var histo=[[0,1000],[1,500],[3,100],[-1,200]];
  var histo=[];
  for (var sym=-500;sym<500;sym++){
    if (histoMap[sym]) histo.push([sym,histoMap[sym]]);
    if (sym==0){
      //do null
      if (histoMap[null]) histo.push(['null',histoMap[null]]);
    }
  }
  
  data.addRows(histo.length);
  for (var i = 0; i < histo.length ; i++) {
    data.setValue(i, 0, ""+histo[i][0]);
    data.setValue(i, 1, histo[i][1]);
  }
  //var g = new Dygraph.GVizChart(document.getElementById("dg_div"));
  //        g.draw(data, {displayAnnotations: true, labelsKMB: true});
  new google.visualization.ColumnChart(document.getElementById('visualization')).
              draw(data,
                   {title:"Histogram for Delta Encoding ("+dayStr+")",
                   legend:'none',
                    width:1024, height:400,
                    hAxis: {title: "Symbol"},
                    vAxis: {title: "Count", logScale:true}
              });
  if(1) new Dygraph.GVizChart(document.getElementById('dygraph')).draw(data, { logscale : true });
                
}

deltaDecode = function(values){
    // [x,y,z,a,b,c] -> [x,y+x,z+y]
    var previous=null;
    for (var i=0;i<values.length;i++){
        var d = values[i];
        var w = (d===null) ? null : ( (previous===null) ? d : (d+previous) );
        previous=w;
        values[i]=w;
    }
}
rlDecode = function(values,verbose){
    // [100,[2,0],x,y,..] -> [0,0,x,y,...] 
    var decoded = [];
    for (var r=0; r<values.length;r++){
      var v = values[r];
      if (Array.isArray(v)){
        for (var i=0;i<v[0];i++){
          decoded.push(v[1]);
        }
      } else if (v===null || 'number'==typeof(v)){
        decoded.push(v);
      } else {
        if (verbose) {
            console.log("Decoding %j(%s)",v,typeof(v));
        }
      }
    }
    return decoded;
}