#!/bin/bash

mkdir -p "packages" && rm "packages/"*

## Chrome
7z a "packages/legacy-wikipedia_chrome.zip" 48.png 128.png main.js manifest.json

mv manifest.json .manifest.json
mv .ff_requires/manifest.json manifest.json

## Firefox
7z a "packages/legacy-wikipedia_firefox.zip" 48.png 128.png main.js manifest.json

mv manifest.json .ff_requires/manifest.json
mv .manifest.json manifest.json