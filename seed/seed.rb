require 'rubygems'
require 'json'
require 'couchrest'
require 'date'
require 'im_util'
require 'benchmark'
require 'digest/sha1'

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