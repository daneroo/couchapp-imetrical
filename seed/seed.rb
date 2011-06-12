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

puts "now:#{Date.today} e:#{IM::EPOCH} diff:#{Date.today-IM::EPOCH}"
IM::EPOCH.upto(Date.today) do |d| 
  puts "++d:#{d}"
end
Date.today.downto(IM::EPOCH) do |d| 
  puts "--d:#{d}"
end

puts "dt:now "+DateTime::now.to_s

baseURI = "http://192.168.5.2/iMetrical/getJSONForDay.php";
table="watt"; # watt_minute
((Date.today-10)..Date.today).each do |d|
  url = "#{baseURI}?day=#{d}&table=#{table}"
  r = Net::HTTP.get_response( URI.parse( url ) )
  json = r.body
  data = JSON.parse(json)
  puts "#{d}  #{json.length} #{data.length}"
  #puts JSON.pretty_generate(data)
  #puts data.inspect
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
