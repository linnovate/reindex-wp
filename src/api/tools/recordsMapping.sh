curl -XPUT $ELASTIC_HOST:9200/$RECORDS_INDEX -d '{
  "mappings": {
    "record": {
      "dynamic_templates": [{
        "phone": {
          "match": "phone*",
          "mapping": {
            "type": "string",
            "fields": {
              "plain": {
                "type": "string",
                "analyzer": "remove_geresh"
              },
              "raw": {
                "type": "string",
                "analyzer": "standard"
              }
            }
          }
        }
      }],
      "properties": {
        "categories": {
          "type": "string",
          "fields": {
            "raw": {
              "type": "string",
              "index": "not_analyzed"
            },
            "plain": {
              "type": "string",
              "analyzer": "remove_geresh"
            }
          }
        },
        "created": {
          "type": "date"
        },
        "updated": {
          "type": "date"
        },
        "reindexTitle": {
          "type": "string",
          "fields": {
            "plain": {
              "type": "string",
              "analyzer": "remove_geresh"
            },
            "raw": {
              "type": "string"
            },
            "notanalyzed": {
              "type": "string",
              "index": "not_analyzed"
            },
            "ac": {
              "type": "string",
              "analyzer": "autocomplete",
              "search_analyzer": "standard"
            }
          }
        },
        "reindexTags": {
          "type": "string",
          "fields": {
            "plain": {
              "type": "string",
              "analyzer": "remove_geresh"
            },
            "raw": {
              "type": "string"
            },
            "notanalyzed": {
              "type": "string",
              "index": "not_analyzed"
            }
          }
        },
        "reindexLocationPoints": {
          "type": "geo_point"
        }
      }
    }
  },
  "settings": {
    "number_of_shards": 1,
    "analysis": {
      "filter": {
        "autocomplete_filter": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      },
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "autocomplete_filter"
          ]
        },
        "remove_geresh": {
          "tokenizer": "standard",
          "char_filter": [
            "my_char_filter"
          ]
        }
      },
      "char_filter": {
        "my_char_filter": {
          "type": "mapping",
          "mappings": ["\\u0022=>", "\\u0027=>", "\\u002D=>"]
        }
      }
    }
  }
}'
