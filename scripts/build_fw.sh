#!/bin/sh

cd /root/build/fw

if [ -f "./ver" ]; then
        rm ./ver
fi

if [ -f "./fw.bin" ]; then
        rm ./fw.bin
fi

if [ -z "$1" ]
  then
    FW_NAME=hds722_$(date +"%Y%m%d").bin
    echo "0.0.0" > ver
  else
    FW_NAME=hds722_v$1_$(date +"%Y%m%d").bin
    echo $1 > ver
fi

pm2 stop all -s

echo "packing backend ..."
cd ~/build/backend/
pkg -t node10-linux-armv7 package.json
cp ~/build/backend/hds722-backend /usr/local/bin/backend
cp ~/build/backend/hds722-backend /root/build/fw/backend
mv ~/build/backend/hds722-backend "/root/release/backend-"$(date +"%Y%m%d-%H%M%S")

# echo "packing service ..."
# pm2 stop service -s
# cd ~/build/service/
# pkg --options -t node10-linux-armv7 app.js
# cp ~/build/service/app "/root/release/service-"$(date +"%Y%m%d-%H%M%S")
# cp ~/build/service/app /root/build/fw/service
# mv ~/build/service/app /usr/local/bin/service

echo "packing frontend ..."
cd /var/www/html
tar -cf frontend.bin *
cp ./frontend.bin /root/build/fw
mv ./frontend.bin "/root/release/frontend-"$(date +"%Y%m%d-%H%M%S")

echo "collecting dot node ..."
find ~/build/backend -name "*.node" -exec cp {} ~/build/fw \;

cd /root/build/fw
echo hds722 > model

echo "taring archive"
tar -cJf fw.bin *
echo "encrypting archive"
gpg -c --batch --passphrase bxb9703838 -o /root/release/$FW_NAME ./fw.bin
rm fw.bin
pm2 start all -s