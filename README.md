## iMetrical CouchApp

The data was pushed by `dirac:/Users/daniel/Documents/NetBeansProjects/iMetricalCouch`.
Actually pushed to imetricaltest on dirac and then replicated back to newton.
`
[More info about CouchApps here.](http://couchapp.org)

## Deploying this app
Credentials are in `~/.couchapp.conf`.

    couchapp push . imetrical

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
    V10P3+RL+D-atach    6860898/35860234:  6.5M ratio: 253.9/48.6
    V10P3+RL+D-atach    21,323,874/113,583,503:  20.3M ratio: xx/yy : 1079 days;2778s
    V10AC+attach        xxx/yyy:  x.xM ratio: xxx/yyy

###  Entropy Coding external resources

    http://www.bodden.de/legacy/arithmetic-coding/
    http://www.arturocampos.com/ac_range.html
    http://www.data-compression.info/Algorithms/AC/
    http://xlinux.nist.gov/dads//HTML/arithmeticCoding.html

### Dependancies
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
