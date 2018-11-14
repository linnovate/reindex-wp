FROM node:8

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
RUN echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.6 main" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list
RUN apt-get update
RUN apt-get install -y mongodb-org-tools
RUN mkdir -p /usr/src/app

RUN npm i -g nodemon

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn install \
  && mv node_modules /node_modules

ENV PATH=/node_modules/.bin:${PATH}

CMD ["nodemon","bin/www"]
