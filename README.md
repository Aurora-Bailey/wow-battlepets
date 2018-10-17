# wow-battlepets

> Nuxt.js + Vuetify.js project

## Build Setup

``` bash
# install for fresh ubuntu 16.04

# install MongoDB
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927; echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list; sudo apt-get update; sudo apt-get install -y mongodb-org; sudo systemctl start mongod; sudo systemctl enable mongod;

# install node
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -; sudo apt-get install -y nodejs; sudo apt-get install -y build-essential;

# install git and project in one
sudo apt-get install git; git clone https://github.com/gbradthompson/wow-battlepets.git; cd "wow-battlepets"; npm install;

screen

cd data/

node setuprealms.js

node scrape.js



```

``` bash
# install dependencies
$ npm install # Or yarn install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm start

# generate static project
$ npm run generate
```


For detailed explanation on how things work, check out the [Nuxt.js](https://github.com/nuxt/nuxt.js) and [Vuetify.js](https://vuetifyjs.com/) documentation.
