require 'date'
module IM
  FMT8601 = "%Y-%m-%dT%H:%M:%SZ"
  
  def IM.couchdb()
    appName='imetrical' # lookup .in ~/.couchapp.conf
    credentials = JSON.parse(File.open(ENV['HOME']+"/.couchapp.conf", "rb").read )
    puts credentials['env'][appName].inspect
    return CouchRest.database!(credentials['env'][appName]['db'])
  end  

  # returns all document of a given type (with their current _rev property)
  # this is done through the doctype view.
  def IM.getByDoctype(db,doctype)
    docs=[]
    db.view('pool/doctype',{:reduce=>false,:key=>doctype})['rows'].each do |r|
      docs.push({"_id"=>r["id"],"_rev"=>r["value"]})
    end
    return docs
  end

  def IM.deleteByDoctype(db,doctype)
    docs=Pool.getByDoctype(db,doctype)
    docs.each do |doc|
      puts "queueing for deletion: "+doc.inspect
      doc["_deleted"]=true
    end
    #puts docs.inspect
    puts "Deleteing #{docs.length} #{doctype} documents"
    db.bulk_save(docs)
  end
  
  def IM.rl_encode(values,verbose=false)
    # [0,0,x,y,...] -> [[2,0],x,y,..]
    encoded=[]
    while values!=nil && values.length>0
      puts "Remaining #{values.inspect}}"  if verbose
      head = values[0]
      run = values.take_while {|v| v==head }
      values = values.slice(run.length,values.length-run.length)
      rl = [[run.length,head]]
      if JSON.generate(rl).length<JSON.generate(run).length
        puts "  --RLE #{run.inspect} > #{rl.inspect}" if verbose
        encoded.concat(rl)
      else
        puts "  ++ORG #{run.inspect} < #{rl.inspect}"  if verbose
        encoded.concat(run)
      end
      puts "Encoded #{encoded.inspect}"  if verbose
      #puts "Remaining #{values.inspect}}"
    end
    return encoded
  end
  
  # [{w,s},{w,s}] (to {w:s,w:s}) to {s,[w,w,w,w]}
  def IM.raw_to_canonical(start8601_str,raw,seconds_per_sample=1,verbose=false)
    asssumed_seconds_duration=86400
    start_t=DateTime.strptime(start8601_str).to_gm_time
    start_str=start_t.strftime(FMT8601)
    
    canonical = {
      "stamp" => start_str,
      "grain" => seconds_per_sample,
      "values" =>[]
    }

    # convert [{w,s},{w,s}] to {w:s,w:s}
    stamp_to_watt = {}
    raw.each do |pair|
      #  no duplicates possible because of source (can't cause of mysql index on stamp)
      stamp_to_watt[pair["stamp"]]=pair["watt"]
    end
    
    # (for each second offset in day).each {|idx| fmt_and_lookup_and_remove_instead_of_parse}
    (start_t...start_t+asssumed_seconds_duration).step(seconds_per_sample).each do |t|
      t_str=t.strftime(FMT8601)
      idx = (t-start_t).to_i / seconds_per_sample
      w = stamp_to_watt.delete(t_str)
      if w==nil && verbose
        puts "!found #{t_str}: #{w}"        
      end  
      canonical["values"][idx]=w
    end
      
    # check that all values were removed/used
    # throw an error ??
    if !stamp_to_watt.empty?
      puts "stamp->watt has #{stamp_to_watt.length} values"
    end

    return canonical
  end
  
  # [{w,s},{w,s}] to {s,[w,w,w,w]}
  def IM.raw_to_canonical_byparse(start8601_str,raw,seconds_per_sample=1,verbose=false)
    start_t=DateTime.strptime(start8601_str).to_gm_time
    start_str=start_t.strftime(FMT8601)
    
    canonical = {
      "stamp" => start_str,
      "grain" => seconds_per_sample,
      "values" =>[]
    }

    # convert [{w,s},{w,s}] to {w:s,w:s}
    raw.each do |pair|
      t=DateTime.strptime(pair["stamp"]).to_gm_time
      idx = (t-start_t).to_i / seconds_per_sample
      canonical["values"][idx]=pair["watt"]
    end
    return canonical
  end
  
  class Util
    def initialize
      puts "Util object created"
    end
  end
end
  
# monkey patch for time conversion - from OReily Cookbook 3.9  
class Date
  def to_gm_time
    to_time(new_offset, :gm)
  end

  def to_local_time
    to_time(new_offset(DateTime.now.offset-offset), :local)
  end

  private
  def to_time(dest, method)
    #Convert a fraction of a day to a number of microseconds
    usec = (dest.sec_fraction * 60 * 60 * 24 * (10**6)).to_i
    Time.send(method, dest.year, dest.month, dest.day, dest.hour, dest.min,
              dest.sec, usec)
  end
end
