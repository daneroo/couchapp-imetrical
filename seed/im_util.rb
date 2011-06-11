require 'date'
module IM
  #EPOCH 2008-07-30T00:04:40Z
  EPOCH=Date.parse('2008-07-30 00:04:40') #Apr-30-1999
  
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
  
  class Util
    def initialize
      puts "Util object created"
    end
  end
end
  
