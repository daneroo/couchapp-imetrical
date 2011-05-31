<?php
  
date_default_timezone_set('UTC');
$DAYFMT='Y-m-d';
function beginDay($t,$offsetInDays=0){
    return mktime(0, 0, 0, date("m",$t) , intval(date("d",$t)) - $offsetInDays, date("Y",$t));
}

$numDays=1000;
$today = beginDay(time());
echo "today=".date($DAYFMT,$today)."\n";
while ($numDays>=0) {
    $day = beginDay($today,$numDays);
    echo "today-".$numDays." : ".date($DAYFMT,$day)."\n";
    $numDays--;
    
}


$p = date_parse(date($DAYFMT,$day));
$p = date_parse("2006-13-23");

print_r($p);
if ($p['error_count']>0){
    
}
?>