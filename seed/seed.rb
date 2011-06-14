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
grain=60
puts sprintf("  %22s %8s %8s %8s %8s", 'date','samples','size','samples\'','size\'')
((Date.today-10)..Date.today-1).each do |d|
  dt=DateTime.jd(d.jd)
  today_t = dt.to_gm_time
  today_str=today_t.strftime(IM::FMT8601)
  
  url = "#{baseURI}?day=#{d}&table=#{table}"
  r = Net::HTTP.get_response( URI.parse( url ) )
  
  json = r.body
  data = JSON.parse(json)
  canonical=IM.raw_to_canonical(today_str,data,grain,false)
  canonical_p=IM.raw_to_canonical_byparse(today_str,data,grain,false)
  
  #puts JSON.generate(canonical)  #.length
  
  # Speedup :
  # convert [{w,s},{w,s}] to {w:s,w:s}
  # (0.86400).each {|idx| fmt_and_lookup_and_remove_instead_of_parse}
  #  check no duplicates (can't cause of mysql index on stamp)
  #  check no unremoved key in converted hash...
  nudata = {
    "stamp" => today_str,
    "grain" => grain,
    "values" =>[],
  }
  
  itertime = Benchmark.realtime do
    stamp_to_watt = {}
    data.each do |pair|
      stamp_to_watt[pair["stamp"]]=pair["watt"]
    end
    (today_t...today_t+86400).step(grain).each do |t|
      t_str=t.strftime"%Y-%m-%dT%H:%M:%SZ"
      idx = (t-today_t).to_i / (grain)
      #w = stamp_to_watt[t_str]
      # simultaneous lookup and delete
      w = stamp_to_watt.delete(t_str)
      if w==nil
        #puts "!found #{t_str}: #{w}"        
      end  
      nudata["values"][idx]=w
    end
    # check that all values were removed
    if !stamp_to_watt.empty?
      puts "stamp->watt has #{stamp_to_watt.length} values"
    end
  end
  #puts JSON.generate(nudata)  #.length

  pdata=nil
  if true
    nudata = {
      "stamp" => today_str,
      "grain" => grain,
      "values" =>[],
    }
    parsetime = Benchmark.realtime do
      data.each do |pair|
        t=DateTime.strptime(pair["stamp"]).to_gm_time
        idx = (t-today_t).to_i / grain
        #pair["t"] = t.strftime"%Y-%m-%dT%H:%M:%SZ"
        #pair["idx"]=idx
        nudata["values"][idx]=pair["watt"]
        #puts pair.inspect
        #break
      end
    end
    #puts "parsed in #{parsetime}s"
    #puts JSON.generate(nudata).length
    pdata=nudata
  end
  #puts JSON.pretty_generate(nudata)
  #puts nudata.inspect

  puts sprintf("1-%22s %8d %8d %8d %8d", today_str,data.length,json.length,canonical["values"].length,JSON.generate(canonical).length)
  puts sprintf("2-%22s %8d %8d %8d %8d", today_str,data.length,json.length,nudata["values"].length,JSON.generate(nudata).length)
  puts sprintf("3-%22s %8d %8d %8d %8d", today_str,data.length,json.length,pdata["values"].length,JSON.generate(pdata).length)
  puts sprintf("4-%22s %8d %8d %8d %8d", today_str,data.length,json.length,canonical_p["values"].length,JSON.generate(canonical_p).length)
end
