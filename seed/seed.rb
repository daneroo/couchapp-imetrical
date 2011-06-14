require 'rubygems'
require 'json'
require 'couchrest'
require 'date'
require 'im_util'
require 'benchmark'
require 'digest/sha1'
require 'uri'
require 'net/http'

db = IM::couchdb()

db.documents({})['rows'].each do |r|
  # r:= {key"=>"daniel_2010-06-02T00", value=>{rev:1-09209},doc=>...}
  # and doc only if :include_docs=>true  suggest ,:limit=>1
  puts r.inspect #["stamp"]
  break;
end
#puts "Pre-cached all(#{globalPlayerPoints.length}) player points"


baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
table="watt_tensec"; # watt,watt_tensec,watt_minute,watt_hour
grain=10
puts sprintf("%22s %10s %8s %8s %5s",'date','method','samples','size','ratio')
((Date.today-10)..Date.today-1).each do |d_d|
  d_dt=DateTime.jd(d_d.jd)
  d_t = d_dt.to_gm_time
  d_str=d_t.strftime(IM::FMT8601)
  
  url = "#{baseURI}?day=#{d_d}&table=#{table}"
  resp = Net::HTTP.get_response( URI.parse( url ) )
  
  json_raw = resp.body
  raw = JSON.parse(json_raw)
  canonical=IM.raw_to_canonical(d_str,raw,grain,false)
  json_canonical = JSON.generate(canonical)
  ratio = json_raw.length*1.0/json_canonical.length
  puts sprintf("%22s %10s %8d %8d", d_str,'raw',raw.length,json_raw.length)
  puts sprintf("%22s %10s %8d %8d %5.2f", d_str,'canonical',canonical["values"].length,json_canonical.length,ratio)
end
