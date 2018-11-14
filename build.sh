#!/bin/bash

source .env

if [ ! -d "src/app" ]; then
  if [ -n "$REINDEX_CUSTOM" ]; then
    # Clone and point to custom repository
    git clone $REINDEX_CUSTOM src/custom
    ln -s custom/app src/app
    ln -s ../custom/api src/api/custom
  else
    git clone git@github.com:linnovate/reindex-app.git src/app
  fi
fi

echo "Building the app. Please wait"
docker-compose up -d --build
sleep 30
echo "Done building the app, now performing some modifications."

# todo - should be based on container named from .env
docker exec ${COMPOSE_PROJECT_NAME}_api bash -c 'sh tools/catMapping.sh && sh tools/recordsMapping.sh'
docker restart ${COMPOSE_PROJECT_NAME}_api
