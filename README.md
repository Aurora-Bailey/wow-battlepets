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
cd ~; curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh; sudo bash nodesource_setup.sh; sudo apt install -y nodejs; sudo apt install -y build-essential; sudo apt install -y mongodb;
```

##### Pull code from git
```
sudo apt install -y git; git clone https://github.com/gbradthompson/wow-battlepets.git
```

##### Update server IP address
```
vim ~/wow-battlepets/client/store/index.js
```
Replace with the ip of your ec2 instance
```
{
  realmIndex: {},
  petIndex: {},
  server: '<ec2 ip address>:3303',
  harvestServer: '<ec2 ip address>:3304',
  liveServer: '<ec2 ip address>:3305'
}
```
[esc] :wq to exit and save

##### Install packages
```
(cd ~/wow-battlepets/server; npm install)
(cd ~/wow-battlepets/client; npm install)
```

##### Run nuxt build
```
(cd ~/wow-battlepets/client; npm run build)
```


##### Setup credentials
```
vim ~/wow-battlepets/server/api/credentials.json
```
Insert
```
{
  "client_id":"<blizzard api client id>",
  "client_secret":"<blizzard api client secret>"
}
```
[esc] :wq to exit and save

##### Setup pm2
```
sudo npm install pm2 -g
pm2 startup (run script outpun into console)
pm2 save
pm2 pm2_ecosystem
```
