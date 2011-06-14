require 'rubygems'
require 'json'
require 'couchrest'
require 'date'
require 'im_util'
require 'benchmark'
require 'digest/sha1'
require 'uri'
require 'net/http'

#IM.rl_encode([1,2,3,4,5,6,7])
v=[1,2,3,3,3,3,7,5,6,8,6,5,4,nil,4,5,nil]
delta=IM.delta_encode(v)
puts v.inspect
puts delta.inspect
#Process.exit

db = IM::couchdb()

db.documents({})['rows'].each do |r|
  # r:= {key"=>"daniel_2010-06-02T00", value=>{rev:1-09209},doc=>...}
  # and doc only if :include_docs=>true  suggest ,:limit=>1
  puts r.inspect #["stamp"]
  break;
end
#puts "Pre-cached all(#{globalPlayerPoints.length}) player points"


baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
table="watt"; # watt,watt_tensec,watt_minute,watt_hour
grain=1
puts sprintf("%22s %10s %8s %8s %5s",'date','method','samples','size','ratio')
((Date.today-365)..Date.today-1).each do |d_d|
  d_dt=DateTime.jd(d_d.jd)
  d_t = d_dt.to_gm_time
  d_str=d_t.strftime(IM::FMT8601)
  
  url = "#{baseURI}?day=#{d_d}&table=#{table}"
  resp = Net::HTTP.get_response( URI.parse( url ) )
  
  json_raw = resp.body
  raw = JSON.parse(json_raw)
  canonical=IM.raw_to_canonical(d_str,raw,grain,false)
  
  #canonical["values"].each do |w|
  #  w = w ? w.to_i : w
  #  puts "watt%10!=0 #{w} : #{ (w % 10) }" if w!=nil && (w % 10)!=0
  #end
  
  # V10
  canonical["values"]=canonical["values"].collect {|w| w!=nil ? w.to_i/10 : w }

  canonical["_id"] = "daniel.#{d_str}"
  json_canonical = JSON.generate(canonical)
  ratio = json_raw.length*1.0/json_canonical.length
  puts sprintf("%22s %10s %8d %8d", d_str,'raw',raw.length,json_raw.length)
  puts sprintf("%22s %10s %8d %8d %5.2f", d_str,'canonical',canonical["values"].length,json_canonical.length,ratio)

  #canonical["values"]=IM.delta_encode(canonical["values"])
  #json_canonical = JSON.generate(canonical)
  #ratio = json_raw.length*1.0/json_canonical.length
  #puts sprintf("%22s %10s %8d %8d %5.2f", d_str,'delta',canonical["values"].length,json_canonical.length,ratio)

  canonical["values"]=IM.rl_encode(canonical["values"])
  json_canonical = JSON.generate(canonical)
  ratio = json_raw.length*1.0/json_canonical.length
  puts sprintf("%22s %10s %8d %8d %5.2f", d_str,'RL',canonical["values"].length,json_canonical.length,ratio)

  canonical["values"]=[]
  rsp = db.save_doc(canonical)
  doc  = db.get( rsp[ 'id' ] )
  #-- add an attachment
  rslt = doc.put_attachment( 'V10RL.json', json_canonical, { "content_type"=>"application/json"} )
  puts 'attachment: ', rslt

  #puts json_canonical
  
end
