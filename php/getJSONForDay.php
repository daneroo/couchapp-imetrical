<?php
  // This script goes into cantor:/varwww/iMetrical/getJSON.php
  //header("Content-type: application/json");
  header("Content-type: text/plain");
  $DAYFMT='Y-m-d';
  date_default_timezone_set('UTC');
  function beginDay($t,$offsetInDays=0){
      return mktime(0, 0, 0, date("m",$t) , intval(date("d",$t)) - $offsetInDays, date("Y",$t));
  }
  
  $timestamp=time(); 
  if (isset($_GET["day"])){
      $day = $_GET["day"];
      if (($t = strtotime($day)) !== false) {
          $reformat = date($DAYFMT,$t);
          if ($day==$reformat){
              $timestamp=$t;
          }
      }
  }
  $offest=0;
  if (isset($_GET["offset"])){
      $offset = intval($_GET["offset"]);
  }
  $timestamp = beginDay($timestamp,$offset);
  //error_log("ts: ".$timestamp);
  $table="watt_minute"; 
  if (isset($_GET["table"])){
      $table = $_GET["table"];
  }

// Connect to db
$dbname = 'ted'; $dbhost = 'localhost'; $dbuser = 'aviso'; $dbpass = '';
$conn = mysql_connect($dbhost, $dbuser, $dbpass) or die ('Error connecting to mysql');
mysql_select_db($dbname);

function queryForTableAndDay($table,$ts) {
    $DAYFMT='Y-m-d';
    $query =  "select stamp,watt from $table ";
    if (is_null($ts)) { $ts = beginDay(time()); }
    $query .= " where stamp>='".date($DAYFMT,beginDay($ts,0))."'"
    ." and stamp<'".date($DAYFMT,beginDay($ts,-1))."'"; 
    $query .= " order by stamp asc";
    $query .= " limit 100000"; // just in case
    return $query;
}

function entriesForQuery($sql) {
    $result = mysql_query($sql) or die('Query failed: ' . mysql_error());
    $obsarray = array();
    while ($dico = mysql_fetch_assoc($result)) {
        $dico['stamp'][10] = 'T';
        $dico['stamp'] .= 'Z';
        $obsarray[]=$dico;
    }
    $json =  json_encode($obsarray);
    mysql_free_result($result);
    return $json;
}


// might be called more than once ?
function entriesForTableAndDay($table,$ts) {
    $sql = queryForTableAndDay($table,$ts);
    //echo "// sql: ".$sql."\n";
    echo entriesForQuery( $sql );
}


//entriesForTableSince('watt',null,86400);
//entriesForTableSince('watt_tensec',null,8640);
entriesForTableAndDay($table,$timestamp);

mysql_close($conn);
?>