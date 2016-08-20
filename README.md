# VulsRepo #

[![license](https://img.shields.io/github/license/usiusi360/vulsrepo.svg?style=flat-square)](https://github.com/usiusi360/vulsrepo/blob/master/LICENSE.txt)

VulsRepo is visualized based on the json report output in [vuls](https://github.com/future-architect/vuls).

YouTube:

[![vulsrepo](http://img.youtube.com/vi/DIBPoik4owc/0.jpg)](https://youtu.be/DIBPoik4owc)

## Online Demo
http://usiusi360.github.io/vulsrepo/

## Installation
*A home folder of vuls is explained as /opt/vuls.*

### Step1. Create a json report of vuls

````
$ vuls scan -report-json --cve-dictionary-dbpath=/opt/vuls/cve.sqlite3
````

Output to a JSON files (/opt/vuls/results/current)

### Step2. Install Http Server. 
Apache HTTP Server is mentioned as installed one.

### Step3. Installation
2 ways to setup.

#### A. Zip download

zip is downloaded and developed in a home folder of http server.

````
$ wget https://github.com/usiusi360/vulsrepo/archive/master.zip
$ unzip master.zip
$ sudo cp -Rp ./vulsrepo-master /var/www/html/vulsrepo
````

#### B. Git clone

````
$ cd /var/www/html
$ sudo git clone https://github.com/usiusi360/vulsrepo.git
````

### Step4. The setting to make a CGI operate

1. Copy the sample configuration file for apache configuration folder.
 - vulsrepo/dist/cgi/vulsrepo.conf.sample

2. Install library for perl. (CGI.pm/JSON.pm) 
 - In the case of RHEL or CentOS  
    - Install perl-CGI and perl-JSON with the yum.

 - In the case of Debian or Ubuntu.  
    - Install libcgi-pm-perl and libjson-perl with the apt-get.  
    - Enabling module cgid.(a2enmod cgid)

3. Restart http server

### Step5. Link to vuls results folder

````
$ cd /var/www/html/vulsrepo/
$ ln -s <VulsHome>/results results
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
