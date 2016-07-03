# VulsRepo #

[![license](https://img.shields.io/github/license/usiusi360/vulsrepo.svg?style=flat-square)](https://github.com/usiusi360/vulsrepo/blob/master/LICENSE.txt)

VulsRepo is visualized based on the json report output in [vuls](https://github.com/future-architect/vuls).

Demo movie:[https://youtu.be/DIBPoik4owc](https://youtu.be/DIBPoik4owc)


## Installation ##

### Step1. Create a json report of vuls ###

````
$ vuls scan -report-json --cve-dictionary-dbpath=<VulsHome>/cve.sqlite3
````

Write report to JSON files ($PWD/results/current)


### Step2. Http Server install ###

Apache HTTP Server or Nginx is installed.

### Step3. Zip download ###

zip is downloaded and developed in a home directories of an http server.

````
$ wget https://github.com/usiusi360/vulsrepo/archive/master.zip
$ unzip master.zip
$ sudo mv ./vulsrepo-master/src /var/www/html/vulsrepo
````

### Step4. Link to json report ###

````
$ cd /var/www/html/vulsrepo/
$ ln -s <VulsHome>/results/current current
````

## Usage ##

Access the browser

````
http://VulsServer/vulsrepo/
````

## Gallery ##
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/img/image001.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/img/image002.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/img/image003.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/img/image004.png)
