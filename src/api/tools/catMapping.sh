curl -XPUT $ELASTIC_HOST:9200/$HCATEGORIES_INDEX -d ' {
    "mappings": {
        "A": {
             "_parent": {
                "type": "Z"
            },
            "dynamic_templates": [{
                "cat": {
                    "match": "*",
                    "match_mapping_type": "string",
                    "mapping": {
                        "type": "text",
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "ac": {
                                "type": "string",
                                "analyzer": "autocomplete",
                                "search_analyzer": "standard"
                            }
                        }
                    }
                }
            }]
        },
        "B": {
            "_parent": {
                "type": "A"
            },
            "dynamic_templates": [{
                "cat": {
                    "match": "*",
                    "match_mapping_type": "string",
                    "mapping": {
                        "type": "text",
                        "_parent": {
                            "type": "A"
                        },
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "ac": {
                                "type": "string",
                                "analyzer": "autocomplete",
                                "search_analyzer": "standard"
                            }
                        }
                    }
                }
            }]
        },
        "C": {
            "_parent": {
                "type": "B"
            },
            "dynamic_templates": [{
                "cat": {
                    "match": "*",
                    "match_mapping_type": "string",
                    "mapping": {
                        "type": "text",
                        "_parent": {
                            "type": "B"
                        },
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "ac": {
                                "type": "string",
                                "analyzer": "autocomplete",
                                "search_analyzer": "standard"
                            }
                        }
                    }
                }
            }]
        },
        "D": {
            "_parent": {
                "type": "C"
            },
            "dynamic_templates": [{
                "cat": {
                    "match": "*",
                    "match_mapping_type": "string",
                    "mapping": {
                        "type": "text",
                        "_parent": {
                            "type": "C"
                        },
                        "fields": {
                            "raw": {
                                "type": "string",
                                "index": "not_analyzed"
                            },
                            "ac": {
                                "type": "string",
                                "analyzer": "autocomplete",
                                "search_analyzer": "standard"
                            }
                        }
                    }
                }
            }]
        }
    },
    "settings": {
        "number_of_shards": 1,
        "analysis": {
            "filter": {
                "autocomplete_filter": {
                    "type": "edge_ngram",
                    "min_gram": 2,
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
                }
            }
        }
    }
}
'
