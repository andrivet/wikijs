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

echo Copy on the destination such as /tmp and execute:
echo sudo systemctl stop wiki
echo sudo -iu wiki
echo cd /opt
echo cp /tmp/ wiki-js-adv.tar.gz
echo tar xzf wiki-js-adv.tar.gz -C ./wiki
echo exit
echo sudo systemctl start wiki
