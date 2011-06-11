## iMetrical CouchApp

The data was pushed by `dirac:/Users/daniel/Documents/NetBeansProjects/iMetricalCouch`.
Actually pushed to imetricaltest on dirac and then replicated back to newton.
`
[More info about CouchApps here.](http://couchapp.org)

## Deploying this app
Credentials are in `~/.couchapp.conf`.

    couchapp push . imetrical

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
