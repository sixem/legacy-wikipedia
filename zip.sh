#!/bin/bash

function join_by { local IFS="$1"; shift; echo "$*"; }

TIMESTAMP=$(date +'%d_%m_%Y_%H-%M-%N')

declare -a REQUIRES=(
    '48.png'
    '128.png'
    'main.js'
    'popup.html'
    'popup.css'
    'popup.js'
    'service.js'
)

mkdir -p "packages" && rm "packages/"*

# Creates the packaged Chrome extension
7z a "packages/legacy-wikipedia_chrome.zip" \
    $(join_by " " "${REQUIRES[@]}") \
    manifest.json

# Creates the packaged Firefox extension
declare -a HAYSTACK=(
    'chrome'
)

declare -a REPLACE=(
    'browser'
)

OUTPUT="ff_port-$TIMESTAMP"

mkdir "$OUTPUT"

cp "./.ff_requires/manifest.json" "./$OUTPUT/manifest.json"

for FILE in "${REQUIRES[@]}"
do
    cp "./$FILE" "./$OUTPUT/$FILE"

    if [[ $FILE == *".js"  ||  $FILE == *".html" ]]
    then
        echo "Processing: $FILE"
        INDEX=0

        for SEARCH in "${HAYSTACK[@]}"
        do
            while IFS= read -r LINE || [ -n "$LINE" ]
            do
                echo "${LINE//$SEARCH/${REPLACE[INDEX]}}"
            done < "./$OUTPUT/$FILE" > "./$OUTPUT/temp_$FILE"

            rm "./$OUTPUT/$FILE"
            mv "./$OUTPUT/temp_$FILE" "./$OUTPUT/$FILE"

            ((INDEX=INDEX+1))
        done
    fi
done

cd "$OUTPUT"

7z a "../packages/legacy-wikipedia_firefox.zip" \
    $(join_by " " "${REQUIRES[@]}") \
    manifest.json

cd ".." && rm -rf "$OUTPUT"