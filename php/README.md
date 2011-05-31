# pumping out the data 

 This script goes into cantor:/varwww/iMetrical/getJSON.php
 
    scp -p getJSONForDay.php root@192.168.5.2:/var/www/iMetrical/
 
 We get data with : `http://192.168.5.2/iMetrical/getJSONForDay.php?offset=2&day=2011-05-22&table=watt_hour`

 defaults:

*   day=today
*   offset=0
*   table=watt_minute

We can run

    for i in {1000..0}; do 
      echo ++++ $i days ago; 
      u="http://192.168.5.2/iMetrical/getJSONForDay.php?offset=$i&table=watt_hour"
      curl -s $u | python -mjson.tool
    done

Or even populating `_docs` with data:

    for i in {30..0}; do 
      echo ++++ $i days ago; 
      u="http://192.168.5.2/iMetrical/getJSONForDay.php?offset=$i&table=watt_hour"
      curl -s $u > day-$i.json
    done