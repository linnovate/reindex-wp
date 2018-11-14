#!/bin/bash
#create sitemap files
SITEMAPTOKEN="d14db03009a4b6f0c1bd718a3031ad535ff6f52e43840a6fc3ff3d84ea0d3b10"
curl --header "Authorization: $SITEMAPTOKEN" https://402.co.il/api/v1/crons/sitemap
