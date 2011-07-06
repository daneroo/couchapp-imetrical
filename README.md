## iMetrical CouchApp

The data was pushed by `dirac:/Users/daniel/Documents/NetBeansProjects/iMetricalCouch`.
Actually pushed to imetricaltest on dirac and then replicated back to newton.
`
[More info about CouchApps here.](http://couchapp.org)

## Deploying this app
Credentials are in `~/.couchapp.conf`.

    couchapp push . imetrical

## Handling timezones from a list function
This is the begining of a list function:

    curl 'http://127.0.0.1:5984/imetrical/_design/couchapp-imetrical/_list/timezone/power'

## Entropy Coding - Compact representation
    Raw              1741938786 : 1.6G ratio:  1.0
    Canonical         263159906 : 251M ratio:  6.6
    Runlength         105803874 : 100M ratio: 16.4
    V10               100216930 :  95M ratio: 17.3
    V10+RL             38056034 :  36M ratio: 45.0
    V10+delta+RL       47861858 :  44M ratio: 36.0
    --attachments Gzip Compreession on disk not on reported size
    --so two numbers are disk/reported size
    V10+RL+atach       10100834/46217380:  9.6M ratio: 172.0/37.0
    V10+RL+D-atach      6971490/39558963:  6.6M ratio: 249.9/44
    V10P3+RL+D-atach    6869090/35845778:  6.6M ratio: 253.6/48.6
    -- whole history 1050 Documents 
    V10P3+RL+D-atach    21,151,842/112,471,842:  20.6M ratio: 253.6/48.6
    -- with node.js
    D10-atach           6942818/81759132:  6.6M ratio: 250.9/21.3 : 365d;703s
    D10-atach           21610594/227333843:  20.6M ratio: xx/yy : 1079d;2914s   
    D10-attach was replicated with 24M of bandwidth! 
    V10P3+RL+D-atach    6860898/35860234:  6.5M ratio: 253.9/48.6
    V10P3+RL+D-atach    21,323,874/113,583,503:  20.3M ratio: xx/yy : 1079d;2778s
    V10AC+attach        8675426/12616212:  x.xM ratio: 200.8/138

###  Entropy Coding external resources

    http://www.bodden.de/legacy/arithmetic-coding/
    http://www.arturocampos.com/ac_range.html
    http://www.data-compression.info/Algorithms/AC/
    http://xlinux.nist.gov/dads//HTML/arithmeticCoding.html

### measuring the impact of gzip/deflate
See [Curl and compression](http://dev.nuclearrooster.com/2009/11/08/checking-gzipdeflate-server-responses-with-curl/).
Make use of curls' `--silent/-s`,`--output/-o`, `-H`, and `--http1.0/-0`

    URL='http://imetrical.couchone.com/imetrical/daniel.2011-05-29T00%3A00%3A00Z/Delta.json'
    URL='http://127.0.0.1:5984/imetrical/daniel.2011-05-29T00%3A00%3A00Z/Delta.json'
    curl -s -o /dev/null --write-out "size=%{size_download}\n" $URL
    # size=185513
    curl -s -o /dev/null -H "Accept-Encoding: gzip,deflate" --write-out "size=%{size_download}\n" $URL
    # size=15687
    curl -s -o /dev/null -0 -H "Accept-Encoding: gzip,deflate" --write-out "size=%{size_download}\n" $URL
    # size=15687
    
### Dependencies
The seeding script has now been rewritten in `node.js` `javascript`.
It now requires a few dependancies:

    npm install underscore underscore.string

For couchdb I will first try [cradle](http://cloudhead.io/cradle) : [github](https://github.com/cloudhead/cradle)

    npm install cradle
    
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
