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
  var url = app.db.uri+'daniel.'+dayStr+'T00:00:00Z/AC.json';
  console.log('url',dayStr,url);


  $.getJSON(url, function(data) {
    console.log(data.ac.histo);
    var histoMap = data.ac.histo;
    drawHistoMap(histoMap,dayStr);
  });
  
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
  if(0) new Dygraph.GVizChart(document.getElementById('dygraph')).draw(data, { logscale : true });
                
}
