
Reindex is a cloud native application - built to be run with docker and a docker orchestrator (docker-compose , kubernetes).

## Project structure
Current struacture is docker-compose based 
* .env - Holds docker-compose.yml variables
* src/api - Reindex API - Rest APi routes including authentication
* src/app - Reindex - Front end. By default will be fetched from https://github.com/linnovate/reindex-app.git

## Switching Front end
src/app is being fetched from https://github.com/linnovate/reindex-app.git
The project can be cloned and added the .env file using REINDEX_APP variable. 
``` REINDEX_APP=https://path-to-new-repo.git ```

If you want to create a new front end

``` cd src/app
git init
git remote add app <your new git repo>
git add .
git commit -m "Initial commit"
git push -u app master
```

## Installation

Copy env-example to .env  
``` mv env-example .env```

Run build.sh - Builds using docker-compose file and starts the services  
``` ./build.sh```  

## Credits
- Client side Forked from - [React Universal Saga](https://github.com/xkawi/react-universal-saga)
