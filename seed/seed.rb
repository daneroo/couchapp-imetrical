require 'rubygems'
require 'json'
require 'couchrest'
require 'date'
require 'im_util'
require 'benchmark'
require 'digest/sha1'
require 'uri'
require 'net/http'

if false
  IM.rl_encode([1,2,3,4,5,6,7],true)
  v=[1,2,3,3,3,3,7,5,6,8,6,5,4,nil,4,5,nil,nil,nil,nil,nil]
  IM.rl_encode(v,true)
  #delta=IM.delta_encode(v)
  #puts v.inspect
  #puts delta.inspect
  Process.exit
end

db = IM::couchdb()
db.delete!
db = IM::couchdb()

db.documents({})['rows'].each do |r|
  # r:= {key"=>"daniel_2010-06-02T00", value=>{rev:1-09209},doc=>...}
  # and doc only if :include_docs=>true  suggest ,:limit=>1
  #puts r.inspect #["stamp"]
  break;
end
#puts "Pre-cached all(#{globalPlayerPoints.length}) player points"


baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
table="watt"; # watt,watt_tensec,watt_minute,watt_hour
grain=1
#((Date.today-365)..Date.today-1).each do |d_d|
(IM::EPOCH..Date.today-1).each do |d_d|
  d_dt=DateTime.jd(d_d.jd)
  d_t = d_dt.to_gm_time
  d_str=d_t.strftime(IM::FMT8601)
  
  results = []
  Benchmark.bm(15) do |x|

    raw=nil,json_raw=nil
    x.report("fetch raw data") do
      url = "#{baseURI}?day=#{d_d}&table=#{table}"
      resp = Net::HTTP.get_response( URI.parse( url ) )

      json_raw = resp.body
      raw = JSON.parse(json_raw)
      results.concat([['raw',raw.length,json_raw.length,1.0]])
    end
  
    canonical=nil
    x.report("canonical") do
      canonical=IM.raw_to_canonical(d_str,raw,grain,false)
    end
  
    json_canonical=nil
    x.report("json-can") do
      json_canonical = JSON.generate(canonical)
      ratio = json_raw.length*1.0/json_canonical.length
      results.concat([['canonical',canonical["values"].length,json_canonical.length,ratio]])
    end
  
  
    x.report("V10") do
      # some value are not  val%10==0
      canonical["values"]=canonical["values"].collect {|w| w!=nil ? w.to_i/10 : w }
    end
    x.report("json-v10") do
      json_canonical = JSON.generate(canonical)
      ratio = json_raw.length*1.0/json_canonical.length
      results.concat([['V10',canonical["values"].length,json_canonical.length,ratio]])
    end
  

    x.report("delta") do
      canonical["values"]=IM.delta_encode(canonical["values"])
    end
    x.report("P3") do
      # some value are not  val%10==0
      canonical["values"]=canonical["values"].collect {|w| w!=nil ? w.to_i+3 : w }
    end
    x.report("json-v10") do
      json_canonical = JSON.generate(canonical)
      ratio = json_raw.length*1.0/json_canonical.length
      results.concat([['Delta',canonical["values"].length,json_canonical.length,ratio]])
      #nada = "No delta"
    end

    x.report("RL") do
      canonical["values"]=IM.rl_encode(canonical["values"])
    end
    x.report("json-RL") do
      json_canonical = JSON.generate(canonical)
      ratio = json_raw.length*1.0/json_canonical.length
      results.concat([['RL',canonical["values"].length,json_canonical.length,ratio]])
    end

    x.report("write w/attach") do
      canonical["values"]=[]
      canonical["_id"] = "daniel.#{d_str}"
      rsp = db.save_doc(canonical)
      doc  = db.get( rsp[ 'id' ] )
      #-- add an attachment
      doc.put_attachment( 'V10RL.json', json_canonical, { "content_type"=>"application/json"} )
    end

    puts sprintf("%22s %10s %8s %8s %5s",'date','method','samples','size','ratio')
    results.each do |r|
      puts sprintf("%22s %10s %8d %8d %5.2f", d_str,r[0],r[1],r[2],r[3])
    end

  end
  
end
