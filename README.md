# VulsRepo #

[![license](https://img.shields.io/github/license/usiusi360/vulsrepo.svg?style=flat-square)](https://github.com/usiusi360/vulsrepo/blob/master/LICENSE.txt)

VulsRepo is visualized based on the json report output in [vuls](https://github.com/future-architect/vuls).


<img src="https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/demo.gif" width="100%">

## Online Demo
http://usiusi360.github.io/vulsrepo/

## Installation
*A home folder of vuls is explained as /opt/vuls.*

### Step1. Create a json report of vuls

````
$ vuls scan 
$ vuls report -to-localfile -format-json --cvedb-path=/opt/vuls/cve.sqlite3  
````

Output to a JSON files (/opt/vuls/results/current)

### Step2. Install Http Server. 
Apache HTTP Server is mentioned as installed one.

### Step3. Installation
2 ways to setup.

From now on , executed by a user running the vuls scan.

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

### Step4. Change the execution of the user group of apache
Set to the same user as the user to run the vuls scan.

```
$ vi httpd.conf

# If you wish httpd to run as a different user or group, you must run
# httpd as root initially and it will switch.  
#
# User/Group: The name (or #number) of the user/group to run httpd as.
# It is usually good practice to create a dedicated user and group for
# running httpd, as with most system services.
#
-User apache
-Group apache

+User vuls
+Group vuls

```

### Step5. The setting to make a CGI operate

1. Copy the sample configuration file for apache configuration folder.
 - vulsrepo/dist/cgi/vulsrepo.conf.sample

2. Install library for perl. (CGI.pm/JSON.pm) 
 - In the case of RHEL or CentOS  
    - Install perl-CGI and perl-JSON with the yum.

 - In the case of Debian or Ubuntu.  
    - Install libcgi-pm-perl and libjson-perl with the apt-get.  
    - Enabling module cgid.(a2enmod cgid)

3. Restart http server

### Step6. Link to vuls results folder

````
$ cd /var/www/html/vulsrepo/
$ ln -s <VulsHome>/results results
````

## Usage ##

Access the browser

````
http://VulsServer/vulsrepo/
````

## Misc

### SETTING

<img src="https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/image006.png" width="50%">

- Detail screen of CVE-ID
    - The look-ahead check the URL => Prefetch Link's URL destination and check whether the page exists
    - Show / Hide the Tab => Toggle display of NVD / JVN tab

- Pivot Table
    - Show / Hide the Item => Set items not to be displayed on pivot table. Since the data of Summary is very large, it turns OFF when the number of vulnerabilities is large and an error occurs.
    - Priority => Set the data to be displayed with priority in the pivot table.The default is NVD data.



## Gallery ##
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/image001.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/image002.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/image003.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/image004.png)
![image](https://raw.githubusercontent.com/usiusi360/vulsrepo/master/gallery/image005.png)
