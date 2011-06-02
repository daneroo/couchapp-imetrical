<?php

require_once("CouchSimple.php");  

date_default_timezone_set('UTC');
$DAYFMT='Y-m-d';
function beginDay($t,$offsetInDays=0){
    return mktime(0, 0, 0, date("m",$t) , intval(date("d",$t)) - $offsetInDays, date("Y",$t));
}

$baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
$couchOpts['host'] = "localhost"; 
$couchOpts['port'] = 5984;
$couchOpts['user'] = "daniel";
$couchOpts['pass'] = "pokpok";

$couch = new CouchSimple($couchOpts); // See if we can make a connection

function putCouch($key,$o){
  global $couch;
  $db = "imetrical";
  $resp = $couch->send("PUT", "/$db/$key", json_encode($o)); 
  //var_dump($resp); // string(42) "{"ok":true,"id":"123","rev":"2039697587"}"
  $c = json_decode($resp,true);
  if (isset($c["error"]) && $c["error"]=="conflict") {
    $resp = $couch->send("GET", "/$db/$key"); 
    $g = json_decode($resp,true);
    $o["_rev"] = $g["_rev"];
    //var_dump($resp); // string(47) "{"_id":"123","_rev":"2039697587","data":"Foo"}" 
    $resp = $couch->send("PUT", "/$db/$key", json_encode($o)); 
    //var_dump($resp); // string(42) "{"ok":true,"id":"123","rev":"2039697587"}"
    echo "updated  $key\n";  
  } else {
    echo "inserted $key\n";  
  }
}

//putCouch(123,array("data"=>"Foo"));
//putCouch(123,array("data"=>"Bar"));
 
//$grain="watt_hour";
//$grain="watt_minute";
//$grain="watt_tensec";
$grain="watt";
$numDays=365;
$today = beginDay(time());
echo "today=".date($DAYFMT,$today)."\n";
while ($numDays>=0) {
    $day = beginDay($today,$numDays);
    $dayStamp=date($DAYFMT,$day);
    echo "-today-".$numDays." : ".$dayStamp."\n";

    $u="$baseURI?offset=$numDays&table=$grain";
    $jsonD =  file_get_contents($u);
    $data = json_decode($jsonD,true);

    $scope="hour";
    if ($scope=="day"){
        $document = array(
          "owner"=>"daniel",
          "scope"=>"day",
          "stamp"=>$dayStamp,
          "data"=>$data
        );
        //putCouch("daniel_$dayStamp",$document);
    } else if ($scope=="hour"){
        $dataByHour=array();
        foreach ($data as $datum){
            $stamp =  $datum["stamp"];
            $HH = substr($stamp,11,2);
            if (!isset($dataByHour[$HH])){
                $dataByHour[$HH]=array();
            }
            array_push($dataByHour[$HH],$datum);
        }
        foreach ($dataByHour as $HH => $dataForHour){
            $hourStamp=$dayStamp."T".$HH;
            echo "  $hourStamp\n"; 
            $document = array(
              "owner"=>"daniel",
              "scope"=>"hour",
              "stamp"=>$hourStamp,
              "data"=>$dataForHour
            );
            putCouch("daniel_$hourStamp",$document);
        }
    }

     
    $numDays--;
    
}

?>