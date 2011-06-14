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

if false 
  puts "now:#{Date.today} e:#{IM::EPOCH} diff:#{Date.today-IM::EPOCH}"
  IM::EPOCH.upto(Date.today) do |d| 
    puts "++d:#{d}"
  end
  Date.today.downto(IM::EPOCH) do |d| 
    puts "--d:#{d}"
  end
  puts "dt:now "+DateTime::now.to_s
end

baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
table="watt_minute"; # watt,watt_tensec,watt_minute,watt_hour
puts sprintf("%25s %8s %8s", 'date','samples','size')
((Date.today-1)..Date.today-1).each do |d|
  dt=DateTime.jd(d.jd)
  today_t = dt.to_gm_time
  today_str=today_t.strftime"%Y-%m-%dT%H:%M:%SZ"
  
  url = "#{baseURI}?day=#{d}&table=#{table}"
  r = Net::HTTP.get_response( URI.parse( url ) )
  json = r.body
  data = JSON.parse(json)
  nudata = {
    "stamp" => today_str,
    "values" =>[],
  }
  # Speedup :
  # convert [{w,s},{w,s}] to {w:s,w:s}
  # (0.86400).each {|idx| fmt_and_lookup_and_remove_instead_of_parse}
  #  check no duplicates (can't cause of mysql index on stamp)
  #  check no unremoved key in converted hash...
  puts sprintf("%25s %8d %8d", dt,data.length,json.length)
  parsetime = Benchmark.realtime do
    data.each do |pair|
      t=DateTime.strptime(pair["stamp"]).to_gm_time
      idx = (t-today_t).to_i 
      #pair["t"] = t.strftime"%Y-%m-%dT%H:%M:%SZ"
      #pair["idx"]=idx
      nudata["values"][idx]=pair["watt"]
      #puts pair.inspect
      #break
    end
  end
  puts "parsed in #{parsetime}"
  #puts JSON.generate(nudata)
  #puts JSON.pretty_generate(nudata)
  #puts nudata.inspect
end

#[
#  {
#    "watt": "1155",
#    "stamp": "2011-06-11T00:00:00Z"
#  },
#  {
#    "watt": "1161",
#    "stamp": "2011-06-11T00:01:00Z"
#  },
