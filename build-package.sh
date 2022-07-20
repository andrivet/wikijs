#!/bin/bash

rm -rf PACKAGE

yarn cache clean
yarn --frozen-lockfile --non-interactive
yarn build
rm -rf node_modules
yarn --production --frozen-lockfile --non-interactive

mkdir -p PACKAGE
cp -r assets PACKAGE/
cp -r node_modules PACKAGE/
cp -r server PACKAGE/
cp package.json PACKAGE/
cp LICENSE PACKAGE/

gfind PACKAGE -printf "%P\n" | tar -czf wiki-js-adv.tar.gz --no-recursion -C PACKAGE -T -
mv wiki-js-adv.tar.gz PACKAGE/

echo
echo On the local machine:
echo scp PACKAGE/wiki-js-adv.tar.gz srv2:/tmp
echo
echo On srv2:
echo sudo systemctl stop wiki
echo sudo -iu wiki
echo tar xzf /tmp/wiki-js-adv.tar.gz -C /opt/wiki
echo exit
echo rm /tmp/wiki-js-adv.tar.gz
echo sudo systemctl start wiki
echo sudo journalctl -f -u wiki
