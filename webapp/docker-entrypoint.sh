#!/bin/sh

set -e

rm -rf /usr/share/nginx/html/*
cp -r /usr/local/src/ferriscord/* /usr/share/nginx/html
envsubst < /usr/local/src/ferriscord/config.json > /usr/share/nginx/html/config.json
