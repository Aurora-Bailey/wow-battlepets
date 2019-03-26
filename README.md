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


### Create EC2 instance

1. Create EC2 spot instance (m3.medium spot instance at 90% discount)
2. Select Ubuntu 18.04
3. Set EBS size to 20 GB
4. Security group - allow everything from your ip (for testing)
5. SSH into instance


### Configure EC2 instance
##### Update
```
sudo apt update; sudo apt upgrade -y; sudo reboot;
```

##### Install Node and MongoDB
```
sudo apt install -y nodejs; sudo apt install -y npm; sudo apt install -y mongodb;
```

##### Pull code from git
```
sudo apt install -y git; git clone https://github.com/gbradthompson/wow-battlepets.git
```

##### Install packages
```
(cd ~/wow-battlepets/server; npm install)
(cd ~/wow-battlepets/client; npm install)
```

##### Run nuxt build
```
(cd ~/wow-battlepets/client; npm run build)
```

##### Setup pm2
```
sudo npm install pm2 -g
pm2 startup (run script outpun into console)
pm2 save
pm2 pm2_ecosystem
```
