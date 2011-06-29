var iMChartDate=new Date();
iMChartDate.setUTCDate(iMChartDate.getUTCDate()-1);

function getChart(whichChart,app){
  if (whichChart=='prev'){
    iMChartDate.setUTCDate(iMChartDate.getUTCDate()-1);
  } else if (whichChart=='next'){
    iMChartDate.setUTCDate(iMChartDate.getUTCDate()+1);
  }
  
  var dayStr = _.sprintf("%4d-%02d-%02d",iMChartDate.getUTCFullYear(),iMChartDate.getUTCMonth()+1,iMChartDate.getUTCDate());
  console.log('whichChart',whichChart,iMChartDate);
  //var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z/AC.json';
  var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z/Delta.json';
  console.log('url',dayStr,url);


  $.getJSON(url, function(data) {
    //console.log(data.ac.histo);
    //var histoMap = data.ac.histo;
    //drawHistoMap(histoMap,dayStr);
    drawGraph(data,dayStr);
  });
  
}

var oldEndPan=null;
var oldMovePan=null;
function interceptPan(){
  console.log('intercepting Pan');
  if (oldEndPan===null){
    //oldPan = Dygraph.Interaction.endPan;
    oldEndPan = Dygraph.endPan;
    Dygraph.endPan = function(event, g, context) {
      //console.log('intercepted end pan',context);
      //console.log('intercepted end pan',JSON.stringify(context));
      oldEndPan(event,g,context);
      console.log('intercepted end pan',new Date(g.dateWindow_[0]),new Date(g.dateWindow_[1]));
    }
    oldMovePanPan = Dygraph.movePan;
    Dygraph.movePan = function(event, g, context) {
      //console.log('intercepted move pan',context);
      //console.log('intercepted move pan',JSON.stringify(context));
      oldMovePanPan(event,g,context);
      console.log('intercepted move pan',new Date(g.dateWindow_[0]),new Date(g.dateWindow_[1]));
    }
  }
}
function drawGraph(delta,dayStr){
  interceptPan();
  values = delta.values;
  var stamp = new Date(delta.stamp);
  var start = stamp.getTime();
  console.log(dayStr,stamp,start,new Date(start),delta.values.length);
  var data = {
    cols: [
    {id: 'date', label: 'Date', type: 'date'},
    {id: 'power', label: 'Delta', type: 'number'}],
    rows: [/*{c:[{v: new Date("2011/06/21")}, {v: 7}]},*/]
  };
  if (values && values.length>0){
    var prev=null;
    for (var i=0;i<values.length;i++){
      var value=values[i];      
      if (prev!=null && value !=null) {
        value+=prev;
      }
      prev=value;
      if (value!=null && i%60==0) {
        data.rows.push({c:[{v: new Date(start+i*1000)}, {v: value}]});
      }
    }
  }
  var datatable = new google.visualization.DataTable(data,0.6);
  new Dygraph.GVizChart(document.getElementById('dygraph')).draw(datatable, { logscale : true });
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
