## iMetrical CouchApp

The data was pushed by `dirac:/Users/daniel/Documents/NetBeansProjects/iMetricalCouch`.
Actually pushed to imetricaltest on dirac and then replicated back to newton.
`
[More info about CouchApps here.](http://couchapp.org)

## Deploying this app
Credentials are in `~/.couchapp.conf`.

    couchapp push . imetrical

## Compact representation
    Raw           - doc/hour - 1741938786 bytes/7574 docs : 1.6G
    Canonical     - doc/day  -  263159906 bytes/365  docs : 251M ratio:  6.6
    Runlength     - doc/day  -  105803874 bytes/365  docs : 100M ratio: 16.4
    V10           - doc/day  -  100216930 bytes/365  docs :  95M ratio: 17.3
    V10+RL        - doc/day  -   38056034 bytes/365  docs :  36M ratio: 45.0
    V10+delta+RL  - doc/day  -   47861858 bytes/365  docs :  44M ratio: 36.0

## Measuring

Map

    function(doc) {
      if (doc._attachments)
      for (var k in doc._attachments) {
        emit(k, doc._attachments[k].length);
      } 
    }
    // or
    function(doc) {
      if (doc._attachments)
      for (var k in doc._attachments) {
        emit([k,"count"], 1);
        emit([k,"length"], doc._attachments[k].length);
      } 
    }

Reduce    

    function (key, values, rereduce) {
        return sum(values);
    }

## Mysql sources

    mysql> select min(stamp),max(stamp) from watt;
    +---------------------+---------------------+
    | 2008-07-30 00:04:40 | 2011-06-11 03:06:59 |
    +---------------------+---------------------+
    mysql> select min(stamp),max(stamp) from ted_service;
    +---------------------+---------------------+
    | 2008-11-14 23:18:13 | 2008-12-17 19:19:20 |
    +---------------------+---------------------+
    mysql> select min(stamp),max(stamp) from ted_native;
    +---------------------+---------------------+
    | 2008-12-17 19:37:16 | 2011-06-11 03:07:08 |
    +---------------------+---------------------+
