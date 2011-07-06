function resample(values,T){// subsample by T
  var subsampled=[];
  for (var i=0;i<values.length;i+=T){
    var sum=null;
    for (var j=0;j<T;j++){
      if (values[i+j]!==null){
        if (sum===null){sum=0;}
        sum+=values[i+j];
      }
    }
    var avg = (sum===null)?null:Math.round(sum/T);
    subsampled.push(avg);
  }
  return subsampled;
}
function(doc) {
  if (doc.values && doc.values.length>0) {
    //var user = doc.id.split('.',1)[0];
    var valuesT600 = resample(doc.values,10);
    var signalT600 = {
      stamp : doc.stamp,
      T : 600,
      Q: 1,
      values : valuesT600,
    };
    emit(doc._id, signalT600);
  }
}