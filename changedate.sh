#!/bin/bash

today=`date "+%Y%m%d-%H%M%S"`
sed -i -e "s/\?var=[^\"]*/\?var=$today/" ./index.html

