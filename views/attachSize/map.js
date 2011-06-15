function(doc) {
  if (doc._attachments)
  for (var k in doc._attachments) {
    emit([k,"count"], 1);
    emit([k,"length"], doc._attachments[k].length);
  } 
}