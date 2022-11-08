# ushauri apis

Apis for ushauri mobile application

[![deploy to test instance](https://github.com/palladiumkenya/ushauri_api/actions/workflows/cicd_process.yml/badge.svg)](https://github.com/palladiumkenya/ushauri_api/actions/workflows/cicd_process.yml)

---
## Requirements

For development, you will only need Node.js and a node global package, Yarn or npm installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###
### Yarn installation
  After installing node, this project will need yarn too, so just run the following command.

      $ npm install -g yarn

---

## Install

    $ git clone https://github.com/mHealthKenya/ushauri_api.git
    $ cd ushauri_api
    $ yarn install
    Or for npm
    $ npm install

## Configure app

create `.env` then edit it with your environment variable. use `.env.save` as a guide.

## Running the project

    $ yarn start

## Or for npm. Running the project

    $ npm start
## docker option

* Create a image using 
 ```sh
  docker build -t ushauri_api:latest .
 ```
 * Run the image creates
 ```sh
    docker run -p 7002:5000 --name ushauri_api -d --restart always ushauri_api:latest        
 ```
 * Access the service via [localhost](http://127.0.0.1:7002)
 * stoping the service use
 ```sh
  docker stop ushauri_api
  ```
