var elasticsearch = require('elasticsearch');
var trim = require('trim');
var client = new elasticsearch.Client({
  host: '139.59.208.209:9200',
  log: 'trace'
});

client.ping({
  requestTimeout: 500000,
}, function (error) {
  if (error) {
    console.error('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

init() ;

function init() {
	client.search({
	  index: 'reindextest1',
	  type: 'heb1',
	  size: '2000',
	  body: {
		fields : 'tags'
	  }
	},getTags) ;
}


function getTags(err, resp, status) {
	// create a list of tags
	hits = resp.hits.hits;
	
	var data = hits;
    var tags ="" ; 
	for(var i in data)
	{
		 tags += "|" + data[i].fields.tags;
	}
	

	var split = tags.split("|");
	
	
	for(var i in split)
	{
		 split[i] = trim(split[i]);
	}
	
	var unique = Array.from(new Set(split))
	
	console.log(unique) ;
	
	// set tags in type tags
	addTagsToIndex(unique) ;
} ;

function addTagsToIndex(tags) {

}










